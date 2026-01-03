
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnalyticsModule from './components/AnalyticsModule';
import MarketingModule from './components/MarketingModule';
import TaskModule from './components/TaskModule';
import RestockModule from './components/RestockModule';
import LogisticsModule from './components/LogisticsModule';
import InfluencerModule from './components/InfluencerModule';
import FinanceModule from './components/FinanceModule';
import SettingsModule from './components/SettingsModule';
import MarketRadarModule from './components/MarketRadarModule';
import GlobalInboxModule from './components/GlobalInboxModule';
import ProductEditor from './components/ProductEditor';
import SKUDetailEditor from './components/SKUDetailEditor';
import ToastSystem from './components/ToastSystem';
import Copilot from './components/Copilot';
import CommandPalette from './components/CommandPalette';
import { 
    Product, Shipment, Transaction, Influencer, Task, Notification, Theme, 
    ProductStatus, Currency, Competitor, CustomerMessage, InventoryLog 
} from './types';
import { pb, isCloudConnected } from './services/pocketbase';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentTheme, setCurrentTheme] = useState<Theme>('neon');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isCloudOnline, setIsCloudOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Changed default to false for instant local load
  
  // --- PERSISTENCE HELPERS ---
  const saveLocal = (key: string, data: any) => {
      try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
  };

  const loadLocal = (key: string, defaultVal: any = []) => {
      try {
          const d = localStorage.getItem(key);
          return d ? JSON.parse(d) : defaultVal;
      } catch (e) { return defaultVal; }
  };

  // --- DATA STATE (Initialize immediately from LocalStorage) ---
  const [products, setProducts] = useState<Product[]>(() => loadLocal('products'));
  const [shipments, setShipments] = useState<Shipment[]>(() => loadLocal('shipments'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLocal('transactions'));
  const [influencers, setInfluencers] = useState<Influencer[]>(() => loadLocal('influencers'));
  const [tasks, setTasks] = useState<Task[]>(() => loadLocal('tasks'));
  const [competitors, setCompetitors] = useState<Competitor[]>(() => loadLocal('competitors'));
  const [messages, setMessages] = useState<CustomerMessage[]>(() => loadLocal('messages'));
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);

  // UI State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSKU, setEditingSKU] = useState<Product | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // --- Handlers ---

  const addNotification = (type: any, title: string, message: string) => {
    const newNotif: Notification = { id: Date.now().toString(), type, title, message };
    setNotifications(prev => [...prev, newNotif]);
  };

  const removeNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- SYNC ENGINE (Cloud Overlay) ---
  useEffect(() => {
      const initSystem = async () => {
          // We don't block UI with loading anymore.
          // Just verify cloud in background.
          const connected = await isCloudConnected();
          setIsCloudOnline(connected);

          if (connected) {
              try {
                  const [p, s, t, i, k, c, m, l] = await Promise.all([
                      pb.collection('products').getFullList({ sort: '-created' }),
                      pb.collection('shipments').getFullList({ sort: '-created' }),
                      pb.collection('transactions').getFullList({ sort: '-date' }),
                      pb.collection('influencers').getFullList({ sort: '-created' }),
                      pb.collection('tasks').getFullList({ sort: '-created' }),
                      pb.collection('competitors').getFullList({ sort: '-created' }),
                      pb.collection('messages').getFullList({ sort: '-created' }),
                      pb.collection('inventory_logs').getFullList({ sort: '-created', page: 1, perPage: 100 }),
                  ]);

                  // Only overwrite local state if cloud has data (to prevent wiping local work with empty cloud)
                  // OR if cloud is strictly the master. 
                  // Logic: If cloud returns data, use it.
                  if (p.length > 0 || s.length > 0) {
                      setProducts(p.map(item => ({ ...item, id: item.id } as unknown as Product)));
                      setShipments(s.map(item => ({ ...item, id: item.id } as unknown as Shipment)));
                      setTransactions(t.map(item => ({ ...item, id: item.id } as unknown as Transaction)));
                      setInfluencers(i.map(item => ({ ...item, id: item.id } as unknown as Influencer)));
                      setTasks(k.map(item => ({ ...item, id: item.id } as unknown as Task)));
                      setCompetitors(c.map(item => ({ ...item, id: item.id } as unknown as Competitor)));
                      setMessages(m.map(item => ({ ...item, id: item.id } as unknown as CustomerMessage)));
                      setInventoryLogs(l.map(item => ({ ...item, id: item.id } as unknown as InventoryLog)));
                      
                      addNotification('success', '云端数据已同步', '界面已更新为服务器最新状态');
                  }
              } catch (error) {
                  console.error("Cloud Sync Error", error);
                  // Keep using local data
              }
          }
      };

      initSystem();
  }, []);

  // --- ALWAYS SYNC TO LOCAL STORAGE (Backup) ---
  // This ensures that even if you are "Online", we keep a local backup for the next refresh.
  useEffect(() => { saveLocal('products', products); }, [products]);
  useEffect(() => { saveLocal('shipments', shipments); }, [shipments]);
  useEffect(() => { saveLocal('transactions', transactions); }, [transactions]);
  useEffect(() => { saveLocal('influencers', influencers); }, [influencers]);
  useEffect(() => { saveLocal('tasks', tasks); }, [tasks]);
  useEffect(() => { saveLocal('competitors', competitors); }, [competitors]);
  useEffect(() => { saveLocal('messages', messages); }, [messages]);

  // --- CRUD WRAPPERS ---

  const saveToCloud = async (collection: string, data: any, id?: string) => {
      if (!isCloudOnline) return { id: data.id || Date.now().toString() };
      try {
          if (id && !id.startsWith('new_') && !id.startsWith('PROD-') && !id.startsWith('IMP-')) {
              return await pb.collection(collection).update(id, data);
          } else {
              const { id: _, ...payload } = data; // Drop local ID for cloud creation
              return await pb.collection(collection).create(payload);
          }
      } catch (err: any) {
          console.error("Cloud Save Failed:", err);
          // Don't throw, just let local state handle it
      }
  };

  const deleteFromCloud = async (collection: string, id: string) => {
      if (!isCloudOnline) return;
      try {
          await pb.collection(collection).delete(id);
      } catch (err: any) {
          console.error("Cloud Delete Failed", err);
      }
  };

  // Product Handlers
  const handleSaveProduct = async (product: Product) => {
    // 1. Optimistic Update (Immediate UI)
    setProducts(prev => {
        const exists = prev.find(p => p.id === product.id);
        if (exists) return prev.map(p => p.id === product.id ? product : p);
        return [product, ...prev];
    });
    setEditingProduct(null);

    // 2. Async Persist
    const saved = await saveToCloud('products', product, products.find(p => p.id === product.id)?.id);
    if (saved && saved.id !== product.id) {
        // Update local ID with real Cloud ID
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, id: saved.id } : p));
    }
    addNotification('success', '已保存', `SKU: ${product.sku}`);
  };

  const handleSaveSKU = async (updated: any) => {
      if (!editingSKU) return;
      const finalProduct = { ...editingSKU, ...updated };
      
      setProducts(prev => prev.map(p => p.id === editingSKU.id ? finalProduct : p));
      setEditingSKU(null);

      await saveToCloud('products', finalProduct, editingSKU.id);
      addNotification('success', 'SKU 更新', '详情已同步');
  };

  const handleCloneSKU = async (product: Product) => {
      const newProductPayload = {
          ...product,
          name: `${product.name} (Copy)`,
          sku: `${product.sku}-COPY-${Math.floor(Math.random()*1000)}`,
          stock: 0,
          id: `PROD-${Date.now()}` // Temp ID
      };
      
      setProducts(prev => [newProductPayload, ...prev]);
      await saveToCloud('products', newProductPayload);
  };

  const handleDeleteSKU = async (id: string) => {
      if(window.confirm('确定删除此资产吗？')) {
          setProducts(prev => prev.filter(p => p.id !== id));
          setEditingSKU(null);
          await deleteFromCloud('products', id);
          addNotification('warning', '资产已删除', '已移除');
      }
  };

  // Task Handlers
  const handleUpdateTasks = (newTasks: Task[]) => {
      setTasks(newTasks);
      // Simplify task cloud sync: just save localized changes if needed, complex sync omitted for brevity
  };

  // PO & Logistics Logic
  const handleCreatePurchaseOrder = async (items: any[], supplier: string) => {
      const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
      
      const txPayload: Transaction = {
          id: `TX-PO-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Expense',
          category: 'COGS',
          amount: totalCost / 7.2, 
          description: `Purchase Order - ${supplier}`,
          status: 'Pending'
      };
      
      const shPayload: Shipment = {
          id: `SH-${Date.now()}`,
          trackingNo: `PO-${Date.now().toString().slice(-6)}`,
          carrier: 'Supplier',
          method: 'Truck',
          origin: supplier,
          destination: 'Warehouse',
          etd: new Date().toISOString().split('T')[0],
          eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'In Production',
          progress: 10,
          weight: 0,
          cartons: 0,
          items: items.map(i => ({ skuId: i.skuId, skuCode: 'UNK', quantity: i.quantity }))
      };

      setTransactions(prev => [txPayload, ...prev]);
      setShipments(prev => [shPayload, ...prev]);

      await saveToCloud('transactions', txPayload);
      await saveToCloud('shipments', shPayload);
      addNotification('success', '采购单已生成', '本地与云端已记录');
  };

  const handleSyncToLogistics = (product: Product) => {
      setActiveView('orders');
  };

  // Logistics Handlers
  const handleAddShipment = async (shipment: Shipment) => {
      setShipments(prev => [shipment, ...prev]);
      await saveToCloud('shipments', shipment);
  };
  const handleUpdateShipment = async (shipment: Shipment) => {
      setShipments(prev => prev.map(s => s.id === shipment.id ? shipment : s));
      await saveToCloud('shipments', shipment, shipment.id);
  };
  const handleDeleteShipment = async (id: string) => {
      setShipments(prev => prev.filter(s => s.id !== id));
      await deleteFromCloud('shipments', id);
  };

  // Influencer Handlers
  const handleAddInfluencer = async (inf: Influencer) => {
      setInfluencers(prev => [inf, ...prev]);
      await saveToCloud('influencers', inf);
  };
  const handleUpdateInfluencer = async (inf: Influencer) => {
      setInfluencers(prev => prev.map(i => i.id === inf.id ? inf : i));
      await saveToCloud('influencers', inf, inf.id);
  };
  const handleDeleteInfluencer = async (id: string) => {
      setInfluencers(prev => prev.filter(i => i.id !== id));
      await deleteFromCloud('influencers', id);
  };

  // Finance Handlers
  const handleAddTransaction = async (tx: Transaction) => {
      setTransactions(prev => [tx, ...prev]);
      await saveToCloud('transactions', tx);
  };

  // Market Radar & Inbox Handlers
  const handleAddCompetitor = async (comp: Competitor) => {
      setCompetitors(prev => [...prev, comp]);
      await saveToCloud('competitors', comp);
  };
  const handleReplyMessage = async (id: string, text: string) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'Replied' } : m));
      await saveToCloud('messages', { status: 'Replied' }, id);
      addNotification('success', '回复已发送', '状态已更新');
  };

  // Data Management
  const handleImportData = (data: Product[]) => {
      if(window.confirm(`确认导入 ${data.length} 条数据？`)) {
          // Force update state immediately
          setProducts(data);
          saveLocal('products', data); // Double assurance
          
          if (isCloudOnline) {
              data.forEach(async p => {
                  try { await saveToCloud('products', p); } catch(e) {}
              });
              addNotification('info', '后台同步中', '正在尝试将导入数据推送到服务器');
          } else {
              addNotification('success', '已导入本地', '数据已保存到浏览器');
          }
      }
  };

  const handleResetData = () => {
      if (confirm("确认重置？这将清空本地数据。")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  // Keyboard Shortcuts
  useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setIsCommandOpen((open) => !open);
        }
      }
      document.addEventListener('keydown', down);
      return () => document.removeEventListener('keydown', down);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard products={products} shipments={shipments} transactions={transactions} influencers={influencers} onChangeView={setActiveView} onNotify={addNotification} />;
      case 'analytics': return <AnalyticsModule transactions={transactions} />;
      case 'marketing': return <MarketingModule />; 
      case 'tasks': return <TaskModule tasks={tasks} onUpdateTasks={handleUpdateTasks} />;
      case 'restock': return <RestockModule products={products} onEditSKU={(p) => setEditingSKU(p)} onCloneSKU={handleCloneSKU} onDeleteSKU={handleDeleteSKU} onAddNew={() => setEditingProduct({} as Product)} onCreatePO={handleCreatePurchaseOrder} onSyncToLogistics={handleSyncToLogistics} />;
      case 'orders': return <LogisticsModule shipments={shipments} products={products} onAddShipment={handleAddShipment} onUpdateShipment={handleUpdateShipment} onDeleteShipment={handleDeleteShipment} />;
      case 'influencers': return <InfluencerModule influencers={influencers} onAddInfluencer={handleAddInfluencer} onUpdateInfluencer={handleUpdateInfluencer} onDeleteInfluencer={handleDeleteInfluencer} onNotify={addNotification} />;
      case 'finance': return <FinanceModule transactions={transactions} onAddTransaction={handleAddTransaction} />;
      case 'market_radar': return <MarketRadarModule competitors={competitors} onAddCompetitor={handleAddCompetitor} />;
      case 'inbox': return <GlobalInboxModule messages={messages} onReplyMessage={handleReplyMessage} />;
      case 'settings': return <SettingsModule currentTheme={currentTheme} onThemeChange={setCurrentTheme} currentData={products} onImportData={handleImportData} onNotify={addNotification} onResetData={handleResetData} />;
      default: return <Dashboard products={products} shipments={shipments} transactions={transactions} influencers={influencers} onChangeView={setActiveView} onNotify={addNotification} />;
    }
  };

  return (
    <div className={`flex h-screen w-full bg-[#050510] text-white font-sans selection:bg-neon-blue selection:text-black overflow-hidden theme-${currentTheme}`}>
        {isLoading && (
            <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
        
        <Sidebar activeView={activeView} onChangeView={setActiveView} currentTheme={currentTheme} onThemeChange={setCurrentTheme} badges={{tasks: tasks.filter(t=>t.status==='Todo').length, orders: shipments.filter(s=>s.status==='Exception').length}} />
        <div className="flex-1 ml-[280px] p-8 h-full overflow-hidden relative flex flex-col">
            {!isCloudOnline && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-600/20 text-yellow-400 text-[10px] font-bold text-center py-1 z-50 pointer-events-none">
                    ⚠️ 离线模式: 数据将保存在本地
                </div>
            )}
            <div className="flex-1 w-full h-full overflow-hidden relative">
                {renderContent()}
            </div>
        </div>
        
        {editingProduct && (
            <ProductEditor 
                initialProduct={editingProduct} 
                onClose={() => setEditingProduct(null)} 
                onSave={handleSaveProduct} 
                inventoryLogs={inventoryLogs.filter(l => l.productId === editingProduct.id)}
            />
        )}
        {editingSKU && (
            <SKUDetailEditor 
                product={editingSKU}
                onClose={() => setEditingSKU(null)}
                onSave={handleSaveSKU}
                onDelete={() => handleDeleteSKU(editingSKU.id)}
                onChangeView={setActiveView}
            />
        )}
        <ToastSystem notifications={notifications} onRemove={removeNotification} />
        <Copilot contextData={{ products, shipments, finance: transactions.slice(-10) }} />
        <CommandPalette 
            isOpen={isCommandOpen} 
            onClose={() => setIsCommandOpen(false)} 
            onChangeView={setActiveView}
            products={products}
            onAddNewProduct={() => { setEditingProduct({} as Product); }}
            onOpenProduct={(p) => setEditingSKU(p)}
        />
    </div>
  );
};

export default App;
