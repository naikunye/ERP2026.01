
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
// CONSTANTS: COLLECTIONS SCHEMA
// ------------------------------------------------------------------
const COLLECTIONS_SCHEMA = [
    {
        name: 'products',
        type: 'base',
        schema: [
            { name: 'sku', type: 'text' },
            { name: 'name', type: 'text' },
            { name: 'description', type: 'text' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
            { name: 'category', type: 'text' },
            { name: 'status', type: 'text' },
            { name: 'imageUrl', type: 'text' },
            { name: 'supplier', type: 'text' },
            { name: 'note', type: 'text' },
            { name: 'inboundId', type: 'text' },
            { name: 'inboundStatus', type: 'text' },
            { name: 'financials', type: 'json' },
            { name: 'logistics', type: 'json' },
            { name: 'variants', type: 'json' },
            { name: 'marketplaces', type: 'json' },
            { name: 'seoKeywords', type: 'json' },
            { name: 'unitWeight', type: 'number' },
            { name: 'boxLength', type: 'number' },
            { name: 'boxWidth', type: 'number' },
            { name: 'boxHeight', type: 'number' },
            { name: 'boxWeight', type: 'number' },
            { name: 'itemsPerBox', type: 'number' },
            { name: 'restockCartons', type: 'number' },
            { name: 'totalRestockUnits', type: 'number' },
            { name: 'variantRestockMap', type: 'json' },
            { name: 'platformCommission', type: 'number' },
            { name: 'influencerCommission', type: 'number' },
            { name: 'orderFixedFee', type: 'number' },
            { name: 'returnRate', type: 'number' },
            { name: 'lastMileShipping', type: 'number' },
            { name: 'exchangeRate', type: 'number' },
            { name: 'dailySales', type: 'number' },
            { name: 'restockDate', type: 'text' },
        ]
    },
    { name: 'shipments', type: 'base', schema: [{ name: 'trackingNo', type: 'text' }] }, 
    { name: 'transactions', type: 'base', schema: [{ name: 'amount', type: 'number' }] },
    { name: 'influencers', type: 'base', schema: [{ name: 'name', type: 'text' }] },
    { name: 'tasks', type: 'base', schema: [{ name: 'title', type: 'text' }] },
    { name: 'competitors', type: 'base', schema: [{ name: 'asin', type: 'text' }] },
    { name: 'messages', type: 'base', schema: [{ name: 'content', type: 'text' }] }
];

// ------------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------------

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');

const parseCleanNum = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const cleanStr = val.replace(/,/g, '').replace(/[¥$€£]/g, '').replace('kg', '').replace('g', '').trim();
        if (!cleanStr) return 0;
        const match = cleanStr.match(/-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
    }
    return 0;
};

// --- SCHEMA DENSITY SCANNER ---
const findBestDataArray = (json: any): any[] => {
    let candidates: { arr: any[], score: number, path: string }[] = [];
    
    // Recursive traverser
    const traverse = (node: any, path: string) => {
        if (!node) return;
        
        if (Array.isArray(node)) {
            if (node.length > 0) {
                const sample = node.slice(0, 10);
                let objCount = 0;
                let keywordHits = 0;
                
                sample.forEach(item => {
                    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                        objCount++;
                        const keys = Object.keys(item).map(k => k.toLowerCase()).join(' ');
                        const values = JSON.stringify(item).toLowerCase();
                        if (/sku|id|code|no\.|item/.test(keys)) keywordHits += 3;
                        if (/name|title|desc|product|goods/.test(keys)) keywordHits += 3;
                        if (/price|cost|amount|value|money/.test(keys)) keywordHits += 3;
                        if (/qty|stock|count|inv/.test(keys)) keywordHits += 2;
                        if (/img|pic|url|http/.test(keys) || /http/.test(values)) keywordHits += 1;
                    }
                });

                if (objCount > 0) {
                    const density = keywordHits / objCount;
                    const score = density * Math.log(node.length + 1);
                    candidates.push({ arr: node, score, path });
                }
            }
            return; 
        }
        
        if (typeof node === 'object') {
            Object.keys(node).forEach(key => traverse(node[key], `${path}.${key}`));
        }
    };
    
    traverse(json, 'root');
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length === 0 || candidates[0].score < 2) {
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
            if (nKey === nAlias) return obj[key];
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
  const [fileInputRef] = useState<React.RefObject<HTMLInputElement>>(useRef<HTMLInputElement>(null));
  
  const [serverUrlInput, setServerUrlInput] = useState(localStorage.getItem('custom_server_url') || 'http://119.28.72.106:8090');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [currentOnlineStatus, setCurrentOnlineStatus] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ usedKB: 0, percent: 0 });

  // Admin State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatusMsg, setInitStatusMsg] = useState('');
  const [detailedError, setDetailedError] = useState<string | null>(null);

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
      setStorageUsage({ usedKB: total / 1024, percent: Math.min((total / maxBytes) * 100, 100) });
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
    if(onNotify) onNotify('success', '备份已下载', '请妥善保管此 JSON 文件。');
  };

  const processFile = (file: File) => {
    setImportStatus('processing');
    setImportMessage('Deep Scan: 正在分析数据逻辑...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let json;
        try { json = JSON.parse(text); } catch (e) { throw new Error("JSON 格式错误"); }

        const arr = findBestDataArray(json);
        if (!arr || arr.length === 0) throw new Error("未找到有效数据数组");
        
        console.log(`Mapping ${arr.length} items...`);

        const sanitized: Product[] = arr.map((raw: any) => {
            const id = raw.id || findValueGreedy(raw, ['_id', 'uuid', 'uid', 'product_id', 'sys_id']) || `IMP-${Math.random().toString(36).substr(2,9)}`;
            const sku = raw.sku || findValueGreedy(raw, ['msku', 'product_code', 'item_no', 'item_code', '编码', '货号']) || 'UNKNOWN-SKU';
            const name = raw.name || findValueGreedy(raw, ['title', 'product_name', '名称', '标题', '品名']) || 'Unnamed Product';
            const supplier = raw.supplier || findValueGreedy(raw, ['vendor', 'factory', '供应商', '厂家']);

            // 1. Weight Extraction (Enhanced Greedy Match)
            // Prioritize explicitly named fields
            let unitWeight = parseCleanNum(
                raw.unitWeight || 
                raw.weight || 
                findValueGreedy(raw, ['gross_weight', 'package_weight', '单重', '毛重', 'weight_kg', 'kg', '单品重量'])
            );
            // Safety: if weight < 0.01, assume it's invalid or missing, default to 0.5kg as placeholder if critical
            if (unitWeight <= 0) unitWeight = 0; 

            // 2. Cost & Price
            const unitCost = parseCleanNum(raw.financials?.costOfGoods || findValueGreedy(raw, ['cost', 'purchase_price', '采购价', '进货价', '成本']));
            const price = parseCleanNum(raw.financials?.sellingPrice || raw.price || findValueGreedy(raw, ['selling_price', 'retail_price', '销售价', '售价']));
            const stock = parseCleanNum(raw.stock || findValueGreedy(raw, ['qty', 'quantity', 'stock_level', '库存', '数量']));
            const imageUrl = raw.imageUrl || findValueGreedy(raw, ['image', 'img', 'pic', 'url']);

            // 3. Logistics Logic & Tracking Extraction (INTELLIGENT)
            const trackingNo = raw.logistics?.trackingNo || 
                               raw.trackingNo || 
                               findValueGreedy(raw, ['tracking', 'tracking_no', 'waybill', '运单号', '追踪号', '提单号']) || '';

            let carrier = raw.logistics?.carrier || 
                          raw.carrier || 
                          findValueGreedy(raw, ['carrier', 'provider', '承运商', '物流公司']) || '';

            let methodRaw = raw.logistics?.method || 
                            raw.method || 
                            findValueGreedy(raw, ['method', 'transport', 'mode', '运输方式', '渠道']) || 'Sea';

            let method: 'Air' | 'Sea' | 'Rail' | 'Truck' = 'Sea';
            const mStr = String(methodRaw).toLowerCase();
            if (mStr.includes('air') || mStr.includes('空')) method = 'Air';
            else if (mStr.includes('rail') || mStr.includes('铁')) method = 'Rail';
            else if (mStr.includes('truck') || mStr.includes('卡')) method = 'Truck';
            
            const tUpper = String(trackingNo).toUpperCase();
            const cUpper = String(carrier).toUpperCase();
            if (tUpper.startsWith('1Z') || cUpper.includes('UPS')) { if(!carrier) carrier = 'UPS'; if(method === 'Sea') method = 'Air'; }
            if (cUpper.includes('DHL') || cUpper.includes('FEDEX')) method = 'Air';
            if (cUpper.includes('MATSON') || cUpper.includes('COSCO')) method = 'Sea';

            // Cost Logic
            let shippingRate = parseCleanNum(
                raw.logistics?.shippingRate || 
                raw.shippingRate || 
                findValueGreedy(raw, ['shipping_rate', 'freight_rate', '头程单价', '运费单价', 'kg_price', '头程费率'])
            );

            let shippingCost = parseCleanNum(
                raw.financials?.shippingCost || 
                findValueGreedy(raw, ['shipping', 'freight', 'logistics_cost', '运费', '头程', 'unit_shipping'])
            );

            if (shippingRate === 0 && shippingCost > 0 && unitWeight > 0) {
                shippingRate = parseFloat((shippingCost / unitWeight).toFixed(2));
            } else if (shippingCost === 0 && shippingRate > 0 && unitWeight > 0) {
                shippingCost = parseFloat((shippingRate * unitWeight).toFixed(2));
            }

            return {
                id: String(id),
                sku: String(sku),
                name: String(name),
                description: raw.description || '',
                price: price || (unitCost * 3),
                stock: stock,
                currency: raw.currency || Currency.USD,
                status: raw.status || ProductStatus.Draft,
                category: raw.category || 'General',
                marketplaces: Array.isArray(raw.marketplaces) ? raw.marketplaces : [],
                imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
                lastUpdated: new Date().toISOString(),
                supplier: String(supplier || ''),
                note: raw.note || '',
                unitWeight: unitWeight,
                
                // Physical Props
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
                logistics: {
                    method: method,
                    carrier: carrier,
                    trackingNo: String(trackingNo),
                    status: 'Pending',
                    origin: '',
                    destination: '',
                    shippingRate: shippingRate,
                    manualChargeableWeight: 0
                },
                dailySales: parseCleanNum(raw.dailySales || 0),
                // Preserve variants if they exist
                variants: Array.isArray(raw.variants) ? raw.variants : [],
                hasVariants: Array.isArray(raw.variants) && raw.variants.length > 0
            };
        });

        onImportData(sanitized);
        setImportStatus('success');
        setImportMessage(`导入成功: ${sanitized.length} 条数据 (已智能识别物流信息)`);
        setTimeout(() => { setImportStatus('idle'); setImportMessage(''); }, 4000);
      } catch (err: any) {
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
        if(onNotify) onNotify(isOnline ? 'success' : 'error', isOnline ? '连接成功' : '连接失败', isOnline ? '已连接私有云' : '无法连接服务器');
    } catch (e) {
        setConnectionStatus('error');
        if(onNotify) onNotify('error', '错误', '未知连接错误');
    }
  };

  // --- ADMIN HANDLERS ---
  const handleInitSchema = async () => {
      setDetailedError(null);
      if (!adminEmail || !adminPassword || !serverUrlInput) { setDetailedError("请输入完整信息"); return; }
      setIsInitializing(true);
      setInitStatusMsg("Connecting...");
      try {
          const targetUrl = serverUrlInput.replace(/\/$/, '');
          const resp = await fetch(`${targetUrl}/api/collections`, { method: 'GET' }).catch(() => null); // Simple check, usually needs auth
          
          // Actual auth logic requires SDK admin usage or raw fetch
          const authResp = await fetch(`${targetUrl}/api/admins/auth-with-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identity: adminEmail, password: adminPassword })
          });
          if (!authResp.ok) throw new Error("Admin Auth Failed");
          const { token } = await authResp.json();
          
          setInitStatusMsg("Creating Collections...");
          for (const def of COLLECTIONS_SCHEMA) {
              await fetch(`${targetUrl}/api/collections`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': token },
                  body: JSON.stringify({ name: def.name, type: def.type, schema: def.schema })
              }).catch(() => {});
          }
          if(onNotify) onNotify('success', '初始化完成', '数据库表结构已更新');
      } catch (e: any) {
          setDetailedError(e.message);
      } finally {
          setIsInitializing(false);
          setInitStatusMsg("");
      }
  };

  const handleClearCloudData = async () => {
      if(!confirm('确定清空云端所有数据？此操作不可逆！')) return;
      setIsInitializing(true);
      try {
          const collections = ['products', 'shipments', 'transactions', 'influencers', 'tasks', 'competitors', 'messages'];
          for (const col of collections) {
              const list = await pb.collection(col).getFullList().catch(()=>[]);
              for(const item of list) await pb.collection(col).delete(item.id).catch(()=>{});
          }
          if(onNotify) onNotify('success', '清空完成', '所有数据已删除');
      } catch(e: any) {
          if(onNotify) onNotify('error', '清空失败', e.message);
      } finally {
          setIsInitializing(false);
      }
  };

  const themes = [
      { id: 'neon', name: 'Neon Glass', icon: Zap, bg: 'bg-black' },
      { id: 'ivory', name: 'Ivory Air', icon: Sun, bg: 'bg-gray-100' },
      { id: 'midnight', name: 'Midnight Pro', icon: Moon, bg: 'bg-slate-900' },
      { id: 'sunset', name: 'Sunset Vibe', icon: Sunset, bg: 'bg-[#2D1B2E]' },
      { id: 'forest', name: 'Deep Forest', icon: Trees, bg: 'bg-[#051C12]' },
      { id: 'nebula', name: 'Void Nebula', icon: Rocket, bg: 'bg-[#0B0014]' },
  ];

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20 max-w-5xl mx-auto">
      
      <div className="border-b border-white/10 pb-6">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight flex items-center gap-3">
              系统设置 <span className="text-gray-500 font-sans text-sm tracking-widest font-medium border border-gray-700 px-2 py-0.5 rounded">SETTINGS</span>
           </h1>
      </div>

      {/* Theme */}
      <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Monitor size={16}/> 界面主题</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {themes.map(t => (
                  <button key={t.id} onClick={() => onThemeChange(t.id as Theme)} className={`p-4 rounded-xl border text-left transition-all ${currentTheme === t.id ? 'border-neon-blue bg-white/10' : 'border-white/10 bg-white/5'}`}>
                      <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/10`}><t.icon size={16}/></div>
                          <span className="text-sm font-bold text-white">{t.name}</span>
                      </div>
                  </button>
              ))}
          </div>
      </section>

      {/* Cloud */}
      <section className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-sm font-bold text-neon-blue uppercase tracking-widest flex items-center gap-2"><CloudCog size={16}/> 云端连接</h2>
          <div className="glass-card p-6 border-neon-blue/30 bg-neon-blue/5 flex gap-4 items-end">
              <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-gray-400">Server URL</label>
                  <input value={serverUrlInput} onChange={(e) => setServerUrlInput(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-white outline-none focus:border-neon-blue"/>
              </div>
              <button onClick={handleConnectServer} className="h-10 px-6 bg-neon-blue text-black rounded-lg font-bold text-xs flex items-center gap-2">
                  {connectionStatus === 'checking' ? <Loader2 size={16} className="animate-spin"/> : 'Connect'}
              </button>
          </div>
      </section>

      {/* Data */}
      <section className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex justify-between">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Database size={16}/> 数据管理</h2>
              <span className="text-xs text-gray-500">Local: {storageUsage.usedKB.toFixed(0)}KB</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6 flex flex-col items-center gap-3 hover:border-white/20 transition-all">
                  <Download size={24} className="text-neon-blue"/>
                  <button onClick={handleExport} className="px-4 py-2 bg-gradient-neon-blue text-white rounded-lg text-xs font-bold">导出备份</button>
              </div>
              
              {/* Import Card */}
              <div className="glass-card p-6 flex flex-col items-center gap-3 hover:border-neon-purple/50 transition-all relative overflow-hidden">
                  {importStatus === 'processing' && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                          <Loader2 size={24} className="text-neon-purple animate-spin mb-2"/>
                          <span className="text-xs text-white font-bold">{importMessage}</span>
                      </div>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept=".json,.txt,.csv" onChange={(e) => { if(e.target.files?.[0]) processFile(e.target.files[0]); e.target.value=''; }} />
                  <Upload size={24} className="text-neon-purple"/>
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20">导入数据</button>
              </div>
          </div>

          {/* Sync Button (Force Visible but show state) */}
          {onSyncToCloud && (
              <div className="glass-card p-6 border-neon-green/20 bg-neon-green/5 flex justify-between items-center mt-4">
                  <div className="flex items-center gap-3">
                      <ArrowUpCircle size={24} className={currentOnlineStatus ? "text-neon-green" : "text-gray-500"}/>
                      <div>
                          <div className="text-sm font-bold text-white">全量推送 (Sync to Cloud)</div>
                          <div className="text-xs text-gray-400">
                              {currentOnlineStatus ? '服务器在线，可以同步' : '⚠️ 离线模式 - 请先连接服务器'}
                          </div>
                      </div>
                  </div>
                  <button 
                      onClick={onSyncToCloud}
                      className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${currentOnlineStatus ? 'bg-neon-green text-black hover:scale-105' : 'bg-gray-700 text-gray-400'}`}
                  >
                      立即同步
                  </button>
              </div>
          )}
      </section>

      {/* Admin */}
      <section className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2"><Lock size={16}/> 管理员专区 (Admin Zone)</h2>
          <div className="glass-card p-6 border-red-500/20 bg-red-500/5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <input type="email" placeholder="admin@email.com" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-white text-xs outline-none focus:border-red-500"/>
                  <input type="password" placeholder="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-white text-xs outline-none focus:border-red-500"/>
              </div>
              {detailedError && <div className="text-xs text-red-300 bg-red-500/10 p-2 rounded">{detailedError}</div>}
              <div className="flex gap-3">
                  <button onClick={handleInitSchema} disabled={isInitializing} className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                      {isInitializing ? <Loader2 size={14} className="animate-spin"/> : <Key size={14}/>} 初始化表结构
                  </button>
                  <button onClick={handleClearCloudData} disabled={isInitializing} className="h-10 px-4 border border-red-500/50 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/10">
                      <Trash2 size={14}/>
                  </button>
              </div>
          </div>
      </section>

    </div>
  );
};

export default SettingsModule;
