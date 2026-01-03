
import React, { useState, useRef, useEffect } from 'react';
import { Theme, Product, ProductStatus, Currency } from '../types';
import { 
  Sun, Moon, Zap, Database, Upload, Download, CheckCircle2, 
  Loader2, FileJson, HardDrive, RefreshCw, Server, Smartphone, 
  Monitor, Shield, Globe, Bell, Sunset, Trees, Rocket, RotateCcw, AlertTriangle, AlertCircle, CloudCog, ArrowUpCircle, Lock, Key, ExternalLink, XCircle, Terminal, Info, ArrowDown, Unlock, Trash2
} from 'lucide-react';
import { pb, updateServerUrl, isCloudConnected } from '../services/pocketbase';
import PocketBase from 'pocketbase';

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
// SCHEMA DEFINITIONS FOR AUTO-INIT
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
    {
        name: 'shipments',
        type: 'base',
        schema: [
            { name: 'trackingNo', type: 'text' },
            { name: 'carrier', type: 'text' },
            { name: 'method', type: 'text' },
            { name: 'origin', type: 'text' },
            { name: 'destination', type: 'text' },
            { name: 'etd', type: 'text' },
            { name: 'eta', type: 'text' },
            { name: 'status', type: 'text' },
            { name: 'progress', type: 'number' },
            { name: 'weight', type: 'number' },
            { name: 'cartons', type: 'number' },
            { name: 'items', type: 'json' },
            { name: 'riskReason', type: 'text' },
            { name: 'customsStatus', type: 'text' },
            { name: 'lastUpdate', type: 'text' },
            { name: 'vesselName', type: 'text' },
            { name: 'containerNo', type: 'text' }
        ]
    },
    {
        name: 'transactions',
        type: 'base',
        schema: [
            { name: 'date', type: 'text' },
            { name: 'type', type: 'text' },
            { name: 'category', type: 'text' },
            { name: 'amount', type: 'number' },
            { name: 'description', type: 'text' },
            { name: 'status', type: 'text' }
        ]
    },
    {
        name: 'influencers',
        type: 'base',
        schema: [
            { name: 'name', type: 'text' },
            { name: 'handle', type: 'text' },
            { name: 'platform', type: 'text' },
            { name: 'followers', type: 'number' },
            { name: 'engagementRate', type: 'number' },
            { name: 'region', type: 'text' },
            { name: 'category', type: 'text' },
            { name: 'status', type: 'text' },
            { name: 'avatarUrl', type: 'text' },
            { name: 'cost', type: 'number' },
            { name: 'gmv', type: 'number' },
            { name: 'roi', type: 'number' },
            { name: 'sampleSku', type: 'text' }
        ]
    },
    {
        name: 'tasks',
        type: 'base',
        schema: [
            { name: 'title', type: 'text' },
            { name: 'desc', type: 'text' },
            { name: 'priority', type: 'text' },
            { name: 'status', type: 'text' },
            { name: 'assignee', type: 'text' },
            { name: 'dueDate', type: 'text' },
            { name: 'tags', type: 'json' }
        ]
    },
    {
        name: 'competitors',
        type: 'base',
        schema: [
            { name: 'asin', type: 'text' },
            { name: 'brand', type: 'text' },
            { name: 'name', type: 'text' },
            { name: 'price', type: 'number' },
            { name: 'rating', type: 'number' },
            { name: 'reviewCount', type: 'number' },
            { name: 'imageUrl', type: 'text' },
            { name: 'dailySalesEst', type: 'number' },
            { name: 'lastUpdate', type: 'text' },
            { name: 'status', type: 'text' },
            { name: 'priceHistory', type: 'json' },
            { name: 'keywords', type: 'json' }
        ]
    },
    {
        name: 'messages',
        type: 'base',
        schema: [
            { name: 'platform', type: 'text' },
            { name: 'customerName', type: 'text' },
            { name: 'subject', type: 'text' },
            { name: 'content', type: 'text' },
            { name: 'timestamp', type: 'text' },
            { name: 'status', type: 'text' },
            { name: 'sentiment', type: 'text' },
            { name: 'orderId', type: 'text' },
            { name: 'aiDraft', type: 'text' }
        ]
    }
];

// ------------------------------------------------------------------
// HELPER FUNCTIONS (Improved)
// ------------------------------------------------------------------

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');

const parseCleanNum = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        // Remove currency symbols and thousands separators
        const cleanStr = val.replace(/,/g, '').replace(/[¥$€£]/g, '');
        const match = cleanStr.match(/-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
    }
    return 0;
};

// Robust deep finder for arrays
const findLargestArray = (obj: any): any[] => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    
    let largest: any[] = [];
    const stack = [obj];
    let iterations = 0;
    
    // Safety break to prevent infinite loops on circular structures
    while(stack.length > 0 && iterations < 500) { 
        const current = stack.pop();
        iterations++;
        
        if (Array.isArray(current)) {
            if (current.length > largest.length) largest = current;
            continue; // Don't dig inside arrays of objects for now, assume the array itself is the list
        }
        
        if (typeof current === 'object' && current !== null) {
            Object.values(current).forEach(val => {
                if (Array.isArray(val)) {
                    if (val.length > largest.length) largest = val;
                } else if (typeof val === 'object' && val !== null) {
                    stack.push(val);
                }
            });
        }
    }
    return largest;
};

const findValueGreedy = (obj: any, aliases: string[], exclude: string[] = []): any => {
    if (!obj) return undefined;
    const keys = Object.keys(obj);
    for (const alias of aliases) {
        const nAlias = normalize(alias);
        for (const key of keys) {
            const nKey = normalize(key);
            if (exclude.some(ex => nKey.includes(normalize(ex)))) continue;
            // Exact match priority or inclusion
            if (nKey === nAlias || nKey.includes(nAlias)) {
                const val = obj[key];
                if (val !== undefined && val !== null && val !== '') return val;
            }
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

  // Admin Init State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatusMsg, setInitStatusMsg] = useState('');
  const [detailedError, setDetailedError] = useState<string | null>(null);
  
  const [initSuccess, setInitSuccess] = useState(false);

  // Storage Stats
  const [storageUsage, setStorageUsage] = useState({ usedKB: 0, percent: 0 });

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
    
    // Relaxed Check: Allow almost any file, try to parse as text/json
    // Users might rename .txt to .json or use excel exports
    
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

        // --- DEEP ARRAY SCAN ---
        const arr = findLargestArray(json);
        
        if (!arr || arr.length === 0) {
            throw new Error("在 JSON 中找不到任何数组数据 (No array found in JSON structure).");
        }
        
        console.log(`Found largest array with ${arr.length} items`);

        const sanitized: Product[] = arr.map((raw: any) => {
            // Enhanced Aliases
            const inboundId = raw.inboundId || findValueGreedy(raw, 
                ['lx', 'ib', '入库', '货件', 'fba', 'shipment', 'inbound', '批次', 'batch', 'po_no', '单号'],
                ['sku', 'tracking', '快递', 'carrier', '配送']
            );

            const id = raw.id || findValueGreedy(raw, ['product_id', 'sys_id', 'id', 'uuid', '_id']) || `IMP-${Math.random().toString(36).substr(2,9)}`;
            const sku = raw.sku || findValueGreedy(raw, ['sku', 'msku', '编码', 'item_no', 'model', 'product_code', '货号']) || 'UNKNOWN';
            const name = raw.name || findValueGreedy(raw, ['name', 'title', '名称', '标题', '品名', 'product_name']) || 'Unnamed Product';
            const supplier = raw.supplier || findValueGreedy(raw, ['supplier', 'vendor', '供应商', '厂家', 'factory']);
            const note = raw.note || findValueGreedy(raw, ['note', 'remark', '备注', '说明', 'desc']);

            const unitCost = parseCleanNum(raw.financials?.costOfGoods || findValueGreedy(raw, 
                ['采购单价', '含税单价', '未税', '进货价', '成本', 'purchase', 'cost', 'buying', 'sourcing', '单价', 'price_cost'],
                ['销售', 'selling', 'retail', 'market', '物流', '运费', 'shipping', '费率', 'rate']
            ));

            const price = parseCleanNum(
                raw.financials?.sellingPrice || 
                raw.price || 
                findValueGreedy(raw, 
                    ['销售价', '售价', '定价', '标准价', 'selling', 'retail', 'sale_price', 'listing', 'msrp', 'price'],
                    ['采购', '成本', 'cost', 'purchase', 'buying', '进货', '费率', 'rate']
                )
            );

            let shippingCost = parseCleanNum(raw.financials?.shippingCost || findValueGreedy(raw, 
                [
                    '头程运费单价', '头运费单价', '运费单价', '头程单价', 
                    'shipping_unit_price', 'freight_unit_price',
                    'shippingCost', 'freight', '运费', '头程', '物流费',
                    '海运费', '空运费', '费率', 'rate', 'kg_price', '$/kg', 'shipping', 'logistics'
                ],
                []
            ));

            const stock = parseCleanNum(raw.stock || findValueGreedy(raw, 
                ['stock', 'qty', 'quantity', '库存', '现有', '总数', 'amount', 'total', 'on_hand', 'available', 'inv'],
                ['箱', 'carton', 'box', '装箱']
            ));

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

            return {
                id,
                sku: String(sku),
                name: String(name),
                description: raw.description || '',
                price: price || (unitCost > 0 ? unitCost * 3 : 0),
                stock,
                currency: raw.currency || Currency.USD,
                status: raw.status || ProductStatus.Draft,
                category: raw.category || 'General',
                marketplaces: Array.isArray(raw.marketplaces) ? raw.marketplaces : [],
                imageUrl: raw.imageUrl || '',
                lastUpdated: new Date().toISOString(),
                supplier: String(supplier || ''),
                note: String(note || ''),
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
                platformCommission: parseCleanNum(raw.platformCommission || findValueGreedy(raw, ['platformFee', '佣金'])),
                influencerCommission: parseCleanNum(raw.influencerCommission),
                orderFixedFee: parseCleanNum(raw.orderFixedFee),
                returnRate: parseCleanNum(raw.returnRate),
                lastMileShipping: parseCleanNum(raw.lastMileShipping),
                exchangeRate: parseCleanNum(raw.exchangeRate) || 7.2,
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
        setImportMessage(`导入成功: ${sanitized.length} 条 (已智能识别字段)`);
        
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
          const originalUrl = pb.baseUrl;
          pb.baseUrl = serverUrlInput;
          const health = await pb.health.check({ requestKey: null });
          
          if (health.code === 200) {
              setConnectionStatus('success');
              updateServerUrl(serverUrlInput);
              if (onNotify) onNotify('success', '连接成功', '已切换至腾讯云服务器，页面即将刷新...');
              setTimeout(() => {
                  window.location.reload();
              }, 1500);
          } else {
              setConnectionStatus('error');
              pb.baseUrl = originalUrl;
              if (onNotify) onNotify('error', '连接失败', '服务器返回异常状态，请检查地址。');
          }
      } catch (e) {
          setConnectionStatus('error');
          console.error(e);
          if (onNotify) onNotify('error', '连接超时', '无法连接到服务器，请检查 IP 和端口是否正确 (例如: http://IP:8090)');
      }
  };

  const handleClearCloudData = async () => {
      if(!confirm('🚨 严重警告 🚨\n\n此操作将【永久删除】服务器上的所有数据！\n此操作不可逆！\n\n您确定要清空服务器吗？')) return;
      if(!confirm('再次确认：您真的要清空服务器吗？请确保您有本地备份。')) return;

      setIsInitializing(true);
      setInitStatusMsg("Nuking Server Data...");
      
      try {
          // Iterate all known collections and delete all records
          const collections = ['products', 'shipments', 'transactions', 'influencers', 'tasks', 'competitors', 'messages'];
          let totalDeleted = 0;

          for (const col of collections) {
              setInitStatusMsg(`Clearing ${col}...`);
              try {
                  const records = await pb.collection(col).getFullList();
                  if (records.length > 0) {
                      // Delete in chunks or loop
                      for (const r of records) {
                          await pb.collection(col).delete(r.id);
                      }
                      totalDeleted += records.length;
                  }
              } catch(e) {
                  console.warn(`Failed to clear ${col}`, e);
              }
          }

          if (onNotify) onNotify('success', '服务器已清空', `共删除了 ${totalDeleted} 条重复/无效数据。现在请重新推送干净的数据。`);
          setInitSuccess(true); // Re-trigger the "Now Upload" prompt

      } catch (e: any) {
          console.error("Clear Error", e);
          if (onNotify) onNotify('error', '清空失败', e.message);
      } finally {
          setIsInitializing(false);
          setInitStatusMsg("");
      }
  };

  const handleInitSchema = async () => {
      // ... (Keep existing Schema Init logic exactly as is)
      setDetailedError(null);
      setInitSuccess(false);
      
      if (!adminEmail || !adminPassword) {
          setDetailedError("请输入 Admin Email 和 Password");
          return;
      }
      if (!serverUrlInput) {
          setDetailedError("Server URL is missing.");
          return;
      }

      setIsInitializing(true);
      setInitStatusMsg("Running Universal Diagnostics...");
      
      const debugLogs: string[] = [];
      const targetUrl = serverUrlInput.replace(/\/$/, '').trim();
      let authSuccess = false;
      let authToken = "";
      let adminModel = null;

      try {
          // 1. Health Check
          debugLogs.push(`[1] Health Check: ${targetUrl}/api/health`);
          try {
              const health = await fetch(`${targetUrl}/api/health`);
              debugLogs.push(`>> Status: ${health.status} ${health.statusText}`);
          } catch (e: any) {
              debugLogs.push(`>> Network Failed: ${e.message}`);
              debugLogs.push(`>> Hint: Check if server is running and accessible from browser.`);
          }

          // 2. Auth Attempt: Legacy (admins)
          debugLogs.push(`\n[2] Attempt Legacy Auth: ${targetUrl}/api/admins/auth-with-password`);
          try {
              const resp = await fetch(`${targetUrl}/api/admins/auth-with-password`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ identity: adminEmail, password: adminPassword })
              });
              
              if (resp.ok) {
                 const data = await resp.json();
                 authToken = data.token;
                 adminModel = data.admin;
                 authSuccess = true;
                 debugLogs.push(`>> SUCCESS! Token received.`);
              } else {
                 const text = await resp.text();
                 debugLogs.push(`>> Failed: HTTP ${resp.status}`);
                 debugLogs.push(`>> Response: ${text.substring(0, 200)}...`);
              }
          } catch (e: any) {
              debugLogs.push(`>> Error: ${e.message}`);
          }

          // 3. Auth Attempt: Modern (_superusers)
          if (!authSuccess) {
              debugLogs.push(`\n[3] Attempt Superuser Auth: ${targetUrl}/api/collections/_superusers/auth-with-password`);
              try {
                  const resp = await fetch(`${targetUrl}/api/collections/_superusers/auth-with-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ identity: adminEmail, password: adminPassword })
                  });

                  if (resp.ok) {
                     const data = await resp.json();
                     authToken = data.token;
                     adminModel = data.record;
                     authSuccess = true;
                     debugLogs.push(`>> SUCCESS! Token received.`);
                  } else {
                     const text = await resp.text();
                     debugLogs.push(`>> Failed: HTTP ${resp.status}`);
                     debugLogs.push(`>> Response: ${text.substring(0, 200)}...`);
                  }
              } catch (e: any) {
                  debugLogs.push(`>> Error: ${e.message}`);
              }
          }

          if (!authSuccess) {
              const fullLog = debugLogs.join('\n');
              setDetailedError(fullLog);
              throw new Error("所有认证尝试均失败 (Check detailed logs below)");
          }

          setInitStatusMsg("Auth OK! Checking & Updating Schema...");
          let createdCount = 0;
          let updatedCount = 0;

          // Helper to generate compliant options for legacy PB versions
          const getOptions = (type: string) => {
              switch (type) {
                  case 'text': return { min: null, max: null, pattern: "" };
                  case 'number': return { min: null, max: null, noDecimal: false };
                  case 'bool': return {};
                  case 'email': return { exceptDomains: [], onlyDomains: [] };
                  case 'url': return { exceptDomains: [], onlyDomains: [] };
                  case 'date': return { min: "", max: "" };
                  case 'select': return { maxSelect: 1, values: [] };
                  case 'json': return { maxSize: 2000000 }; 
                  case 'file': return { maxSize: 5242880, maxSelect: 1, mimeTypes: [] };
                  case 'relation': return { collectionId: "", cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: [] };
                  default: return {};
              }
          };

          for (const def of COLLECTIONS_SCHEMA) {
              const checkUrl = `${targetUrl}/api/collections/${def.name}`;
              let exists = false;
              let existingId = '';
              try {
                  const checkResp = await fetch(checkUrl, {
                      headers: { 'Authorization': authToken }
                  });
                  if (checkResp.ok) {
                      exists = true;
                      const existingData = await checkResp.json();
                      existingId = existingData.id;
                  }
              } catch (e) { /* ignore */ }

              const legacySchema = def.schema.map(f => ({
                  name: f.name,
                  type: f.type,
                  required: false,
                  unique: false,
                  options: getOptions(f.type)
              }));

              const payloadLegacy = {
                  name: def.name,
                  type: def.type,
                  schema: legacySchema, 
                  listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
              };

              const payloadModern = {
                  name: def.name,
                  type: def.type,
                  fields: def.schema, 
                  listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
              };

              if (!exists) {
                  debugLogs.push(`>> Creating '${def.name}' (Public)...`);
                  let createResp = await fetch(`${targetUrl}/api/collections`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': authToken },
                      body: JSON.stringify(payloadLegacy)
                  });

                  if (!createResp.ok) {
                      createResp = await fetch(`${targetUrl}/api/collections`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': authToken },
                          body: JSON.stringify(payloadModern)
                      });
                  }

                  if (createResp.ok) {
                      createdCount++;
                  } else {
                      throw new Error(`Failed to create ${def.name}`);
                  }
              } else {
                  debugLogs.push(`>> Updating '${def.name}' permissions...`);
                  const updateUrl = `${targetUrl}/api/collections/${existingId}`;
                  
                  let updateResp = await fetch(updateUrl, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', 'Authorization': authToken },
                      body: JSON.stringify(payloadLegacy)
                  });

                  if(!updateResp.ok) {
                       updateResp = await fetch(updateUrl, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', 'Authorization': authToken },
                          body: JSON.stringify(payloadModern)
                      });
                  }

                  if (updateResp.ok) {
                      updatedCount++;
                  }
              }
          }
          
          updateServerUrl(targetUrl);
          pb.authStore.save(authToken, adminModel);
          setInitSuccess(true); 

          if (onNotify) onNotify('success', '服务器结构更新成功', `Created: ${createdCount}, Updated: ${updatedCount}. 全设备可访问。`);

      } catch (e: any) {
          console.error("Init Error:", e);
          if (!detailedError && debugLogs.length > 0) {
             setDetailedError(debugLogs.join('\n') + `\n\nFinal Error: ${e.message}`);
          } else if (!detailedError) {
             setDetailedError(e.message);
          }
      } finally {
          setIsInitializing(false);
          setInitStatusMsg("");
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

      {/* 2. Cloud Server Connection */}
      <section className="space-y-4">
          <h2 className="text-sm font-bold text-neon-blue uppercase tracking-widest flex items-center gap-2">
              <CloudCog size={16} /> 云服务器配置 (Cloud Server)
          </h2>
          
          {/* Mixed Content Warning */}
          {isMixedContent && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                  <Shield className="text-red-500 mt-1" size={20} />
                  <div>
                      <h4 className="text-sm font-bold text-white mb-1">安全策略警告 (Mixed Content)</h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                          当前页面运行在 <strong>HTTPS</strong>，但您尝试连接 <strong>HTTP</strong> 服务器。
                          浏览器会出于安全原因拦截此请求。
                          <br/><br/>
                          解决方案：
                          <ul className="list-disc pl-4 mt-1 space-y-1">
                              <li>使用 <code>localhost</code> 访问前端</li>
                              <li>为 PocketBase 服务器配置 SSL 证书 (使用 https://)</li>
                              <li>或者使用 Cloudflare Tunnel 等工具暴露 https 地址</li>
                          </ul>
                      </p>
                  </div>
              </div>
          )}

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

          {initSuccess && (
              <div className="bg-neon-green/10 border border-neon-green/30 p-4 rounded-xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-neon-green"/>
                      <div>
                          <h4 className="text-sm font-bold text-white">操作成功！数据库已就绪。</h4>
                          <p className="text-xs text-gray-300">现在请点击下方的 <strong className="text-neon-green">全量推送到云端</strong> 按钮，将您的本地数据上传到服务器。</p>
                      </div>
                  </div>
                  <ArrowDown size={24} className="text-neon-green animate-bounce mr-10"/>
              </div>
          )}

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
              {/* Export */}
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

              {/* Push to Cloud */}
              {onSyncToCloud && currentOnlineStatus && (
                  <div className={`glass-card p-8 flex flex-col items-center justify-center text-center space-y-4 group transition-all relative overflow-hidden ${
                      initSuccess 
                      ? 'border-2 border-neon-green shadow-glow-green bg-neon-green/5' 
                      : 'hover:border-neon-green/30 border-neon-green/10 bg-neon-green/5'
                  }`}>
                      <div className="w-16 h-16 rounded-full bg-neon-green/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <ArrowUpCircle size={32} className="text-neon-green" />
                      </div>
                      <div>
                          <h2 className="text-lg font-bold text-white mb-1">全量推送到云端 (Push)</h2>
                          <p className="text-xs text-gray-400 px-6">
                              将所有本地数据上传到腾讯云。智能防重机制已启用。
                          </p>
                      </div>
                      <button 
                        onClick={onSyncToCloud}
                        className="mt-2 px-6 py-2 bg-neon-green text-black font-bold rounded-lg text-xs transition-all flex items-center gap-2 shadow-glow-green hover:scale-105 z-10"
                      >
                          <Upload size={14} /> 开始上传
                      </button>
                      
                      {initSuccess && (
                          <div className="absolute inset-0 bg-neon-green/5 animate-pulse pointer-events-none"></div>
                      )}
                  </div>
              )}

              {/* Import */}
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
                          accept=".json,.txt,.csv" 
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

      {/* 4. Admin Zone: Schema Init */}
      <section className="space-y-4">
          <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
              <Lock size={16} /> 管理员专区 (Admin Zone)
          </h2>
          
          {detailedError && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-4 relative animate-scale-in">
                  <button onClick={() => setDetailedError(null)} className="absolute top-3 right-3 text-red-400 hover:text-white"><XCircle size={16}/></button>
                  <div className="flex gap-3">
                      <Terminal className="text-red-500 shrink-0 mt-1" size={20}/>
                      <div className="overflow-hidden w-full">
                          <h4 className="text-sm font-bold text-white mb-1">初始化遇到错误 (Error Diagnostic Report)</h4>
                          <pre className="text-[10px] text-red-200 font-mono bg-black/40 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                              {detailedError}
                          </pre>
                          <div className="flex gap-2 mt-2">
                              <Info size={12} className="text-gray-400 mt-0.5"/>
                              <p className="text-xs text-gray-400">
                                  <b>常见错误代码:</b> <br/>
                                  <span className="text-neon-yellow">404</span> = 路径错误 (请检查 URL) <br/>
                                  <span className="text-neon-yellow">400</span> = 密码错误或参数无效 <br/>
                                  <span className="text-neon-yellow">Failed to fetch</span> = 混合内容/CORS/服务器离线
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <div className="glass-card p-6 border-red-500/20 bg-red-500/5">
              <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 mb-2">
                      <AlertTriangle size={24} className="text-red-500 shrink-0"/>
                      <div>
                          <h3 className="text-white font-bold">服务器初始化 (Server Initialization)</h3>
                          <p className="text-xs text-gray-400 mt-1">
                              管理数据表结构与权限。
                              <br/>
                              <span className="text-neon-yellow flex items-center gap-1 mt-1">
                                <Unlock size={10} /> 
                                系统会自动将所有表的读取权限设置为<strong>公开 (Public)</strong>，以便多设备同步。
                              </span>
                          </p>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Admin Email</label>
                          <input 
                              type="email"
                              value={adminEmail}
                              onChange={(e) => setAdminEmail(e.target.value)}
                              placeholder="admin@example.com"
                              className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-red-500 outline-none"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Password</label>
                          <input 
                              type="password"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-red-500 outline-none"
                          />
                      </div>
                  </div>
                  
                  <div className="flex gap-4 mt-2">
                      <button 
                          onClick={handleInitSchema}
                          disabled={isInitializing}
                          className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                          {isInitializing ? <Loader2 size={16} className="animate-spin"/> : <Key size={16}/>}
                          {isInitializing ? (initStatusMsg || '正在处理...') : '一键创建/修复数据表'}
                      </button>
                      
                      <button 
                          onClick={handleClearCloudData}
                          disabled={isInitializing}
                          className="px-6 py-3 border border-red-500/50 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                          title="删除服务器上所有数据 (Dangerous)"
                      >
                          <Trash2 size={16}/> 清空云端数据库
                      </button>
                  </div>
              </div>
          </div>
      </section>

      <div className="border-t border-white/10 my-8"></div>

      {/* 5. About */}
      <section className="space-y-4">
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
