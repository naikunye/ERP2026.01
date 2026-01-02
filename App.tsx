
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductEditor from './components/ProductEditor';
import RestockModule from './components/RestockModule';
import SKUDetailEditor from './components/SKUDetailEditor';
import LogisticsModule from './components/LogisticsModule';
import SettingsModule from './components/SettingsModule';
import InfluencerModule from './components/InfluencerModule';
import FinanceModule from './components/FinanceModule';
import TaskModule from './components/TaskModule';
import MarketingModule from './components/MarketingModule'; 
import MarketRadarModule from './components/MarketRadarModule'; 
import GlobalInboxModule from './components/GlobalInboxModule'; 
import AnalyticsModule from './components/AnalyticsModule'; // Import
import CommandPalette from './components/CommandPalette';
import Copilot from './components/Copilot';
import ToastSystem from './components/ToastSystem';
import { Product, ProductStatus, Currency, Shipment, Influencer, Transaction, Theme, InventoryLog, Task, Notification, Competitor, CustomerMessage } from './types';

// --- HIGH FIDELITY DEMO DATA (Updated for New Structure) ---

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'DEMO-001',
    sku: 'AERO-ANC-PRO',
    name: 'Aero 降噪耳机 Pro (2024)',
    description: '旗舰级主动降噪，40小时续航，透明模式。',
    price: 89.99,
    currency: Currency.USD,
    stock: 1200,
    category: 'Electronics',
    status: ProductStatus.Active,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300&h=300',
    marketplaces: ['US', 'DE'],
    lastUpdated: new Date().toISOString(),
    supplier: '深圳声学科技有限公司',
    inboundId: 'IB-20231101',
    inboundStatus: 'Received',
    exchangeRate: 7.2,
    financials: { costOfGoods: 160, shippingCost: 3.2, otherCost: 0.5, sellingPrice: 89.99, platformFee: 13.5, adCost: 12.0 }, // Cost in RMB (approx 160)
    logistics: { method: 'Air', carrier: 'DHL', trackingNo: 'DHL99283711HK', status: 'In Transit', origin: 'Shenzhen', destination: 'US-LAX', shippingRate: 5.5 }
  },
  {
    id: 'DEMO-002',
    sku: 'ERGO-CHAIR-X1',
    name: '人体工学办公椅 X1',
    description: '全网布透气，3D扶手调节，腰部支撑。',
    price: 199.00,
    currency: Currency.USD,
    stock: 45,
    category: 'Furniture',
    status: ProductStatus.Active,
    imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=300&h=300',
    marketplaces: ['US'],
    lastUpdated: new Date().toISOString(),
    supplier: '安吉椅业集团',
    inboundId: 'IB-20231105',
    inboundStatus: 'Pending',
    exchangeRate: 7.2,
    financials: { costOfGoods: 450, shippingCost: 45.0, otherCost: 2.0, sellingPrice: 199.00, platformFee: 29.85, adCost: 25.0 }, // Cost in RMB
    logistics: { method: 'Sea', carrier: 'Matson', trackingNo: 'MSN78291029US', status: 'Customs', origin: 'Ningbo', destination: 'US-LGB', shippingRate: 1.2 }
  },
  {
    id: 'DEMO-003',
    sku: 'LUMI-SMART-BULB',
    name: 'Lumina 智能灯泡 (4件装)',
    description: 'WiFi直连，1600万色，支持Alexa/Google Home。',
    price: 39.99,
    currency: Currency.USD,
    stock: 0,
    category: 'Home',
    status: ProductStatus.Draft,
    imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=300&h=300',
    marketplaces: ['US', 'JP'],
    lastUpdated: new Date().toISOString(),
    supplier: '中山照明厂',
    exchangeRate: 7.2,
    financials: { costOfGoods: 55, shippingCost: 1.5, otherCost: 0.2, sellingPrice: 39.99, platformFee: 6.0, adCost: 8.0 },
    logistics: { method: 'Air', carrier: 'UPS', trackingNo: '', status: 'Pending', origin: 'Zhongshan', destination: 'US-DAL', shippingRate: 6.0 }
  }
];

const DEMO_SHIPMENTS: Shipment[] = [
  {
    id: 'SH-001',
    trackingNo: 'MSN78291029US',
    carrier: 'Matson (CLX)',
    method: 'Sea',
    origin: 'Ningbo, CN',
    destination: 'Long Beach, US',
    etd: '2023-11-01',
    eta: '2023-11-14',
    status: 'In Transit',
    progress: 65,
    weight: 3500,
    cartons: 120,
    items: [{ skuId: 'DEMO-002', skuCode: 'ERGO-CHAIR-X1', quantity: 120 }], // Updated Structure
    vesselName: 'COSCO GALAXY',
    voyageNo: 'V.049W',
    containerNo: 'MSKU9022831',
    sealNo: 'H882910',
    customsStatus: 'Cleared',
    lastUpdate: '2023-11-10T08:30:00Z'
  },
  {
    id: 'SH-002',
    trackingNo: 'DHL99283711HK',
    carrier: 'DHL Express',
    method: 'Air',
    origin: 'Hong Kong, CN',
    destination: 'Los Angeles, US',
    etd: '2023-11-10',
    eta: '2023-11-12',
    status: 'Customs',
    progress: 85,
    weight: 240,
    cartons: 20,
    items: [{ skuId: 'DEMO-001', skuCode: 'AERO-ANC-PRO', quantity: 500 }],
    customsStatus: 'Inspection',
    customsBroker: 'Flexport Customs',
    lastUpdate: '2023-11-11T14:15:00Z'
  }
];

const DEMO_INFLUENCERS: Influencer[] = [
    {
        id: 'INF-001',
        name: 'Jessica Tech',
        handle: '@jessicamania',
        platform: 'TikTok',
        followers: 1200000,
        engagementRate: 5.8,
        region: 'North America',
        category: 'Tech Review',
        status: 'Content Live',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150',
        cost: 1500,
        gmv: 12400,
        roi: 8.2,
        sampleSku: 'AERO-ANC-PRO'
    }
];

const DEMO_TRANSACTIONS: Transaction[] = [
    { id: 'TX-1001', date: '2023-11-15', type: 'Revenue', category: 'Sales', amount: 4500.00, description: 'Amazon US Settlement', status: 'Cleared' },
    { id: 'TX-1002', date: '2023-11-14', type: 'Expense', category: 'Shipping', amount: 1200.00, description: 'DHL Express Payment', status: 'Cleared' },
];

const DEMO_TASKS: Task[] = [
  {
    id: 'T-101',
    title: '审核 Q4 备货计划',
    desc: '根据 AI 预测数据，审核主要 SKU 的补货建议量。',
    priority: 'High',
    status: 'Todo',
    assignee: 'https://ui-avatars.com/api/?name=Admin&background=random',
    dueDate: '2023-11-20',
    tags: ['Inventory', 'Audit']
  }
];

const DEMO_COMPETITORS: Competitor[] = [
    {
        id: 'C-001',
        asin: 'B08XJ8912',
        brand: 'SoundCore',
        name: 'SoundCore Noise Cancelling Headphones Q30',
        price: 79.99,
        priceHistory: [
            { date: '11/01', price: 79.99 }, { date: '11/05', price: 79.99 },
            { date: '11/10', price: 69.99 }, { date: '11/15', price: 69.99 },
            { date: '11/20', price: 79.99 }, { date: '11/25', price: 79.99 }
        ],
        rating: 4.5,
        reviewCount: 12450,
        imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=150&q=80',
        dailySalesEst: 150,
        keywords: ['anc headphones', 'bluetooth headset'],
        lastUpdate: '10 min ago',
        status: 'Tracking'
    }
];

const DEMO_MESSAGES: CustomerMessage[] = [
    {
        id: 'MSG-001',
        platform: 'Amazon',
        customerName: 'Alice Smith',
        subject: 'Defective Item Received',
        content: 'I received the headphones yesterday but the right ear cup is not working. I am very disappointed as this was a gift.',
        timestamp: '10:30 AM',
        status: 'Unread',
        sentiment: 'Negative',
        orderId: '112-39283-12321',
        aiDraft: 'Dear Alice,\n\nI am so sorry to hear about the issue with the right ear cup. This is certainly not the experience we want for our customers, especially for a gift.\n\nWe would be happy to send you a free replacement immediately, no return needed. Please confirm your shipping address.\n\nBest regards,\nCustomer Support'
    }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentTheme, setCurrentTheme] = useState<Theme>('neon');
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // --- Data Loading ---
  const loadSafe = <T extends unknown>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      return JSON.parse(saved);
    } catch (e: any) {
      console.warn(`Data corruption detected for key "${key}".`, e);
      return fallback;
    }
  };

  const [products, setProducts] = useState<Product[]>(() => loadSafe('aero_erp_products', DEMO_PRODUCTS));
  const [shipments, setShipments] = useState<Shipment[]>(() => loadSafe('aero_erp_shipments', DEMO_SHIPMENTS));
  const [influencers, setInfluencers] = useState<Influencer[]>(() => loadSafe('aero_erp_influencers', DEMO_INFLUENCERS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadSafe('aero_erp_transactions', DEMO_TRANSACTIONS));
  const [tasks, setTasks] = useState<Task[]>(() => loadSafe('aero_erp_tasks', DEMO_TASKS));
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(() => loadSafe('aero_erp_inventory_logs', []));
  const [competitors, setCompetitors] = useState<Competitor[]>(() => loadSafe('aero_erp_competitors', DEMO_COMPETITORS));
  const [messages, setMessages] = useState<CustomerMessage[]>(() => loadSafe('aero_erp_messages', DEMO_MESSAGES));

  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingSKU, setEditingSKU] = useState<Product | null>(null);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('aero_erp_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('aero_erp_shipments', JSON.stringify(shipments)); }, [shipments]);
  useEffect(() => { localStorage.setItem('aero_erp_influencers', JSON.stringify(influencers)); }, [influencers]);
  useEffect(() => { localStorage.setItem('aero_erp_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('aero_erp_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('aero_erp_inventory_logs', JSON.stringify(inventoryLogs)); }, [inventoryLogs]);
  useEffect(() => { localStorage.setItem('aero_erp_competitors', JSON.stringify(competitors)); }, [competitors]);
  useEffect(() => { localStorage.setItem('aero_erp_messages', JSON.stringify(messages)); }, [messages]);

  // Theme Side Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // CMD+K Listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCmdOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // --- NOTIFICATION SYSTEM ---
  const addNotification = (type: Notification['type'], title: string, message: string) => {
      const newNotif: Notification = {
          id: Date.now().toString(),
          type,
          title,
          message
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const removeNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- DYNAMIC BADGE CALCULATION ---
  const sidebarBadges = useMemo(() => {
      return {
          inbox: messages.filter(m => m.status === 'Unread').length,
          tasks: tasks.filter(t => t.status === 'Todo').length,
          orders: shipments.filter(s => s.status === 'Exception').length,
      };
  }, [messages, tasks, shipments]);

  // --- CORE BUSINESS LOGIC CONTROLLER ---

  const handleInventoryTransaction = (
      productId: string, 
      delta: number, 
      type: 'Inbound' | 'Outbound' | 'Adjustment' | 'OrderPlaced', 
      reason: string,
      operator: string = 'Admin'
  ) => {
      setProducts(prev => prev.map(p => {
          if (p.id !== productId) return p;
          if (type === 'OrderPlaced') return p; 

          const newStock = Math.max(0, p.stock + delta);
          return { ...p, stock: newStock };
      }));

      const log: InventoryLog = {
          id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
          productId,
          type,
          quantity: delta,
          reason,
          timestamp: new Date().toISOString(),
          operator
      };
      setInventoryLogs(prev => [log, ...prev]);
  };

  const handleAddShipment = (newShipment: Shipment) => {
      setShipments(prev => [newShipment, ...prev]);
      newShipment.items.forEach(item => {
          handleInventoryTransaction(item.skuId, -item.quantity, 'Outbound', `发货出库: ${newShipment.trackingNo} (${newShipment.method})`);
      });
      
      // AUTO-LOGIC FIX: Calculate estimated shipping cost in USD based on RMB market rates
      // Assumed Market Rates: Air ~40 RMB/kg, Sea ~10 RMB/kg
      // Exchange Rate: 7.2
      const rmbRate = newShipment.method === 'Air' ? 40 : 10;
      const exchangeRate = 7.2;
      const estimatedCostRMB = newShipment.weight * rmbRate;
      const estimatedCostUSD = estimatedCostRMB / exchangeRate;

      if (estimatedCostUSD > 0) {
          const expense: Transaction = {
              id: `TX-AUTO-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Expense',
              category: 'Shipping',
              amount: parseFloat(estimatedCostUSD.toFixed(2)),
              description: `[系统自动] 运费预估: ${newShipment.trackingNo} (Est. ¥${estimatedCostRMB.toFixed(0)})`,
              status: 'Pending'
          };
          setTransactions(prev => [expense, ...prev]);
          addNotification('success', '运单已创建', `成功扣除库存并记录预计运费 $${estimatedCostUSD.toFixed(2)}`);
      }
  };

  const handleUpdateShipment = (updatedShipment: Shipment) => {
      // 1. Calculate Inventory Delta
      // Find the previous version of this shipment to compare items
      const oldShipment = shipments.find(s => s.id === updatedShipment.id);
      
      if (oldShipment) {
          const oldMap = new Map<string, number>(oldShipment.items.map(i => [i.skuId, i.quantity] as [string, number]));
          const newMap = new Map<string, number>(updatedShipment.items.map(i => [i.skuId, i.quantity] as [string, number]));
          
          const allSkus = new Set<string>([...oldMap.keys(), ...newMap.keys()]);
          
          allSkus.forEach(skuId => {
              const oldQty = oldMap.get(skuId) || 0;
              const newQty = newMap.get(skuId) || 0;
              const delta = newQty - oldQty;
              
              if (delta !== 0) {
                  handleInventoryTransaction(skuId, -delta, delta > 0 ? 'Outbound' : 'Adjustment', `运单修正: ${updatedShipment.trackingNo}`);
              }
          });
      }

      setShipments(prev => prev.map(s => s.id === updatedShipment.id ? updatedShipment : s));
      
      setProducts(prev => prev.map(p => {
          const wasLinked = oldShipment && p.logistics?.trackingNo === oldShipment.trackingNo;
          const isInNewItems = updatedShipment.items?.some(item => item.skuId === p.id);

          if (wasLinked || isInNewItems) {
              return {
                  ...p,
                  logistics: {
                      ...p.logistics!,
                      trackingNo: updatedShipment.trackingNo, // Sync Tracking Number
                      status: updatedShipment.status as any,
                      eta: updatedShipment.eta,
                      carrier: updatedShipment.carrier,
                      method: updatedShipment.method
                  }
              };
          }
          return p;
      }));

      addNotification('success', '状态更新', `运单 ${updatedShipment.trackingNo} 状态已更新并同步至备货清单`);
  };

  // --- SYNC FEATURE: Restock -> Logistics (FIXED LOGIC) ---
  const handleSyncToLogistics = (product: Product) => {
      const logInfo = product.logistics;
      if (!logInfo?.trackingNo) {
          addNotification('error', '同步失败', '该 SKU 暂无物流单号，请先编辑填写');
          return;
      }

      const trackingNo = (logInfo.trackingNo || '').trim();
      const restockCartons = product.restockCartons || 0;
      const itemsPerBox = product.itemsPerBox || 0;
      const boxWeight = product.boxWeight || 0;
      const addedWeight = restockCartons * boxWeight;
      const addedQty = restockCartons * itemsPerBox || product.stock; 

      if(addedQty <= 0) {
          addNotification('warning', '数据无效', '请先配置发货箱数 (Cartons) 和装箱数 (Items/Box)');
          return;
      }

      const existingShipment = shipments.find(s => s.trackingNo === trackingNo);

      if (existingShipment) {
          // Check if shipment is closed
          if (existingShipment.status === 'Delivered' || existingShipment.status === 'Exception') {
              addNotification('error', '同步被拒绝', `运单 ${trackingNo} 已${existingShipment.status === 'Delivered' ? '送达' : '异常'}，无法追加货物。`);
              return;
          }

          const skuExists = existingShipment.items.find(i => i.skuId === product.id);
          if (skuExists) {
              addNotification('warning', '重复添加', `SKU ${product.sku} 已存在于运单 ${trackingNo} 中`);
              return;
          }

          const updatedShipment = {
              ...existingShipment,
              weight: existingShipment.weight + addedWeight,
              cartons: existingShipment.cartons + restockCartons,
              items: [...existingShipment.items, {
                  skuId: product.id,
                  skuCode: product.sku,
                  quantity: addedQty
              }],
              lastUpdate: new Date().toISOString()
          };

          setShipments(prev => prev.map(s => s.id === existingShipment.id ? updatedShipment : s));
          addNotification('success', '拼柜成功', `SKU ${product.sku} 已追加到运单 ${trackingNo}`);

      } else {
          const newShipment: Shipment = {
              id: `SH-SYNC-${Date.now()}`,
              trackingNo: trackingNo,
              carrier: logInfo.carrier || 'Unknown',
              method: logInfo.method || 'Sea',
              origin: product.supplier || 'China Warehouse',
              destination: logInfo.destination || 'FBA / Overseas',
              etd: new Date().toISOString().split('T')[0],
              eta: '',
              status: logInfo.status || 'Pending',
              progress: 0,
              weight: addedWeight,
              cartons: restockCartons,
              items: [{
                  skuId: product.id,
                  skuCode: product.sku,
                  quantity: addedQty
              }],
              lastUpdate: new Date().toISOString()
          };
          setShipments(prev => [newShipment, ...prev]);
          addNotification('success', '同步成功', `新运单 ${trackingNo} 已创建`);
      }

      handleInventoryTransaction(product.id as string, -addedQty, 'Outbound', `发货同步: ${trackingNo} (${logInfo.method})`);

      // FIXED: Use product-specific shipping rate (RMB) -> USD
      const exchangeRate = product.exchangeRate || 7.2;
      const rmbRate = product.logistics?.shippingRate || (logInfo.method === 'Air' ? 40 : 10);
      const estimatedCostRMB = addedWeight * rmbRate;
      const estimatedCostUSD = estimatedCostRMB / exchangeRate;
      
      if (estimatedCostUSD > 0) {
          const expense: Transaction = {
              id: `TX-SYNC-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Expense',
              category: 'Shipping',
              amount: parseFloat(estimatedCostUSD.toFixed(2)),
              description: `[系统同步] 运费预估: ${trackingNo} - ${product.sku as string} (Est. ¥${estimatedCostRMB.toFixed(0)})`,
              status: 'Pending'
          };
          setTransactions(prev => [expense, ...prev]);
      }

      setProducts(prev => prev.map(p => p.id === product.id ? {
          ...p,
          logistics: { ...p.logistics!, status: 'Pending' }
      } : p));
  };

  // --- PROCUREMENT WORKFLOW (New Feature) ---
  const handleCreatePurchaseOrder = (poItems: Array<{ skuId: string; quantity: number; cost: number }>, supplierName: string) => {
      const poId = `PO-${new Date().getFullYear()}${Math.floor(Math.random()*10000)}`;
      let totalCostRMB = 0;
      let totalCostUSD = 0;
      let totalQty = 0;

      for (const item of poItems) {
          handleInventoryTransaction(item.skuId, item.quantity, 'OrderPlaced', `采购下单: ${poId}`);
          
          const product = products.find(p => p.id === item.skuId);
          const rate = product?.exchangeRate || 7.2;
          
          totalCostRMB += item.cost * item.quantity;
          totalCostUSD += (item.cost * item.quantity) / rate;
          totalQty += item.quantity;
      }

      const expense: Transaction = {
          id: `TX-PO-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Expense',
          category: 'COGS',
          amount: parseFloat(totalCostUSD.toFixed(2)), // Record in USD for dashboard
          description: `采购单 ${poId} - ${supplierName} (Total: ¥${totalCostRMB.toLocaleString()})`,
          status: 'Pending'
      };
      setTransactions(prev => [expense, ...prev]);

      const task: Task = {
          id: `T-PO-${Date.now()}`,
          title: `收货入库: ${poId}`,
          desc: `供应商: ${supplierName}。共 ${totalQty} 件商品等待入库。请核对数量和质量。`,
          priority: 'High',
          status: 'Todo',
          assignee: 'https://ui-avatars.com/api/?name=Warehouse&background=random',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
          tags: ['Inbound', 'Procurement']
      };
      setTasks(prev => [task, ...prev]);

      setProducts(prev => prev.map(p => {
          const poItem = poItems.find(i => i.skuId === p.id);
          if (poItem) {
              return {
                  ...p,
                  inboundId: poId,
                  inboundStatus: 'Pending'
              };
          }
          return p;
      }));

      addNotification('success', '采购单已生成', `${poId} 已发送。财务挂账 $${totalCostUSD.toLocaleString()} (¥${totalCostRMB.toLocaleString()})`);
  };

  // --- MARKET RADAR HANDLERS ---
  const handleAddCompetitor = (comp: Competitor) => {
      setCompetitors(prev => [comp, ...prev]);
      addNotification('success', '监控已添加', `开始追踪 ${comp.name} 的价格与销量变动`);
  };

  // --- MESSAGING HANDLERS ---
  const handleReplyMessage = (id: string, replyText: string) => {
      setMessages(prev => prev.map(msg => 
          msg.id === id ? { ...msg, status: 'Replied' } : msg
      ));
      addNotification('success', '回复已发送', '客户将很快收到您的消息');
  };

  // --- CRUD Handlers ---

  const handleSaveProduct = (savedProduct: Product) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === savedProduct.id);
      if (exists && exists.stock !== savedProduct.stock) {
          const delta = savedProduct.stock - exists.stock;
          handleInventoryTransaction(savedProduct.id, delta, 'Adjustment', '手动修正 (Product Editor)');
      } else if (!exists && savedProduct.stock > 0) {
          handleInventoryTransaction(savedProduct.id, savedProduct.stock, 'Inbound', '初始库存 (Initial)');
      }

      if (exists) {
        addNotification('success', '保存成功', `资产 ${savedProduct.sku} 已更新`);
        return prev.map(p => p.id === savedProduct.id ? savedProduct : p);
      }
      addNotification('success', '创建成功', `新资产 ${savedProduct.sku} 已录入`);
      return [savedProduct, ...prev];
    });
  };

  const handleSaveSKU = (updatedData: any) => {
    if (editingSKU) {
       setProducts(prev => prev.map(p => {
           if (p.id !== editingSKU.id) return p;
           
           // Calculate platform fee based on commission if present
           const commissionRate = (updatedData.platformCommission || 0) + (updatedData.influencerCommission || 0);
           const calculatedPlatformFee = (updatedData.sellingPrice * commissionRate) / 100;

           // Determine Shipping Cost Source of Truth
           // If 'unitShippingCost' is passed (calculated from editor), use it.
           // Fallback to existing or 0.
           const finalShippingCostUSD = updatedData.unitShippingCost !== undefined 
                ? updatedData.unitShippingCost 
                : (p.financials?.shippingCost || 0);

           return {
               ...p,
               note: updatedData.note,
               imageUrl: updatedData.imageUrl !== undefined ? updatedData.imageUrl : p.imageUrl, 
               supplier: updatedData.supplierName,
               dailySales: updatedData.dailySales,
               inboundId: updatedData.inboundId,
               inboundStatus: updatedData.inboundStatus, 
               restockDate: updatedData.restockDate,
               
               unitWeight: updatedData.unitWeight,
               boxLength: updatedData.boxLength,
               boxWidth: updatedData.boxWidth,
               boxHeight: updatedData.boxHeight,
               boxWeight: updatedData.boxWeight,
               itemsPerBox: updatedData.itemsPerBox,
               restockCartons: updatedData.restockCartons,

               // New TikTok Fields Persisted
               platformCommission: updatedData.platformCommission,
               influencerCommission: updatedData.influencerCommission,
               orderFixedFee: updatedData.orderFixedFee,
               returnRate: updatedData.returnRate,
               lastMileShipping: updatedData.lastMileShipping,
               
               // Persist Exchange Rate
               exchangeRate: updatedData.exchangeRate,

               financials: {
                   ...p.financials!,
                   costOfGoods: updatedData.unitCost, // Raw RMB Value
                   sellingPrice: updatedData.sellingPrice,
                   shippingCost: finalShippingCostUSD, // Explicitly saved USD value
                   // Map new fields to aggregate financials for backward compatibility
                   otherCost: (updatedData.lastMileShipping || 0) + (updatedData.orderFixedFee || 0) + ((updatedData.sellingPrice * (updatedData.returnRate || 0)) / 100),
                   adCost: updatedData.adCostPerUnit || 0,
                   platformFee: calculatedPlatformFee
               },
               logistics: {
                   ...p.logistics!,
                   method: updatedData.transportMethod,
                   carrier: updatedData.carrier,
                   trackingNo: updatedData.trackingNo,
                   destination: updatedData.destinationWarehouse,
                   shippingRate: updatedData.shippingRate, // Raw RMB Rate
                   manualChargeableWeight: updatedData.manualChargeableWeight // Persist Manual Weight
               }
           } as Product;
       }));
       addNotification('success', '配置已保存', `${editingSKU.sku} 详情已更新`);
    }
    setEditingSKU(null);
  };

  const handleCloneSKU = (product: Product) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(), 
      sku: `${product.sku}-COPY`,
      name: `${product.name} (副本)`,
      status: ProductStatus.Draft,
      stock: 0,
      lastUpdated: new Date().toISOString(),
      note: product.note ? `[Clone] ${product.note}` : undefined
    };
    setProducts(prev => [newProduct, ...prev]);
    addNotification('info', '复制成功', `已创建 ${product.sku} 的副本`);
  };

  const handleDeleteSKU = (productId: string) => {
    if (window.confirm('警告：确定要永久删除此 SKU 吗？此操作涉及库存资产，不可撤销。')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      if (editingSKU?.id === productId) {
        setEditingSKU(null);
      }
      addNotification('warning', '已删除', 'SKU 资产已永久移除');
    }
  };

  const handleImportData = (importedData: Product[]) => {
      if (!Array.isArray(importedData)) {
          addNotification('error', '导入失败', '文件格式不正确，必须为 JSON 数组');
          return;
      }
      setProducts(prev => {
          const prevMap = new Map(prev.map(p => [p.id, p]));
          importedData.forEach(p => { 
              if (p && (p.name || p.sku)) { 
                  const id = p.id || `IMP-${Math.random().toString(36).substr(2,9)}`;
                  prevMap.set(id, { ...p, id }); 
              }
          });
          return Array.from(prevMap.values());
      });
      addNotification('success', '导入完成', `成功同步 ${importedData.length} 条数据`);
  };
  
  const handleAddInfluencer = (newInfluencer: Influencer) => {
      setInfluencers(prev => [newInfluencer, ...prev]);
      addNotification('success', '达人已录入', `新增 ${newInfluencer.platform} 达人: ${newInfluencer.name}`);
  }
  const handleUpdateInfluencer = (updatedInfluencer: Influencer) => setInfluencers(prev => prev.map(inf => inf.id === updatedInfluencer.id ? updatedInfluencer : inf));
  const handleDeleteInfluencer = (id: string) => { 
      if(window.confirm('确定删除?')) {
          setInfluencers(prev => prev.filter(inf => inf.id !== id));
          addNotification('info', '已移除', '达人档案已删除');
      }
  }
  const handleAddTransaction = (newTx: Transaction) => {
      setTransactions(prev => [newTx, ...prev]);
      addNotification('success', '记账成功', `${newTx.type === 'Revenue' ? '收入' : '支出'} $${newTx.amount} 已记录`);
  }
  
  const handleUpdateTasks = (updatedTasks: Task[]) => setTasks(updatedTasks);

  const handleResetData = () => {
      setProducts(DEMO_PRODUCTS);
      setShipments(DEMO_SHIPMENTS);
      setInfluencers(DEMO_INFLUENCERS);
      setTransactions(DEMO_TRANSACTIONS);
      setTasks(DEMO_TASKS);
      setInventoryLogs([]);
      setCompetitors(DEMO_COMPETITORS);
      setMessages(DEMO_MESSAGES);
      
      localStorage.clear(); // Clear all keys
      
      addNotification('success', '重置完成', '所有数据已恢复为演示初始状态');
  };

  const handleOpenProduct = (product: Product) => {
      setEditingProduct(product);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard products={products} shipments={shipments} transactions={transactions} influencers={influencers} onChangeView={setActiveView} onNotify={addNotification} />;
      case 'analytics': return <AnalyticsModule transactions={transactions} />; // Connected Real Data
      case 'marketing': return <MarketingModule />; 
      case 'tasks': return <TaskModule tasks={tasks} onUpdateTasks={handleUpdateTasks} />;
      case 'restock': return <RestockModule products={products} onEditSKU={(p) => setEditingSKU(p)} onCloneSKU={handleCloneSKU} onDeleteSKU={handleDeleteSKU} onAddNew={() => setEditingProduct(null)} onCreatePO={handleCreatePurchaseOrder} onSyncToLogistics={handleSyncToLogistics} />;
      case 'orders': return <LogisticsModule shipments={shipments} products={products} onAddShipment={handleAddShipment} onUpdateShipment={handleUpdateShipment} />;
      case 'influencers': return <InfluencerModule influencers={influencers} onAddInfluencer={handleAddInfluencer} onUpdateInfluencer={handleUpdateInfluencer} onDeleteInfluencer={handleDeleteInfluencer} onNotify={addNotification} />;
      case 'finance': return <FinanceModule transactions={transactions} onAddTransaction={handleAddTransaction} />;
      case 'settings': return <SettingsModule currentTheme={currentTheme} onThemeChange={setCurrentTheme} currentData={products} onImportData={handleImportData} onNotify={addNotification} onResetData={handleResetData} />;
      case 'market_radar': return <MarketRadarModule competitors={competitors} onAddCompetitor={handleAddCompetitor} />; 
      case 'inbox': return <GlobalInboxModule messages={messages} onReplyMessage={handleReplyMessage} />; 
      default: return null;
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-neon-pink selection:text-white overflow-hidden text-gray-900 bg-transparent">
      
      {/* Global Toast System */}
      <ToastSystem notifications={notifications} onRemove={removeNotification} />

      <CommandPalette 
        isOpen={isCmdOpen} 
        onClose={() => setIsCmdOpen(false)}
        onChangeView={setActiveView}
        products={products}
        onAddNewProduct={() => setEditingProduct(null)}
        onOpenProduct={handleOpenProduct}
      />

      <Copilot 
         contextData={{ 
            activeView, 
            stats: { 
                products: products.length, 
                shipments: shipments.length, 
                activeInfluencers: influencers.filter(i=>i.status==='Content Live').length,
                pendingTasks: tasks.filter(t => t.status === 'Todo').length,
                unreadMessages: messages.filter(m => m.status === 'Unread').length
            },
            activeContextItem: editingSKU ? { type: 'SKU_Detail', ...editingSKU } : (editingProduct ? { type: 'Product_Edit', ...editingProduct } : null)
         }} 
      />

      <Sidebar 
        activeView={activeView} 
        onChangeView={setActiveView} 
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        badges={sidebarBadges} // Pass dynamic badges
      />
      
      <main className="ml-[320px] h-screen overflow-y-auto no-scrollbar pr-6">
        <div className="w-full h-full pt-6 pb-32 pl-0 pr-0">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {editingProduct !== undefined && (
        <ProductEditor 
          onClose={() => setEditingProduct(undefined)}
          onSave={handleSaveProduct}
          initialProduct={editingProduct}
          inventoryLogs={inventoryLogs.filter(l => l.productId === editingProduct?.id)}
        />
      )}

      {editingSKU && (
        <SKUDetailEditor 
          product={editingSKU}
          onClose={() => setEditingSKU(null)}
          onSave={handleSaveSKU}
          onDelete={() => handleDeleteSKU(editingSKU.id)}
          onChangeView={setActiveView} // Pass nav control
        />
      )}
    </div>
  );
};

export default App;
