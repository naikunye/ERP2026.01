
import React, { useState } from 'react';
import { Product } from '../types';
import { 
  Search, Plus, Filter, Factory, Truck, Plane, Ship, 
  DollarSign, Package, Edit3, Copy, Trash2, StickyNote, Wallet, ExternalLink,
  Activity, AlertTriangle, TrendingUp, Container, CheckSquare, Square, ShoppingCart, ArrowRight, Scale, ArrowRightCircle, ListTree
} from 'lucide-react';

interface RestockModuleProps {
  products: Product[];
  onEditSKU?: (product: Product) => void;
  onCloneSKU?: (product: Product) => void;
  onDeleteSKU?: (productId: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
  onAddNew?: () => void;
  onCreatePO?: (items: { skuId: string, quantity: number, cost: number }[], supplier: string) => void;
  onSyncToLogistics?: (product: Product) => void; 
}

const RestockModule: React.FC<RestockModuleProps> = ({ products, onEditSKU, onCloneSKU, onDeleteSKU, onDeleteMultiple, onAddNew, onCreatePO, onSyncToLogistics }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  
  const [poDraft, setPoDraft] = useState<{ uniqueKey: string, skuId: string, name: string, sku: string, qty: number, cost: number, isVariant: boolean }[]>([]);
  const [supplierName, setSupplierName] = useState('Default Supplier');

  const filteredData = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LOGISTICS STATUS MAPPING (CHINESE) ---
  const getLogisticsStatusCN = (status: string) => {
      const map: Record<string, string> = {
          'Pending': '待发货',
          'In Production': '生产中',
          'In Transit': '运输中',
          'Customs': '清关中',
          'Out for Delivery': '派送中',
          'Delivered': '已送达',
          'Exception': '异常',
      };
      return map[status] || status;
  };

  // --- STRICT FINANCIAL CORE (MIRRORING SKUDetailEditor) ---
  const getFinancials = (item: Product) => {
      // 1. Core Params
      const rate = item.exchangeRate && item.exchangeRate > 0 ? item.exchangeRate : 7.2;
      const sellingPrice = item.financials?.sellingPrice || item.price || 0;
      
      // 2. Hard Costs (RMB -> USD)
      const unitCostRMB = item.financials?.costOfGoods || 0;
      
      // LOGISTICS LOGIC: Priority = Manual Override > Volumetric Calculation > Unit Weight
      // This ensures list view matches editor even if data wasn't explicitly saved as 'manualChargeableWeight' yet.
      let unitChargeableWeight = item.unitWeight || 0;
      let weightSource = 'Real';

      if (item.logistics?.manualChargeableWeight && item.logistics.manualChargeableWeight > 0.001) {
          unitChargeableWeight = item.logistics.manualChargeableWeight;
          weightSource = 'Manual';
      } else if (item.itemsPerBox && item.boxLength && item.boxWidth && item.boxHeight) {
           const boxVolWeight = (item.boxLength * item.boxWidth * item.boxHeight) / 6000;
           const boxRealWeight = item.boxWeight || 0; 
           const boxChargeable = Math.max(boxVolWeight, boxRealWeight);
           if (item.itemsPerBox > 0) {
               unitChargeableWeight = boxChargeable / item.itemsPerBox;
               weightSource = 'Volumetric';
           }
      }

      const shippingRate = item.logistics?.shippingRate || 0;
      // FORMULA: Unit Shipping RMB = Unit Weight * Rate
      const unitShippingCostRMB = unitChargeableWeight * shippingRate;
      
      const totalHardCostRMB = unitCostRMB + unitShippingCostRMB;
      const totalHardCostUSD = totalHardCostRMB / rate;

      // 3. Soft Costs (USD) - STRICT MODE
      // Ensure we pull from all possible locations
      const platformFee = sellingPrice * ((item.platformCommission || item.financials?.platformFee || 0) / 100);
      const influencerFee = sellingPrice * ((item.influencerCommission || 0) / 100);
      const returnCost = sellingPrice * ((item.returnRate || 0) / 100);
      const fixedFee = item.orderFixedFee || 0;
      const adCost = item.financials?.adCost || item.adCostPerUnit || 0; 
      const otherCost = item.financials?.otherCost || item.otherCost || 0;

      const totalSoftCostUSD = platformFee + influencerFee + fixedFee + adCost + returnCost + otherCost;

      // 4. Profit
      const totalUnitCostUSD = totalHardCostUSD + totalSoftCostUSD;
      const unitProfitUSD = sellingPrice - totalUnitCostUSD;

      return {
          rate,
          costRMB: unitCostRMB, 
          shippingCostRMB_Display: unitShippingCostRMB,
          unitChargeableWeight,
          weightSource,
          totalHardCostRMB,
          unitProfitUSD,
          totalUnitCostUSD
      };
  };

  const totalCapitalRMB = products.reduce((sum, item) => {
      const { totalHardCostRMB } = getFinancials(item);
      return sum + (totalHardCostRMB * item.stock);
  }, 0);

  // ... (Selection Logic) ...
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

  const handleBatchDelete = () => {
      if (onDeleteMultiple && selectedIds.size > 0) {
          onDeleteMultiple(Array.from(selectedIds));
          setSelectedIds(new Set()); 
      }
  };

  // ... (PO Logic) ...
  const handleOpenPO = () => {
      if (selectedIds.size === 0) return;
      const draftItems: typeof poDraft = [];
      const selectedProducts = products.filter(p => selectedIds.has(p.id));

      selectedProducts.forEach(p => {
          const cost = p.financials?.costOfGoods || 0;
          const hasVariantConfig = p.variantRestockMap && Object.keys(p.variantRestockMap).length > 0;
          
          if (hasVariantConfig) {
              Object.entries(p.variantRestockMap!).forEach(([variantSku, qty]) => {
                  if (typeof qty === 'number' && qty > 0) {
                      const variantDef = p.variants?.find(v => v.sku === variantSku);
                      const nameSuffix = variantDef ? `[${variantDef.name}]` : '';
                      draftItems.push({
                          uniqueKey: `${p.id}-${variantSku}`,
                          skuId: p.id,
                          name: `${p.name} ${nameSuffix}`,
                          sku: variantSku,
                          qty: qty,
                          cost: cost,
                          isVariant: true
                      });
                  }
              });
          } 
          
          const alreadyAdded = draftItems.some(i => i.skuId === p.id);
          if (!alreadyAdded) {
              const plannedQty = p.totalRestockUnits || 0;
              draftItems.push({
                  uniqueKey: `${p.id}-MAIN`,
                  skuId: p.id,
                  name: p.name,
                  sku: p.sku,
                  qty: plannedQty > 0 ? plannedQty : 0, 
                  cost: cost,
                  isVariant: false
              });
          }
      });
      
      setPoDraft(draftItems);
      const firstProduct = selectedProducts[0];
      setSupplierName(firstProduct?.supplier || '未指定供应商');
      setIsPOModalOpen(true);
  };

  const handleConfirmPO = () => {
      if (!onCreatePO) return;
      const validItems = poDraft.filter(i => i.qty > 0);
      if (validItems.length === 0) {
          alert("请至少为一个商品输入采购数量");
          return;
      }
      const payload = validItems.map(item => ({ 
          skuId: item.skuId, 
          quantity: item.qty, 
          cost: item.cost,
      }));
      onCreatePO(payload, supplierName);
      setIsPOModalOpen(false);
      setSelectedIds(new Set());
  };

  const updatePoQty = (uniqueKey: string, newQty: number) => {
      setPoDraft(prev => prev.map(item => item.uniqueKey === uniqueKey ? { ...item, qty: Math.max(0, newQty) } : item));
  };

  const poTotalCostRMB = poDraft.reduce((acc, item) => acc + (item.cost * item.qty), 0);

  const getLogisticsIcon = (method?: string) => {
    switch(method) {
      case 'Air': return <Plane size={14} className="text-neon-blue" />;
      case 'Sea': return <Ship size={14} className="text-neon-blue" />;
      default: return <Truck size={14} className="text-gray-500" />;
    }
  };

  const getTrackingUrl = (carrier: string = '', trackingNo: string = '') => {
      if (!trackingNo) return '#';
      const c = carrier.toLowerCase().trim();
      if (c.includes('ups')) return `https://www.ups.com/track?loc=zh_CN&tracknum=${trackingNo}`;
      return `https://www.17track.net/zh-cn/track?nums=${trackingNo}`;
  };

  return (
    <div className="h-full flex flex-col w-full animate-fade-in overflow-hidden">
      
      {/* 1. Header */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-b border-white/10 pb-6 px-2">
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
                    <div className="text-[10px] text-neon-green font-bold uppercase tracking-widest">库存资产总额 (RMB)</div>
                    <div className="text-xl font-display font-bold text-white tracking-wide">
                        <span className="text-neon-green text-sm mr-1">¥</span>
                        {totalCapitalRMB.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                    </div>
                </div>
             </div>
        </div>
      </div>

      {/* 2. Controls */}
      <div className="shrink-0 flex justify-between items-center py-4 bg-[#050510]/80 border-b border-white/5 z-20 px-2">
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
              {selectedIds.size > 0 && (
                  <>
                      <button 
                          onClick={handleOpenPO}
                          className="h-12 px-6 rounded-xl bg-neon-green text-black font-bold text-sm shadow-glow-green hover:scale-105 transition-all flex items-center gap-2 animate-scale-in"
                      >
                          <ShoppingCart size={18} /> 生成采购单 ({selectedIds.size})
                      </button>
                      
                      {onDeleteMultiple && (
                          <button 
                              onClick={handleBatchDelete}
                              className="h-12 px-6 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-bold text-sm transition-all flex items-center gap-2 animate-scale-in"
                          >
                              <Trash2 size={18} /> 批量删除
                          </button>
                      )}
                  </>
              )}
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

      {/* 3. The List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative px-2 min-h-0 bg-[#050510]">
          
          <div className="sticky top-0 bg-[#050510] z-30 grid grid-cols-12 px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-12 border-b border-white/5 mb-2">
              <div className="col-span-3">SKU / 入库信息</div>
              <div className="col-span-2">产品详情 / 箱规</div>
              <div className="col-span-2">物流状态</div>
              <div className="col-span-2">库存 / 计划补货量</div>
              <div className="col-span-1">硬成本 (RMB)</div>
              <div className="col-span-1">利润分析 (USD)</div>
              <div className="col-span-1 text-center">操作</div>
          </div>

          <div className="absolute top-[12px] left-4 z-40" title="全选">
              <button onClick={handleSelectAll} className="text-gray-500 hover:text-white">
                  {selectedIds.size === filteredData.length && filteredData.length > 0 ? <CheckSquare size={20} className="text-neon-blue"/> : <Square size={20}/>}
              </button>
          </div>

          <div className="space-y-3 pb-10">
          {filteredData.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                  暂无数据，请点击右上角新建 SKU
              </div>
          ) : (
             filteredData.map((item) => {
                 // EXACT Calculation Call
                 const { unitProfitUSD, costRMB, shippingCostRMB_Display, totalHardCostRMB, unitChargeableWeight, weightSource } = getFinancials(item);
                 
                 const hasData = !!item.financials;
                 const trackingUrl = getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo);
                 const isSelected = selectedIds.has(item.id);
                 const variantCount = item.variants?.length || 0;
                 const plannedRestock = item.totalRestockUnits || 0;
                 
                 // Total Profit Calculation
                 const totalProfitUSD = unitProfitUSD * plannedRestock;
                 
                 // Progress Calculation (Current vs Total)
                 const totalPotentialStock = item.stock + plannedRestock;
                 const stockPercentage = totalPotentialStock > 0 ? (item.stock / totalPotentialStock) * 100 : 0;

                 return (
                  <div key={item.id} onClick={() => onEditSKU && onEditSKU(item)} className={`glass-card grid grid-cols-12 items-center p-0 min-h-[110px] hover:border-white/20 transition-all group relative overflow-visible cursor-pointer ${isSelected ? 'border-neon-blue/30 bg-neon-blue/5' : ''}`}>
                      
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10" onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}>
                          {isSelected ? <CheckSquare size={20} className="text-neon-blue" /> : <Square size={20} className="text-gray-600 hover:text-gray-400" />}
                      </div>

                      {/* 1. Identity */}
                      <div className="col-span-3 p-4 pl-12 border-r border-white/5 h-full flex flex-col justify-center gap-1.5 relative">
                          <div className="font-mono text-neon-blue font-bold text-sm flex items-center gap-2">
                              {item.sku}
                              {variantCount > 0 && <span className="text-[9px] bg-neon-purple/20 text-neon-purple px-1.5 rounded border border-neon-purple/30 flex items-center gap-1"><ListTree size={10}/> {variantCount} Vars</span>}
                          </div>
                          {item.inboundId ? (
                              <div className="flex items-start gap-1.5 text-[10px] text-gray-400 w-full mt-1">
                                  <Container size={10} className="shrink-0 mt-[2px]" />
                                  <span className="font-mono tracking-wide">{item.inboundId}</span>
                              </div>
                          ) : <div className="text-[9px] text-gray-600 italic mt-1">无入库单</div>}
                      </div>

                      {/* 2. Product Detail */}
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
                          <div className="flex gap-2 text-[9px] text-gray-400 bg-black/20 p-1.5 rounded border border-white/5">
                              <span>装箱: <strong className="text-white">{item.itemsPerBox || 0}</strong> pcs</span>
                              <span>| 箱数: <strong className="text-white">{item.restockCartons || 0}</strong></span>
                          </div>
                      </div>

                      {/* 3. Logistics */}
                      <div className="col-span-2 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2 relative">
                          {item.logistics ? (
                              <>
                                <div className="flex items-center gap-2 text-white font-bold text-xs">
                                    {getLogisticsIcon(item.logistics.method)}
                                    <span className={item.logistics.status === 'In Transit' ? 'text-neon-blue' : ''}>{getLogisticsStatusCN(item.logistics.status)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-[10px] text-gray-500 font-mono truncate max-w-[80px]" title={item.logistics.trackingNo}>{item.logistics.trackingNo || 'No Track'}</div>
                                    {item.logistics.trackingNo && (
                                        <div className="flex gap-1">
                                            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-gray-500 hover:text-white" title="查询轨迹">
                                                <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                              </>
                          ) : <div className="text-[10px] text-gray-600 italic">暂无物流</div>}
                          
                          {/* Unit Chargeable Weight Indicator */}
                          {unitChargeableWeight > 0 && (
                              <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
                                  <Scale size={8}/> 计费重: {unitChargeableWeight.toFixed(3)}kg
                                  {weightSource === 'Volumetric' && <span className="text-[8px] bg-white/10 px-1 rounded text-gray-400">材积</span>}
                                  {weightSource === 'Manual' && <span className="text-[8px] bg-neon-purple/20 text-neon-purple px-1 rounded border border-neon-purple/30">锁定</span>}
                              </div>
                          )}
                      </div>

                      {/* 4. Inventory Plan (Refactored) */}
                      <div className="col-span-2 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-3">
                           <div className="flex justify-between items-center text-[11px]">
                               <span className="text-gray-400">现货库存:</span>
                               <span className="text-white font-bold text-sm">{item.stock}</span>
                           </div>
                           <div className="space-y-1.5">
                               <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                   <div className={`h-full ${plannedRestock > 0 ? 'bg-gradient-neon-blue' : 'bg-gray-500'}`} style={{ width: `${Math.max(5, stockPercentage)}%` }}></div>
                               </div>
                               <div className="flex justify-between text-[9px] text-gray-500">
                                   <span>Inventory</span>
                                   <span>补货: <strong className="text-neon-green">{plannedRestock}</strong></span>
                               </div>
                           </div>
                      </div>

                      {/* 5. Cost Structure */}
                      <div className="col-span-1 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-1">
                          <div className="flex justify-between items-center">
                              <span className="text-[9px] text-gray-500">采购</span>
                              <span className="text-[10px] font-bold text-white font-mono">¥{costRMB.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-[9px] text-gray-500">头程</span>
                              <span className={`text-[10px] font-bold font-mono ${shippingCostRMB_Display > 0 ? 'text-neon-blue' : 'text-gray-400'}`}>
                                  ¥{shippingCostRMB_Display.toFixed(1)}
                              </span>
                          </div>
                          <div className="h-px w-full bg-white/10 my-1"></div>
                          <div className="flex justify-between items-center" title="Hard Cost Only">
                              <span className="text-[9px] text-neon-yellow font-bold">硬成本</span>
                              <span className="text-xs font-bold text-neon-yellow font-mono">¥{totalHardCostRMB.toFixed(1)}</span>
                          </div>
                      </div>

                      {/* 6. Profit Analysis (Unit & Total) */}
                      <div className="col-span-1 p-4 border-r border-white/5 h-full flex flex-col justify-center gap-2">
                          {hasData ? (
                              <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                      <span className="text-[9px] text-gray-500">单品</span>
                                      <span className={`text-[10px] font-bold font-mono ${unitProfitUSD > 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
                                          {unitProfitUSD > 0 ? '+' : ''}${unitProfitUSD.toFixed(2)}
                                      </span>
                                  </div>
                                  <div className="flex justify-between items-center bg-white/5 px-1.5 py-1 rounded">
                                      <span className="text-[9px] text-gray-400 font-bold uppercase">总计 (Est)</span>
                                      <span className={`text-[11px] font-bold font-mono ${totalProfitUSD > 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
                                          ${totalProfitUSD.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                      </span>
                                  </div>
                              </div>
                          ) : <span className="text-[10px] text-gray-600 text-center">-</span>}
                      </div>

                      {/* 7. Action */}
                      <div className="col-span-1 p-4 h-full flex items-center justify-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); onEditSKU && onEditSKU(item); }} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-blue hover:text-black flex items-center justify-center text-gray-400 transition-colors" title="编辑详情"><Edit3 size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onCloneSKU && onCloneSKU(item); }} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-purple hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="复制 SKU"><Copy size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onDeleteSKU && onDeleteSKU(item.id); }} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-neon-pink hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="删除"><Trash2 size={14} /></button>
                      </div>
                  </div>
                 );
             }))}
          </div>
      </div>

      {/* PO Creation Modal */}
      {isPOModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
              <div className="w-full max-w-5xl glass-card border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
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
                                  <th className="px-4 py-3">产品名称 / 变体</th>
                                  <th className="px-4 py-3">采购价 (¥)</th>
                                  <th className="px-4 py-3">下单数量 (Qty)</th>
                                  <th className="px-4 py-3 text-right">小计 (¥)</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {poDraft.length === 0 ? (
                                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">无有效采购项，请检查“补货数量”配置</td></tr>
                              ) : poDraft.map(item => (
                                  <tr key={item.uniqueKey} className={item.qty === 0 ? "opacity-50" : ""}>
                                      <td className="px-4 py-3 font-mono text-neon-blue text-xs align-middle">
                                          {item.sku}
                                      </td>
                                      <td className="px-4 py-3 align-middle">
                                          <div className="text-xs text-white max-w-[250px] truncate">{item.name}</div>
                                          {item.isVariant && <div className="text-[9px] text-neon-purple mt-0.5">Variant Line</div>}
                                      </td>
                                      <td className="px-4 py-3 text-xs text-gray-300 align-middle">¥{item.cost}</td>
                                      <td className="px-4 py-3 align-middle">
                                          <input 
                                              type="number" 
                                              value={item.qty}
                                              onChange={(e) => updatePoQty(item.uniqueKey, parseInt(e.target.value) || 0)}
                                              className={`w-24 bg-black/30 border rounded px-2 py-1 text-white text-xs outline-none focus:border-neon-green font-bold ${item.qty === 0 ? 'border-red-500/50 text-red-500' : 'border-white/10'}`}
                                          />
                                      </td>
                                      <td className="px-4 py-3 text-right text-xs font-bold text-white align-middle">¥{(item.cost * item.qty).toLocaleString()}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center">
                      <div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold">预估总成本 (RMB)</div>
                          <div className="text-2xl font-bold text-neon-green">¥{poTotalCostRMB.toLocaleString()}</div>
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
