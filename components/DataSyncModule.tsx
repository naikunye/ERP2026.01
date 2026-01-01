import React, { useState, useRef } from 'react';
import { Product, ProductStatus, Currency } from '../types';
import { 
  Database, Upload, Download, CheckCircle2, Loader2, FileJson, HardDrive, RefreshCw, Server
} from 'lucide-react';

interface DataSyncModuleProps {
  currentData: Product[];
  onImportData: (data: Product[]) => void;
}

const DataSyncModule: React.FC<DataSyncModuleProps> = ({ currentData, onImportData }) => {
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processFile = (file: File) => {
    setImportStatus('processing');
    setImportMessage('解析文件中...');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const arr = Array.isArray(json) ? json : (json.products || json.items || []);
        if (arr.length === 0) throw new Error("无有效数据");
        
        // Simple sanitization
        const sanitized = arr.map((raw: any) => ({
            ...raw,
            id: raw.id || `IMP-${Math.random().toString(36).substr(2,9)}`,
            price: Number(raw.price) || 0,
            stock: Number(raw.stock) || 0
        }));

        onImportData(sanitized);
        setImportStatus('success');
        setImportMessage(`成功导入 ${arr.length} 条资产数据`);
        setTimeout(() => { setImportStatus('idle'); setImportMessage(''); }, 3000);
      } catch (err: any) {
        setImportStatus('error');
        setImportMessage('JSON 格式错误或文件损坏');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20 max-w-5xl mx-auto">
      
      <div className="border-b border-white/10 pb-6 text-center">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none mb-2">
              数据控制中心
           </h1>
           <p className="text-gray-400 text-sm">由于服务器连接不稳定，当前系统运行在 <span className="text-neon-green font-bold bg-neon-green/10 px-2 py-0.5 rounded">本地离线模式 (Local Mode)</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Export Card */}
          <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-6 group hover:border-neon-blue/30 transition-all">
              <div className="w-20 h-20 rounded-full bg-neon-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Download size={40} className="text-neon-blue" />
              </div>
              <div>
                  <h2 className="text-xl font-bold text-white mb-2">数据备份 (Backup)</h2>
                  <p className="text-sm text-gray-400 px-6">
                      将当前所有产品、库存及财务配置导出为 JSON 文件。建议每日备份。
                  </p>
              </div>
              <button 
                onClick={handleExport}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm transition-all flex items-center gap-2"
              >
                  <FileJson size={16} /> 立即导出
              </button>
          </div>

          {/* Import Card */}
          <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-6 group hover:border-neon-purple/30 transition-all relative overflow-hidden">
              {importStatus === 'processing' && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                      <Loader2 size={40} className="text-neon-purple animate-spin mb-4" />
                      <div className="text-white font-bold animate-pulse">{importMessage}</div>
                  </div>
              )}

              <div 
                  className={`w-full h-full absolute inset-0 border-2 border-dashed transition-all pointer-events-none rounded-2xl ${dragActive ? 'border-neon-purple bg-neon-purple/5' : 'border-transparent'}`}
              ></div>

              <div 
                  className="w-full flex flex-col items-center cursor-pointer"
                  onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
              >
                  <input ref={fileInputRef} type="file" className="hidden" accept=".json" onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); e.target.value = ''; }} />
                  
                  <div className="w-20 h-20 rounded-full bg-neon-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-6">
                      {importStatus === 'success' ? <CheckCircle2 size={40} className="text-neon-green"/> : <Upload size={40} className="text-neon-purple" />}
                  </div>
                  
                  <div>
                      <h2 className="text-xl font-bold text-white mb-2">数据恢复 (Restore)</h2>
                      <p className="text-sm text-gray-400 px-6">
                          {importStatus === 'success' ? <span className="text-neon-green">{importMessage}</span> : '点击或拖拽 AERO_OS_BACKUP.json 文件到此处恢复数据。'}
                      </p>
                  </div>
              </div>
          </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex justify-center items-center gap-8 pt-8 border-t border-white/5 opacity-50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
              <HardDrive size={12} /> 本地存储: <span className="text-gray-300">{(JSON.stringify(currentData).length / 1024).toFixed(2)} KB</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
              <RefreshCw size={12} /> 上次同步: <span className="text-gray-300">刚刚</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
              <Server size={12} /> 服务器状态: <span className="text-gray-600">离线 (Offline)</span>
          </div>
      </div>

    </div>
  );
};

export default DataSyncModule;
