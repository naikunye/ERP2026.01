import React, { useState, useRef } from 'react';
import { Theme, Product } from '../types';
import { 
  Sun, Moon, Zap, Database, Upload, Download, CheckCircle2, 
  Loader2, FileJson, HardDrive, RefreshCw, Server, Smartphone, 
  Monitor, Shield, Globe, Bell
} from 'lucide-react';

interface SettingsModuleProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  currentData: Product[];
  onImportData: (data: Product[]) => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  currentTheme, onThemeChange, currentData, onImportData 
}) => {
  // Data Sync Logic
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
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none mb-2 flex items-center gap-3">
              系统偏好设置
              <span className="text-gray-500 font-sans text-sm tracking-widest font-medium border border-gray-700 px-2 py-0.5 rounded">SETTINGS</span>
           </h1>
           <p className="text-gray-400 text-sm">管理界面外观、数据备份及系统连接。</p>
      </div>

      {/* 1. Appearance Section */}
      <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Monitor size={16} /> 界面外观 (Appearance)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Neon Theme */}
              <button 
                  onClick={() => onThemeChange('neon')}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 text-left group overflow-hidden ${
                      currentTheme === 'neon' 
                      ? 'bg-black/40 border-neon-blue shadow-glow-blue' 
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
              >
                  <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentTheme === 'neon' ? 'bg-neon-blue text-black' : 'bg-white/10 text-gray-400'}`}>
                          <Zap size={20} fill="currentColor" />
                      </div>
                      {currentTheme === 'neon' && <CheckCircle2 size={20} className="text-neon-blue"/>}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Neon Glass</h3>
                  <p className="text-xs text-gray-500">赛博朋克深色模式，高对比度荧光。</p>
                  {/* Preview Element */}
                  <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-neon-blue/20 rounded-full blur-xl group-hover:bg-neon-blue/30 transition-colors"></div>
              </button>

              {/* Ivory Theme */}
              <button 
                  onClick={() => onThemeChange('ivory')}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 text-left group overflow-hidden ${
                      currentTheme === 'ivory' 
                      ? 'bg-[#F5F5F7] border-gray-300 shadow-xl' 
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
              >
                  <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentTheme === 'ivory' ? 'bg-black text-white' : 'bg-white/10 text-gray-400'}`}>
                          <Sun size={20} />
                      </div>
                      {currentTheme === 'ivory' && <CheckCircle2 size={20} className="text-black"/>}
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${currentTheme === 'ivory' ? 'text-black' : 'text-white'}`}>Ivory Air</h3>
                  <p className={`text-xs ${currentTheme === 'ivory' ? 'text-gray-500' : 'text-gray-500'}`}>极简主义浅色模式，清爽现代。</p>
              </button>

              {/* Midnight Theme */}
              <button 
                  onClick={() => onThemeChange('midnight')}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 text-left group overflow-hidden ${
                      currentTheme === 'midnight' 
                      ? 'bg-[#0F172A] border-neon-purple shadow-glow-purple' 
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
              >
                   <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentTheme === 'midnight' ? 'bg-neon-purple text-white' : 'bg-white/10 text-gray-400'}`}>
                          <Moon size={20} />
                      </div>
                      {currentTheme === 'midnight' && <CheckCircle2 size={20} className="text-neon-purple"/>}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Midnight Pro</h3>
                  <p className="text-xs text-gray-500">深海午夜模式，专注护眼。</p>
                  <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-neon-purple/20 rounded-full blur-xl group-hover:bg-neon-purple/30 transition-colors"></div>
              </button>
          </div>
      </section>

      <div className="border-t border-white/10 my-8"></div>

      {/* 2. Data Management Section */}
      <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Database size={16} /> 数据与备份 (Data & Backup)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Export Card */}
              <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4 group hover:border-neon-blue/30 transition-all">
                  <div className="w-16 h-16 rounded-full bg-neon-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Download size={32} className="text-neon-blue" />
                  </div>
                  <div>
                      <h2 className="text-lg font-bold text-white mb-1">本地备份导出</h2>
                      <p className="text-xs text-gray-400 px-6">
                          将当前所有产品、库存及财务配置导出为 JSON 文件。
                      </p>
                  </div>
                  <button 
                    onClick={handleExport}
                    className="mt-2 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold text-xs transition-all flex items-center gap-2"
                  >
                      <FileJson size={14} /> 立即导出
                  </button>
              </div>

              {/* Import Card */}
              <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4 group hover:border-neon-purple/30 transition-all relative overflow-hidden">
                  {importStatus === 'processing' && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                          <Loader2 size={32} className="text-neon-purple animate-spin mb-4" />
                          <div className="text-white font-bold animate-pulse text-sm">{importMessage}</div>
                      </div>
                  )}

                  <div 
                      className={`w-full h-full absolute inset-0 border-2 border-dashed transition-all pointer-events-none rounded-2xl ${dragActive ? 'border-neon-purple bg-neon-purple/5' : 'border-transparent'}`}
                  ></div>

                  <div 
                      className="w-full flex flex-col items-center cursor-pointer z-10"
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
                      
                      <div className="w-16 h-16 rounded-full bg-neon-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-4">
                          {importStatus === 'success' ? <CheckCircle2 size={32} className="text-neon-green"/> : <Upload size={32} className="text-neon-purple" />}
                      </div>
                      
                      <div>
                          <h2 className="text-lg font-bold text-white mb-1">数据恢复导入</h2>
                          <p className="text-xs text-gray-400 px-6">
                              {importStatus === 'success' ? <span className="text-neon-green">{importMessage}</span> : '点击或拖拽 AERO_OS_BACKUP.json 文件到此处。'}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
          
           {/* System Status Footer inside Settings */}
          <div className="flex justify-center items-center gap-8 pt-4 opacity-50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                  <HardDrive size={12} /> 本地存储: <span className="text-gray-300">{(JSON.stringify(currentData).length / 1024).toFixed(2)} KB</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Server size={12} /> 服务器状态: <span className="text-gray-600">离线 (Local)</span>
              </div>
          </div>
      </section>

      <div className="border-t border-white/10 my-8"></div>

      {/* 3. About / Notifications */}
      <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Shield size={16} /> 关于系统
          </h2>
          <div className="glass-card p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      <Globe size={24} className="text-gray-400"/>
                  </div>
                  <div>
                      <h3 className="text-white font-bold">AERO.OS Enterprise</h3>
                      <p className="text-xs text-gray-500">Version 5.3.0 PRO (Build 20241029)</p>
                  </div>
              </div>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition-colors">
                  检查更新
              </button>
          </div>
      </section>

    </div>
  );
};

export default SettingsModule;