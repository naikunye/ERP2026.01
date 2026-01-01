import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductStatus, Currency } from '../types';
import { 
  Cloud, Server, Database, Upload, Download, 
  Wifi, Activity, CheckCircle2, AlertCircle, Loader2, Globe, Lock, RefreshCw, Zap, ShieldAlert,
  PlayCircle, HelpCircle, AlertTriangle, ExternalLink, ShieldCheck, Terminal, Cpu, Copy, Check, Layout, MousePointerClick, Settings
} from 'lucide-react';

interface DataSyncModuleProps {
  currentData: Product[];
  onImportData: (data: Product[]) => void;
}

const DataSyncModule: React.FC<DataSyncModuleProps> = ({ currentData, onImportData }) => {
  // Protocol Selection: 'websocket' (Raw) or 'pocketbase' (HTTP/REST)
  const [protocol, setProtocol] = useState<'websocket' | 'pocketbase'>('pocketbase');
  
  const [serverUrl, setServerUrl] = useState('http://119.28.72.106:8090');
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'simulating'>('disconnected');
  const [errorCode, setErrorCode] = useState<number | string>(0);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsMessageCount, setWsMessageCount] = useState(0);
  const [simulationInterval, setSimulationInterval] = useState<any>(null);

  const [importDragActive, setImportDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  
  // UI State for Copy buttons
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      // Auto-switch protocol prefix based on selection
      if (protocol === 'pocketbase' && serverUrl.startsWith('ws')) {
          setServerUrl(serverUrl.replace('ws://', 'http://').replace('wss://', 'https://'));
      } else if (protocol === 'websocket' && serverUrl.startsWith('http')) {
          setServerUrl(serverUrl.replace('http://', 'ws://').replace('https://', 'wss://'));
      }

      return () => {
          if (socket) socket.close();
          if (simulationInterval) clearInterval(simulationInterval);
      };
  }, [protocol]);

  const copyToClipboard = (text: string, stepId: number) => {
      navigator.clipboard.writeText(text);
      setCopiedStep(stepId);
      setTimeout(() => setCopiedStep(null), 2000);
  };

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
          imageUrl: raw.imageUrl ? 
            (raw.imageUrl.startsWith('http') ? raw.imageUrl : `${serverUrl}/api/files/${raw.collectionId}/${raw.id}/${raw.imageUrl}`) 
            : '',
          marketplaces: Array.isArray(raw.marketplaces) ? raw.marketplaces : [],
          lastUpdated: raw.updated || new Date().toISOString(),
          supplier: raw.supplier || '',
          note: raw.note || '',
          inboundId: raw.inboundId || '',
          dailySales: Number(raw.dailySales) || 0,
          financials: {
              costOfGoods: Number(raw.costOfGoods) || 0,
              shippingCost: Number(raw.shippingCost) || 0,
              otherCost: Number(raw.otherCost) || 0,
              sellingPrice: Number(raw.price) || 0,
              platformFee: Number(raw.platformFee) || 0,
              adCost: Number(raw.adCost) || 0,
          },
          logistics: {
              method: raw.logisticsMethod || 'Air',
              carrier: raw.logisticsCarrier || '',
              trackingNo: raw.logisticsTracking || '',
              status: raw.logisticsStatus || 'Pending',
              origin: raw.origin || '',
              destination: raw.destination || '',
              etd: '',
              eta: ''
          }
      };
  };

  // --- PocketBase Logic ---
  const handlePocketBaseSync = async () => {
      setConnectionStatus('connecting');
      setErrorCode(0);
      
      try {
          // Normalize URL (remove trailing slash)
          const cleanUrl = serverUrl.replace(/\/$/, '');
          
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 5000);

          // Simple Request (No headers)
          const response = await fetch(`${cleanUrl}/api/collections/products/records?perPage=200`, {
              method: 'GET',
              signal: controller.signal
          });
          
          clearTimeout(id);

          if (!response.ok) {
              if (response.status === 404) throw new Error('404_COLLECTION');
              if (response.status === 403) throw new Error('403_PERMISSION');
              throw new Error(`HTTP_${response.status}`);
          }

          const data = await response.json();
          const items = data.items || [];
          
          if (items.length > 0) {
              onImportData(items.map(sanitizeProduct));
              setWsMessageCount(items.length);
              setConnectionStatus('connected');
          } else {
              setConnectionStatus('connected'); // Connected but empty
              setWsMessageCount(0);
          }

      } catch (err: any) {
          console.error(err);
          setConnectionStatus('error');
          
          const isHttps = window.location.protocol === 'https:';
          const isTargetHttp = serverUrl.startsWith('http://');
          
          if (err.message === '404_COLLECTION') {
              setErrorCode('404_COLLECTION');
          } else if (err.name === 'AbortError') {
              setErrorCode('TIMEOUT');
          } else if (isHttps && isTargetHttp && !err.message.startsWith('HTTP_')) {
              setErrorCode('MIXED_CONTENT');
          } else {
              setErrorCode(err.message || 'UNKNOWN');
          }
      }
  };

  // --- WebSocket Logic ---
  const handleWebSocketConnect = () => {
      if (socket) socket.close();
      
      setConnectionStatus('connecting');
      setErrorCode(0);

      let targetUrl = serverUrl.trim();
      
      setTimeout(() => {
        try {
            const ws = new WebSocket(targetUrl);
            
            ws.onopen = () => {
                setConnectionStatus('connected');
                setSocket(ws);
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

            ws.onclose = (e) => {
                setSocket(null);
                setConnectionStatus('error');
                setErrorCode(e.code);
            };
        } catch (err: any) {
            setConnectionStatus('error');
        }
      }, 800); 
  };

  const handleConnect = () => {
      if (protocol === 'pocketbase') {
          handlePocketBaseSync();
      } else {
          handleWebSocketConnect();
      }
  };

  const handleDisconnect = () => {
      if (socket) socket.close();
      if (simulationInterval) clearInterval(simulationInterval);
      setConnectionStatus('disconnected');
      setSocket(null);
  };

  const handleSimulate = () => {
      handleDisconnect();
      setTimeout(() => {
        setConnectionStatus('simulating');
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
                  
                  {/* Protocol Switcher */}
                  <div className="flex gap-2 mb-6 p-1 bg-black/20 rounded-xl border border-white/10 relative z-20">
                      <button 
                        onClick={() => setProtocol('pocketbase')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${protocol === 'pocketbase' ? 'bg-neon-blue text-black shadow-glow-blue' : 'text-gray-400 hover:text-white'}`}
                      >
                          <Database size={14} /> PocketBase (HTTP)
                      </button>
                      <button 
                        onClick={() => setProtocol('websocket')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${protocol === 'websocket' ? 'bg-neon-purple text-white shadow-glow-purple' : 'text-gray-400 hover:text-white'}`}
                      >
                          <Zap size={14} /> Raw WebSocket
                      </button>
                  </div>

                  <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none"><Cloud size={120} className={protocol === 'pocketbase' ? 'text-neon-blue' : 'text-neon-purple'} /></div>
                  
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Server className={protocol === 'pocketbase' ? 'text-neon-blue' : 'text-neon-purple'} size={20} /> 
                      {protocol === 'pocketbase' ? 'PocketBase 集成' : '原始 WebSocket 连接'}
                  </h2>
                  <p className="text-sm text-gray-400 max-w-sm mb-6">
                      {protocol === 'pocketbase' 
                        ? '直接连接到您的 PocketBase 实例获取数据。无需额外代码。' 
                        : '连接到自定义的 Node.js/Python WebSocket 服务端。'}
                  </p>

                  <div className="space-y-4 relative z-10">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Server Endpoint URL</label>
                          <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                              <input 
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                placeholder={protocol === 'pocketbase' ? "http://119.28.xx.xx:8090" : "ws://119.28.xx.xx:8090"}
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
                                    className={`col-span-1 py-3 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${protocol === 'pocketbase' ? 'bg-gradient-neon-blue' : 'bg-gradient-neon-purple'}`}
                                  >
                                      {connectionStatus === 'connecting' ? <Loader2 className="animate-spin" size={18}/> : <Wifi size={18} />}
                                      {protocol === 'pocketbase' ? '同步数据' : '建立连接'}
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

                      {/* --- Advanced Diagnostic / Error Area --- */}
                      {connectionStatus === 'error' && (
                          <>
                          {errorCode === '404_COLLECTION' ? (
                            <div className="mt-4 bg-neon-blue/5 border border-neon-blue/20 rounded-xl overflow-hidden animate-fade-in">
                                <div className="p-5 border-b border-neon-blue/10 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-neon-blue/10 flex items-center justify-center text-neon-blue shrink-0">
                                        <Database size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-1">数据库初始化向导</h3>
                                        <p className="text-xs text-gray-400">
                                            服务器连接正常 ({serverUrl})，但未检测到 <code className="text-neon-blue bg-neon-blue/10 px-1 rounded">products</code> 数据表。
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="p-5 bg-black/20 space-y-4">
                                     <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <Settings size={12} /> 修复步骤
                                     </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <a 
                                            href={`${serverUrl.replace(/\/$/, '')}/_/`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex flex-col gap-2 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-neon-blue/10 hover:border-neon-blue/30 transition-all group text-left"
                                         >
                                             <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                 <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">1</span>
                                                 进入后台
                                                 <ExternalLink size={12} className="opacity-50 group-hover:opacity-100"/>
                                             </div>
                                             <p className="text-[10px] text-gray-500">点击打开 PocketBase Admin 面板并登录。</p>
                                         </a>

                                         <div className="flex flex-col gap-2 p-4 rounded-lg bg-white/5 border border-white/5 text-left opacity-80">
                                             <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                 <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">2</span>
                                                 创建表 (Collection)
                                             </div>
                                             <p className="text-[10px] text-gray-500">
                                                 点击 <strong>New Collection</strong> <br/>
                                                 Name 输入: <code className="text-neon-blue">products</code> <br/>
                                                 点击 <strong>Create</strong>
                                             </p>
                                         </div>
                                     </div>

                                     <div className="pt-2">
                                         <button 
                                            onClick={handleConnect}
                                            className="w-full py-3 bg-gradient-neon-blue text-black rounded-xl font-bold text-sm shadow-glow-blue hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                         >
                                             <RefreshCw size={16} className={connectionStatus === 'connecting' ? 'animate-spin' : ''} />
                                             我已创建，重新检测
                                         </button>
                                     </div>
                                </div>
                            </div>
                          ) : (
                              <div className="mt-4 p-0 bg-black/60 border border-red-500/30 rounded-xl overflow-hidden animate-fade-in">
                                    <div className="bg-red-500/10 px-4 py-3 border-b border-red-500/20 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                                            <ShieldAlert size={14} /> 
                                            {protocol === 'pocketbase' ? '同步失败 (Sync Failed)' : '连接失败 (Socket Error)'}
                                        </div>
                                        <div className="text-[10px] font-mono opacity-70">{errorCode}</div>
                                    </div>
                                    
                                    <div className="p-5 space-y-4 text-xs">
                                        {errorCode === 'MIXED_CONTENT' && (
                                            <div className="text-gray-300">
                                                <p className="font-bold text-white mb-2">连接被阻断 (Connection Blocked)</p>
                                                <p className="mb-2">我们删除了所有请求头以尝试穿透，但浏览器依然阻断了请求。</p>
                                                
                                                <div className="bg-white/10 p-4 rounded-xl border border-white/10 mb-3">
                                                    <div className="font-bold text-white mb-2 flex items-center gap-2">
                                                        <MousePointerClick size={16} className="text-neon-blue"/>
                                                        验证服务器状态：
                                                    </div>
                                                    <p className="mb-2 text-gray-400">请点击下方链接。如果能在新窗口看到 JSON 数据，说明服务器是好的，纯粹是浏览器安全限制。</p>
                                                    <a 
                                                        href={`${serverUrl.replace(/\/$/, '')}/api/collections/products/records?perPage=200`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-neon-blue font-bold underline hover:text-white"
                                                    >
                                                        打开 API 测试链接 <ExternalLink size={12}/>
                                                    </a>
                                                </div>

                                                <p className="text-gray-500 italic">如果上方链接也打不开，请检查服务器防火墙 IP 白名单。</p>
                                            </div>
                                        )}

                                        {errorCode === 'TIMEOUT' && (
                                            <div className="text-gray-300">
                                                <p className="font-bold text-white mb-2">请求超时 (Timeout)</p>
                                                <p>服务器在 5 秒内没有响应。请检查 IP 是否正确，或服务器是否卡死。</p>
                                            </div>
                                        )}

                                        {errorCode === '403_PERMISSION' && (
                                            <div className="text-gray-300">
                                                <p className="font-bold text-white mb-2">权限被拒绝 (API Rules)</p>
                                                <p className="mb-3">找到了 products 表，但 API 权限是锁定的。</p>
                                                <div className="bg-white/10 p-3 rounded border border-white/10">
                                                    <div className="font-bold mb-1">请在 PocketBase 后台操作：</div>
                                                    <ol className="list-decimal list-inside space-y-1 text-gray-400">
                                                        <li>在 PocketBase 后台点击 <strong>products</strong> 表</li>
                                                        <li>点击右上角 <strong>Settings (齿轮)</strong> &gt; <strong>API Rules</strong></li>
                                                        <li>将 <strong>List/Search</strong> 规则留空 (默认是 Admin only)</li>
                                                        <li>或者填入 <code className="text-neon-green">""</code> (空字符串) 以完全公开</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {typeof errorCode === 'string' && errorCode.startsWith('HTTP_') && (
                                            <p className="text-gray-300">服务器返回了错误状态码。请检查 PocketBase 日志。</p>
                                        )}
                                    </div>
                              </div>
                          )}
                          </>
                      )}

                      {/* Status Success */}
                      {connectionStatus === 'connected' && (
                           <div className="p-3 bg-neon-green/10 border border-neon-green/20 rounded-lg text-neon-green text-xs flex items-center gap-2 animate-fade-in mt-4">
                               <Activity size={14} className="animate-pulse" /> 
                               {protocol === 'pocketbase' 
                                ? `同步成功 | 已获取 ${wsMessageCount} 条记录` 
                                : `连接保持中 | 已接收 ${wsMessageCount} 条数据包`}
                           </div>
                       )}
                       {connectionStatus === 'simulating' && (
                           <div className="p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-lg text-neon-purple text-xs flex items-center gap-2 animate-fade-in mt-4">
                               <Zap size={14} className="animate-pulse" /> 
                               正在生成模拟数据... ({wsMessageCount})
                           </div>
                       )}
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