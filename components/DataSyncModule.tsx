import React, { useState } from 'react';
import { Product } from '../types';
import { 
  Cloud, Server, Database, Upload, Download, 
  Wifi, Activity, FileJson, CheckCircle2, AlertCircle, Loader2, Globe, Lock
} from 'lucide-react';

interface DataSyncModuleProps {
  currentData: Product[];
  onImportData: (data: Product[]) => void;
}

const DataSyncModule: React.FC<DataSyncModuleProps> = ({ currentData, onImportData }) => {
  // Real Connection State
  const [serverUrl, setServerUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [importDragActive, setImportDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // REAL Logic: Attempt to connect to the provided URL
  const handleConnect = () => {
      if (!serverUrl) return;

      setConnectionStatus('connecting');
      try {
          const ws = new WebSocket(serverUrl);
          
          ws.onopen = () => {
              setConnectionStatus('connected');
              setSocket(ws);
          };

          ws.onerror = () => {
              setConnectionStatus('error');
          };

          ws.onclose = () => {
              setConnectionStatus('disconnected');
              setSocket(null);
          };

      } catch (e) {
          console.error(e);
          setConnectionStatus('error');
      }
  };

  const handleDisconnect = () => {
      if (socket) {
          socket.close();
      }
  };

  // Handle Export
  const handleExport = () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AERO_OS_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Import (File Input)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    // Reset value to allow selecting the same file again if user fixes it
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setImportDragActive(true);
    else if (e.type === "dragleave") setImportDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImportDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Robust check: Check MIME type OR file extension (case insensitive)
    const isJsonType = file.type === "application/json";
    const isJsonExt = file.name.toLowerCase().endsWith('.json');

    if (!isJsonType && !isJsonExt) {
      setImportStatus('error');
      setImportMessage(`格式错误：不支持的文件类型 (${file.type || 'unknown'})，请上传 .json 文件`);
      return;
    }

    setImportStatus('processing');
    setImportMessage('正在解析数据...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) throw new Error("File is empty");

        const json = JSON.parse(content);
        
        if (Array.isArray(json)) {
            onImportData(json as Product[]);
            setImportStatus('success');
            setImportMessage(`成功导入 ${json.length} 条数据`);
        } else if (typeof json === 'object' && json !== null) {
            // Support importing a single object wrapped in an array
            if ('id' in json && 'sku' in json) {
                onImportData([json] as Product[]);
                setImportStatus('success');
                setImportMessage(`成功导入 1 条数据`);
            } else {
                throw new Error("Invalid structure: Expected Array or Product Object");
            }
        } else {
            throw new Error("Invalid JSON structure");
        }
      } catch (err) {
        console.error("Import Error:", err);
        setImportStatus('error');
        setImportMessage('文件解析失败：JSON 格式不正确');
      }
    };
    
    reader.onerror = () => {
        setImportStatus('error');
        setImportMessage('读取文件发生系统错误');
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
          
          {/* Left: Real Server Config */}
          <div className="space-y-6">
              <section className="glass-card p-8 h-full relative overflow-hidden flex flex-col group border-neon-blue/30">
                  <div className="absolute top-0 right-0 p-8 opacity-20"><Cloud size={120} className="text-neon-blue" /></div>
                  
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Server className="text-neon-blue" size={20} /> 
                      私有云连接配置
                  </h2>
                  <p className="text-sm text-gray-400 max-w-sm mb-6">
                      请输入您腾讯云服务器的 WebSocket 地址以启用实时同步。
                  </p>

                  <div className="space-y-4 relative z-10">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Server URL (WebSocket)</label>
                          <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                              <input 
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                placeholder="wss://your-tencent-server-ip:8080"
                                disabled={connectionStatus === 'connected'}
                                className="w-full h-12 pl-12 pr-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-neon-blue outline-none font-mono"
                              />
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">API Key (SecretId)</label>
                          <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                              <input 
                                type="password"
                                placeholder="****************"
                                className="w-full h-12 pl-12 pr-4 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-neon-blue outline-none"
                              />
                          </div>
                      </div>

                      <div className="pt-4">
                          {connectionStatus === 'connected' ? (
                              <button onClick={handleDisconnect} className="w-full py-3 bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all">
                                  断开连接
                              </button>
                          ) : (
                              <button 
                                onClick={handleConnect}
                                disabled={connectionStatus === 'connecting' || !serverUrl}
                                className="w-full py-3 bg-gradient-neon-blue text-white rounded-xl font-bold text-sm shadow-glow-blue hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                  {connectionStatus === 'connecting' ? <Loader2 className="animate-spin"/> : <Wifi size={18} />}
                                  {connectionStatus === 'connecting' ? '正在握手...' : '建立连接'}
                              </button>
                          )}
                      </div>

                      {/* Real Status Feedback */}
                      {connectionStatus === 'error' && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                              <AlertCircle size={14} /> 连接失败，请检查服务器地址或防火墙设置。
                          </div>
                      )}
                      {connectionStatus === 'connected' && (
                          <div className="p-3 bg-neon-green/10 border border-neon-green/20 rounded-lg text-neon-green text-xs flex items-center gap-2">
                              <Activity size={14} /> 通道已建立，正在监听数据流...
                          </div>
                      )}
                  </div>
              </section>
          </div>

          {/* Right: Data Migration (Real) */}
          <div className="space-y-6">
               <section className="glass-card p-8 h-full flex flex-col">
                   <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Database className="text-neon-purple" size={20} /> 
                      本地数据管理
                   </h2>
                   
                   {/* Import Zone */}
                   <div 
                      className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all duration-300 relative ${
                          importDragActive ? 'border-neon-purple bg-neon-purple/10' : 'border-white/20 bg-black/20 hover:border-white/40'
                      }`}
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                   >
                        {/* Note: onChange requires re-selection if we don't clear value, handled in handleFileChange */}
                        <input type="file" id="file-upload" className="hidden" accept=".json,application/json" onChange={handleFileChange} />

                        {importStatus === 'processing' ? (
                            <div className="flex flex-col items-center">
                                <Loader2 size={40} className="text-neon-purple animate-spin mb-2" />
                                <div className="text-xs text-gray-400">{importMessage}</div>
                            </div>
                        ) : importStatus === 'success' ? (
                            <div className="text-center">
                                <CheckCircle2 size={40} className="text-neon-green mx-auto mb-2" />
                                <div className="text-xs text-gray-400">{importMessage}</div>
                                <label htmlFor="file-upload" className="mt-2 text-xs text-neon-blue underline cursor-pointer inline-block">继续导入</label>
                            </div>
                        ) : (
                            <>
                                {importStatus === 'error' && (
                                    <div className="absolute top-4 left-0 right-0 text-center text-xs text-red-400 flex items-center justify-center gap-1">
                                        <AlertCircle size={12} /> {importMessage}
                                    </div>
                                )}
                                <Upload size={28} className="text-gray-400 mb-4" />
                                <label htmlFor="file-upload" className="cursor-pointer text-neon-purple font-bold hover:underline">点击导入 JSON</label>
                                <div className="text-[10px] text-gray-500 mt-2">支持拖拽上传</div>
                            </>
                        )}
                   </div>

                   <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                       <div className="text-xs text-gray-500">
                           <div className="font-bold uppercase">当前缓存</div>
                           <div className="text-white">{currentData.length} SKU</div>
                       </div>
                       <button onClick={handleExport} className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white text-sm font-bold flex items-center gap-2">
                           <Download size={16} /> 导出
                       </button>
                   </div>
               </section>
          </div>
      </div>
    </div>
  );
};

export default DataSyncModule;
