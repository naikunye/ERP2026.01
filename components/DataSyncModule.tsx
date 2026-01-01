import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductStatus, Currency } from '../types';
import { 
  Cloud, Server, Database, Upload, Download, 
  Wifi, Activity, CheckCircle2, AlertCircle, Loader2, Globe, Lock, RefreshCw, Zap, ShieldAlert,
  PlayCircle, HelpCircle, AlertTriangle, ExternalLink, ShieldCheck, Terminal, Cpu, Copy, Check, Layout, MousePointerClick, Settings, List,
  Plus, ChevronRight, ChevronLeft
} from 'lucide-react';

interface DataSyncModuleProps {
  currentData: Product[];
  onImportData: (data: Product[]) => void;
}

const DataSyncModule: React.FC<DataSyncModuleProps> = ({ currentData, onImportData }) => {
  const [protocol, setProtocol] = useState<'websocket' | 'pocketbase'>('pocketbase');
  const [serverUrl, setServerUrl] = useState('http://119.28.72.106:8090');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'simulating'>('disconnected');
  const [errorCode, setErrorCode] = useState<number | string>(0);
  const [wsMessageCount, setWsMessageCount] = useState(0);
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [simulationInterval, setSimulationInterval] = useState<any>(null);
  const [importDragActive, setImportDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  // Helper function to process uploaded JSON files
  const processFile = (file: File) => {
    setImportStatus('processing');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonStr = e.target?.result as string;
        const json = JSON.parse(jsonStr);
        const data = Array.isArray(json) ? json : (json.items || []);
        const products = data.map(sanitizeProduct);
        onImportData(products);
        setImportStatus('success');
        setImportMessage(`成功导入 ${products.length} 条数据`);
        setTimeout(() => setImportStatus('idle'), 3000);
      } catch (err) {
        setImportStatus('error');
        setImportMessage('解析 JSON 失败');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.onerror = () => {
      setImportStatus('error');
      setImportMessage('读取文件失败');
      setTimeout(() => setImportStatus('idle'), 3000);
    };
    reader.readAsText(file);
  };

  // Helper function to export current state to a JSON file
  const handleExport = () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `AERO_OS_BACKUP_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handlePocketBaseSync = async () => {
      setConnectionStatus('connecting');
      setErrorCode(0);
      try {
          const cleanUrl = serverUrl.replace(/\/$/, '');
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 5000);
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
          onImportData(items.map(sanitizeProduct));
          setWsMessageCount(items.length);
          setConnectionStatus('connected');
      } catch (err: any) {
          setConnectionStatus('error');
          if (err.message === '404_COLLECTION') setErrorCode('404_COLLECTION');
          else if (err.name === 'AbortError') setErrorCode('TIMEOUT');
          else setErrorCode(err.message || 'UNKNOWN');
      }
  };

  const handleConnect = () => {
      if (protocol === 'pocketbase') handlePocketBaseSync();
      else {
        setConnectionStatus('connecting');
        setTimeout(() => setConnectionStatus('error'), 1000);
      }
  };

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20">
      <div className="border-b border-white/10 pb-6">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              服务器与数据中枢
              <span className="text-neon-blue/50 font-sans text-sm tracking-widest font-medium border border-neon-blue/30 px-2 py-0.5 rounded">SERVER HUB</span>
           </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
              <section className={`glass-card p-8 h-full relative overflow-hidden flex flex-col transition-all duration-500 ${errorCode === '404_COLLECTION' ? 'border-neon-blue' : 'border-white/10'}`}>
                  
                  {/* Status Indicator */}
                  <div className="absolute top-8 right-8 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${connectionStatus === 'connected' ? 'bg-neon-green' : connectionStatus === 'error' ? 'bg-neon-pink' : 'bg-gray-500'}`}></div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{connectionStatus}</span>
                  </div>

                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                      <Server className="text-neon-blue" size={20} /> 连接配置
                  </h2>

                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">PocketBase 地址</label>
                          <input 
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-neon-blue outline-none font-mono"
                          />
                      </div>
                      <button 
                        onClick={handleConnect}
                        disabled={connectionStatus === 'connecting'}
                        className="w-full py-4 bg-gradient-neon-blue text-black font-bold rounded-xl shadow-glow-blue hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                        {connectionStatus === 'connecting' ? <Loader2 className="animate-spin" size={18}/> : <Wifi size={18} />}
                        立即同步数据
                      </button>
                  </div>

                  {/* --- Interactive Wizard for 404 Error --- */}
                  {errorCode === '404_COLLECTION' && (
                      <div className="mt-8 bg-black/40 border border-neon-blue/30 rounded-2xl overflow-hidden animate-scale-in">
                          <div className="bg-neon-blue/10 px-6 py-4 flex items-center justify-between border-b border-neon-blue/20">
                              <div className="flex items-center gap-2 font-bold text-white text-sm">
                                  <Cpu size={16} className="text-neon-blue" />
                                  手把手配置向导 (Step {wizardStep}/5)
                              </div>
                              <div className="flex gap-1">
                                  <div className={`h-1 w-4 rounded-full ${wizardStep >= 1 ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                                  <div className={`h-1 w-4 rounded-full ${wizardStep >= 2 ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                                  <div className={`h-1 w-4 rounded-full ${wizardStep >= 3 ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                                  <div className={`h-1 w-4 rounded-full ${wizardStep >= 4 ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                                  <div className={`h-1 w-4 rounded-full ${wizardStep >= 5 ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                              </div>
                          </div>

                          <div className="p-8">
                              {/* Step 1: Open Admin */}
                              {wizardStep === 1 && (
                                  <div className="space-y-4 animate-fade-in">
                                      <div className="w-12 h-12 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue mb-2">
                                          <ExternalLink size={24} />
                                      </div>
                                      <h4 className="text-lg font-bold text-white">第 1 步：进入管理后台</h4>
                                      <p className="text-sm text-gray-400 leading-relaxed">
                                          服务器已经通了，但我们需要去它的“大脑”里新建一个表格。请点击下方链接进入 PocketBase 的管理界面并登录。
                                      </p>
                                      <div className="pt-4">
                                          <a href={`${serverUrl.replace(/\/$/, '')}/_/`} target="_blank" className="inline-flex items-center gap-2 text-neon-blue font-bold border-b border-neon-blue hover:text-white hover:border-white transition-all">
                                              打开 Admin 后台 <ExternalLink size={14} />
                                          </a>
                                      </div>
                                  </div>
                              )}

                              {/* Step 2: Create Table */}
                              {wizardStep === 2 && (
                                  <div className="space-y-4 animate-fade-in">
                                      <div className="w-12 h-12 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple mb-2">
                                          <Plus size={24} />
                                      </div>
                                      <h4 className="text-lg font-bold text-white">第 2 步：新建 products 表</h4>
                                      <p className="text-sm text-gray-400 leading-relaxed">
                                          在左侧边栏点击 <strong className="text-white">+ New collection</strong>。在弹出的窗口中，Name 这一栏填写：
                                      </p>
                                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 font-mono text-neon-blue text-center text-xl font-bold select-all">
                                          products
                                      </div>
                                      <p className="text-xs text-gray-500 italic">注意：必须全小写，且不能有空格。</p>
                                  </div>
                              )}

                              {/* Step 3: Add Fields */}
                              {wizardStep === 3 && (
                                  <div className="space-y-4 animate-fade-in">
                                      <div className="w-12 h-12 rounded-full bg-neon-yellow/20 flex items-center justify-center text-neon-yellow mb-2">
                                          <List size={24} />
                                      </div>
                                      <h4 className="text-lg font-bold text-white">第 3 步：配置数据字段</h4>
                                      <p className="text-sm text-gray-400 leading-relaxed">
                                          我们需要告诉数据库我们要存什么。点击 <strong className="text-white">+ New field</strong>，依次添加以下字段：
                                      </p>
                                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                                          <div className="p-2 bg-white/5 rounded border border-white/10 text-white flex justify-between"><span>name</span><span className="opacity-40">Plain text</span></div>
                                          <div className="p-2 bg-white/5 rounded border border-white/10 text-white flex justify-between"><span>sku</span><span className="opacity-40">Plain text</span></div>
                                          <div className="p-2 bg-white/5 rounded border border-white/10 text-white flex justify-between"><span>price</span><span className="opacity-40">Number</span></div>
                                          <div className="p-2 bg-white/5 rounded border border-white/10 text-white flex justify-between"><span>stock</span><span className="opacity-40">Number</span></div>
                                      </div>
                                      <p className="text-xs text-gray-500">完成后先不要点 Create，点击顶部的 <strong>API Rules</strong> 标签。</p>
                                  </div>
                              )}

                              {/* Step 4: API Rules */}
                              {wizardStep === 4 && (
                                  <div className="space-y-4 animate-fade-in">
                                      <div className="w-12 h-12 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green mb-2">
                                          <ShieldCheck size={24} />
                                      </div>
                                      <h4 className="text-lg font-bold text-white">第 4 步：开放读取权限</h4>
                                      <p className="text-sm text-gray-400 leading-relaxed">
                                          这是最容易被漏掉的一步！为了让 ERP 看到数据，需要点击顶部的 <strong>API Rules</strong>：
                                      </p>
                                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                          <div className="text-[10px] text-gray-500 mb-1">List/Search 这一行：</div>
                                          <div className="text-neon-green font-bold text-xs flex items-center gap-2">
                                              <MousePointerClick size={12}/> 点击使其显示为空白 (Everyone)
                                          </div>
                                      </div>
                                      <p className="text-xs text-gray-500">最后点击右下角的黑色 <strong>Create</strong> 按钮保存！</p>
                                  </div>
                              )}

                              {/* Step 5: Verify */}
                              {wizardStep === 5 && (
                                  <div className="space-y-4 animate-fade-in text-center">
                                      <div className="w-16 h-16 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue mx-auto mb-4 shadow-glow-blue/20">
                                          <RefreshCw size={32} className={connectionStatus === 'connecting' ? 'animate-spin' : ''} />
                                      </div>
                                      <h4 className="text-xl font-bold text-white">全部完成！</h4>
                                      <p className="text-sm text-gray-400">
                                          如果您已经在 PocketBase 后台点击了 Create，现在系统应该可以读到数据了。
                                      </p>
                                      <div className="pt-4">
                                          <button 
                                            onClick={handlePocketBaseSync}
                                            className="px-10 py-3 bg-neon-blue text-black font-bold rounded-xl shadow-glow-blue hover:scale-105 transition-all"
                                          >
                                              点击重新检测连接
                                          </button>
                                      </div>
                                  </div>
                              )}

                              {/* Wizard Navigation */}
                              <div className="mt-10 flex justify-between items-center border-t border-white/10 pt-6">
                                  <button 
                                    disabled={wizardStep === 1}
                                    onClick={() => setWizardStep(prev => prev - 1)}
                                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 disabled:opacity-0 transition-all"
                                  >
                                      <ChevronLeft size={14} /> 上一步
                                  </button>
                                  {wizardStep < 5 && (
                                      <button 
                                        onClick={() => setWizardStep(prev => prev + 1)}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                      >
                                          下一步 <ChevronRight size={14} />
                                      </button>
                                  )}
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Normal Status Messages */}
                  {connectionStatus === 'connected' && (
                       <div className="mt-8 p-4 bg-neon-green/10 border border-neon-green/20 rounded-xl text-neon-green text-sm flex items-center gap-3 animate-fade-in">
                           <Activity size={18} className="animate-pulse" /> 
                           数据同步成功！已获取 {wsMessageCount} 条资产记录。
                       </div>
                  )}

                  {connectionStatus === 'error' && errorCode !== '404_COLLECTION' && (
                       <div className="mt-8 p-4 bg-neon-pink/10 border border-neon-pink/20 rounded-xl text-neon-pink text-sm flex items-center gap-3 animate-fade-in">
                           <ShieldAlert size={18} /> 
                           连接异常: {errorCode}。请检查 IP 地址和端口号。
                       </div>
                  )}
              </section>
          </div>

          <div className="space-y-6">
              <section className="glass-card p-8 h-full flex flex-col border-white/10">
                   <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Database className="text-neon-purple" size={20} /> 本地导入 (备用方案)
                   </h2>
                   <p className="text-sm text-gray-400 mb-8">如果没有服务器，您可以直接拖入 JSON 文件快速测试系统功能。</p>
                   
                   <div 
                      className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-12 transition-all duration-300 relative cursor-pointer group ${
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
                            <Loader2 size={48} className="text-neon-purple animate-spin" />
                        ) : importStatus === 'success' ? (
                            <div className="text-center">
                                <CheckCircle2 size={48} className="text-neon-green mx-auto mb-4" />
                                <div className="text-lg font-bold text-neon-green">{importMessage}</div>
                            </div>
                        ) : (
                            <>
                                <Upload size={40} className="text-gray-500 group-hover:text-neon-purple mb-4 transition-colors" />
                                <div className="font-bold text-white text-lg">点击或拖拽上传 JSON</div>
                                <p className="text-xs text-gray-500 mt-2 font-mono">AERO_OS_BACKUP.json</p>
                            </>
                        )}
                   </div>
                   
                   <div className="mt-6 flex justify-end">
                       <button onClick={handleExport} className="text-xs text-gray-500 hover:text-white flex items-center gap-2 transition-colors">
                           <Download size={14} /> 备份当前本地数据
                       </button>
                   </div>
              </section>
          </div>
      </div>
    </div>
  );
};

export default DataSyncModule;