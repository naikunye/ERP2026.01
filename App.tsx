import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductEditor from './components/ProductEditor';
import RestockModule from './components/RestockModule';
import SKUDetailEditor from './components/SKUDetailEditor';
import LogisticsModule from './components/LogisticsModule';
import DataSyncModule from './components/DataSyncModule';
import { Product, ProductStatus, Currency, Shipment } from './types';

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
    skuIds: ['DEMO-002']
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
    skuIds: ['DEMO-001']
  }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  
  // Initialize from LocalStorage OR fall back to DEMO DATA for first-time experience
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aero_erp_products');
    return saved ? JSON.parse(saved) : DEMO_PRODUCTS; 
  });

  const [shipments, setShipments] = useState<Shipment[]>(() => {
    const saved = localStorage.getItem('aero_erp_shipments');
    return saved ? JSON.parse(saved) : DEMO_SHIPMENTS;
  });

  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingSKU, setEditingSKU] = useState<Product | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('aero_erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('aero_erp_shipments', JSON.stringify(shipments));
  }, [shipments]);

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
      setProducts(prev => {
          const prevMap = new Map(prev.map(p => [p.id, p]));
          importedData.forEach(p => prevMap.set(p.id, p));
          return Array.from(prevMap.values());
      });
  };
  
  const handleAddShipment = (newShipment: Shipment) => {
      setShipments(prev => [newShipment, ...prev]);
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return (
          <ProductList 
            products={products} 
            onEdit={(p) => setEditingProduct(p)} 
            onAddNew={() => setEditingProduct(null)} 
          />
        );
      case 'restock':
        return (
          <RestockModule 
            products={products} 
            onEditSKU={(p) => setEditingSKU(p)}
            onCloneSKU={handleCloneSKU}
            onDeleteSKU={handleDeleteSKU}
          />
        );
      case 'orders':
        return <LogisticsModule shipments={shipments} onAddShipment={handleAddShipment} />;
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
    <div className="min-h-screen font-sans selection:bg-neon-pink selection:text-white overflow-hidden text-gray-900">
      <Sidebar activeView={activeView} onChangeView={setActiveView} />
      
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