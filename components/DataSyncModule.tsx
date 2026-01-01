import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductStatus, Currency } from '../types';
import { 
  Cloud, Server, Database, Upload, Download, 
  Wifi, Activity, CheckCircle2, AlertCircle, Loader2, Globe, Lock, RefreshCw, Zap, ShieldAlert,
  PlayCircle, HelpCircle, AlertTriangle, ExternalLink, ShieldCheck, Terminal, Cpu, Copy, Check
} from 'lucide-react';

interface DataSyncModuleProps {
  currentData: Product[];
  onImportData: (data: Product[]) => void;
}

const DataSyncModule: React.FC<DataSyncModuleProps> = ({ currentData, onImportData }) => {
  const [serverUrl, setServerUrl] = useState('ws://119.28.72.106:8090');
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'simulating'>('disconnected');
  const [errorCode, setErrorCode] = useState<number>(0);
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
      return () => {
          if (socket) socket.close();
          if (simulationInterval) clearInterval(simulationInterval);
      };
  }, []);

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
      if (socket) socket.close();
      if (simulationInterval) clearInterval(simulationInterval);
      
      setConnectionStatus('connecting');
      setErrorCode(0);

      let targetUrl = serverUrl.trim();
      if (!targetUrl.startsWith('ws://') && !targetUrl.startsWith('wss://')) {
          targetUrl = `ws://${targetUrl}`;
          setServerUrl(targetUrl);
      }

      console.log(`[Connecting] Target: ${targetUrl}`);

      setTimeout(() => {
        try {
            const ws = new WebSocket(targetUrl);
            
            ws.onopen = () => {
                setConnectionStatus('connected');
                setSocket(ws);
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
            };

            ws.onclose = (e) => {
                console.log(`[Closed] Code: ${e.code}, Reason: ${e.reason}`);
                setSocket(null);
                setConnectionStatus('error');
                setErrorCode(e.code);
            };
        } catch (err: any) {
            setConnectionStatus('error');
        }
      }, 800); 
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

                      {/* --- Troubleshooting Wizard --- */}
                      {connectionStatus === 'error' && errorCode === 1006 && (
                          <div className="mt-4 p-0 bg-black/60 border border-red-500/30 rounded-xl overflow-hidden animate-fade-in">
                                <div className="bg-red-500/10 px-4 py-3 border-b border-red-500/20 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                                        <ShieldAlert size={14} /> 连接诊断向导 (Server Diagnostics)
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="flex items-center gap-1 text-[10px] text-neon-green/80 bg-neon-green/10 px-2 py-0.5 rounded border border-neon-green/20">
                                            <Check size={10} /> 浏览器
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-neon-green/80 bg-neon-green/10 px-2 py-0.5 rounded border border-neon-green/20">
                                            <Check size={10} /> 云防火墙
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-5 space-y-6">
                                    <p className="text-[11px] text-gray-400">
                                        外部通道已打通！现在的目标是<b className="text-white">服务器内部</b>。请在 SSH 终端依次运行以下命令：
                                    </p>

                                    {/* Step 1 */}
                                    <div>
                                        <h4 className="text-white font-bold text-xs mb-2 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">1</span>
                                            检查监听地址 (Port Binding)
                                        </h4>
                                        <div className="bg-black/50 rounded-lg p-3 font-mono text-[11px] border border-white/10 relative group hover:border-neon-blue/50 transition-colors">
                                            <span className="text-neon-pink select-none">$ </span>
                                            netstat -tunlp | grep 8090
                                            <button 
                                                onClick={() => copyToClipboard('netstat -tunlp | grep 8090', 1)}
                                                className="absolute right-2 top-2 p-1.5 hover:bg-white/20 rounded bg-white/5 text-gray-400 hover:text-white transition-all" 
                                                title="复制命令"
                                            >
                                                {copiedStep === 1 ? <Check size={12} className="text-neon-green"/> : <Copy size={12}/>}
                                            </button>
                                        </div>
                                        <div className="mt-2 grid grid-cols-1 gap-1 text-[10px] pl-2 border-l-2 border-white/5">
                                            <div className="text-gray-500 flex items-center gap-2">
                                                <span className="text-red-400">❌ 127.0.0.1:8090</span> 
                                                <span>(仅限本机访问 → 修改代码监听 0.0.0.0)</span>
                                            </div>
                                            <div className="text-gray-500 flex items-center gap-2">
                                                <span className="text-neon-green">✅ 0.0.0.0:8090</span> 
                                                <span>(允许外网访问 → 继续下一步)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div>
                                        <h4 className="text-white font-bold text-xs mb-2 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">2</span>
                                            放行内部防火墙 (Internal Firewall)
                                        </h4>
                                        <div className="space-y-2">
                                            {/* Ubuntu */}
                                            <div className="bg-black/50 rounded-lg p-3 font-mono text-[11px] border border-white/10 relative group hover:border-neon-purple/50 transition-colors">
                                                <div className="text-gray-600 mb-1 select-none text-[9px] uppercase font-bold">Ubuntu / Debian (UFW)</div>
                                                <span className="text-neon-pink select-none">$ </span>
                                                sudo ufw allow 8090/tcp
                                                <button 
                                                    onClick={() => copyToClipboard('sudo ufw allow 8090/tcp', 2)}
                                                    className="absolute right-2 top-2 p-1.5 hover:bg-white/20 rounded bg-white/5 text-gray-400 hover:text-white transition-all"
                                                >
                                                    {copiedStep === 2 ? <Check size={12} className="text-neon-green"/> : <Copy size={12}/>}
                                                </button>
                                            </div>

                                            {/* CentOS */}
                                            <div className="bg-black/50 rounded-lg p-3 font-mono text-[11px] border border-white/10 relative group hover:border-neon-purple/50 transition-colors">
                                                <div className="text-gray-600 mb-1 select-none text-[9px] uppercase font-bold">CentOS / RedHat (FirewallD)</div>
                                                <div className="flex flex-col gap-1">
                                                    <div>
                                                        <span className="text-neon-pink select-none">$ </span>
                                                        firewall-cmd --zone=public --add-port=8090/tcp --permanent
                                                    </div>
                                                    <div>
                                                        <span className="text-neon-pink select-none">$ </span>
                                                        firewall-cmd --reload
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => copyToClipboard('firewall-cmd --zone=public --add-port=8090/tcp --permanent && firewall-cmd --reload', 3)}
                                                    className="absolute right-2 top-2 p-1.5 hover:bg-white/20 rounded bg-white/5 text-gray-400 hover:text-white transition-all"
                                                >
                                                    {copiedStep === 3 ? <Check size={12} className="text-neon-green"/> : <Copy size={12}/>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                          </div>
                      )}

                      {/* Diagnostic / Status Area (Non-Error) */}
                      {connectionStatus === 'connected' && (
                           <div className="p-3 bg-neon-green/10 border border-neon-green/20 rounded-lg text-neon-green text-xs flex items-center gap-2 animate-fade-in mt-4">
                               <Activity size={14} className="animate-pulse" /> 
                               连接成功 | 已接收 {wsMessageCount} 条数据包
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