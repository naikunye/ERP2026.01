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

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  
  // REAL DATA: Initialize from LocalStorage or empty array. No more hardcoded mocks if user has data.
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aero_erp_products');
    return saved ? JSON.parse(saved) : []; 
  });

  const [shipments, setShipments] = useState<Shipment[]>(() => {
    const saved = localStorage.getItem('aero_erp_shipments');
    return saved ? JSON.parse(saved) : [];
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
    // Merge the complex data from SKU Detail Editor into the main product object
    // In a real backend, this would be a PATCH request
    if (editingSKU) {
       setProducts(prev => prev.map(p => {
           if (p.id !== editingSKU.id) return p;
           
           // Construct the real data structure from the form flat data
           return {
               ...p,
               note: updatedData.note,
               supplier: updatedData.supplierName,
               // Map flat form data to structured types
               financials: {
                   costOfGoods: updatedData.unitCost,
                   shippingCost: updatedData.shippingRate * updatedData.unitWeight, // Simplified calc
                   otherCost: updatedData.fulfillmentFee + updatedData.adCostPerUnit,
                   sellingPrice: updatedData.sellingPrice,
                   platformFee: (updatedData.sellingPrice * updatedData.tiktokCommission) / 100,
                   adCost: updatedData.adCostPerUnit
               },
               logistics: {
                   method: updatedData.transportMethod,
                   carrier: updatedData.carrier,
                   trackingNo: updatedData.trackingNo,
                   status: 'Pending', // Default status for new update
                   origin: 'China', // Default
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
      id: crypto.randomUUID(), // Use real UUID
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
          // Intelligent Merge: Update existing IDs, Append new ones
          const prevMap = new Map(prev.map(p => [p.id, p]));
          importedData.forEach(p => prevMap.set(p.id, p));
          return Array.from(prevMap.values());
      });
  };
  
  // Real Logic: Add a new shipment
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
