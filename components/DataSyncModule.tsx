import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductStatus, Currency } from '../types';
import { 
  Cloud, Server, Database, Upload, Download, 
  Wifi, Activity, CheckCircle2, AlertCircle, Loader2, Globe, Lock, RefreshCw, Zap, ShieldAlert,
  PlayCircle, HelpCircle, AlertTriangle, ExternalLink
} from 'lucide-react';

interface DataSyncModuleProps {
  currentData: Product[];
  onImportData: (data: Product[]) => void;
}

const DataSyncModule: React.FC<DataSyncModuleProps> = ({ currentData, onImportData }) => {
  // 1. 设置默认值为您的腾讯云 IP
  const [serverUrl, setServerUrl] = useState('ws://119.28.72.106:8090');
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'simulating'>('disconnected');
  const [errorDetail, setErrorDetail] = useState<React.ReactNode>('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsMessageCount, setWsMessageCount] = useState(0);
  const [simulationInterval, setSimulationInterval] = useState<any>(null);

  const [importDragActive, setImportDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      return () => {
          if (socket) socket.close();
          if (simulationInterval) clearInterval(simulationInterval);
      };
  }, []);

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

  const handleConnect = () => {
      // Clean up previous
      if (socket) socket.close();
      if (simulationInterval) clearInterval(simulationInterval);
      
      setErrorDetail('');
      setConnectionStatus('connecting');

      // 1. 获取用户输入，不做任何智能修改，完全信任用户
      let targetUrl = serverUrl.trim();
      
      // 简单补全协议，如果用户完全没写
      if (!targetUrl.startsWith('ws://') && !targetUrl.startsWith('wss://')) {
          targetUrl = `ws://${targetUrl}`;
          setServerUrl(targetUrl); // 回填到输入框
      }

      console.log(`[Connecting] Target: ${targetUrl}`);

      setTimeout(() => {
        try {
            const ws = new WebSocket(targetUrl);
            
            ws.onopen = () => {
                setConnectionStatus('connected');
                setSocket(ws);
                setErrorDetail('');
                console.log("[Success] WebSocket Connected");
            };

            ws.onmessage = (event) => {
                setWsMessageCount(prev => prev + 1);
                try {
                    const payload = JSON.parse(event.data);
                    const rawData = Array.isArray(payload) ? payload : (payload.data || payload.products || []);
                    if (Array.isArray(rawData)) {
                        onImportData(rawData.map(sanitizeProduct));
                    }
                } catch (e) { console.warn("Invalid JSON", e); }
            };

            ws.onerror = (e) => {
                console.error("WS Error", e);
                // onclose will handle the state update
            };

            ws.onclose = (e) => {
                console.log(`[Closed] Code: ${e.code}, Reason: ${e.reason}`);
                setSocket(null);
                setConnectionStatus('error');

                // --- 核心诊断逻辑 ---
                if (e.code === 1006) {
                    const isPageHttps = window.location.protocol === 'https:';
                    const isTargetUnsecure = targetUrl.startsWith('ws://');

                    if (isPageHttps && isTargetUnsecure) {
                        // 这是最常见的 Vercel (HTTPS) -> IP (WS) 阻断
                        setErrorDetail(
                            <div className="space-y-3 mt-2">
                                <div className="font-bold text-neon-pink flex items-center gap-2 text-sm">
                                    <ShieldAlert size={16}/> 浏览器安全阻断 (Code 1006)
                                </div>
                                <div className="text-xs text-gray-300 leading-relaxed">
                                    当前网页是安全链接 (HTTPS)，但您尝试连接的服务器是不安全的 (ws://)。浏览器默认已拦截此请求。
                                </div>
                                <div className="bg-white/10 p-4 rounded-lg border border-white/20 text-xs text-white">
                                    <strong>如何解决 (即使之前开过，请再次检查):</strong>
                                    <ol className="list-decimal list-inside mt-2 space-y-2 text-gray-300">
                                        <li>点击浏览器地址栏最左侧的 <Lock size={12} className="inline text-neon-blue"/> <b>锁图标</b> 或 <b>设置图标</b>。</li>
                                        <li>点击 <b>网站设置 (Site Settings)</b>。</li>
                                        <li>向下滚动找到 <b>不安全内容 (Insecure Content)</b>。</li>
                                        <li>强制将其设置为 <span className="text-neon-green font-bold border border-neon-green/30 px-1 rounded">允许 (Allow)</span>。</li>
                                        <li>回到本页面，刷新后重新连接。</li>
                                    </ol>
                                </div>
                            </div>
                        );
                    } else {
                        // 其他网络错误
                        setErrorDetail(`连接失败 (Code 1006): 无法连接到 ${targetUrl}。请检查服务器防火墙是否放行了 8090 端口，或 IP 是否正确。`);
                    }
                } else {
                    setErrorDetail(`连接断开 (Code ${e.code}): ${e.reason || '网络中断'}`);
                }
            };
        } catch (err: any) {
            setConnectionStatus('error');
            setErrorDetail(`初始化异常: ${err.message}`);
        }
      }, 500); // Small delay to show UI state
  };

  const handleDisconnect = () => {
      if (socket) socket.close();
      if (simulationInterval) clearInterval(simulationInterval);
      setConnectionStatus('disconnected');
      setSocket(null);
  };

  // Simulation Logic
  const handleSimulate = () => {
      handleDisconnect();
      setTimeout(() => {
        setConnectionStatus('simulating');
        setErrorDetail('');
        let counter = 0;
        const interval = setInterval(() => {
            setWsMessageCount(prev => prev + 1);
            counter++;
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
        }, 1500);
        setSimulationInterval(interval);
      }, 100);
  };

  // File Import Logic
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
    setImportMessage('解析文件中...');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const arr = Array.isArray(json) ? json : (json.products || []);
        if (arr.length === 0) throw new Error("无有效数据");
        onImportData(arr.map(sanitizeProduct));
        setImportStatus('success');
        setImportMessage(`成功导入 ${arr.length} 条`);
        setTimeout(() => { setImportStatus('idle'); setImportMessage(''); }, 3000);
      } catch (err: any) {
        setImportStatus('error');
        setImportMessage('格式错误');
      }
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
          
          {/* Left: Connection Panel */}
          <div className="space-y-6">
              <section className={`glass-card p-8 h-full relative overflow-hidden flex flex-col group border-neon-blue/30 transition-colors ${connectionStatus === 'error' ? 'border-red-500/50' : ''}`}>
                  <div className="absolute top-0 right-0 p-8 opacity-20"><Cloud size={120} className="text-neon-blue" /></div>
                  
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Server className="text-neon-blue" size={20} /> 
                      直连腾讯云 (Direct IP)
                  </h2>
                  <p className="text-sm text-gray-400 max-w-sm mb-6">
                      使用原生 WebSocket 协议连接。
                  </p>

                  <div className="space-y-4 relative z-10">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">WebSocket Server URL</label>
                          <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                              <input 
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                placeholder="ws://119.28.xx.xx:8090"
                                disabled={connectionStatus === 'connected' || connectionStatus === 'simulating'}
                                className="w-full h-12 pl-12 pr-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-neon-blue outline-none font-mono placeholder-gray-600"
                              />
                          </div>
                      </div>
                      
                      <div className="pt-2 flex flex-col gap-3">
                          {connectionStatus === 'connected' || connectionStatus === 'simulating' ? (
                              <button onClick={handleDisconnect} className="w-full py-3 bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all">
                                  断开连接
                              </button>
                          ) : (
                              <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    onClick={handleConnect}
                                    disabled={connectionStatus === 'connecting'}
                                    className="col-span-1 py-3 bg-gradient-neon-blue text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

                      {/* Diagnostic / Status Area */}
                      <div className="min-h-[80px]">
                          {connectionStatus === 'error' && (
                              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs animate-fade-in relative z-20">
                                  {errorDetail}
                              </div>
                          )}
                          {connectionStatus === 'connected' && (
                              <div className="p-3 bg-neon-green/10 border border-neon-green/20 rounded-lg text-neon-green text-xs flex items-center gap-2 animate-fade-in">
                                  <Activity size={14} className="animate-pulse" /> 
                                  连接成功 | 已接收 {wsMessageCount} 条数据包
                              </div>
                          )}
                          {connectionStatus === 'simulating' && (
                              <div className="p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-lg text-neon-purple text-xs flex items-center gap-2 animate-fade-in">
                                  <Zap size={14} className="animate-pulse" /> 
                                  正在生成模拟数据... ({wsMessageCount})
                              </div>
                          )}
                      </div>
                  </div>
              </section>
          </div>

          {/* Right: File Import (Backup) */}
          <div className="space-y-6">
               <section className="glass-card p-8 h-full flex flex-col">
                   <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Database className="text-neon-purple" size={20} /> 本地导入
                   </h2>
                   
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
                            ref={fileInputRef} type="file" className="hidden" accept=".json" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
                                e.target.value = '';
                            }}
                        />

                        {importStatus === 'processing' ? (
                            <Loader2 size={40} className="text-neon-purple animate-spin" />
                        ) : importStatus === 'success' ? (
                            <div className="text-center">
                                <CheckCircle2 size={40} className="text-neon-green mx-auto mb-2" />
                                <div className="text-xs text-neon-green">{importMessage}</div>
                            </div>
                        ) : (
                            <>
                                <Upload size={32} className="text-gray-400 group-hover:text-neon-purple mb-4 transition-colors" />
                                <div className="font-bold text-white">点击上传 JSON</div>
                            </>
                        )}
                   </div>
                   
                   <div className="mt-4 flex justify-end">
                       <button onClick={handleExport} className="text-xs text-gray-400 hover:text-white flex items-center gap-2">
                           <Download size={14} /> 备份当前数据
                       </button>
                   </div>
               </section>
          </div>
      </div>
    </div>
  );
};

export default DataSyncModule;