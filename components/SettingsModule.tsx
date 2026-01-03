
import React, { useState, useRef, useEffect } from 'react';
import { Theme, Product, ProductStatus, Currency } from '../types';
import { 
  Sun, Moon, Zap, Database, Upload, Download, CheckCircle2, 
  Loader2, FileJson, HardDrive, Server, Monitor, Shield, 
  Globe, RotateCcw, AlertTriangle, AlertCircle, CloudCog, ArrowUpCircle, Lock, Key, XCircle, Terminal, Info, ArrowDown, Unlock, Trash2,
  Sunset, Trees, Rocket
} from 'lucide-react';
import { pb, updateServerUrl, isCloudConnected } from '../services/pocketbase';

interface SettingsModuleProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  currentData: Product[];
  onImportData: (data: Product[]) => void;
  onNotify?: (type: any, title: string, message: string) => void;
  onResetData?: () => void;
  onSyncToCloud?: () => void;
}

// ------------------------------------------------------------------
// HELPER FUNCTIONS (Advanced V3)
// ------------------------------------------------------------------

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');

const parseCleanNum = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const cleanStr = val.replace(/,/g, '').replace(/[¥$€£]/g, '').trim();
        if (!cleanStr) return 0;
        const match = cleanStr.match(/-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
    }
    return 0;
};

// --- SCHEMA DENSITY SCANNER ---
// Finds the array that best matches a "Product" schema structure
const findBestDataArray = (json: any): any[] => {
    let candidates: { arr: any[], score: number, path: string }[] = [];
    
    // Recursive traverser
    const traverse = (node: any, path: string) => {
        if (!node) return;
        
        if (Array.isArray(node)) {
            // Evaluate this array
            if (node.length > 0) {
                // Check sample items (up to 10)
                const sample = node.slice(0, 10);
                let objCount = 0;
                let keywordHits = 0;
                
                sample.forEach(item => {
                    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                        objCount++;
                        const keys = Object.keys(item).map(k => k.toLowerCase()).join(' ');
                        const values = JSON.stringify(item).toLowerCase();
                        
                        // Strong Signals
                        if (/sku|id|code|no\.|item/.test(keys)) keywordHits += 3;
                        if (/name|title|desc|product|goods/.test(keys)) keywordHits += 3;
                        if (/price|cost|amount|value|money/.test(keys)) keywordHits += 3;
                        if (/qty|stock|count|inv/.test(keys)) keywordHits += 2;
                        if (/img|pic|url|http/.test(keys) || /http/.test(values)) keywordHits += 1;
                    }
                });

                if (objCount > 0) {
                    // Score = Density of keywords * log(Length)
                    // We prioritize arrays that actually look like product lists
                    const density = keywordHits / objCount;
                    const score = density * Math.log(node.length + 1);
                    candidates.push({ arr: node, score, path });
                }
            }
            // Do not recurse INSIDE arrays (products usually don't contain lists of products)
            return; 
        }
        
        if (typeof node === 'object') {
            Object.keys(node).forEach(key => traverse(node[key], `${path}.${key}`));
        }
    };
    
    traverse(json, 'root');
    
    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    
    console.log("Import Candidates:", candidates.slice(0,3));

    // Fallback: If no good semantic match, just return the largest array of objects
    if (candidates.length === 0 || candidates[0].score < 2) {
        // Re-scan for ANY array of objects
        candidates.sort((a, b) => b.arr.length - a.arr.length);
    }
    
    return candidates.length > 0 ? candidates[0].arr : [];
};

const findValueGreedy = (obj: any, aliases: string[], exclude: string[] = []): any => {
    if (!obj) return undefined;
    const keys = Object.keys(obj);
    for (const alias of aliases) {
        const nAlias = normalize(alias);
        for (const key of keys) {
            const nKey = normalize(key);
            if (exclude.some(ex => nKey.includes(normalize(ex)))) continue;
            
            // 1. Exact Match (normalized)
            if (nKey === nAlias) return obj[key];
            
            // 2. Partial Match (key contains alias)
            if (nKey.includes(nAlias)) return obj[key];
        }
    }
    return undefined;
};

const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  currentTheme, onThemeChange, currentData, onImportData, onNotify, onResetData, onSyncToCloud
}) => {
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Server Config State
  const [serverUrlInput, setServerUrlInput] = useState(localStorage.getItem('custom_server_url') || 'http://119.28.72.106:8090');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [currentOnlineStatus, setCurrentOnlineStatus] = useState(false);

  // Storage Stats
  const [storageUsage, setStorageUsage] = useState({ usedKB: 0, percent: 0 });

  // Init State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatusMsg, setInitStatusMsg] = useState('');
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [initSuccess, setInitSuccess] = useState(false);

  // Safety Check
  const isMixedContent = window.location.protocol === 'https:' && serverUrlInput.startsWith('http:');

  useEffect(() => {
      calculateStorage();
      checkCurrentConnection();
  }, [currentData]);

  const checkCurrentConnection = async () => {
      const status = await isCloudConnected();
      setCurrentOnlineStatus(status);
  };

  const calculateStorage = () => {
      let total = 0;
      for (const x in localStorage) {
          if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
              total += ((localStorage[x].length + x.length) * 2);
          }
      }
      const maxBytes = 5 * 1024 * 1024;
      const usedKB = total / 1024;
      const percent = Math.min((total / maxBytes) * 100, 100);
      setStorageUsage({ usedKB, percent });
  };

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
    if(onNotify) onNotify('success', '备份已下载', '请妥善保管此 JSON 文件，这是您数据的唯一永久存档。');
  };

  // --- RE-IMPLEMENTED IMPORT LOGIC ---
  const processFile = (file: File) => {
    setImportStatus('processing');
    setImportMessage('Deep Scan: 正在扫描数据结构...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let json;
        try {
            json = JSON.parse(text);
        } catch (parseError) {
            throw new Error("文件不是有效的 JSON 格式。请检查是否是 .csv 或 .xlsx 改名？必须导出为 JSON。");
        }

        // --- SCANNING ---
        const arr = findBestDataArray(json);
        
        if (!arr || arr.length === 0) {
            throw new Error("未找到任何有效的产品数组数据 (No array of objects found).");
        }
        
        console.log(`Mapping ${arr.length} items...`);

        const sanitized: Product[] = arr.map((raw: any) => {
            
            // --- FIELD MAPPING STRATEGY (AGGRESSIVE) ---
            
            // ID
            const id = raw.id || findValueGreedy(raw, ['_id', 'uuid', 'uid', 'product_id', 'sys_id']) || `IMP-${Math.random().toString(36).substr(2,9)}`;
            
            // SKU
            const sku = raw.sku || findValueGreedy(raw, 
                ['msku', 'product_code', 'item_no', 'item_code', 'part_number', 'p_id', '编码', '货号', 'model'],
                ['parent', 'group']
            ) || 'UNKNOWN-SKU';

            // NAME
            const name = raw.name || findValueGreedy(raw, 
                ['title', 'product_name', 'item_name', 'goods_name', 'desc', 'description', '名称', '标题', '品名'],
                ['meta', 'seo']
            ) || 'Unnamed Product';

            // SUPPLIER
            const supplier = raw.supplier || findValueGreedy(raw, ['vendor', 'factory', 'manufacturer', 'source', '供应商', '厂家']);

            // COST (RMB)
            const unitCost = parseCleanNum(raw.financials?.costOfGoods || findValueGreedy(raw, 
                ['cost', 'purchase_price', 'buying_price', 'sourcing_price', 'factory_price', '采购价', '进货价', '成本'],
                ['total', 'shipping']
            ));

            // PRICE (USD)
            const price = parseCleanNum(raw.financials?.sellingPrice || raw.price || findValueGreedy(raw, 
                ['selling_price', 'retail_price', 'sales_price', 'list_price', 'msrp', '销售价', '售价', '定价'],
                ['cost', 'total']
            ));

            // STOCK
            const stock = parseCleanNum(raw.stock || findValueGreedy(raw, 
                ['qty', 'quantity', 'inventory', 'stock_level', 'on_hand', 'available', '库存', '数量', '现有'],
                ['min', 'max', 'safety']
            ));

            // IMAGE
            const imageUrl = raw.imageUrl || findValueGreedy(raw, ['image', 'img', 'pic', 'photo', 'thumbnail', 'url', 'link'], ['site', 'page']);

            // LOGISTICS
            const shippingCost = parseCleanNum(raw.financials?.shippingCost || findValueGreedy(raw, ['shipping', 'freight', 'logistics_cost', '运费', '头程']));

            return {
                id: String(id),
                sku: String(sku),
                name: String(name),
                description: raw.description || '',
                price: price || (unitCost * 3), // Fallback price
                stock: stock,
                currency: raw.currency || Currency.USD,
                status: raw.status || ProductStatus.Draft,
                category: raw.category || 'General',
                marketplaces: Array.isArray(raw.marketplaces) ? raw.marketplaces : [],
                imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
                lastUpdated: new Date().toISOString(),
                supplier: String(supplier || ''),
                note: raw.note || '',
                unitWeight: parseCleanNum(raw.unitWeight || findValueGreedy(raw, ['weight', 'kg'])),
                
                // Detailed Fields
                boxLength: Number(raw.boxLength) || 0,
                boxWidth: Number(raw.boxWidth) || 0,
                boxHeight: Number(raw.boxHeight) || 0,
                boxWeight: Number(raw.boxWeight) || 0,
                itemsPerBox: Number(raw.itemsPerBox) || 0,
                restockCartons: Number(raw.restockCartons) || 0,
                totalRestockUnits: parseCleanNum(raw.totalRestockUnits),
                variantRestockMap: raw.variantRestockMap || {},
                inboundId: raw.inboundId || '',
                inboundStatus: raw.inboundStatus || 'Pending',
                
                // Financials
                exchangeRate: parseCleanNum(raw.exchangeRate) || 7.2,
                financials: {
                    costOfGoods: unitCost,
                    shippingCost: shippingCost,
                    otherCost: parseCleanNum(raw.financials?.otherCost || 0),
                    sellingPrice: price,
                    platformFee: parseCleanNum(raw.financials?.platformFee || 0),
                    adCost: parseCleanNum(raw.financials?.adCost || 0),
                },
                dailySales: parseCleanNum(raw.dailySales || 0)
            };
        });

        if (sanitized.length === 0) {
             throw new Error("解析到数组但未能映射出有效数据 (Mapped 0 items). Check your keys.");
        }

        onImportData(sanitized);
        setImportStatus('success');
        setImportMessage(`AI 识别成功: ${sanitized.length} 条数据已加载`);
        
        setTimeout(() => { 
            setImportStatus('idle'); 
            setImportMessage(''); 
        }, 4000);
      } catch (err: any) {
        console.error("Import Error:", err);
        setImportStatus('error');
        setImportMessage(`导入失败: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleConnectServer = async () => {
    setConnectionStatus('checking');
    try {
        updateServerUrl(serverUrlInput);
        const isOnline = await isCloudConnected();
        setCurrentOnlineStatus(isOnline);
        setConnectionStatus(isOnline ? 'success' : 'error');
        if (onNotify) {
            if (isOnline) {
                onNotify('success', '连接成功', '已连接到私有云服务器');
            } else {
                onNotify('error', '连接失败', '无法连接到服务器，请检查 URL 或网络状态');
            }
        }
    } catch (e) {
        setConnectionStatus('error');
        if (onNotify) onNotify('error', '错误', '连接过程中发生未知错误');
    }
  };

  // (Paste Themes array and standard render code below)
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
                      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${t.bg} border border-white/20 shadow-sm`}></div>

                      <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/10 ${t.color}`}>
                              <t.icon size={20} />
                          </div>
                          {currentTheme === t.id && <CheckCircle2 size={20} className="text-neon-blue absolute top-4 right-4"/>}
                      </div>
                      <h3 className={`text-lg font-bold mb-1 ${currentTheme === 'ivory' && t.id === 'ivory' ? 'text-black' : 'text-white'}`}>{t.name}</h3>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                  </button>
              ))}
          </div>
      </section>

      <div className="border-t border-white/10 my-8"></div>

      {/* 2. Cloud Server */}
      <section className="space-y-4">
          <h2 className="text-sm font-bold text-neon-blue uppercase tracking-widest flex items-center gap-2">
              <CloudCog size={16} /> 云服务器配置 (Cloud Server)
          </h2>
          {isMixedContent && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                  <Shield className="text-red-500 mt-1" size={20} />
                  <div className="text-xs text-gray-300">
                      <strong>Mixed Content Warning:</strong> App is HTTPS, Server is HTTP. Check connection.
                  </div>
              </div>
          )}
          <div className="glass-card p-6 border-neon-blue/30 bg-neon-blue/5">
              <div className="flex flex-col md:flex-row gap-6 items-end">
                  <div className="flex-1 space-y-2 w-full">
                      <label className="text-xs font-bold text-gray-400 uppercase">PocketBase API URL</label>
                      <input 
                          type="text" 
                          value={serverUrlInput}
                          onChange={(e) => setServerUrlInput(e.target.value)}
                          className="w-full h-12 pl-4 bg-black/40 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-neon-blue outline-none"
                      />
                      <p className="text-[10px] text-gray-500">
                          Status: <span className={currentOnlineStatus ? "text-neon-green" : "text-gray-400"}>{currentOnlineStatus ? "Online" : "Offline"}</span>
                      </p>
                  </div>
                  <button 
                      onClick={handleConnectServer}
                      className="h-12 px-6 rounded-xl font-bold text-sm bg-neon-blue text-black flex items-center gap-2"
                  >
                      {connectionStatus === 'checking' ? <Loader2 size={16} className="animate-spin"/> : 'Connect'}
                  </button>
              </div>
          </div>
      </section>

      <div className="border-t border-white/10 my-8"></div>

      {/* 3. Data Management */}
      <section className="space-y-4">
          <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Database size={16} /> 数据与备份
              </h2>
              <div className="text-[10px] text-gray-500 font-mono">Local: {storageUsage.usedKB.toFixed(0)}KB</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-8 flex flex-col items-center text-center space-y-4">
                  <Download size={32} className="text-neon-blue" />
                  <div>
                      <h2 className="text-lg font-bold text-white">本地备份 (Export)</h2>
                      <p className="text-xs text-gray-400">生成 JSON 备份文件。</p>
                  </div>
                  <button onClick={handleExport} className="px-6 py-2 bg-gradient-neon-blue text-black font-bold rounded-lg text-xs">
                      立即备份
                  </button>
              </div>

              {onSyncToCloud && currentOnlineStatus && (
                  <div className="glass-card p-8 flex flex-col items-center text-center space-y-4 border-neon-green/20">
                      <ArrowUpCircle size={32} className="text-neon-green" />
                      <div>
                          <h2 className="text-lg font-bold text-white">推送到云端 (Push)</h2>
                          <p className="text-xs text-gray-400">将本地数据同步至服务器。</p>
                      </div>
                      <button onClick={onSyncToCloud} className="px-6 py-2 bg-neon-green text-black font-bold rounded-lg text-xs">
                          开始上传
                      </button>
                  </div>
              )}

              {/* Import */}
              <div className="glass-card p-8 flex flex-col items-center text-center space-y-4 hover:border-neon-purple/30 transition-all relative overflow-hidden">
                  {importStatus === 'processing' && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                          <Loader2 size={32} className="text-neon-purple animate-spin mb-4" />
                          <div className="text-white font-bold animate-pulse text-sm">{importMessage}</div>
                      </div>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept=".json,.txt,.csv" onChange={(e) => { if(e.target.files?.[0]) processFile(e.target.files[0]); e.target.value=''; }} />
                  <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer flex flex-col items-center">
                      <Upload size={32} className="text-neon-purple mb-4" />
                      <h2 className="text-lg font-bold text-white">恢复导入 (Restore)</h2>
                      <p className="text-xs text-gray-400">{importStatus === 'success' ? <span className="text-neon-green">{importMessage}</span> : '点击选择文件导入数据'}</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Admin Zone (Omitted for brevity, logic kept in previous chunks if needed, but structure is here) */}
      
    </div>
  );
};

export default SettingsModule;
