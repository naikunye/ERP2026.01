import React, { useState } from 'react';
import { Product } from '../types';
import { 
  Search, Plus, Filter, Factory, Truck, Plane, Ship, 
  DollarSign, Calendar, Package, Edit3, Copy, Trash2, StickyNote, Wallet, ExternalLink,
  Activity, AlertTriangle, TrendingUp, BarChart, Container
} from 'lucide-react';

interface RestockModuleProps {
  products: Product[];
  onEditSKU?: (product: Product) => void;
  onCloneSKU?: (product: Product) => void;
  onDeleteSKU?: (productId: string) => void;
  onAddNew?: () => void;
}

const RestockModule: React.FC<RestockModuleProps> = ({ products, onEditSKU, onCloneSKU, onDeleteSKU, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Real Calculation based on saved data
  const totalCapital = products.reduce((sum, item) => {
      const cost = item.financials?.costOfGoods || 0;
      const ship = item.financials?.shippingCost || 0;
      return sum + ((cost + ship) * item.stock);
  }, 0);

  const getLogisticsIcon = (method?: string) => {
    switch(method) {
      case 'Air': return <Plane size={14} className="text-neon-blue" />;
      case 'Sea': return <Ship size={14} className="text-neon-blue" />;
      default: return <Truck size={14} className="text-gray-500" />;
    }
  };

  const getStatusCN = (status?: string) => {
      if (!status) return '待配置';
      switch(status) {
          case 'In Transit': return '运输中';
          case 'Delivered': return '已送达';
          case 'In Production': return '生产中';
          case 'Customs': return '清关中';
          case 'Pending': return '待处理';
          default: return status;
      }
  }

  // Helper to generate tracking URL
  const getTrackingUrl = (carrier: string = '', trackingNo: string = '') => {
      if (!trackingNo) return '#';
      const c = carrier.toLowerCase();
      // Simple logic to guess carrier URL
      if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${trackingNo}&loc=zh_CN`;
      if (c.includes('dhl')) return `https://www.dhl.com/cn-zh/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNo}`;
      if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNo}`;
      return `https://www.17track.net/zh-cn/track?nums=${trackingNo}`;
  };

  // Calculate profit on the fly
  const calculateProfit = (item: Product) => {
      if (!item.financials) return 0;
      const cost = item.financials.costOfGoods + item.financials.shippingCost + item.financials.otherCost + item.financials.platformFee + item.financials.adCost;
      return item.financials.sellingPrice - cost;
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20">
      
      {/* 1. Header & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-b border-white/10 pb-6">
        <div className="md:col-span-6">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              智能备货清单 
              <span className="text-neon-blue/50 font-sans text-sm tracking-widest font-medium border border-neon-blue/30 px-2 py-0.5 rounded">SMART RESTOCK</span>
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
                    <div className="text-xl font-display font-bold text-white">{products.length}</div>
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
                        <span className="text-neon-green text-sm mr-1">¥</span>
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
                  placeholder="搜索 SKU, 产品名称..."
              />
          </div>
          
          <div className="flex gap-3">
              <button className="h-12 px-5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold">
                  <Filter size={16} /> 筛选
              </button>
              {onAddNew && (
                  <button 
                    onClick={onAddNew}
                    className="h-12 px-5 rounded-xl bg-gradient-neon-blue text-white shadow-glow-blue hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold"
                  >
                      <Plus size={16} strokeWidth={3} /> 新建 SKU
                  </button>
              )}
          </div>
      </div>

      {/* 3. The List (Card Table) */}
      <div className="space-y-3">
          {/* Header Row */}
          <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <div className="col-span-2">SKU 标识</div>
              <div className="col-span-2">产品详情</div>
              <div className="col-span-2">物流 & 入库</div>
              <div className="col-span-2">库存健康度 (DOI)</div>
              <div className="col-span-1">投入资金</div>
              <div className="col-span-1">利润透视</div>
              <div className="col-span-2 text-center">操作</div>
          </div>

          {/* Data Rows */}
          {filteredData.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                  暂无数据，请点击右上角新建 SKU
              </div>
          ) : (
             filteredData.map((item) => {
                 const unitProfit = calculateProfit(item);
                 const hasData = !!item.financials;
                 const trackingUrl = getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo);
                 
                 // --- Smart Inventory Logic ---
                 // Calculate Days of Inventory (DOI)
                 const dailySales = item.dailySales || 1; // Default to 1 to avoid division by zero visually
                 const daysOfInventory = Math.floor(item.stock / dailySales);
                 const safeStockDays = 30; // Target stock level
                 const stockProgress = Math.min((daysOfInventory / safeStockDays) * 100, 100);
                 
                 // Urgency Logic
                 const isLowStock = daysOfInventory < 15;
                 const isCritical = daysOfInventory < 7;
                 const urgencyColor = isCritical ? 'bg-neon-pink' : (isLowStock ? 'bg-neon-yellow' : 'bg-neon-green');
                 const urgencyText = isCritical ? 'text-neon-pink' : (isLowStock ? 'text-neon-yellow' : 'text-neon-green');

                 // Total Potential Profit
                 const totalPotentialProfit = unitProfit * item.stock;

                 // Safe financial access
                 const costOfGoods = item.financials?.costOfGoods || 0;
                 const shippingCost = item.financials?.shippingCost || 0;

                 return (
                  <div key={item.id} onClick={() => onEditSKU && onEditSKU(item)} className="glass-card grid grid-cols-12 items-center p-0 min-h-[110px] hover:border-white/20 transition-all group relative overflow-visible cursor-pointer">
                      
                      {/* Left Accent Bar: Indicates Health */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${urgencyColor}`}></div>

                      {/* 1. Identity */}
                      <div className="col-span-2 p-4 pl-6 border-r border-white/5 h-full flex flex-col justify-center relative">
                          <div className="font-mono text-neon-blue font-bold text-sm mb-1 flex items-center gap-2">
                              {item.sku}
                              {item.note && (
                                  <div className="group/note relative">
                                      <StickyNote size={12} className="text-neon-yellow" />
                                      <div className="absolute left-full top-0 ml-2 w-48 p-2 bg-black/90 border border-white/20 rounded-lg text-[10px] text-white hidden group-hover/note:block z-50 pointer-events-none">
                                          {item.note}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* 2. Product Detail */}
                      <div className="col-span-2 p-4 border-r border-white/5 h-full flex items-center gap-3 overflow-hidden">
                          <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 overflow-hidden shrink-0">
                              <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="min-w-0 flex-1">
                              <div className="font-bold text-white text-xs truncate mb-1">{item.name}</div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 truncate">
                                  <Factory size={10} className="shrink-0"/> <span className="truncate">{item.supplier || '未指定供应商'}</span>
                              </div>
                          </div>
                      </div>

                      {/* 3. Logistics & Inbound ID (UPDATED) */}
                      <div className="col-span-2 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2">
                          {item.logistics ? (
                              <>
                                <div className="flex items-center gap-2 text-white font-bold text-xs">
                                    {getLogisticsIcon(item.logistics.method)}
                                    <span className={item.logistics.status === 'In Transit' ? 'text-neon-blue' : ''}>{getStatusCN(item.logistics.status)}</span>
                                </div>
                                
                                {/* Inbound ID Display */}
                                {item.inboundId ? (
                                    <div className="flex items-center gap-1.5 text-[10px] text-neon-purple bg-neon-purple/5 px-1.5 py-0.5 rounded border border-neon-purple/10 w-fit">
                                        <Container size={10} />
                                        <span className="font-mono">{item.inboundId}</span>
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-gray-600 border border-dashed border-gray-700 px-1 rounded w-fit">无入库单</div>
                                )}

                                <div className="flex items-center gap-2">
                                    <div className="text-[10px] text-gray-500 font-mono truncate max-w-[100px]">
                                        {item.logistics.trackingNo || '无单号'}
                                    </div>
                                    {item.logistics.trackingNo && (
                                        <a 
                                            href={trackingUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()} 
                                            className="text-gray-500 hover:text-white transition-colors"
                                        >
                                            <ExternalLink size={10} />
                                        </a>
                                    )}
                                </div>
                              </>
                          ) : (
                              <div className="text-[10px] text-gray-600 italic">暂无物流数据</div>
                          )}
                      </div>

                      {/* 4. Inventory Health (UPDATED: Progress Bar & Days) */}
                      <div className="col-span-2 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2">
                           <div className="flex justify-between items-end">
                                <div className="text-lg font-display font-bold text-white leading-none">{item.stock}</div>
                                <div className={`text-[10px] font-bold ${urgencyText} flex items-center gap-1`}>
                                    {isCritical && <AlertTriangle size={10} />}
                                    {daysOfInventory > 365 ? '>1年' : `${daysOfInventory}天可售`}
                                </div>
                           </div>
                           
                           {/* Velocity */}
                           <div className="flex items-center gap-1 text-[10px] text-gray-500">
                               <Activity size={10} /> 日销: <span className="text-white font-mono">{item.dailySales || 0}</span>
                           </div>

                           {/* Progress Bar */}
                           <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                               <div 
                                  className={`h-full rounded-full ${urgencyColor}`} 
                                  style={{ width: `${stockProgress}%` }}
                               ></div>
                           </div>
                      </div>

                      {/* 5. Invested Capital */}
                      <div className="col-span-1 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-1">
                          {hasData ? (
                              <>
                                <div className="flex items-center gap-1 text-xs font-bold text-white">
                                    <span className="text-[10px] text-gray-500">¥</span>
                                    {((costOfGoods + shippingCost) * item.stock).toLocaleString()}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <span className="text-gray-600">货:</span>
                                        <span className="font-mono">¥ {(costOfGoods * item.stock).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <span className="text-gray-600">运:</span>
                                        <span className="font-mono">¥ {(shippingCost * item.stock).toLocaleString()}</span>
                                    </div>
                                </div>
                              </>
                          ) : (
                              <div className="text-[10px] text-gray-600">待补充</div>
                          )}
                      </div>

                      {/* 6. Financials (UPDATED: Total Profit) */}
                      <div className="col-span-1 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2">
                          {hasData ? (
                              <div className="flex flex-col gap-2">
                                  {/* Unit Profit */}
                                  <div className="flex flex-col">
                                      <span className="text-[9px] text-gray-500 uppercase">单品利</span>
                                      <span className={`text-[11px] font-bold leading-none ${unitProfit > 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
                                         {unitProfit > 0 ? '+' : ''}${unitProfit.toFixed(1)}
                                      </span>
                                  </div>
                                  
                                  {/* Total Potential Profit */}
                                  <div className="flex flex-col">
                                      <span className="text-[9px] text-gray-500 uppercase flex items-center gap-1">
                                          <TrendingUp size={8} /> 潜在总利
                                      </span>
                                      <span className={`text-[11px] font-bold leading-none ${totalPotentialProfit > 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
                                         {totalPotentialProfit > 0 ? '+' : ''}${totalPotentialProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                      </span>
                                  </div>
                              </div>
                          ) : (
                              <span className="text-[10px] text-gray-600">-</span>
                          )}
                      </div>

                      {/* 7. Action */}
                      <div className="col-span-2 p-4 h-full flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditSKU && onEditSKU(item);
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-blue hover:text-black flex items-center justify-center text-gray-400 transition-colors"
                            title="编辑详情"
                          >
                              <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onCloneSKU && onCloneSKU(item);
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-purple hover:text-white flex items-center justify-center text-gray-400 transition-colors"
                            title="复制 SKU"
                          >
                              <Copy size={14} />
                          </button>
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSKU && onDeleteSKU(item.id);
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-pink hover:text-white flex items-center justify-center text-gray-400 transition-colors"
                            title="删除"
                          >
                              <Trash2 size={14} />
                          </button>
                      </div>

                  </div>
                 );
             }))}
      </div>
    </div>
  );
};

export default RestockModule;