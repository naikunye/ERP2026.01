import React, { useState } from 'react';
import { Product } from '../types';
import { 
  Search, Plus, Filter, Factory, Truck, Plane, Ship, 
  DollarSign, Calendar, Package, Edit3, Copy, Trash2, StickyNote, Wallet, ExternalLink,
  Activity, AlertTriangle, TrendingUp, BarChart, Container, CheckSquare, Square, ShoppingCart, ArrowRight, Scale
} from 'lucide-react';

interface RestockModuleProps {
  products: Product[];
  onEditSKU?: (product: Product) => void;
  onCloneSKU?: (product: Product) => void;
  onDeleteSKU?: (productId: string) => void;
  onAddNew?: () => void;
  onCreatePO?: (items: { skuId: string, quantity: number, cost: number }[], supplier: string) => void;
}

const RestockModule: React.FC<RestockModuleProps> = ({ products, onEditSKU, onCloneSKU, onDeleteSKU, onAddNew, onCreatePO }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poDraft, setPoDraft] = useState<{ id: string, qty: number, cost: number }[]>([]);
  const [supplierName, setSupplierName] = useState('Default Supplier');

  const filteredData = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCapital = products.reduce((sum, item) => {
      const cost = item.financials?.costOfGoods || 0;
      const ship = item.financials?.shippingCost || 0;
      return sum + ((cost + ship) * item.stock);
  }, 0);

  // --- Multi-Select Logic ---
  const toggleSelect = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
      if (selectedIds.size === filteredData.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filteredData.map(p => p.id)));
      }
  };

  // --- PO Logic ---
  const handleOpenPO = () => {
      if (selectedIds.size === 0) return;
      const items = products
          .filter(p => selectedIds.has(p.id))
          .map(p => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              qty: 100, // Default restock qty
              cost: p.financials?.costOfGoods || 0
          }));
      
      setPoDraft(items);
      // Try to guess supplier from first item
      const firstProduct = products.find(p => p.id === Array.from(selectedIds)[0]);
      setSupplierName(firstProduct?.supplier || '深圳科技实业有限公司');
      setIsPOModalOpen(true);
  };

  const handleConfirmPO = () => {
      if (!onCreatePO) return;
      const payload = poDraft.map(item => ({ skuId: item.id, quantity: item.qty, cost: item.cost }));
      onCreatePO(payload, supplierName);
      setIsPOModalOpen(false);
      setSelectedIds(new Set());
  };

  const updatePoQty = (id: string, newQty: number) => {
      setPoDraft(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, newQty) } : item));
  };

  const poTotalCost = poDraft.reduce((acc, item) => acc + (item.cost * item.qty), 0);

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

  // UPDATED TRACKING URL LOGIC
  const getTrackingUrl = (carrier: string = '', trackingNo: string = '') => {
      if (!trackingNo) return '#';
      
      const c = carrier.toLowerCase().trim();
      const t = trackingNo.toUpperCase().trim();

      // 1. Force UPS China for explicit UPS carrier OR 1Z... tracking numbers
      if (c.includes('ups') || t.startsWith('1Z')) {
          return `https://www.ups.com/track?loc=zh_CN&tracknum=${trackingNo}`;
      }
      
      // 2. DHL
      if (c.includes('dhl')) {
          return `https://www.dhl.com/cn-zh/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNo}`;
      }

      // 3. FedEx
      if (c.includes('fedex')) {
          return `https://www.fedex.com/zh-cn/home.html`;
      }

      // 4. Default Fallback
      return `https://www.17track.net/zh-cn/track?nums=${trackingNo}`;
  };

  const calculateProfit = (item: Product) => {
      if (!item.financials) return 0;
      const cost = item.financials.costOfGoods + item.financials.shippingCost + item.financials.otherCost + item.financials.platformFee + item.financials.adCost;
      return item.financials.sellingPrice - cost;
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20 relative">
      
      {/* 1. Header & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-b border-white/10 pb-6">
        <div className="md:col-span-6">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              智能备货清单 
              <span className="text-neon-blue/50 font-sans text-sm tracking-widest font-medium border border-neon-blue/30 px-2 py-0.5 rounded">SMART RESTOCK</span>
           </h1>
        </div>
        
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

      {/* 2. Controls & Actions */}
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
          
          <div className="flex gap-3 items-center">
              {/* Batch Action */}
              {selectedIds.size > 0 && (
                  <button 
                      onClick={handleOpenPO}
                      className="h-12 px-6 rounded-xl bg-neon-green text-black font-bold text-sm shadow-glow-green hover:scale-105 transition-all flex items-center gap-2 animate-scale-in"
                  >
                      <ShoppingCart size={18} /> 
                      生成采购单 ({selectedIds.size})
                  </button>
              )}

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
          <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-12">
              <div className="col-span-2">SKU / 入库单 / 备注</div>
              <div className="col-span-2">产品详情 / 箱规</div>
              <div className="col-span-2">物流状态 / 费率</div>
              <div className="col-span-2">库存健康度 (DOI)</div>
              <div className="col-span-1">采购成本 / 售价</div>
              <div className="col-span-1">利润透视</div>
              <div className="col-span-2 text-center">操作</div>
          </div>

          {/* Select All Checkbox Overlay */}
          <div className="absolute top-[80px] left-4 z-40" title="全选">
              <button onClick={handleSelectAll} className="text-gray-500 hover:text-white">
                  {selectedIds.size === filteredData.length && filteredData.length > 0 ? <CheckSquare size={20} className="text-neon-blue"/> : <Square size={20}/>}
              </button>
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
                 const dailySales = item.dailySales || 1; 
                 const daysOfInventory = Math.floor(item.stock / dailySales);
                 const safeStockDays = 30; 
                 const stockProgress = Math.min((daysOfInventory / safeStockDays) * 100, 100);
                 const isLowStock = daysOfInventory < 15;
                 const isCritical = daysOfInventory < 7;
                 const urgencyColor = isCritical ? 'bg-neon-pink' : (isLowStock ? 'bg-neon-yellow' : 'bg-neon-green');
                 const urgencyText = isCritical ? 'text-neon-pink' : (isLowStock ? 'text-neon-yellow' : 'text-neon-green');
                 const totalPotentialProfit = unitProfit * item.stock;
                 const costOfGoods = item.financials?.costOfGoods || 0;
                 const shippingCost = item.financials?.shippingCost || 0;
                 const isSelected = selectedIds.has(item.id);

                 return (
                  <div key={item.id} onClick={() => onEditSKU && onEditSKU(item)} className={`glass-card grid grid-cols-12 items-center p-0 min-h-[110px] hover:border-white/20 transition-all group relative overflow-visible cursor-pointer ${isSelected ? 'border-neon-blue/30 bg-neon-blue/5' : ''}`}>
                      
                      {/* Selection Checkbox */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10" onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}>
                          {isSelected ? <CheckSquare size={20} className="text-neon-blue" /> : <Square size={20} className="text-gray-600 hover:text-gray-400" />}
                      </div>

                      {/* Left Accent Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${urgencyColor}`}></div>

                      {/* 1. Identity (Updated: SKU + Inbound ID + Note) */}
                      <div className="col-span-2 p-4 pl-12 border-r border-white/5 h-full flex flex-col justify-center gap-1.5 relative">
                          <div className="font-mono text-neon-blue font-bold text-sm">
                              {item.sku}
                          </div>
                          
                          {/* MOVED INBOUND ID HERE FOR VISIBILITY + WRAPPING FIX */}
                          {item.inboundId ? (
                              <div className="flex items-start gap-1.5 text-[10px] text-neon-purple w-full mt-1" title="Inbound ID (入库单号)">
                                  <Container size={10} className="shrink-0 mt-[2px]" />
                                  <span className="font-mono font-bold tracking-wide break-all whitespace-normal leading-tight">
                                      {item.inboundId}
                                  </span>
                              </div>
                          ) : (
                              <div className="text-[9px] text-gray-600 border border-dashed border-gray-800 px-1 py-0.5 rounded w-fit mt-1">无入库单号</div>
                          )}

                          {item.note && (
                              <div className="flex items-start gap-1.5 text-[10px] text-gray-400 bg-white/5 p-1.5 rounded border border-white/5 w-fit mt-1">
                                   <StickyNote size={10} className="text-neon-yellow shrink-0 mt-[1px]" />
                                   <span className="text-gray-300 leading-snug line-clamp-2 break-all" title={item.note}>
                                      {item.note}
                                   </span>
                              </div>
                          )}
                      </div>

                      {/* 2. Product Detail + Boxing Info */}
                      <div className="col-span-2 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-black/50 border border-white/10 overflow-hidden shrink-0">
                                  <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div className="min-w-0 flex-1">
                                  <div className="font-bold text-white text-xs truncate mb-1" title={item.name}>{item.name}</div>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-500 truncate">
                                      <Factory size={10} className="shrink-0"/> <span className="truncate">{item.supplier || '未指定供应商'}</span>
                                  </div>
                              </div>
                          </div>
                          {/* NEW: Explicit Box Info */}
                          <div className="flex gap-2 text-[9px] text-gray-400 bg-black/20 p-1.5 rounded border border-white/5">
                              <span>装箱: <strong className="text-white">{item.itemsPerBox || 0}</strong> pcs/箱</span>
                              <span className="text-gray-600">|</span>
                              <span>箱数: <strong className="text-white">{item.restockCartons || 0}</strong> ctns</span>
                          </div>
                      </div>

                      {/* 3. Logistics (Simplified) + Rate */}
                      <div className="col-span-2 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2">
                          {item.logistics ? (
                              <>
                                <div className="flex items-center gap-2 text-white font-bold text-xs">
                                    {getLogisticsIcon(item.logistics.method)}
                                    <span className={item.logistics.status === 'In Transit' ? 'text-neon-blue' : ''}>{getStatusCN(item.logistics.status)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-[10px] text-gray-500 font-mono truncate max-w-[100px]">{item.logistics.trackingNo || '无运单号'}</div>
                                    {item.logistics.trackingNo && <a href={trackingUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-gray-500 hover:text-white"><ExternalLink size={10} /></a>}
                                </div>
                              </>
                          ) : <div className="text-[10px] text-gray-600 italic">暂无物流数据</div>}
                          
                          {/* NEW: Shipping Rate Explicit Label */}
                          {shippingCost > 0 && (
                              <div className="text-[10px] text-neon-yellow flex items-center gap-1">
                                  <Scale size={10}/> 头程运费单价: ${shippingCost.toFixed(2)}/kg
                              </div>
                          )}
                      </div>

                      {/* 4. Inventory Health */}
                      <div className="col-span-2 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2">
                           <div className="flex justify-between items-end">
                                <div className="text-lg font-display font-bold text-white leading-none">{item.stock} <span className="text-[10px] text-gray-500 font-sans">pcs (总数)</span></div>
                                <div className={`text-[10px] font-bold ${urgencyText} flex items-center gap-1`}>
                                    {isCritical && <AlertTriangle size={10} />}
                                    {daysOfInventory > 365 ? '>1年' : `${daysOfInventory}天可售`}
                                </div>
                           </div>
                           <div className="flex items-center justify-between gap-1 text-[10px] text-gray-500">
                               <div className="flex items-center gap-1">
                                   <Activity size={10} /> 日销: <span className="text-white font-mono">{item.dailySales || 0}</span>
                               </div>
                           </div>
                           <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                               <div className={`h-full rounded-full ${urgencyColor}`} style={{ width: `${stockProgress}%` }}></div>
                           </div>
                      </div>

                      {/* 5. Procurement Cost / Sales Price */}
                      <div className="col-span-1 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2">
                          <div className="flex flex-col">
                              <span className="text-[9px] text-gray-500 uppercase">采购成本</span>
                              <span className="text-xs font-bold text-white font-mono">${costOfGoods.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[9px] text-gray-500 uppercase">销售价</span>
                              <span className="text-xs font-bold text-neon-green font-mono">${item.financials?.sellingPrice.toFixed(2) || '0.00'}</span>
                          </div>
                      </div>

                      {/* 6. Financials */}
                      <div className="col-span-1 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2">
                          {hasData ? (
                              <div className="flex flex-col gap-2">
                                  <div className="flex flex-col">
                                      <span className="text-[9px] text-gray-500 uppercase">单品利</span>
                                      <span className={`text-[11px] font-bold leading-none ${unitProfit > 0 ? 'text-neon-green' : 'text-neon-pink'}`}>{unitProfit > 0 ? '+' : ''}${unitProfit.toFixed(1)}</span>
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="text-[9px] text-gray-500 uppercase flex items-center gap-1"><TrendingUp size={8} /> 潜在总利</span>
                                      <span className={`text-[11px] font-bold leading-none ${totalPotentialProfit > 0 ? 'text-neon-green' : 'text-neon-pink'}`}>{totalPotentialProfit > 0 ? '+' : ''}${totalPotentialProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                  </div>
                              </div>
                          ) : <span className="text-[10px] text-gray-600">-</span>}
                      </div>

                      {/* 7. Action */}
                      <div className="col-span-2 p-4 h-full flex items-center justify-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); onEditSKU && onEditSKU(item); }} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-blue hover:text-black flex items-center justify-center text-gray-400 transition-colors" title="编辑详情"><Edit3 size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onCloneSKU && onCloneSKU(item); }} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-purple hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="复制 SKU"><Copy size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onDeleteSKU && onDeleteSKU(item.id); }} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-pink hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="删除"><Trash2 size={14} /></button>
                      </div>
                  </div>
                 );
             }))}
      </div>

      {/* PO Creation Modal */}
      {isPOModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
              <div className="w-full max-w-4xl glass-card border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="px-8 py-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <ShoppingCart size={20} className="text-neon-green"/> 生成采购单 (Create Purchase Order)
                      </h3>
                      <button onClick={() => setIsPOModalOpen(false)} className="text-gray-400 hover:text-white"><Trash2 size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      <div className="mb-6 space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">供应商信息</label>
                          <input 
                              value={supplierName} 
                              onChange={(e) => setSupplierName(e.target.value)}
                              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-bold text-lg focus:border-neon-green outline-none"
                          />
                      </div>

                      <table className="w-full text-left">
                          <thead className="bg-white/5 text-[10px] font-bold text-gray-500 uppercase">
                              <tr>
                                  <th className="px-4 py-3">SKU</th>
                                  <th className="px-4 py-3">名称</th>
                                  <th className="px-4 py-3">采购价 ($)</th>
                                  <th className="px-4 py-3">数量 (Qty)</th>
                                  <th className="px-4 py-3 text-right">小计</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {poDraft.map(item => (
                                  <tr key={item.id}>
                                      <td className="px-4 py-3 font-mono text-neon-blue text-xs">{item.sku}</td>
                                      <td className="px-4 py-3 text-xs text-white max-w-[200px] truncate">{item.name}</td>
                                      <td className="px-4 py-3 text-xs text-gray-300">${item.cost}</td>
                                      <td className="px-4 py-3">
                                          <input 
                                              type="number" 
                                              value={item.qty}
                                              onChange={(e) => updatePoQty(item.id, parseInt(e.target.value))}
                                              className="w-20 bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-neon-green"
                                          />
                                      </td>
                                      <td className="px-4 py-3 text-right text-xs font-bold text-white">${(item.cost * item.qty).toLocaleString()}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center">
                      <div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold">预估总成本</div>
                          <div className="text-2xl font-bold text-neon-green">${poTotalCost.toLocaleString()}</div>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => setIsPOModalOpen(false)} className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:text-white">取消</button>
                          <button onClick={handleConfirmPO} className="px-8 py-3 rounded-xl bg-neon-green text-black font-bold text-sm shadow-glow-green hover:scale-105 transition-all flex items-center gap-2">
                              确认下单 <ArrowRight size={16}/>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default RestockModule;