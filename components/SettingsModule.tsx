
import React, { useState, useRef, useEffect } from 'react';
import { Theme, Product, ProductStatus, Currency } from '../types';
import { 
  Sun, Moon, Zap, Database, Upload, Download, CheckCircle2, 
  Loader2, FileJson, HardDrive, RefreshCw, Server, Smartphone, 
  Monitor, Shield, Globe, Bell, Sunset, Trees, Rocket, RotateCcw, AlertTriangle, AlertCircle, CloudCog
} from 'lucide-react';
import { pb, updateServerUrl, isCloudConnected } from '../services/pocketbase';

interface SettingsModuleProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  currentData: Product[];
  onImportData: (data: Product[]) => void;
  onNotify?: (type: any, title: string, message: string) => void;
  onResetData?: () => void; // New Prop
}

// ------------------------------------------------------------------
// CORE MATCHING ENGINE V7.3 (Refined for Full Backup Restoration)
// ------------------------------------------------------------------

// 1. Helper: Normalize keys to remove noise
const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');

// 2. Helper: Extract Number from messy strings (e.g. "¥ 12.5" -> 12.5, "10箱" -> 10)
const parseCleanNum = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        // Remove commas first (1,000 -> 1000)
        const cleanStr = val.replace(/,/g, '');
        // Match the first valid float number found
        const match = cleanStr.match(/-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
    }
    return 0;
};

// 3. Helper: The Greedy Finder (Header Matching)
const findValueGreedy = (obj: any, aliases: string[], exclude: string[] = []): any => {
    if (!obj) return undefined;
    const keys = Object.keys(obj);
    
    for (const alias of aliases) {
        const nAlias = normalize(alias);
        for (const key of keys) {
            const nKey = normalize(key);
            if (exclude.some(ex => nKey.includes(normalize(ex)))) continue;
            if (nKey.includes(nAlias)) {
                const val = obj[key];
                if (val !== undefined && val !== null && val !== '') return val;
            }
        }
    }
    return undefined;
};

const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  currentTheme, onThemeChange, currentData, onImportData, onNotify, onResetData
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
      // Approx 5MB limit usually (5 * 1024 * 1024 bytes)
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

  const processFile = (file: File) => {
    setImportStatus('processing');
    setImportMessage('V7.3 引擎启动: 正在恢复深度数据结构...');
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        setImportStatus('error');
        setImportMessage('目前仅支持 .json 文件 (请将 Excel 另存为 JSON)');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : (json.products || json.items || json.data || []);
        
        if (!Array.isArray(arr) || arr.length === 0) {
            throw new Error("无有效数据");
        }
        
        // ------------------------------------------------
        // V7.3 MAPPING CONFIGURATION
        // ------------------------------------------------
        const sanitized: Product[] = arr.map((raw: any) => {
            
            // --- A. IDENTITY (Direct Restore Priority) ---
            const inboundId = raw.inboundId || findValueGreedy(raw, 
                ['lx', 'ib', '入库', '货件', 'fba', 'shipment', 'inbound', '批次', 'batch', 'po_no', '单号'],
                ['sku', 'tracking', '快递', 'carrier', '配送']
            );

            const id = raw.id || findValueGreedy(raw, ['product_id', 'sys_id', 'id']) || `IMP-${Math.random().toString(36).substr(2,9)}`;
            const sku = raw.sku || findValueGreedy(raw, ['sku', 'msku', '编码', 'item_no', 'model']) || 'UNKNOWN';
            const name = raw.name || findValueGreedy(raw, ['name', 'title', '名称', '标题', '品名']) || 'Unnamed Product';
            const supplier = raw.supplier || findValueGreedy(raw, ['supplier', 'vendor', '供应商', '厂家']);
            const note = raw.note || findValueGreedy(raw, ['note', 'remark', '备注', '说明']);

            // --- B. FINANCIALS ---
            const unitCost = parseCleanNum(raw.financials?.costOfGoods || findValueGreedy(raw, 
                ['采购单价', '含税单价', '未税', '进货价', '成本', 'purchase', 'cost', 'buying', 'sourcing', '单价'],
                ['销售', 'selling', 'retail', 'market', '物流', '运费', 'shipping', '费率', 'rate']
            ));

            const price = parseCleanNum(raw.price || findValueGreedy(raw, 
                ['销售价', '售价', '定价', '标准价', 'selling', 'retail', 'sale_price', 'listing', 'msrp'],
                ['采购', '成本', 'cost', 'purchase', 'buying', '进货', '费率', 'rate']
            ));

            // --- C. LOGISTICS & SPECS ---
            let shippingCost = parseCleanNum(raw.financials?.shippingCost || findValueGreedy(raw, 
                [
                    '头程运费单价', '头运费单价', '运费单价', '头程单价', // Highest priority
                    'shipping_unit_price', 'freight_unit_price',
                    'shippingCost', 'freight', '运费', '头程', '物流费',
                    '海运费', '空运费', '费率', 'rate', 'kg_price', '$/kg', 'shipping', 'logistics'
                ],
                []
            ));

            const stock = parseCleanNum(raw.stock || findValueGreedy(raw, 
                ['stock', 'qty', 'quantity', '库存', '现有', '总数', 'amount', 'total', 'on_hand', 'available'],
                ['箱', 'carton', 'box', '装箱']
            ));

            // Boxing Info
            const itemsPerBox = parseCleanNum(raw.itemsPerBox || findValueGreedy(raw, 
                ['itemsPerBox', 'per_box', 'boxing', '装箱数', '每箱', '单箱', 'pcs_per', 'quantity_per', '装箱'],
                []
            ));

            const restockCartons = parseCleanNum(raw.restockCartons || findValueGreedy(raw, 
                ['restockCartons', 'cartons', 'box_count', '箱数', '件数', 'ctns', 'total_boxes'],
                ['per', '装箱', '每箱'] 
            ));

            const unitWeight = parseCleanNum(raw.unitWeight || findValueGreedy(raw, ['unitWeight', 'weight', '重量', 'kg']));
            const boxWeight = parseCleanNum(raw.boxWeight || findValueGreedy(raw, ['boxWeight', '箱重', 'gross_weight']));

            // --- D. RECONSTRUCT ---
            return {
                id,
                sku: String(sku),
                name: String(name),
                description: raw.description || '',
                price: price || (unitCost * 3) || 99.99,
                stock,
                currency: raw.currency || Currency.USD,
                status: raw.status || ProductStatus.Draft,
                category: raw.category || 'General',
                marketplaces: Array.isArray(raw.marketplaces) ? raw.marketplaces : [],
                imageUrl: raw.imageUrl || '',
                lastUpdated: new Date().toISOString(),
                supplier: String(supplier || ''),
                note: String(note || ''),
                
                // --- CRITICAL RESTORE FIELDS ---
                unitWeight,
                boxLength: Number(raw.boxLength) || 0,
                boxWidth: Number(raw.boxWidth) || 0,
                boxHeight: Number(raw.boxHeight) || 0,
                boxWeight: boxWeight,
                itemsPerBox,
                restockCartons,
                totalRestockUnits: parseCleanNum(raw.totalRestockUnits), 
                variantRestockMap: raw.variantRestockMap || {}, 
                inboundId: String(inboundId || ''), 
                inboundStatus: raw.inboundStatus || 'Pending',
                restockDate: raw.restockDate,
                
                // TikTok Fees
                platformCommission: parseCleanNum(raw.platformCommission || findValueGreedy(raw, ['platformFee', '佣金'])),
                influencerCommission: parseCleanNum(raw.influencerCommission),
                orderFixedFee: parseCleanNum(raw.orderFixedFee),
                returnRate: parseCleanNum(raw.returnRate),
                lastMileShipping: parseCleanNum(raw.lastMileShipping),
                exchangeRate: parseCleanNum(raw.exchangeRate) || 7.2,

                // Nested Objects
                hasVariants: raw.hasVariants || false,
                variants: Array.isArray(raw.variants) ? raw.variants : [],

                financials: {
                    costOfGoods: unitCost,
                    shippingCost: shippingCost,
                    otherCost: parseCleanNum(raw.financials?.otherCost || findValueGreedy(raw, ['otherCost', '杂费'])),
                    sellingPrice: price, 
                    platformFee: parseCleanNum(raw.financials?.platformFee || 0),
                    adCost: parseCleanNum(raw.financials?.adCost || findValueGreedy(raw, ['adCost', '广告'])),
                },
                logistics: {
                    method: raw.logistics?.method || 'Sea',
                    carrier: raw.logistics?.carrier || '',
                    trackingNo: raw.logistics?.trackingNo || '',
                    status: raw.logistics?.status || 'Pending',
                    origin: '',
                    destination: '',
                    shippingRate: parseCleanNum(raw.logistics?.shippingRate),
                    manualChargeableWeight: parseCleanNum(raw.logistics?.manualChargeableWeight)
                },
                dailySales: parseCleanNum(raw.dailySales || findValueGreedy(raw, ['dailySales', '日销', 'sales']))
            };
        });

        onImportData(sanitized);
        setImportStatus('success');
        setImportMessage(`导入成功: ${sanitized.length} 条 (变体/箱规/成本 已恢复)`);
        
        setTimeout(() => { 
            setImportStatus('idle'); 
            setImportMessage(''); 
        }, 4000);
      } catch (err: any) {
        console.error("Import Error:", err);
        setImportStatus('error');
        setImportMessage('JSON 解析失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          processFile(e.target.files[0]);
      }
      e.target.value = '';
  };

  const handleCheckUpdate = () => {
      if (onNotify) {
          onNotify('info', '系统已是最新', '当前版本: V.7.3.0 (Stable)');
      }
  };

  const handleReset = () => {
      if(confirm('警告：此操作将清除所有本地缓存并恢复到初始演示数据。确定继续吗？')) {
          if (onResetData) onResetData();
      }
  };

  const handleConnectServer = async () => {
      setConnectionStatus('checking');
      try {
          // Temporarily set baseUrl to check
          const originalUrl = pb.baseUrl;
          pb.baseUrl = serverUrlInput;
          const health = await pb.health.check({ requestKey: null });
          
          if (health.code === 200) {
              setConnectionStatus('success');
              // Save and update
              updateServerUrl(serverUrlInput);
              if (onNotify) onNotify('success', '连接成功', '已切换至腾讯云服务器，页面即将刷新...');
              setTimeout(() => {
                  window.location.reload();
              }, 1500);
          } else {
              setConnectionStatus('error');
              pb.baseUrl = originalUrl; // Revert
              if (onNotify) onNotify('error', '连接失败', '服务器返回异常状态，请检查地址。');
          }
      } catch (e) {
          setConnectionStatus('error');
          console.error(e);
          if (onNotify) onNotify('error', '连接超时', '无法连接到服务器，请检查 IP 和端口是否正确 (例如: http://IP:8090)');
      }
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
                      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${t.bg} border border-white/20 shadow-sm`}></div>

                      <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/10 ${t.color}`}>
                              <t.icon size={20} />
                          </div>
                          {currentTheme === t.id && <CheckCircle2 size={20} className="text-neon-blue absolute top-4 right-4"/>}
                      </div>
                      <h3 className={`text-lg font-bold mb-1 ${currentTheme === 'ivory' && t.id === 'ivory' ? 'text-black' : 'text-white'}`}>{t.name}</h3>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                      
                      {currentTheme === t.id && (
                          <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-neon-blue/10 rounded-full blur-xl"></div>
                      )}
                  </button>
              ))}
          </div>
      </section>

      <div className="border-t border-white/10 my-8"></div>

      {/* 2. Cloud Server Connection (NEW) */}
      <section className="space-y-4">
          <h2 className="text-sm font-bold text-neon-blue uppercase tracking-widest flex items-center gap-2">
              <CloudCog size={16} /> 云服务器配置 (Cloud Server)
          </h2>
          <div className="glass-card p-6 border-neon-blue/30 bg-neon-blue/5">
              <div className="flex flex-col md:flex-row gap-6 items-end">
                  <div className="flex-1 space-y-2 w-full">
                      <label className="text-xs font-bold text-gray-400 uppercase">PocketBase 服务器地址 (API URL)</label>
                      <div className="relative group">
                          <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue" size={16} />
                          <input 
                              type="text" 
                              value={serverUrlInput}
                              onChange={(e) => setServerUrlInput(e.target.value)}
                              placeholder="http://119.28.72.106:8090"
                              className="w-full h-12 pl-10 pr-4 bg-black/40 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-neon-blue outline-none transition-all"
                          />
                      </div>
                      <p className="text-[10px] text-gray-500">
                          当前状态: <span className={currentOnlineStatus ? "text-neon-green font-bold" : "text-gray-400"}>{currentOnlineStatus ? "● 在线 (Online)" : "○ 离线 (Offline)"}</span>
                      </p>
                  </div>
                  <button 
                      onClick={handleConnectServer}
                      disabled={connectionStatus === 'checking'}
                      className={`h-12 px-6 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all shrink-0 ${
                          connectionStatus === 'checking' 
                          ? 'bg-gray-700 text-gray-400 cursor-wait' 
                          : connectionStatus === 'success'
                          ? 'bg-neon-green text-black hover:scale-105'
                          : 'bg-neon-blue text-black hover:scale-105'
                      }`}
                  >
                      {connectionStatus === 'checking' && <Loader2 size={16} className="animate-spin"/>}
                      {connectionStatus === 'success' && <CheckCircle2 size={16}/>}
                      {connectionStatus === 'idle' || connectionStatus === 'error' ? '连接并保存' : '连接成功'}
                  </button>
              </div>
          </div>
      </section>

      <div className="border-t border-white/10 my-8"></div>

      {/* 3. Data Management Section */}
      <section className="space-y-4">
          <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Database size={16} /> 数据与备份 (Data & Backup)
              </h2>
              {/* Storage Usage Meter */}
              <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <HardDrive size={14} className={storageUsage.percent > 90 ? 'text-neon-pink' : 'text-gray-400'} />
                  <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">本地存储 (Local Storage)</span>
                      <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-black rounded-full overflow-hidden">
                              <div 
                                  className={`h-full rounded-full transition-all duration-500 ${storageUsage.percent > 90 ? 'bg-neon-pink' : storageUsage.percent > 70 ? 'bg-neon-yellow' : 'bg-neon-green'}`} 
                                  style={{ width: `${storageUsage.percent}%` }}
                              ></div>
                          </div>
                          <span className={`text-[10px] font-mono ${storageUsage.percent > 90 ? 'text-neon-pink' : 'text-white'}`}>
                              {storageUsage.usedKB.toFixed(0)}KB / 5MB
                          </span>
                      </div>
                  </div>
              </div>
          </div>

          {!currentOnlineStatus && (
            <div className="bg-neon-yellow/10 border border-neon-yellow/20 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-neon-yellow shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-white mb-1">离线模式警告</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        您当前未连接到服务器。所有数据仅保存在浏览器本地。
                        <strong className="text-neon-yellow"> 请务必定期导出备份，或在上方配置服务器地址进行连接。</strong>
                    </p>
                </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Export Card */}
              <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4 group hover:border-neon-blue/30 transition-all">
                  <div className="w-16 h-16 rounded-full bg-neon-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Download size={32} className="text-neon-blue" />
                  </div>
                  <div>
                      <h2 className="text-lg font-bold text-white mb-1">本地备份导出 (Export)</h2>
                      <p className="text-xs text-gray-400 px-6">
                          生成全量数据 JSON 文件。建议每周备份一次。
                      </p>
                  </div>
                  <button 
                    onClick={handleExport}
                    className="mt-2 px-6 py-2 bg-gradient-neon-blue text-black font-bold rounded-lg text-xs transition-all flex items-center gap-2 shadow-glow-blue hover:scale-105"
                  >
                      <FileJson size={14} /> 立即备份
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
                          <h2 className="text-lg font-bold text-white mb-1">数据恢复导入 (Restore)</h2>
                          <p className="text-xs text-gray-400 px-6">
                              {importStatus === 'success' ? <span className="text-neon-green">{importMessage}</span> : '点击或拖拽备份 JSON 文件恢复数据。'}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      <div className="border-t border-white/10 my-8"></div>

      {/* 4. About / Notifications */}
      <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Shield size={16} /> 关于系统
          </h2>
          <div className="glass-card p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      <Globe size={24} className="text-gray-400"/>
                  </div>
                  <div>
                      <h3 className="text-white font-bold">AERO.OS Enterprise</h3>
                      <p className="text-xs text-gray-500">Version 7.3.0 (Storage Guard)</p>
                  </div>
              </div>
              <div className="flex gap-3">
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-xs font-bold text-red-400 transition-colors flex items-center gap-2"
                  >
                      <RotateCcw size={14}/> 重置出厂设置
                  </button>
                  <button 
                    onClick={handleCheckUpdate}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                  >
                      检查更新
                  </button>
              </div>
          </div>
      </section>

    </div>
  );
};

export default SettingsModule;
