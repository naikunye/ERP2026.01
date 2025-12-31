import React, { useState, useMemo } from 'react';
import { Product, ProductStatus } from '../types';
import { 
  Search, Plus, Filter, Factory, Truck, Plane, Ship, 
  DollarSign, AlertTriangle, Calendar, Package, MoreHorizontal, 
  TrendingUp, Wallet, Edit3, Copy, Trash2, StickyNote, FileText,
  Coins
} from 'lucide-react';

interface RestockModuleProps {
  products: Product[];
  onEditSKU?: (product: Product) => void;
  onCloneSKU?: (product: Product) => void;
  onDeleteSKU?: (productId: string) => void;
}

// Extended interface for ERP specific fields (Mocking backend data)
interface ERPProduct extends Product {
  supplier: string;
  batchNo: string;
  logistics: {
    status: 'In Production' | 'In Transit' | 'Customs' | 'Delivered' | 'Pending';
    trackingNo: string;
    method: 'Air' | 'Sea' | 'Rail';
    eta: string;
  };
  financials: {
    costOfGoods: number; // Unit cost
    shippingCost: number; // Unit shipping
    unitProfit: number;
  };
  inventoryAnalysis: {
    daysRemaining: number;
    riskLevel: 'Safe' | 'Low' | 'Critical';
  };
}

// Mock Data Generator to enrich the basic product list
const enrichProductData = (products: Product[]): ERPProduct[] => {
  return products.map((p, index) => {
    const cost = p.price * 0.4;
    const shipping = p.price * 0.05;
    const profit = p.price - cost - shipping;
    
    // Simulate stock risks based on stock level
    let days = Math.floor(p.stock / 2); // Mock velocity
    if (p.stock === 0) days = 0;
    
    let risk: 'Safe' | 'Low' | 'Critical' = 'Safe';
    if (days < 10) risk = 'Critical';
    else if (days < 30) risk = 'Low';

    return {
      ...p,
      supplier: index % 2 === 0 ? '深圳科技实业有限公司' : '广州电子元件厂',
      batchNo: `B-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
      logistics: {
        status: index === 0 ? 'In Transit' : index === 1 ? 'Delivered' : 'In Production',
        trackingNo: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        method: index % 2 === 0 ? 'Air' : 'Sea',
        eta: new Date(Date.now() + 86400000 * (index + 5)).toLocaleDateString(),
      },
      financials: {
        costOfGoods: cost,
        shippingCost: shipping,
        unitProfit: profit
      },
      inventoryAnalysis: {
        daysRemaining: days,
        riskLevel: risk
      }
    };
  });
};

const RestockModule: React.FC<RestockModuleProps> = ({ products, onEditSKU, onCloneSKU, onDeleteSKU }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const erpData = useMemo(() => enrichProductData(products), [products]);

  const filteredData = erpData.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary Stats Calculation
  const totalCapital = erpData.reduce((sum, item) => sum + ((item.financials.costOfGoods + item.financials.shippingCost) * item.stock), 0);
  const totalPotentialProfit = erpData.reduce((sum, item) => sum + (item.financials.unitProfit * item.stock), 0);

  const getLogisticsIcon = (method: string) => {
    switch(method) {
      case 'Air': return <Plane size={14} className="text-neon-blue" />;
      case 'Sea': return <Ship size={14} className="text-neon-blue" />;
      default: return <Truck size={14} className="text-neon-blue" />;
    }
  };

  const getStatusCN = (status: string) => {
      switch(status) {
          case 'In Transit': return '运输中';
          case 'Delivered': return '已送达';
          case 'In Production': return '生产中';
          case 'Customs': return '清关中';
          case 'Pending': return '待处理';
          default: return status;
      }
  }

  const getStatusLabelCN = (status: string) => {
      if(status === 'Active') return '在售';
      if(status === 'Draft') return '草稿';
      if(status === 'Archived') return '归档';
      return status;
  }

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20">
      
      {/* 1. Header & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-b border-white/10 pb-6">
        <div className="md:col-span-6">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              智能备货清单 
              <span className="text-neon-blue/50 font-sans text-sm tracking-widest font-medium border border-neon-blue/30 px-2 py-0.5 rounded">REPLENISHMENT LIST</span>
           </h1>
        </div>
        
        {/* Summary Cards */}
        <div className="md:col-span-6 flex gap-4 justify-end">
             <div className="glass-card px-5 py-3 flex items-center gap-4 min-w-[200px] border-white/10 bg-white/5">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-300">
                    <Package size={20} />
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">SKU 总数</div>
                    <div className="text-xl font-display font-bold text-white">{erpData.length}</div>
                </div>
             </div>
             
             <div className="glass-card px-5 py-3 flex items-center gap-4 min-w-[240px] border-neon-green/20 bg-neon-green/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-20"><Wallet size={40} className="text-neon-green"/></div>
                <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green shadow-glow-green/30">
                    <DollarSign size={20} />
                </div>
                <div className="relative z-10">
                    <div className="text-[10px] text-neon-green font-bold uppercase tracking-widest">资金占用总额</div>
                    <div className="text-xl font-display font-bold text-white tracking-wide">
                        <span className="text-neon-green text-sm mr-1">$</span>
                        {totalCapital.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                    </div>
                </div>
             </div>
        </div>
      </div>

      {/* 2. Controls */}
      <div className="flex justify-between items-center sticky top-0 z-30 py-4 backdrop-blur-xl bg-black/10 border-b border-white/5 transition-all">
          <div className="relative w-[400px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={18} />
              <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-neon-blue focus:bg-white/10 outline-none transition-all placeholder-gray-600"
                  placeholder="搜索 SKU, 产品名称或批次号..."
              />
          </div>
          
          <div className="flex gap-3">
              <button className="h-12 px-5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold">
                  <Filter size={16} /> 筛选
              </button>
              <button className="h-12 px-8 bg-gradient-neon-purple text-white rounded-xl font-bold text-xs shadow-glow-purple hover:scale-105 transition-transform flex items-center gap-2">
                  <Plus size={16} strokeWidth={3} /> 添加 SKU
              </button>
          </div>
      </div>

      {/* 3. The List (Card Table) */}
      <div className="space-y-3">
          {/* Header Row - ADJUSTED GRID for new column */}
          <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <div className="col-span-2">标识</div>
              <div className="col-span-2">产品详情</div> {/* Reduced from 3 */}
              <div className="col-span-2">物流信息</div>
              <div className="col-span-1">库存</div> {/* Reduced from 2 */}
              <div className="col-span-2">投入资金</div> {/* NEW COLUMN */}
              <div className="col-span-1">利润数据</div>
              <div className="col-span-2 text-center">操作</div>
          </div>

          {/* Data Rows */}
          {filteredData.map((item) => (
              <div key={item.id} onClick={() => onEditSKU && onEditSKU(item)} className="glass-card grid grid-cols-12 items-center p-0 min-h-[100px] hover:border-white/20 transition-all group relative overflow-visible cursor-pointer">
                  
                  {/* Left Accent Bar based on risk */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.inventoryAnalysis.riskLevel === 'Critical' ? 'bg-neon-pink shadow-[0_0_10px_#FF2975]' : 'bg-neon-green'}`}></div>

                  {/* 1. Identity (Col 2) */}
                  <div className="col-span-2 p-4 pl-6 border-r border-white/5 h-full flex flex-col justify-center relative">
                      <div className="font-mono text-neon-blue font-bold text-sm mb-1 flex items-center gap-2">
                          {item.sku}
                          {item.note && (
                              <div className="group/note relative">
                                  <StickyNote size={12} className="text-neon-yellow" />
                                  <div className="absolute left-full top-0 ml-2 w-48 p-2 bg-black/90 border border-white/20 rounded-lg text-[10px] text-white hidden group-hover/note:block z-50 pointer-events-none">
                                      <span className="text-neon-yellow font-bold block mb-1">备注:</span>
                                      {item.note}
                                  </div>
                              </div>
                          )}
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold w-fit border ${
                          item.status === 'Active' 
                          ? 'bg-neon-green/10 text-neon-green border-neon-green/20' 
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>
                          {getStatusLabelCN(item.status)}
                      </span>
                  </div>

                  {/* 2. Product Detail (Col 2 - Compacted) */}
                  <div className="col-span-2 p-4 border-r border-white/5 h-full flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-black/50 border border-white/10 overflow-hidden shrink-0">
                          <img src={item.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                      </div>
                      <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-sm truncate mb-0.5">{item.name}</div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 truncate">
                              <Factory size={10} className="shrink-0"/> <span className="truncate">{item.supplier}</span>
                          </div>
                      </div>
                  </div>

                  {/* 3. Logistics (Col 2) */}
                  <div className="col-span-2 p-4 border-r border-white/5 h-full flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-white font-bold text-xs mb-1">
                          {getLogisticsIcon(item.logistics.method)}
                          {getStatusCN(item.logistics.status)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mb-2 truncate">{item.logistics.trackingNo}</div>
                      <div className="flex items-center gap-1 text-[10px] text-neon-blue bg-neon-blue/5 w-fit px-1.5 py-0.5 rounded border border-neon-blue/10">
                          <Calendar size={10} /> 预计: {item.logistics.eta}
                      </div>
                  </div>

                  {/* 4. Inventory & Risk (Col 1 - Compacted) */}
                  <div className="col-span-1 p-4 border-r border-white/5 h-full flex flex-col justify-center">
                       <div className="text-lg font-display font-bold text-white">{item.stock}</div>
                       
                       {item.inventoryAnalysis.riskLevel === 'Critical' ? (
                           <div className="text-neon-pink text-[10px] font-bold mt-1 leading-tight">
                               剩 {item.inventoryAnalysis.daysRemaining} 天
                           </div>
                       ) : (
                           <div className="text-neon-green text-[10px] font-bold mt-1 leading-tight">
                               安 {item.inventoryAnalysis.daysRemaining} 天
                           </div>
                       )}
                  </div>

                  {/* 5. Invested Capital (Col 2 - NEW) */}
                  <div className="col-span-2 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-1 text-sm font-bold text-white">
                          <span className="text-xs text-gray-500">¥</span>
                          {((item.financials.costOfGoods + item.financials.shippingCost) * item.stock).toLocaleString()}
                      </div>
                      <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                               <span className="w-12 text-gray-600">货值应占:</span>
                               <span className="font-mono">¥ {(item.financials.costOfGoods * item.stock).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                               <span className="w-12 text-gray-600">物流费用:</span>
                               <span className="font-mono">¥ {(item.financials.shippingCost * item.stock).toLocaleString()}</span>
                          </div>
                      </div>
                  </div>

                  {/* 6. Financials (Col 1 - Profit Only) */}
                  <div className="col-span-1 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-1.5">
                      <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 leading-tight">单品利</span>
                          <span className="text-[12px] font-bold text-white leading-tight">
                             +${item.financials.unitProfit.toFixed(1)}
                          </span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 leading-tight">总利润</span>
                          <span className="text-[12px] font-bold text-neon-green leading-tight">
                             +${(item.financials.unitProfit * item.stock).toLocaleString()}
                          </span>
                      </div>
                  </div>

                  {/* 7. Action (Col 2) */}
                  <div className="col-span-2 p-4 h-full flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditSKU && onEditSKU(item);
                        }}
                        title="编辑 (Edit)"
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-blue hover:text-black flex items-center justify-center text-gray-400 transition-colors"
                      >
                          <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onCloneSKU && onCloneSKU(item);
                        }}
                        title="克隆 (Clone)"
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-purple hover:text-white flex items-center justify-center text-gray-400 transition-colors"
                      >
                          <Copy size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSKU && onDeleteSKU(item.id);
                        }}
                        title="删除 (Delete)"
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-pink hover:text-white flex items-center justify-center text-gray-400 transition-colors"
                      >
                          <Trash2 size={14} />
                      </button>
                  </div>

              </div>
          ))}
      </div>
    </div>
  );
};

export default RestockModule;