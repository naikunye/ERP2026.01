import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductEditor from './components/ProductEditor';
import RestockModule from './components/RestockModule';
import { Product, ProductStatus, Currency } from './types';

// Mock Initial Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'AERO-WL-001',
    name: 'Aero Noise-Cancel Pro',
    description: 'High-fidelity audio with active noise cancellation and transparency mode.',
    price: 249.00,
    currency: Currency.USD,
    stock: 142,
    category: 'Electronics',
    status: ProductStatus.Active,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=200&h=200',
    marketplaces: ['US', 'EU'],
    lastUpdated: '2023-10-24'
  },
  {
    id: '2',
    sku: 'AERO-CH-002',
    name: 'ErgoWorkspace Chair',
    description: 'Designed for comfort and productivity with breathable mesh back.',
    price: 499.00,
    currency: Currency.USD,
    stock: 45,
    category: 'Furniture',
    status: ProductStatus.Active,
    imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=200&h=200',
    marketplaces: ['US'],
    lastUpdated: '2023-10-23'
  },
  {
    id: '3',
    sku: 'AERO-LT-003',
    name: 'Lumina Smart Ambient',
    description: '16 million colors, voice controlled, syncs with music.',
    price: 89.99,
    currency: Currency.USD,
    stock: 12,
    category: 'Home',
    status: ProductStatus.Archived,
    imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=200&h=200',
    marketplaces: ['US', 'JP'],
    lastUpdated: '2023-09-15'
  },
  {
    id: '4',
    sku: 'AERO-KB-004',
    name: 'Mechanic Pro Keyboard',
    description: 'RGB Backlit mechanical keyboard with blue switches.',
    price: 129.99,
    currency: Currency.USD,
    stock: 8,
    category: 'Electronics',
    status: ProductStatus.Active,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?auto=format&fit=crop&q=80&w=200&h=200',
    marketplaces: ['US'],
    lastUpdated: '2023-11-01'
  }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined); 

  const handleSaveProduct = (savedProduct: Product) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === savedProduct.id);
      if (exists) {
        return prev.map(p => p.id === savedProduct.id ? savedProduct : p);
      }
      return [savedProduct, ...prev];
    });
  };

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
        return <RestockModule products={products} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-white/50">
            <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 shadow-lg backdrop-blur-md flex items-center justify-center mb-6">
               <span className="text-4xl opacity-80">🚧</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Module Offline</h2>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest opacity-70">Construction in progress</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-neon-pink selection:text-white overflow-hidden text-gray-900">
      <Sidebar activeView={activeView} onChangeView={setActiveView} />
      
      {/* Main Content Area - Full Width Optimization */}
      <main className="ml-[320px] h-screen overflow-y-auto no-scrollbar pr-6">
        {/* Removed max-w, adjusted padding for edge-to-edge feel */}
        <div className="w-full h-full pt-6 pb-32 pl-0 pr-0">
          {renderContent()}
        </div>
      </main>

      {/* Product Editor Modal */}
      {editingProduct !== undefined && (
        <ProductEditor 
          onClose={() => setEditingProduct(undefined)}
          onSave={handleSaveProduct}
          initialProduct={editingProduct}
        />
      )}
    </div>
  );
};

export default App;