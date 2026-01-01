import React, { useState, useEffect } from 'react';
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
import CommandPalette from './components/CommandPalette';
import Copilot from './components/Copilot';
import ToastSystem from './components/ToastSystem';
import { Product, ProductStatus, Currency, Shipment, Influencer, Transaction, Theme, InventoryLog, Task, Notification } from './types';

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
    financials: { costOfGoods: 22.5, shippingCost: 3.2, otherCost: 0.5, sellingPrice: 89.99, platformFee: 13.5, adCost: 12.0 },
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
    financials: { costOfGoods: 65.0, shippingCost: 45.0, otherCost: 2.0, sellingPrice: 199.00, platformFee: 29.85, adCost: 25.0 },
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
    financials: { costOfGoods: 8.0, shippingCost: 1.5, otherCost: 0.2, sellingPrice: 39.99, platformFee: 6.0, adCost: 8.0 },
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
    } catch (e) {
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

  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingSKU, setEditingSKU] = useState<Product | null>(null);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('aero_erp_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('aero_erp_shipments', JSON.stringify(shipments)); }, [shipments]);
  useEffect(() => { localStorage.setItem('aero_erp_influencers', JSON.stringify(influencers)); }, [influencers]);
  useEffect(() => { localStorage.setItem('aero_erp_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('aero_erp_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('aero_erp_inventory_logs', JSON.stringify(inventoryLogs)); }, [inventoryLogs]);

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
      const rate = newShipment.method === 'Air' ? 5.5 : 1.5;
      const estimatedCost = newShipment.weight * rate;
      if (estimatedCost > 0) {
          const expense: Transaction = {
              id: `TX-AUTO-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Expense',
              category: 'Shipping',
              amount: estimatedCost,
              description: `[系统自动] 运费预估: ${newShipment.trackingNo}`,
              status: 'Pending'
          };
          setTransactions(prev => [expense, ...prev]);
          addNotification('success', '运单已创建', `成功扣除库存并记录预计运费 $${estimatedCost.toFixed(2)}`);
      }
  };

  const handleUpdateShipment = (updatedShipment: Shipment) => {
      setShipments(prev => prev.map(s => s.id === updatedShipment.id ? updatedShipment : s));
      
      // SYNC LOGIC: Update products linked to this shipment
      // We look for products that are either in the shipment items list OR match the tracking number
      setProducts(prev => prev.map(p => {
          const isIncludedInItems = updatedShipment.items?.some(item => item.skuId === p.id);
          const isTrackingMatch = p.logistics?.trackingNo === updatedShipment.trackingNo;

          if (isIncludedInItems || isTrackingMatch) {
              return {
                  ...p,
                  logistics: {
                      ...p.logistics!,
                      // Sync status, ETA and Carrier updates back to product view
                      status: updatedShipment.status,
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

  // --- SYNC FEATURE: Restock -> Logistics ---
  const handleSyncToLogistics = (product: Product) => {
      if (!product.logistics?.trackingNo) {
          addNotification('error', '同步失败', '该 SKU 暂无物流单号，请先编辑填写');
          return;
      }

      // Check for duplicate tracking number
      const exists = shipments.find(s => s.trackingNo === product.logistics?.trackingNo);
      if (exists) {
          addNotification('warning', '重复同步', '该运单号已存在于物流模块中');
          return;
      }

      // Calculate Total Qty (Logic: Cartons * ItemsPerBox, or stock as fallback)
      const calcQty = (product.restockCartons || 0) * (product.itemsPerBox || 0);
      const finalQty = calcQty > 0 ? calcQty : (product.stock || 0);

      const newShipment: Shipment = {
          id: `SH-SYNC-${Date.now()}`,
          trackingNo: product.logistics.trackingNo,
          carrier: product.logistics.carrier || 'Unknown Carrier',
          method: product.logistics.method || 'Sea',
          origin: product.supplier || 'China Warehouse',
          destination: product.logistics.destination || 'FBA / Overseas',
          etd: new Date().toISOString().split('T')[0], // Default to today
          eta: '', // TBD
          status: product.logistics.status || 'Pending',
          progress: 0,
          weight: (product.restockCartons || 0) * (product.boxWeight || 0),
          cartons: product.restockCartons || 0,
          items: [{
              skuId: product.id,
              skuCode: product.sku,
              quantity: finalQty
          }],
          lastUpdate: new Date().toISOString()
      };

      setShipments(prev => [newShipment, ...prev]);
      addNotification('success', '同步成功', `运单 ${newShipment.trackingNo} 已推送到物流追踪模块`);
  };

  // --- PROCUREMENT WORKFLOW (New Feature) ---
  const handleCreatePurchaseOrder = (poItems: { skuId: string, quantity: number, cost: number }[], supplierName: string) => {
      const poId = `PO-${new Date().getFullYear()}${Math.floor(Math.random()*10000)}`;
      let totalCost = 0;
      let totalQty = 0;

      // 1. Log Inventory Changes (Order Placed)
      poItems.forEach(item => {
          handleInventoryTransaction(item.skuId, item.quantity, 'OrderPlaced', `采购下单: ${poId}`);
          totalCost += item.cost * item.quantity;
          totalQty += item.quantity;
      });

      // 2. Create Finance Entry (Pending Expense)
      const expense: Transaction = {
          id: `TX-PO-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Expense',
          category: 'COGS',
          amount: totalCost,
          description: `采购单 ${poId} - ${supplierName}`,
          status: 'Pending' // Accounts Payable
      };
      setTransactions(prev => [expense, ...prev]);

      // 3. Create Task (Receive Goods)
      const task: Task = {
          id: `T-PO-${Date.now()}`,
          title: `收货入库: ${poId}`,
          desc: `供应商: ${supplierName}。共 ${totalQty} 件商品等待入库。请核对数量和质量。`,
          priority: 'High',
          status: 'Todo',
          assignee: 'https://ui-avatars.com/api/?name=Warehouse&background=random',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days
          tags: ['Inbound', 'Procurement']
      };
      setTasks(prev => [task, ...prev]);

      // 4. Notification
      addNotification('success', '采购单已生成', `${poId} 已发送。财务挂账 $${totalCost.toLocaleString()}，待办任务已创建。`);
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
           return {
               ...p,
               note: updatedData.note,
               // CRITICAL FIX: Check for undefined specifically to allow empty string updates (deleting image)
               imageUrl: updatedData.imageUrl !== undefined ? updatedData.imageUrl : p.imageUrl, 
               supplier: updatedData.supplierName,
               dailySales: updatedData.dailySales,
               inboundId: updatedData.inboundId,
               inboundStatus: updatedData.inboundStatus, // Persist Status
               restockDate: updatedData.restockDate,
               
               // Persist Extended Physical Props
               unitWeight: updatedData.unitWeight,
               boxLength: updatedData.boxLength,
               boxWidth: updatedData.boxWidth,
               boxHeight: updatedData.boxHeight,
               boxWeight: updatedData.boxWeight,
               itemsPerBox: updatedData.itemsPerBox,
               restockCartons: updatedData.restockCartons,

               financials: {
                   ...p.financials!,
                   costOfGoods: updatedData.unitCost,
                   sellingPrice: updatedData.sellingPrice,
                   shippingCost: updatedData.unitShippingCost || p.financials?.shippingCost || 0, // CORRECTED: Use calculated cost if available
                   otherCost: updatedData.fulfillmentFee || 0,
                   adCost: updatedData.adCostPerUnit || 0,
                   platformFee: (updatedData.sellingPrice * (updatedData.tiktokCommission || 0)) / 100
               },
               logistics: {
                   ...p.logistics!,
                   method: updatedData.transportMethod,
                   carrier: updatedData.carrier,
                   trackingNo: updatedData.trackingNo,
                   destination: updatedData.destinationWarehouse,
                   shippingRate: updatedData.shippingRate // Persist input rate
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
              if (p && (p.name || p.sku)) { // Ensure bare minimum validity
                  // If ID exists in system, update it. If not, treat as new.
                  // If import data doesn't have ID, generate one.
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

  const handleOpenProduct = (product: Product) => {
      setEditingProduct(product);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard products={products} shipments={shipments} transactions={transactions} influencers={influencers} onChangeView={setActiveView} />;
      case 'marketing': return <MarketingModule />; 
      case 'tasks': return <TaskModule tasks={tasks} onUpdateTasks={handleUpdateTasks} />;
      case 'restock': return <RestockModule products={products} onEditSKU={(p) => setEditingSKU(p)} onCloneSKU={handleCloneSKU} onDeleteSKU={handleDeleteSKU} onAddNew={() => setEditingProduct(null)} onCreatePO={handleCreatePurchaseOrder} onSyncToLogistics={handleSyncToLogistics} />;
      case 'orders': return <LogisticsModule shipments={shipments} products={products} onAddShipment={handleAddShipment} onUpdateShipment={handleUpdateShipment} />;
      case 'influencers': return <InfluencerModule influencers={influencers} onAddInfluencer={handleAddInfluencer} onUpdateInfluencer={handleUpdateInfluencer} onDeleteInfluencer={handleDeleteInfluencer} />;
      case 'finance': return <FinanceModule transactions={transactions} onAddTransaction={handleAddTransaction} />;
      case 'settings': return <SettingsModule currentTheme={currentTheme} onThemeChange={setCurrentTheme} currentData={products} onImportData={handleImportData} />;
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
                activeInfluencers: influencers.filter(i=>i.status==='Content Live').length 
            },
            activeContextItem: editingSKU ? { type: 'SKU_Detail', ...editingSKU } : (editingProduct ? { type: 'Product_Edit', ...editingProduct } : null)
         }} 
      />

      <Sidebar 
        activeView={activeView} 
        onChangeView={setActiveView} 
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
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
        />
      )}
    </div>
  );
};

export default App;