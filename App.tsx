import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductEditor from './components/ProductEditor';
import RestockModule from './components/RestockModule';
import SKUDetailEditor from './components/SKUDetailEditor';
import LogisticsModule from './components/LogisticsModule';
import DataSyncModule from './components/DataSyncModule';
import InfluencerModule from './components/InfluencerModule';
import FinanceModule from './components/FinanceModule';
import { Product, ProductStatus, Currency, Shipment, Influencer, Transaction, Theme } from './types';

// --- HIGH FIDELITY DEMO DATA ---

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
    note: 'Q4 旺季主推款，注意备货节奏',
    financials: {
        costOfGoods: 22.5,
        shippingCost: 3.2,
        otherCost: 0.5,
        sellingPrice: 89.99,
        platformFee: 13.5, // 15%
        adCost: 12.0
    },
    logistics: {
        method: 'Air',
        carrier: 'DHL',
        trackingNo: 'DHL99283711HK',
        status: 'In Transit',
        origin: 'Shenzhen',
        destination: 'US-LAX',
        eta: '2023-11-20'
    }
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
    note: '体积大，海运费上涨影响利润',
    financials: {
        costOfGoods: 65.0,
        shippingCost: 45.0, // Heavy item
        otherCost: 2.0,
        sellingPrice: 199.00,
        platformFee: 29.85,
        adCost: 25.0
    },
    logistics: {
        method: 'Sea',
        carrier: 'Matson',
        trackingNo: 'MSN78291029US',
        status: 'Customs',
        origin: 'Ningbo',
        destination: 'US-LGB',
        eta: '2023-11-25'
    }
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
    note: '缺货！需紧急补货',
    financials: {
        costOfGoods: 8.0,
        shippingCost: 1.5,
        otherCost: 0.2,
        sellingPrice: 39.99,
        platformFee: 6.0,
        adCost: 8.0
    },
    logistics: {
        method: 'Air',
        carrier: 'UPS',
        trackingNo: '',
        status: 'Pending',
        origin: 'Zhongshan',
        destination: 'US-DAL',
        eta: ''
    }
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
    riskReason: '正常航行',
    skuIds: ['DEMO-002'],
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
    riskReason: '清关查验排队中',
    skuIds: ['DEMO-001'],
    customsStatus: 'Inspection',
    customsBroker: 'Flexport Customs',
    lastUpdate: '2023-11-11T14:15:00Z'
  },
  {
    id: 'SH-003',
    trackingNo: 'UPS1Z9928301',
    carrier: 'UPS Worldwide',
    method: 'Air',
    origin: 'Shanghai, CN',
    destination: 'New York, US',
    etd: '2023-10-25',
    eta: '2023-10-28',
    status: 'Delivered',
    progress: 100,
    weight: 50,
    cartons: 5,
    riskReason: '',
    skuIds: ['DEMO-003'],
    customsStatus: 'Cleared',
    podName: 'J. SMITH (Dock)',
    podTime: '2023-10-28T10:30:00Z',
    lastUpdate: '2023-10-28T10:30:00Z'
  }
];

// Mock Influencer Data
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
    },
    {
        id: 'INF-002',
        name: 'David Home',
        handle: '@david.living',
        platform: 'Instagram',
        followers: 450000,
        engagementRate: 3.2,
        region: 'Europe',
        category: 'Home Decor',
        status: 'Sample Sent',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150',
        cost: 500,
        gmv: 0,
        roi: 0,
        sampleSku: 'LUMI-SMART-BULB'
    },
    {
        id: 'INF-003',
        name: 'TechUnboxed',
        handle: 'tech_unboxed_official',
        platform: 'YouTube',
        followers: 890000,
        engagementRate: 8.5,
        region: 'Global',
        category: 'Tech Review',
        status: 'Negotiating',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150',
        cost: 3000,
        gmv: 0,
        roi: 0,
        sampleSku: 'N/A'
    }
];

// Mock Transaction Data
const DEMO_TRANSACTIONS: Transaction[] = [
    { id: 'TX-1001', date: '2023-11-15', type: 'Revenue', category: 'Sales', amount: 4500.00, description: 'Amazon US Settlement', status: 'Cleared' },
    { id: 'TX-1002', date: '2023-11-14', type: 'Expense', category: 'Shipping', amount: 1200.00, description: 'DHL Express Payment', status: 'Cleared' },
    { id: 'TX-1003', date: '2023-11-14', type: 'Expense', category: 'Marketing', amount: 500.00, description: 'Influencer Fee @david.living', status: 'Pending' },
    { id: 'TX-1004', date: '2023-11-13', type: 'Revenue', category: 'Sales', amount: 2100.00, description: 'Shopify Store Payout', status: 'Cleared' },
    { id: 'TX-1005', date: '2023-11-12', type: 'Expense', category: 'COGS', amount: 3000.00, description: 'Supplier Payment Batch #4', status: 'Cleared' },
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentTheme, setCurrentTheme] = useState<Theme>('neon');
  
  // --- SAFE INITIALIZATION WRAPPER ---
  // Helper to safely load JSON from localStorage. If corrupted, returns fallback.
  const loadSafe = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      // Basic check: if array required but object returned, or vice versa
      if (Array.isArray(fallback) && !Array.isArray(parsed)) throw new Error('Type mismatch: Expected array');
      return parsed;
    } catch (e) {
      console.warn(`Data corruption detected for key "${key}". Reverting to demo data.`, e);
      // Optional: Clear corrupted data to prevent future crashes
      // localStorage.removeItem(key); 
      return fallback;
    }
  };

  const [products, setProducts] = useState<Product[]>(() => loadSafe('aero_erp_products', DEMO_PRODUCTS));
  const [shipments, setShipments] = useState<Shipment[]>(() => loadSafe('aero_erp_shipments', DEMO_SHIPMENTS));
  const [influencers, setInfluencers] = useState<Influencer[]>(() => loadSafe('aero_erp_influencers', DEMO_INFLUENCERS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadSafe('aero_erp_transactions', DEMO_TRANSACTIONS));

  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingSKU, setEditingSKU] = useState<Product | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('aero_erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('aero_erp_shipments', JSON.stringify(shipments));
  }, [shipments]);

  useEffect(() => {
    localStorage.setItem('aero_erp_influencers', JSON.stringify(influencers));
  }, [influencers]);

  useEffect(() => {
    localStorage.setItem('aero_erp_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Theme Side Effect
  useEffect(() => {
    // Apply theme to document body
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleSaveProduct = (savedProduct: Product) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === savedProduct.id);
      if (exists) {
        return prev.map(p => p.id === savedProduct.id ? savedProduct : p);
      }
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
               supplier: updatedData.supplierName,
               financials: {
                   costOfGoods: updatedData.unitCost,
                   shippingCost: updatedData.shippingRate * updatedData.unitWeight,
                   otherCost: updatedData.fulfillmentFee + updatedData.adCostPerUnit,
                   sellingPrice: updatedData.sellingPrice,
                   platformFee: (updatedData.sellingPrice * updatedData.tiktokCommission) / 100,
                   adCost: updatedData.adCostPerUnit
               },
               logistics: {
                   method: updatedData.transportMethod,
                   carrier: updatedData.carrier,
                   trackingNo: updatedData.trackingNo,
                   status: 'Pending',
                   origin: 'China',
                   destination: updatedData.destinationWarehouse,
                   etd: updatedData.restockDate
               }
           };
       }));
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
  };

  const handleDeleteSKU = (productId: string) => {
    if (window.confirm('警告：确定要永久删除此 SKU 吗？此操作涉及库存资产，不可撤销。')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      if (editingSKU?.id === productId) {
        setEditingSKU(null);
      }
    }
  };

  const handleImportData = (importedData: Product[]) => {
      // Final safety check before setting state
      if (!Array.isArray(importedData)) return;

      setProducts(prev => {
          const prevMap = new Map(prev.map(p => [p.id, p]));
          importedData.forEach(p => {
              if (p && p.id) {
                 prevMap.set(p.id, p);
              }
          });
          return Array.from(prevMap.values());
      });
  };
  
  // Logistics Handlers
  const handleAddShipment = (newShipment: Shipment) => {
      setShipments(prev => [newShipment, ...prev]);
  }
  const handleUpdateShipment = (updatedShipment: Shipment) => {
      setShipments(prev => prev.map(s => s.id === updatedShipment.id ? updatedShipment : s));
  }

  // Influencer Handlers
  const handleAddInfluencer = (newInfluencer: Influencer) => {
      setInfluencers(prev => [newInfluencer, ...prev]);
  }
  const handleUpdateInfluencer = (updatedInfluencer: Influencer) => {
      setInfluencers(prev => prev.map(inf => inf.id === updatedInfluencer.id ? updatedInfluencer : inf));
  }
  const handleDeleteInfluencer = (id: string) => {
      if(window.confirm('确定删除此达人档案吗？')) {
          setInfluencers(prev => prev.filter(inf => inf.id !== id));
      }
  }

  const handleAddTransaction = (newTx: Transaction) => {
      setTransactions(prev => [newTx, ...prev]);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
            <Dashboard 
                products={products}
                shipments={shipments}
                transactions={transactions}
                influencers={influencers}
                onChangeView={setActiveView}
            />
        );
      case 'restock':
        return (
          <RestockModule 
            products={products} 
            onEditSKU={(p) => setEditingSKU(p)}
            onCloneSKU={handleCloneSKU}
            onDeleteSKU={handleDeleteSKU}
            onAddNew={() => setEditingProduct(null)} // Enable Creating New Products via Restock Module
          />
        );
      case 'orders':
        return (
            <LogisticsModule 
                shipments={shipments} 
                products={products} // Pass products to enable SKU selection
                onAddShipment={handleAddShipment} 
                onUpdateShipment={handleUpdateShipment}
            />
        );
      case 'influencers': 
        return (
            <InfluencerModule 
                influencers={influencers} 
                onAddInfluencer={handleAddInfluencer}
                onUpdateInfluencer={handleUpdateInfluencer}
                onDeleteInfluencer={handleDeleteInfluencer}
            />
        );
      case 'finance': 
        return <FinanceModule transactions={transactions} onAddTransaction={handleAddTransaction} />;
      case 'datasync':
        return (
            <DataSyncModule 
                currentData={products} 
                onImportData={handleImportData} 
            />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-neon-pink selection:text-white overflow-hidden text-gray-900 bg-transparent">
      <Sidebar 
        activeView={activeView} 
        onChangeView={setActiveView} 
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
      
      {/* Main Content Area */}
      <main className="ml-[320px] h-screen overflow-y-auto no-scrollbar pr-6">
        <div className="w-full h-full pt-6 pb-32 pl-0 pr-0">
          {renderContent()}
        </div>
      </main>

      {/* Basic Product Editor Modal */}
      {editingProduct !== undefined && (
        <ProductEditor 
          onClose={() => setEditingProduct(undefined)}
          onSave={handleSaveProduct}
          initialProduct={editingProduct}
        />
      )}

      {/* Advanced SKU Detail Editor Modal */}
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