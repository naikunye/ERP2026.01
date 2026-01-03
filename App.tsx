
import React, { useState, useEffect, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  
  // --- DATA GUARD STATE ---
  // Critical: Prevents saving empty state to localStorage during initial render
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- PERSISTENCE HELPERS ---
  const saveLocal = (key: string, data: any) => {
      // SECURITY CHECK: Never overwrite local storage with empty array if we haven't confirmed data load
      if (!isDataLoaded && (!data || data.length === 0)) return;
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

  // --- INIT & SYNC ENGINE ---
  useEffect(() => {
      // 1. Mark data as loaded immediately so existing local data is respected
      setIsDataLoaded(true);

      const initSystem = async () => {
          const connected = await isCloudConnected();
          setIsCloudOnline(connected);

          if (connected) {
              try {
                  // Only fetch if connection is healthy
                  const [p, s, t, i, k, c, m] = await Promise.all([
                      pb.collection('products').getFullList({ sort: '-created' }).catch(() => []),
                      pb.collection('shipments').getFullList({ sort: '-created' }).catch(() => []),
                      pb.collection('transactions').getFullList({ sort: '-date' }).catch(() => []),
                      pb.collection('influencers').getFullList({ sort: '-created' }).catch(() => []),
                      pb.collection('tasks').getFullList({ sort: '-created' }).catch(() => []),
                      pb.collection('competitors').getFullList({ sort: '-created' }).catch(() => []),
                      pb.collection('messages').getFullList({ sort: '-created' }).catch(() => []),
                  ]);

                  // Strategy: If cloud is empty but local has data, DO NOT OVERWRITE local with empty cloud data.
                  // Only overwrite local state if cloud actually has data.
                  if (p.length > 0 || s.length > 0) {
                      setProducts(p.map(item => ({ ...item, id: item.id } as unknown as Product)));
                      setShipments(s.map(item => ({ ...item, id: item.id } as unknown as Shipment)));
                      setTransactions(t.map(item => ({ ...item, id: item.id } as unknown as Transaction)));
                      setInfluencers(i.map(item => ({ ...item, id: item.id } as unknown as Influencer)));
                      setTasks(k.map(item => ({ ...item, id: item.id } as unknown as Task)));
                      setCompetitors(c.map(item => ({ ...item, id: item.id } as unknown as Competitor)));
                      setMessages(m.map(item => ({ ...item, id: item.id } as unknown as CustomerMessage)));
                      
                      addNotification('success', '云端数据已同步', '界面已更新为服务器最新状态');
                  } else {
                      // If cloud is empty, warn user they might need to push
                      addNotification('info', '已连接新服务器', '服务器数据为空。请在设置中点击“上传本地数据”以初始化云端。');
                  }
              } catch (error) {
                  // console.error("Cloud Sync Error", error);
                  // Silent fail is fine here, user will see offline status or 404s when pushing
              }
          }
      };

      initSystem();
  }, []);

  // --- DATA PERSISTENCE EFFECTS (With Guard) ---
  useEffect(() => { if(isDataLoaded) saveLocal('products', products); }, [products, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) saveLocal('shipments', shipments); }, [shipments, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) saveLocal('transactions', transactions); }, [transactions, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) saveLocal('influencers', influencers); }, [influencers, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) saveLocal('tasks', tasks); }, [tasks, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) saveLocal('competitors', competitors); }, [competitors, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) saveLocal('messages', messages); }, [messages, isDataLoaded]);

  // --- CRUD WRAPPERS ---

  const saveToCloud = async (collection: string, data: any, id?: string) => {
      if (!isCloudOnline) return { id: data.id || Date.now().toString() };
      try {
          if (id && !id.startsWith('new_') && !id.startsWith('PROD-') && !id.startsWith('IMP-') && id.length > 10) {
              return await pb.collection(collection).update(id, data);
          } else {
              const { id: _, ...payload } = data; // Drop local ID for cloud creation
              return await pb.collection(collection).create(payload);
          }
      } catch (err: any) {
          // console.error("Cloud Save Failed:", err);
          return null;
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

  // --- MANUAL SYNC (Push Local to Cloud) ---
  const handleSyncToCloud = async () => {
    if (!isCloudOnline) {
        addNotification('error', '无法同步', '请先连接服务器');
        return;
    }
    
    if(!confirm('⚠️ 警告：这将把当前电脑的所有本地数据上传到腾讯云服务器。\n\n如果是首次连接空服务器，请点击确定。\n如果服务器已有数据，可能会产生重复项。\n\n是否继续？')) return;

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    let lastError: any = null;
    
    // Helper to upload a list and update IDs
    const uploadBatch = async (collectionName: string, items: any[], setItems: React.Dispatch<React.SetStateAction<any[]>>) => {
        const newItems = [...items];
        for (let i = 0; i < newItems.length; i++) {
            const item = newItems[i];
            try {
                // Strip local system fields and try create
                const { id, created, updated, ...payload } = item; 
                const res = await pb.collection(collectionName).create(payload);
                newItems[i] = { ...item, id: res.id }; // Update local state with real server ID
                successCount++;
            } catch (e: any) {
                failCount++;
                lastError = e;
                console.warn(`Failed item in ${collectionName}:`, e);
            }
        }
        setItems(newItems);
    };

    try {
        await uploadBatch('products', products, setProducts);
        await uploadBatch('shipments', shipments, setShipments);
        await uploadBatch('transactions', transactions, setTransactions);
        await uploadBatch('influencers', influencers, setInfluencers);
        await uploadBatch('tasks', tasks, setTasks);
        await uploadBatch('competitors', competitors, setCompetitors);
        await uploadBatch('messages', messages, setMessages);
        
        if (successCount > 0) {
            addNotification('success', '上传完成', `成功: ${successCount} 条, 失败: ${failCount} 条。`);
            saveLocal('products', products); // Force re-save with new IDs
        } else if (failCount > 0) {
            // Detailed Error Analysis
            let errorMsg = '数据上传被拒绝。';
            let desc = '请检查服务器日志或数据格式。';
            
            if (lastError?.status === 403) {
                errorMsg = '权限不足 (403 Forbidden)';
                desc = '请在 PocketBase 后台 -> Collections -> API Rules 中，将 Create/Write 权限设为 Public (留空)，或者在前端配置管理员账号。';
            } else if (lastError?.status === 404) {
                errorMsg = '集合不存在 (404 Not Found)';
                desc = '请在下方“管理员专区”先初始化数据库结构。';
            } else if (lastError?.status === 400) {
                errorMsg = '数据格式错误 (400 Bad Request)';
                desc = '字段校验失败。';
            }

            addNotification('error', errorMsg, desc);
        } else {
            addNotification('info', '无数据需上传', '本地数据为空。');
        }

    } catch (e) {
        console.error(e);
        addNotification('error', '同步中断', '未知网络错误。');
    } finally {
        setIsLoading(false);
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
      // For bulk updates like drag-drop, simple persistence is tricky without diffing. 
      // Ideally update individual task. Here we just save local. 
      // Real app should sync specific task change.
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
          // Manually triggering save to ensure it writes immediately even if effects are queued
          try { localStorage.setItem('products', JSON.stringify(data)); } catch(e) {}
          
          if (isCloudOnline) {
              // Note: This tries to save one by one, might be slow. 
              // The new "Sync to Cloud" button is better for bulk.
              data.forEach(async p => {
                  try { await saveToCloud('products', p); } catch(e) {}
              });
              addNotification('info', '后台同步中', '正在尝试将导入数据推送到服务器');
          } else {
              addNotification('success', '已导入本地', '数据已安全保存到浏览器');
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
      case 'settings': 
        return <SettingsModule 
            currentTheme={currentTheme} 
            onThemeChange={setCurrentTheme} 
            currentData={products} 
            onImportData={handleImportData} 
            onNotify={addNotification} 
            onResetData={handleResetData}
            onSyncToCloud={handleSyncToCloud} // NEW PROP
        />;
      default: return <Dashboard products={products} shipments={shipments} transactions={transactions} influencers={influencers} onChangeView={setActiveView} onNotify={addNotification} />;
    }
  };

  return (
    <div className={`flex h-screen w-full bg-[#050510] text-white font-sans selection:bg-neon-blue selection:text-black overflow-hidden theme-${currentTheme}`}>
        {isLoading && (
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in">
                <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                <div className="text-neon-blue font-bold text-lg animate-pulse">正在上传数据到云端...</div>
            </div>
        )}
        
        <Sidebar activeView={activeView} onChangeView={setActiveView} currentTheme={currentTheme} onThemeChange={setCurrentTheme} badges={{tasks: tasks.filter(t=>t.status==='Todo').length, orders: shipments.filter(s=>s.status==='Exception').length}} />
        
        {/* MAIN CONTENT AREA - FIXED LAYOUT FOR SCROLLING */}
        <div className="flex-1 ml-[280px] p-8 h-full flex flex-col overflow-hidden relative">
            {!isCloudOnline && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-600/20 text-yellow-400 text-[10px] font-bold text-center py-1 z-50 pointer-events-none backdrop-blur-sm">
                    ⚠️ 离线模式: 数据将保存在本地
                </div>
            )}
            
            {/* FORCE CONTENT TO TAKE FULL HEIGHT AND MANAGE ITS OWN SCROLL */}
            <div className="absolute inset-0 top-0 bottom-0 left-0 right-0 overflow-y-auto custom-scrollbar p-8">
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
