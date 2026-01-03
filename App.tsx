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
    ProductStatus, Currency, Competitor, CustomerMessage 
} from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentTheme, setCurrentTheme] = useState<Theme>('neon');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);

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

  // Product Handlers
  const handleSaveProduct = (product: Product) => {
    setProducts(prev => {
        const exists = prev.find(p => p.id === product.id);
        if (exists) return prev.map(p => p.id === product.id ? product : p);
        return [...prev, product];
    });
    setEditingProduct(null);
    addNotification('success', 'Product Saved', `Asset ${product.sku} updated successfully.`);
  };

  const handleSaveSKU = (updated: Product) => {
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingSKU(null);
      addNotification('success', 'SKU Updated', `Details for ${updated.sku} saved.`);
  };

  const handleCloneSKU = (product: Product) => {
      const newProduct = {
          ...product,
          id: `PROD-${Date.now()}`,
          name: `${product.name} (Copy)`,
          sku: `${product.sku}-COPY`,
          stock: 0
      };
      setProducts(prev => [newProduct, ...prev]);
      addNotification('info', 'SKU Cloned', `Created copy of ${product.sku}`);
  };

  const handleDeleteSKU = (id: string) => {
      if(window.confirm('Are you sure you want to delete this asset?')) {
          setProducts(prev => prev.filter(p => p.id !== id));
          setEditingSKU(null);
          addNotification('warning', 'Asset Deleted', 'Product removed from database.');
      }
  };

  // Task Handlers
  const handleUpdateTasks = (updatedTasks: Task[]) => {
      setTasks(updatedTasks);
  };

  // PO & Logistics Logic
  const handleCreatePurchaseOrder = (items: any[], supplier: string) => {
      const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
      const newTx: Transaction = {
          id: `TX-PO-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Expense',
          category: 'COGS',
          amount: totalCost / 7.2, 
          description: `Purchase Order for ${items.length} SKUs from ${supplier}`,
          status: 'Pending'
      };
      setTransactions(prev => [newTx, ...prev]);
      
      const newShipment: Shipment = {
          id: `SH-${Date.now()}`,
          trackingNo: `PO-${Date.now().toString().slice(-6)}`,
          carrier: 'Supplier Delivery',
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
      setShipments(prev => [newShipment, ...prev]);
      addNotification('success', 'Purchase Order Created', `Order placed with ${supplier}. Financials updated.`);
  };

  const handleSyncToLogistics = (product: Product) => {
      setActiveView('orders');
  };

  // Logistics Handlers
  const handleAddShipment = (shipment: Shipment) => setShipments(prev => [shipment, ...prev]);
  const handleUpdateShipment = (shipment: Shipment) => setShipments(prev => prev.map(s => s.id === shipment.id ? shipment : s));
  const handleDeleteShipment = (id: string) => setShipments(prev => prev.filter(s => s.id !== id));

  // Influencer Handlers
  const handleAddInfluencer = (inf: Influencer) => setInfluencers(prev => [inf, ...prev]);
  const handleUpdateInfluencer = (inf: Influencer) => setInfluencers(prev => prev.map(i => i.id === inf.id ? inf : i));
  const handleDeleteInfluencer = (id: string) => setInfluencers(prev => prev.filter(i => i.id !== id));

  // Finance Handlers
  const handleAddTransaction = (tx: Transaction) => setTransactions(prev => [tx, ...prev]);

  // Market Radar & Inbox Handlers
  const handleAddCompetitor = (comp: Competitor) => setCompetitors(prev => [...prev, comp]);
  const handleReplyMessage = (id: string, text: string) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'Replied' } : m));
      addNotification('success', 'Reply Sent', 'Message sent to customer.');
  };

  // Data Management
  const handleImportData = (data: Product[]) => {
      setProducts(data);
      addNotification('success', 'Data Imported', `Loaded ${data.length} products.`);
  };

  const handleResetData = () => {
      const demoProducts: Product[] = [
          {
              id: 'p1', sku: 'AERO-H1-BLK', name: 'Aero ANC Headphones (Midnight)', price: 129.00, stock: 450, 
              currency: Currency.USD, status: ProductStatus.Active, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
              category: 'Electronics', marketplaces: ['Amazon'], lastUpdated: new Date().toISOString(),
              financials: { costOfGoods: 180, shippingCost: 4.5, otherCost: 0, sellingPrice: 129, platformFee: 19, adCost: 15 },
              logistics: { method: 'Air', carrier: 'DHL', trackingNo: 'HK88291022', status: 'In Transit', origin: 'Shenzhen', destination: 'LAX' },
              dailySales: 15
          },
          {
              id: 'p2', sku: 'AERO-H1-WHT', name: 'Aero ANC Headphones (Ivory)', price: 129.00, stock: 20, 
              currency: Currency.USD, status: ProductStatus.Active, imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
              category: 'Electronics', marketplaces: ['Amazon'], lastUpdated: new Date().toISOString(),
              financials: { costOfGoods: 180, shippingCost: 4.5, otherCost: 0, sellingPrice: 129, platformFee: 19, adCost: 15 },
              dailySales: 5
          }
      ];
      setProducts(demoProducts);
      setShipments([{
          id: 's1', trackingNo: 'HK88291022', carrier: 'DHL', method: 'Air', origin: 'Shenzhen', destination: 'Los Angeles',
          etd: '2023-10-01', eta: '2023-10-05', status: 'In Transit', progress: 65, weight: 450, cartons: 20, items: []
      }]);
      setTransactions([
          { id: 't1', date: '2023-10-01', type: 'Revenue', category: 'Sales', amount: 4500, description: 'Amazon Settlement', status: 'Cleared' },
          { id: 't2', date: '2023-10-02', type: 'Expense', category: 'Marketing', amount: 1200, description: 'TikTok Ads Q3', status: 'Cleared' }
      ]);
      setInfluencers([
          { id: 'i1', name: 'Jessica Tech', handle: '@jessicatech', platform: 'TikTok', status: 'Content Live', followers: 450000, engagementRate: 5.2, cost: 500, gmv: 2400, roi: 4.8, region: 'USA', category: 'Tech', avatarUrl: 'https://ui-avatars.com/api/?name=Jessica+Tech&background=random', sampleSku: 'AERO-H1-BLK' }
      ]);
      setTasks([
          { id: 'tsk1', title: 'Q4 Inventory Planning', desc: 'Review holiday sales forecast', priority: 'High', status: 'Todo', assignee: 'https://ui-avatars.com/api/?name=Admin', dueDate: '2023-10-15', tags: ['Planning'] }
      ]);
      setCompetitors([
         { id: 'c1', asin: 'B08...', brand: 'Sony', name: 'WH-1000XM5', price: 348, priceHistory: Array(5).fill(0).map((_, i) => ({ date: `D-${5-i}`, price: 348 })), rating: 4.5, reviewCount: 2000, imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=150', dailySalesEst: 50, keywords: ['anc', 'headphones'], lastUpdate: 'Now', status: 'Tracking' }
      ]);
      setMessages([
         { id: 'm1', platform: 'Amazon', customerName: 'John Doe', subject: 'Product Defect', content: 'The hinge broke after 2 days.', timestamp: '2h ago', status: 'Unread', sentiment: 'Negative', orderId: '123-456', aiDraft: 'Dear John,\n\nWe are very sorry to hear about the hinge issue. This is covered by our warranty. We can ship a replacement immediately. Please confirm your address.' }
      ]);
      
      addNotification('info', 'System Reset', 'Loaded demo data.');
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

  // Initial Load (if empty)
  useEffect(() => {
      if(products.length === 0) {
          handleResetData();
      }
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
        <Sidebar activeView={activeView} onChangeView={setActiveView} currentTheme={currentTheme} onThemeChange={setCurrentTheme} badges={{tasks: tasks.filter(t=>t.status==='Todo').length, orders: shipments.filter(s=>s.status==='Exception').length}} />
        <div className="flex-1 ml-[280px] p-8 h-full overflow-hidden relative">
            {renderContent()}
        </div>
        
        {editingProduct && (
            <ProductEditor 
                initialProduct={editingProduct} 
                onClose={() => setEditingProduct(null)} 
                onSave={handleSaveProduct} 
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