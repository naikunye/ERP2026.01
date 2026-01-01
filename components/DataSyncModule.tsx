import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductStatus, Currency } from '../types';
import { 
  Cloud, Server, Database, Upload, Download, 
  Wifi, Activity, CheckCircle2, AlertCircle, Loader2, Globe, Lock, RefreshCw, Zap, ShieldAlert,
  PlayCircle
} from 'lucide-react';

interface DataSyncModuleProps {
  currentData: Product[];
  onImportData: (data: Product[]) => void;
}

const DataSyncModule: React.FC<DataSyncModuleProps> = ({ currentData, onImportData }) => {
  // Real Connection State
  const [serverUrl, setServerUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'simulating'>('disconnected');
  const [errorDetail, setErrorDetail] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsMessageCount, setWsMessageCount] = useState(0);
  const [simulationInterval, setSimulationInterval] = useState<any>(null);

  const [importDragActive, setImportDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up socket on unmount
  useEffect(() => {
      return () => {
          if (socket) socket.close();
          if (simulationInterval) clearInterval(simulationInterval);
      };
  }, []);

  // --- 1. ROBUST DATA SANITIZATION ---
  const sanitizeProduct = (raw: any): Product => {
      const id = raw.id || raw._id || `IMPORTED-${Math.random().toString(36).substr(2, 9)}`;
      return {
          id: String(id),
          sku: raw.sku || raw.SKU || 'UNKNOWN',
          name: raw.name || raw.title || raw.productName || '未命名商品',
          description: raw.description || '',
          price: Number(raw.price) || 0,
          currency: raw.currency || Currency.USD,
          stock: Number(raw.stock) || Number(raw.inventory) || 0,
          category: raw.category || 'General',
          status: raw.status || ProductStatus.Draft,
          imageUrl: raw.imageUrl || raw.image || raw.img || '',
          marketplaces: Array.isArray(raw.marketplaces) ? raw.marketplaces : [],
          lastUpdated: raw.lastUpdated || new Date().toISOString(),
          supplier: raw.supplier || '',
          note: raw.note || '',
          inboundId: raw.inboundId || '',
          dailySales: Number(raw.dailySales) || 0,
          financials: {
              costOfGoods: Number(raw.financials?.costOfGoods) || Number(raw.cost) || 0,
              shippingCost: Number(raw.financials?.shippingCost) || 0,
              otherCost: Number(raw.financials?.otherCost) || 0,
              sellingPrice: Number(raw.financials?.sellingPrice) || Number(raw.price) || 0,
              platformFee: Number(raw.financials?.platformFee) || 0,
              adCost: Number(raw.financials?.adCost) || 0,
          },
          logistics: {
              method: raw.logistics?.method || 'Air',
              carrier: raw.logistics?.carrier || '',
              trackingNo: raw.logistics?.trackingNo || '',
              status: raw.logistics?.status || 'Pending',
              origin: raw.logistics?.origin || '',
              destination: raw.logistics?.destination || '',
              etd: raw.logistics?.etd || '',
              eta: raw.logistics?.eta || ''
          }
      };
  };

  // --- 2. INTELLIGENT WEBSOCKET LOGIC ---
  const handleConnect = () => {
      // 1. Clean up old connections
      if (socket) socket.close();
      if (simulationInterval) clearInterval(simulationInterval);
      setErrorDetail('');

      if (!serverUrl) {
          setConnectionStatus('error');
          setErrorDetail('请输入服务器地址');
          return;
      }

      // --- AGGRESSIVE URL SANITIZATION (Fix for wss://http:// issue) ---
      let rawUrl = serverUrl.trim();
      
      // Remove trailing slash
      if (rawUrl.endsWith('/')) rawUrl = rawUrl.slice(0, -1);

      // Regex to recursively remove ANY protocol prefix at the start
      // This handles "http://...", "wss://...", and crucially "wss://http://..."
      let host = rawUrl.replace(/^(?:[a-z0-9]+:\/\/)+/i, '');

      // Determine correct protocol
      // If it matches an IP pattern (x.x.x.x), FORCE 'ws://' because IPs rarely have SSL.
      // If it looks like a domain, prefer 'wss://'.
      const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?$/.test(host);
      
      // NOTE: Connecting to 'ws://' (IP) from an 'https://' site (Vercel) will trigger Mixed Content warnings.
      // You must enable "Insecure Content" in site settings for this to work.
      const protocol = isIP ? 'ws' : 'wss';
      
      const finalTargetUrl = `${protocol}://${host}`;
      
      // Immediately update the UI input so the user sees the corrected URL
      setServerUrl(finalTargetUrl);

      // 3. Set UI to "Connecting"
      setConnectionStatus('connecting');

      // 4. Connect with delay
      setTimeout(() => {
          attemptRealConnection(finalTargetUrl);
      }, 300);
  };

  const attemptRealConnection = (url: string) => {
      try {
          console.log("Attempting WebSocket connection to:", url);
          const ws = new WebSocket(url);
          
          // Safety timeout
          const timeoutId = setTimeout(() => {
              if (ws.readyState === WebSocket.CONNECTING) {
                  ws.close();
                  setConnectionStatus('error');
                  setErrorDetail('连接超时：服务器无响应 (Timeout 5s)');
              }
          }, 5000);

          ws.onopen = () => {
              clearTimeout(timeoutId);
              setConnectionStatus('connected');
              setSocket(ws);
              setErrorDetail('');
              console.log("WebSocket Connected Successfully");
          };

          ws.onmessage = (event) => {
              setWsMessageCount(prev => prev + 1);
              try {
                  const payload = JSON.parse(event.data);
                  const rawData = Array.isArray(payload) ? payload : (payload.data || payload.products || []);
                  if (Array.isArray(rawData) && rawData.length > 0) {
                      const cleanData = rawData.map(sanitizeProduct);
                      onImportData(cleanData);
                  }
              } catch (e) { /* ignore non-json */ }
          };

          ws.onerror = (e) => {
              clearTimeout(timeoutId);
              console.error("WS Error Event:", e);
              // Error event usually doesn't contain details for security reasons
          };

          ws.onclose = (e) => {
              clearTimeout(timeoutId);
              console.log("WS Closed:", e.code, e.reason);
              setSocket(null);

              if (e.code === 1000) {
                 setConnectionStatus('disconnected');
              } else {
                 setConnectionStatus('error');
                 
                 // Smart Error Diagnosis
                 if (e.code === 1006) {
                     const isHttps = window.location.protocol === 'https:';
                     const isWs = url.startsWith('ws://');
                     
                     if (isHttps && isWs) {
                         setErrorDetail('连接被阻断 (Code 1006): 您正在 HTTPS 环境下连接非加密 IP。请确保已在浏览器地址栏左侧设置中将“不安全内容”设为“允许”，并刷新页面重试。');
                     } else {
                         setErrorDetail('连接意外断开 (Code 1006): 请检查 1.服务器防火墙 2.IP地址是否正确 3.端口是否开放');
                     }
                 } else {
                     setErrorDetail(`连接断开 (Code ${e.code}): ${e.reason || '未知网络错误'}`);
                 }
              }
          };

      } catch (e: any) {
          console.error("WS Sync Error:", e);
          setConnectionStatus('error');
          setErrorDetail(`初始化错误: ${e.message}`);
      }
  };

  const handleDisconnect = () => {
      if (socket) socket.close();
      if (simulationInterval) clearInterval(simulationInterval);
      setConnectionStatus('disconnected');
      setSocket(null);
  };

  // --- 2.5 SIMULATION MODE ---
  const handleSimulate = () => {
      handleDisconnect();
      setTimeout(() => {
        setConnectionStatus('simulating');
        setErrorDetail('');
        
        let counter = 0;
        const interval = setInterval(() => {
            setWsMessageCount(prev => prev + 1);
            counter++;
            // Simulate receiving a stock update for a random product
            if (currentData.length > 0) {
                const randomIdx = Math.floor(Math.random() * currentData.length);
                const p = currentData[randomIdx];
                const updatedP = { 
                    ...p, 
                    stock: Math.max(0, p.stock + Math.floor(Math.random() * 20) - 10),
                    dailySales: Math.floor(Math.random() * 50),
                    lastUpdated: new Date().toISOString()
                };
                onImportData([updatedP]);
            }
        }, 1500); // Fast updates
        setSimulationInterval(interval);
      }, 100);
  };

  // --- 3. RECURSIVE DEEP SCAN IMPORT ---
  const handleExport = () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AERO_OS_BACKUP.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (file: File) => {
    setImportStatus('processing');
    setImportMessage('启动深度递归扫描...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) throw new Error("文件内容为空");

        let json;
        try {
            json = JSON.parse(content);
        } catch (e) {
            throw new Error("JSON 语法错误，无法解析");
        }
        
        // --- POWERFUL RECURSIVE SEARCH ---
        // Looks for ANY array where the items look like products (have id, sku, or name)
        const findProductArray = (obj: any, depth = 0): any[] => {
            if (depth > 8) return []; // Prevent infinite recursion
            
            // 1. Is this node an array?
            if (Array.isArray(obj)) {
                 // 1a. Is it empty? Return it, maybe it's valid but empty.
                 if (obj.length === 0) return obj;
                 
                 // 1b. Does it contain objects?
                 const sample = obj[0];
                 if (typeof sample === 'object' && sample !== null) {
                     // 1c. Do they look like products? (Loose check)
                     if ('id' in sample || 'sku' in sample || 'name' in sample || 'title' in sample || 'price' in sample) {
                         return obj;
                     }
                 }
                 return []; // Array of primitives or unrelated objects
            }
            
            // 2. Is this node an object?
            if (typeof obj === 'object' && obj !== null) {
                // Search all keys
                for (const key of Object.keys(obj)) {
                    const result = findProductArray(obj[key], depth + 1);
                    if (result.length > 0) return result;
                }
            }
            
            return [];
        };

        let productsToImport = findProductArray(json);

        // Fallback: Check if the root object itself is a single product
        if (productsToImport.length === 0 && typeof json === 'object' && json !== null) {
            if (json.id || json.sku || json.name) {
                productsToImport = [json];
            }
        }

        if (productsToImport.length === 0) {
            throw new Error("未在文件中找到有效的商品数据数组");
        }

        // Apply Sanitization
        const validProducts = productsToImport.map(sanitizeProduct);
        onImportData(validProducts);
        
        setImportStatus('success');
        setImportMessage(`扫描完成：成功提取 ${validProducts.length} 条数据`);
        setTimeout(() => { setImportStatus('idle'); setImportMessage(''); }, 3000);

      } catch (err: any) {
        console.error("Import Error:", err);
        setImportStatus('error');
        setImportMessage(err.message || '文件解析失败');
      }
    };
    reader.onerror = () => {
        setImportStatus('error');
        setImportMessage('无法读取文件');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              服务器与数据
              <span className="text-neon-blue/50 font-sans text-sm tracking-widest font-medium border border-neon-blue/30 px-2 py-0.5 rounded">SERVER & DATA</span>
           </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Smart Server Config */}
          <div className="space-y-6">
              <section className="glass-card p-8 h-full relative overflow-hidden flex flex-col group border-neon-blue/30">
                  <div className="absolute top-0 right-0 p-8 opacity-20"><Cloud size={120} className="text-neon-blue" /></div>
                  
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Server className="text-neon-blue" size={20} /> 
                      私有云连接 (WebSocket)
                  </h2>
                  <p className="text-sm text-gray-400 max-w-sm mb-6">
                      支持 ws:// (本地/IP) 和 wss:// (安全域名)。请确保已在浏览器设置中允许连接不安全内容。
                  </p>

                  <div className="space-y-4 relative z-10">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Server URL</label>
                          <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                              <input 
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                placeholder="119.28.72.106:8090"
                                disabled={connectionStatus === 'connected' || connectionStatus === 'simulating'}
                                className="w-full h-12 pl-12 pr-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-neon-blue outline-none font-mono placeholder-gray-600"
                              />
                          </div>
                      </div>
                      
                      <div className="pt-4 flex flex-col gap-3">
                          {connectionStatus === 'connected' || connectionStatus === 'simulating' ? (
                              <button onClick={handleDisconnect} className="w-full py-3 bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all">
                                  {connectionStatus === 'simulating' ? '停止模拟' : '断开连接'}
                              </button>
                          ) : (
                              <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    onClick={handleConnect}
                                    disabled={connectionStatus === 'connecting'}
                                    className="col-span-1 py-3 bg-gradient-neon-blue text-white rounded-xl font-bold text-sm shadow-glow-blue hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                      {connectionStatus === 'connecting' ? <Loader2 className="animate-spin" size={18}/> : <Wifi size={18} />}
                                      {connectionStatus === 'connecting' ? '连接中...' : '建立连接'}
                                  </button>
                                  <button 
                                    onClick={handleSimulate}
                                    className="col-span-1 py-3 bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                                  >
                                      <PlayCircle size={18} /> 模拟演示
                                  </button>
                              </div>
                          )}
                      </div>

                      {/* Status Feedback Area */}
                      <div className="min-h-[60px]">
                          {connectionStatus === 'error' && (
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2 animate-fade-in">
                                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> 
                                  <div>
                                      <div className="font-bold mb-1">连接受阻</div>
                                      <div className="opacity-80 leading-relaxed">{errorDetail}</div>
                                  </div>
                              </div>
                          )}
                          {connectionStatus === 'connected' && (
                              <div className="space-y-2 animate-fade-in">
                                  <div className="p-3 bg-neon-green/10 border border-neon-green/20 rounded-lg text-neon-green text-xs flex items-center gap-2">
                                      <Activity size={14} /> WebSocket 通道已建立
                                  </div>
                                  <div className="flex justify-between text-[10px] text-gray-500 font-mono px-1">
                                      <span>STATUS: ONLINE</span>
                                      <span>RX: {wsMessageCount} packets</span>
                                  </div>
                              </div>
                          )}
                          {connectionStatus === 'simulating' && (
                              <div className="space-y-2 animate-fade-in">
                                  <div className="p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-lg text-neon-purple text-xs flex items-center gap-2">
                                      <Zap size={14} className="animate-pulse" /> 正在模拟服务器数据推送...
                                  </div>
                                  <div className="flex justify-between text-[10px] text-gray-500 font-mono px-1">
                                      <span>MODE: SIMULATION</span>
                                      <span>MOCK RX: {wsMessageCount}</span>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </section>
          </div>

          {/* Right: Robust Import */}
          <div className="space-y-6">
               <section className="glass-card p-8 h-full flex flex-col">
                   <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Database className="text-neon-purple" size={20} /> 
                      本地数据导入 (Deep Scan)
                   </h2>
                   
                   {/* Import Zone */}
                   <div 
                      className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all duration-300 relative cursor-pointer group ${
                          importDragActive ? 'border-neon-purple bg-neon-purple/10' : 'border-white/20 bg-black/20 hover:border-white/40 hover:bg-white/5'
                      }`}
                      onDragEnter={(e) => { e.preventDefault(); setImportDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setImportDragActive(false); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                          e.preventDefault();
                          setImportDragActive(false);
                          if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                   >
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            className="hidden" 
                            accept=".json" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
                                e.target.value = ''; // Reset to allow re-selection
                            }}
                        />

                        {importStatus === 'processing' ? (
                            <div className="flex flex-col items-center">
                                <Loader2 size={40} className="text-neon-purple animate-spin mb-2" />
                                <div className="text-xs text-gray-400">{importMessage}</div>
                            </div>
                        ) : importStatus === 'success' ? (
                            <div className="text-center animate-scale-in">
                                <CheckCircle2 size={40} className="text-neon-green mx-auto mb-2" />
                                <div className="text-xs text-gray-400">{importMessage}</div>
                            </div>
                        ) : (
                            <>
                                {importStatus === 'error' && (
                                    <div className="absolute top-4 left-4 right-4 text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg flex items-center justify-center gap-1">
                                        <AlertCircle size={12} /> {importMessage}
                                    </div>
                                )}
                                <div className="p-4 rounded-full bg-white/5 group-hover:bg-neon-purple/20 transition-colors mb-4 text-gray-400 group-hover:text-neon-purple">
                                    <Upload size={32} />
                                </div>
                                <div className="font-bold text-white group-hover:text-neon-purple transition-colors">点击或拖拽 JSON</div>
                                <div className="text-[10px] text-gray-500 mt-2">支持深度遍历嵌套数组结构</div>
                            </>
                        )}
                   </div>

                   <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                       <div className="text-xs text-gray-500">
                           <div className="font-bold uppercase">数据概览</div>
                           <div className="text-white flex items-center gap-2">
                               <Database size={12}/> {currentData.length} SKU
                           </div>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={() => window.location.reload()} className="p-3 rounded-xl border border-white/20 hover:bg-white/10 text-white transition-all" title="强制刷新">
                               <RefreshCw size={16} />
                           </button>
                           <button onClick={handleExport} className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white text-sm font-bold flex items-center gap-2 transition-all">
                               <Download size={16} /> 导出备份
                           </button>
                       </div>
                   </div>
               </section>
          </div>
      </div>
    </div>
  );
};

export default DataSyncModule;