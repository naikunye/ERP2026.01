import React, { useState, useRef } from 'react';
import { Theme, Product, ProductStatus, Currency } from '../types';
import { 
  Sun, Moon, Zap, Database, Upload, Download, CheckCircle2, 
  Loader2, FileJson, HardDrive, RefreshCw, Server, Smartphone, 
  Monitor, Shield, Globe, Bell, Sunset, Trees, Rocket
} from 'lucide-react';

interface SettingsModuleProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  currentData: Product[];
  onImportData: (data: Product[]) => void;
}

// Helper to fuzzy match keys from raw object
const findValue = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    
    // 1. Exact match
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }

    // 2. Case-insensitive / Space-insensitive search (more expensive, do only if needed)
    const normalizedKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, ''));
    const objKeys = Object.keys(obj);
    
    for (const objKey of objKeys) {
        const normalizedObjKey = objKey.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
        if (normalizedKeys.includes(normalizedObjKey)) {
             if (obj[objKey] !== undefined && obj[objKey] !== null && obj[objKey] !== '') return obj[objKey];
        }
    }
    return undefined;
};

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
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        setImportStatus('error');
        setImportMessage('请上传 .json 格式文件');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        
        // Handle various JSON structures
        const arr = Array.isArray(json) ? json : (json.products || json.items || []);
        
        if (!Array.isArray(arr) || arr.length === 0) {
            throw new Error("文件未包含有效的数组数据");
        }
        
        // Strict Sanitization with Fuzzy Matching for Headers
        const sanitized: Product[] = arr.map((raw: any) => {
            // Field mapping strategies
            const id = findValue(raw, ['id', 'ID', 'product_id', '序号']) || `IMP-${Math.random().toString(36).substr(2,9)}`;
            const sku = findValue(raw, ['sku', 'SKU', 'sku_code', 'SKU编码']) || 'UNKNOWN-SKU';
            const name = findValue(raw, ['name', 'title', 'product_name', '产品名称', '中文名称']) || 'Unnamed Product';
            const note = findValue(raw, ['note', 'remarks', 'remark', '备注']) || '';
            const supplier = findValue(raw, ['supplier', 'vendor', 'supplier_name', '供应商']) || '';
            
            // Numeric fields
            const parseNum = (keys: string[]) => {
                const val = findValue(raw, keys);
                if (typeof val === 'string') return parseFloat(val.replace(/[$,¥]/g, '')) || 0;
                return Number(val) || 0;
            };

            const price = parseNum(['price', 'selling_price', '销售价', '售价']);
            const stock = parseNum(['stock', 'quantity', 'inventory', '库存', '现有库存']);
            
            const unitCost = parseNum(['unitCost', 'cost', 'purchase_price', 'cost_price', '采购单价', '单价', '含税单价']);
            const restockCartons = parseNum(['restockCartons', 'cartons', 'box_count', '采购箱数', '箱数']);
            const itemsPerBox = parseNum(['itemsPerBox', 'per_box', 'boxing_qty', '装箱数', '每箱数量']);
            const unitWeight = parseNum(['unitWeight', 'weight', 'weight_kg', '单品重量', '重量']);
            
            // Inbound ID
            const inboundId = findValue(raw, ['inboundId', 'inbound_id', 'shipment_id', '入库单号', '货件编号']);

            return {
                id,
                sku,
                name,
                description: raw.description || '',
                price,
                stock,
                currency: raw.currency || Currency.USD,
                status: raw.status || ProductStatus.Draft,
                category: raw.category || 'General',
                marketplaces: Array.isArray(raw.marketplaces) ? raw.marketplaces : [],
                variants: Array.isArray(raw.variants) ? raw.variants : [],
                imageUrl: raw.imageUrl || '',
                lastUpdated: new Date().toISOString(),
                supplier,
                note,
                
                // Mapped extended fields
                unitWeight,
                boxLength: Number(raw.boxLength) || 0,
                boxWidth: Number(raw.boxWidth) || 0,
                boxHeight: Number(raw.boxHeight) || 0,
                boxWeight: Number(raw.boxWeight) || 0,
                itemsPerBox,
                restockCartons,
                inboundId: inboundId || '', // Ensure empty string if not found, NOT undefined

                // Financials reconstruction
                financials: {
                    costOfGoods: unitCost,
                    shippingCost: parseNum(['shippingCost', 'shipping', 'head_freight', '头程运费']),
                    otherCost: parseNum(['otherCost', 'fulfillment', 'fba_fee', '杂费']),
                    sellingPrice: price, // Default to main price if sellingPrice not explicit in financials
                    platformFee: parseNum(['platformFee', 'referral_fee', 'commission', '佣金']),
                    adCost: parseNum(['adCost', 'cpa', 'ad_spend', '广告费']),
                },
                logistics: {
                    method: raw.logistics?.method || 'Sea',
                    carrier: raw.logistics?.carrier || '',
                    trackingNo: raw.logistics?.trackingNo || '',
                    status: raw.logistics?.status || 'Pending',
                    origin: raw.logistics?.origin || '',
                    destination: raw.logistics?.destination || ''
                },
                dailySales: parseNum(['dailySales', 'daily_sales', 'sales_velocity', '日销', '日均销量'])
            };
        });

        onImportData(sanitized);
        setImportStatus('success');
        setImportMessage(`成功导入 ${sanitized.length} 条资产数据`);
        
        setTimeout(() => { 
            setImportStatus('idle'); 
            setImportMessage(''); 
        }, 3000);
      } catch (err: any) {
        console.error("Import Error:", err);
        setImportStatus('error');
        setImportMessage('JSON 解析失败或格式错误');
      }
    };
    reader.onerror = () => {
        setImportStatus('error');
        setImportMessage('读取文件失败');
    }
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          processFile(e.target.files[0]);
      }
      e.target.value = ''; // Reset input to allow re-selection
  };

  const themes = [
      { id: 'neon', name: 'Neon Glass', desc: '赛博朋克深色 (Default)', icon: Zap, color: 'text-neon-blue', bg: 'bg-black' },
      { id: 'ivory', name: 'Ivory Air', desc: '极简主义浅色 (Light)', icon: Sun, color: 'text-yellow-500', bg: 'bg-gray-100' },
      { id: 'midnight', name: 'Midnight Pro', desc: '深海午夜护眼 (Deep)', icon: Moon, color: 'text-indigo-400', bg: 'bg-slate-900' },
      { id: 'sunset', name: 'Sunset Vibe', desc: '紫霞渐变 (Synthwave)', icon: Sunset, color: 'text-pink-500', bg: 'bg-[#2D1B2E]' },
      { id: 'forest', name: 'Deep Forest', desc: '森系暗绿 (Nature)', icon: Trees, color: 'text-emerald-400', bg: 'bg-[#051C12]' },
      { id: 'nebula', name: 'Void Nebula', desc: '虚空黑洞 (Void)', icon: Rocket, color: 'text-purple-500', bg: 'bg-[#0B0014]' },
  ];

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none mb-2 flex items-center gap-3">
              系统偏好设置
              <span className="text-gray-500 font-sans text-sm tracking-widest font-medium border border-gray-700 px-2 py-0.5 rounded">SETTINGS</span>
           </h1>
           <p className="text-gray-400 text-sm">自定义界面主题与数据管理。</p>
      </div>

      {/* 1. Appearance Section */}
      <section className="space-y-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Monitor size={16} /> 界面主题 (Themes)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {themes.map(t => (
                  <button 
                      key={t.id}
                      onClick={() => onThemeChange(t.id as Theme)}
                      className={`relative p-5 rounded-2xl border transition-all duration-300 text-left group overflow-hidden ${
                          currentTheme === t.id 
                          ? 'border-neon-blue shadow-glow-blue bg-white/10' 
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                  >
                      {/* Theme Preview Dot */}
                      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${t.bg} border border-white/20 shadow-sm`}></div>

                      <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/10 ${t.color}`}>
                              <t.icon size={20} />
                          </div>
                          {currentTheme === t.id && <CheckCircle2 size={20} className="text-neon-blue absolute top-4 right-4"/>}
                      </div>
                      <h3 className={`text-lg font-bold mb-1 ${currentTheme === 'ivory' && t.id === 'ivory' ? 'text-black' : 'text-white'}`}>{t.name}</h3>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                      
                      {/* Active Glow */}
                      {currentTheme === t.id && (
                          <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-neon-blue/10 rounded-full blur-xl"></div>
                      )}
                  </button>
              ))}
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
                      <input 
                          ref={fileInputRef} 
                          type="file" 
                          className="hidden" 
                          accept=".json" 
                          onChange={handleFileSelect} 
                      />
                      
                      <div className="w-16 h-16 rounded-full bg-neon-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-4">
                          {importStatus === 'success' ? <CheckCircle2 size={32} className="text-neon-green"/> : <Upload size={32} className="text-neon-purple" />}
                      </div>
                      
                      <div>
                          <h2 className="text-lg font-bold text-white mb-1">数据恢复导入</h2>
                          <p className="text-xs text-gray-400 px-6">
                              {importStatus === 'success' ? <span className="text-neon-green">{importMessage}</span> : '支持 AERO 原生 JSON 或平铺式 Excel 转换数据 (包含 UnitCost, InboundID 等字段)'}
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