
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Currency } from '../types';
import { 
  X, Save, History, Box, Layers, Truck, 
  DollarSign, TrendingUp, Calculator, Package, 
  Scale, Anchor, Globe, Share2, AlertCircle, Trash2, FileText, CheckCircle2, Clock,
  RefreshCcw, ArrowRightLeft
} from 'lucide-react';
import ImageUpload from './ImageUpload';

interface SKUDetailEditorProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: any) => void;
  onDelete?: () => void;
  onChangeView?: (view: string) => void; 
}

// Complex Interface for the detailed form state
interface SKUFormData {
  // Remark Field
  note: string;
  imageUrl?: string; 

  // M1: Product & Supply Chain
  lifecycle: 'Growing' | 'Stable' | 'Declining';
  leadTimeProduction: number;
  leadTimeShipping: number;
  safetyStockDays: number;
  restockDate: string;

  // M2: Procurement (CRM)
  supplierName: string;
  supplierContact: string;
  unitCost: number; // NOW: Treated as RMB/Base Currency
  unitWeight: number; 
  dailySales: number;

  // M3: Boxing & Inbound
  boxLength: number; 
  boxWidth: number;
  boxHeight: number;
  boxWeight: number; 
  itemsPerBox: number;
  restockCartons: number;
  totalRestockUnits: number; 
  inboundId: string;
  inboundStatus: 'Pending' | 'Received'; 

  // M4: First Leg Logistics
  transportMethod: 'Air' | 'Sea' | 'Rail' | 'Truck';
  carrier: string;
  trackingNo: string;
  shippingRate: number; // NOW: Treated as RMB/kg
  manualChargeableWeight: number; // NEW: Manual Override
  destinationWarehouse: string;

  // M5: TikTok Cost Structure
  sellingPrice: number; // USD
  platformCommission: number; // %
  influencerCommission: number; // %
  orderFixedFee: number; // $
  returnRate: number; // %
  lastMileShipping: number; // $
  adCostPerUnit: number; // $

  // NEW: Exchange Rate
  exchangeRate: number; 
}

const SKUDetailEditor: React.FC<SKUDetailEditorProps> = ({ product, onClose, onSave, onDelete, onChangeView }) => {
  
  // Initialize with product data + defaults for missing fields
  const [formData, setFormData] = useState<SKUFormData>({
    note: product.note || '',
    imageUrl: product.imageUrl,
    lifecycle: 'Growing',
    leadTimeProduction: 15,
    leadTimeShipping: 30,
    safetyStockDays: 14,
    restockDate: product.restockDate || new Date().toISOString().split('T')[0],
    supplierName: product.supplier || '未指定供应商',
    supplierContact: '', 
    unitCost: product.financials?.costOfGoods || 0,
    unitWeight: product.unitWeight || 0.5,
    dailySales: product.dailySales || 0,
    boxLength: product.boxLength || 50,
    boxWidth: product.boxWidth || 40,
    boxHeight: product.boxHeight || 30,
    boxWeight: product.boxWeight || 12,
    itemsPerBox: product.itemsPerBox || 24,
    restockCartons: product.restockCartons || 10,
    // CRITICAL FIX: Prioritize stored 'totalRestockUnits' if available, else auto-calculate
    totalRestockUnits: product.totalRestockUnits || ((product.restockCartons || 10) * (product.itemsPerBox || 24)),
    inboundId: product.inboundId || `IB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    inboundStatus: product.inboundStatus || 'Pending', 
    transportMethod: product.logistics?.method || 'Sea',
    carrier: product.logistics?.carrier || '',
    trackingNo: product.logistics?.trackingNo || '',
    shippingRate: product.logistics?.shippingRate || 12, // Default typically higher in RMB
    manualChargeableWeight: product.logistics?.manualChargeableWeight || 0, 
    destinationWarehouse: product.logistics?.destination || '',
    
    // Financials
    sellingPrice: product.financials?.sellingPrice || product.price,
    platformCommission: product.platformCommission ?? 2,
    influencerCommission: product.influencerCommission ?? 15,
    orderFixedFee: product.orderFixedFee ?? 0.3,
    returnRate: product.returnRate ?? 3,
    lastMileShipping: product.lastMileShipping ?? 0,
    adCostPerUnit: product.financials?.adCost || 2,

    // Exchange Rate (Default 7.2 if not set previously)
    exchangeRate: (product as any).exchangeRate || 7.2
  });

  // --- Real-time Calculations ---
  const metrics = useMemo(() => {
    // Exchange Rate Safety
    const rate = formData.exchangeRate || 7.2;

    // 1. Inventory Analysis
    const totalRestockUnits = formData.totalRestockUnits;
    const currentAvailableDays = Math.floor(product.stock / (formData.dailySales || 1));
    
    // 2. Logistics Calcs (RMB Logic)
    const singleBoxVol = (formData.boxLength * formData.boxWidth * formData.boxHeight) / 6000; 
    const totalVolWeight = singleBoxVol * formData.restockCartons;
    const totalRealWeight = formData.boxWeight * formData.restockCartons;
    
    // Auto-calculated weight
    const autoChargeableWeight = Math.max(totalVolWeight, totalRealWeight);
    
    // FINAL Chargeable Weight (Use manual if set, otherwise auto)
    const chargeableWeight = formData.manualChargeableWeight > 0 ? formData.manualChargeableWeight : autoChargeableWeight;
    
    // Shipping Cost (RMB)
    const totalShippingCostRMB = chargeableWeight * formData.shippingRate;
    const unitShippingCostRMB = totalRestockUnits > 0 ? totalShippingCostRMB / totalRestockUnits : 0;
    
    // CONVERT TO USD (This is the Source of Truth)
    const unitShippingCostUSD = unitShippingCostRMB / rate;
    
    // Cost of Goods (USD)
    const unitCostUSD = formData.unitCost / rate;

    // 3. Profit Analysis (USD Base)
    const revenue = formData.sellingPrice;
    
    // Fees (USD)
    const platformFee = revenue * (formData.platformCommission / 100);
    const influencerFee = revenue * (formData.influencerCommission / 100);
    const estimatedReturnCost = revenue * (formData.returnRate / 100);
    
    // Total Unit Cost (USD)
    // Formula: (Purchase(RMB) / Rate) + (Shipping(RMB) / Rate) + SalesFees(USD)
    const totalUnitCostUSD = 
        unitCostUSD + 
        unitShippingCostUSD + 
        platformFee + 
        influencerFee + 
        formData.orderFixedFee + 
        formData.lastMileShipping + 
        estimatedReturnCost + 
        formData.adCostPerUnit;

    const unitProfit = revenue - totalUnitCostUSD;
    const netMargin = revenue > 0 ? (unitProfit / revenue) * 100 : 0;
    const totalStockProfit = unitProfit * product.stock;

    return {
      totalRestockUnits,
      currentAvailableDays,
      chargeableWeight,
      autoChargeableWeight, // Export for placeholder reference
      totalShippingCostRMB,
      unitShippingCostRMB,
      unitShippingCostUSD, // Exported for display and SAVING
      unitCostUSD,         // Exported for display
      totalUnitCostUSD,
      unitProfit,
      netMargin,
      totalStockProfit,
      cbm: (formData.boxLength * formData.boxWidth * formData.boxHeight * formData.restockCartons) / 1000000,
      rate,
      
      breakdown: {
          platformFee,
          influencerFee,
          estimatedReturnCost
      }
    };
  }, [formData, product.stock]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numVal = e.target.type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => {
        const updates: any = { [name]: numVal };
        
        if (name === 'restockCartons') {
            updates.totalRestockUnits = (numVal as number) * prev.itemsPerBox;
        }
        if (name === 'itemsPerBox') {
            updates.totalRestockUnits = prev.restockCartons * (numVal as number);
        }

        return { ...prev, ...updates };
    });
  };

  const handleSave = () => {
      // Force sync the calculated shipping cost
      onSave({
          ...formData,
          unitShippingCost: metrics.unitShippingCostUSD, // CRITICAL: This overwrites any stale value
          exchangeRate: formData.exchangeRate 
      });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-[95vw] h-[92vh] glass-card flex flex-col border-white/20 shadow-2xl relative overflow-hidden">
        
        {/* --- Header --- */}
        <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-white/5 backdrop-blur-xl z-20">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center text-neon-blue">
                <Box size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                编辑：{product.name}
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-gray-400 border border-white/10 font-mono">
                    {product.sku}
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                 <AlertCircle size={12} className="text-neon-blue"/> 
                 采购与头程运费为人民币，销售为美金，系统自动根据汇率折算。
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             <button className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 text-xs font-bold flex items-center gap-2 transition-all">
                <History size={14} /> 历史记录
             </button>
             <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white transition-all">
                <X size={20} />
             </button>
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="flex-1 overflow-y-auto p-6 bg-transparent custom-scrollbar">
          <div className="grid grid-cols-12 gap-6 pb-20">
            
            {/* Left Column (Product, CRM, Boxing) */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* Module 1: Product & Supply Chain */}
                <section className="glass-card p-6 border-l-4 border-l-neon-purple group hover:border-white/20 transition-all">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Layers size={16} className="text-neon-purple" /> 产品与供应链
                    </h3>
                    <div className="flex gap-4 mb-6">
                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            <ImageUpload 
                                currentImage={formData.imageUrl || product.imageUrl}
                                onImageChange={(url) => setFormData(p => ({...p, imageUrl: url}))}
                                productName={product.name}
                            />
                        </div>
                        <div className="space-y-4 flex-1">
                             <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                                    <FileText size={10} /> 备注 (Remark)
                                </label>
                                <textarea 
                                    name="note" 
                                    value={formData.note} 
                                    onChange={handleChange} 
                                    className="w-full h-16 bg-white/5 border border-white/10 rounded-lg text-xs p-2 text-neon-yellow outline-none resize-none focus:border-neon-yellow/50 focus:bg-white/10 placeholder-gray-600" 
                                    placeholder="输入关于此 SKU 的重要备注..."
                                />
                             </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold">生命周期</label>
                            <select 
                                name="lifecycle"
                                value={formData.lifecycle}
                                onChange={handleChange}
                                className="w-full h-8 bg-white/5 border border-white/10 rounded-lg text-xs px-2 text-white outline-none focus:border-neon-purple"
                            >
                                <option value="Growing">上升期 🚀</option>
                                <option value="Stable">平稳期 ⚓</option>
                                <option value="Declining">衰退期 📉</option>
                            </select>
                        </div>
                        <InputGroup label="备货日期" name="restockDate" value={formData.restockDate} type="date" onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <InputGroup label="生产(天)" name="leadTimeProduction" value={formData.leadTimeProduction} onChange={handleChange} />
                        <InputGroup label="运输(天)" name="leadTimeShipping" value={formData.leadTimeShipping} onChange={handleChange} />
                        <InputGroup label="安库(天)" name="safetyStockDays" value={formData.safetyStockDays} onChange={handleChange} />
                    </div>
                </section>

                {/* Module 2: Procurement CRM */}
                <section className="glass-card p-6 border-l-4 border-l-neon-blue group hover:border-white/20 transition-all">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Globe size={16} className="text-neon-blue" /> 采购与供应商
                    </h3>
                    <div className="space-y-4">
                        <InputGroup label="供应商名称" name="supplierName" value={formData.supplierName} type="text" onChange={handleChange} />
                        <InputGroup label="联系方式" name="supplierContact" value={formData.supplierContact} type="text" onChange={handleChange} />
                        
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                            {/* Updated Label to show currency explicitly */}
                            <InputGroup 
                                label="采购单价 (¥ CNY)" 
                                name="unitCost" 
                                value={formData.unitCost} 
                                highlight="text-neon-blue" 
                                onChange={handleChange} 
                            />
                            <InputGroup label="单件重量 (kg)" name="unitWeight" value={formData.unitWeight} onChange={handleChange} />
                        </div>
                        {/* Exchange Preview */}
                        <div className="text-[10px] text-gray-500 text-right -mt-2">
                            ≈ ${metrics.unitCostUSD.toFixed(2)} USD
                        </div>
                        
                        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between border border-white/5">
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">日均销量 (件/天)</label>
                                <input 
                                    type="number"
                                    name="dailySales"
                                    value={formData.dailySales}
                                    onChange={handleChange}
                                    className="bg-transparent border-b border-white/20 w-24 text-lg font-bold text-white outline-none focus:border-neon-blue"
                                />
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 font-bold uppercase">库存周转天数</div>
                                <div className={`text-lg font-bold ${metrics.currentAvailableDays < 20 ? 'text-neon-pink' : 'text-neon-green'}`}>
                                    {metrics.currentAvailableDays} <span className="text-xs text-gray-600">天</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Module 3: Boxing */}
                <section className="glass-card p-6 border-l-4 border-l-gray-500 group hover:border-white/20 transition-all">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Package size={16} className="text-gray-300" /> 装箱与入库
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <InputGroup label="长 (cm)" name="boxLength" value={formData.boxLength} onChange={handleChange} />
                        <InputGroup label="宽 (cm)" name="boxWidth" value={formData.boxWidth} onChange={handleChange} />
                        <InputGroup label="高 (cm)" name="boxHeight" value={formData.boxHeight} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                         <InputGroup label="单箱重量 (kg)" name="boxWeight" value={formData.boxWeight} onChange={handleChange} />
                         <InputGroup label="单箱数量" name="itemsPerBox" value={formData.itemsPerBox} onChange={handleChange} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 mb-4">
                         <InputGroup label="补货箱数 (ctns)" name="restockCartons" value={formData.restockCartons} highlight="text-white bg-white/10 rounded px-2" onChange={handleChange} />
                         
                         {/* Total Restock Units as Input */}
                         <div className="space-y-1 w-full">
                            <label className="text-[10px] text-neon-yellow font-bold uppercase flex items-center gap-1">
                                总数量 (pcs) <span className="text-[9px] font-normal opacity-70">非标可改</span>
                            </label>
                            <input 
                                type="number" 
                                name="totalRestockUnits"
                                value={formData.totalRestockUnits}
                                onChange={handleChange}
                                className="w-full h-10 bg-black/40 border border-neon-yellow/30 rounded-lg px-3 text-sm text-neon-yellow font-bold outline-none focus:border-neon-yellow transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* INBOUND ID + STATUS SELECTOR */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <InputGroup label="入库单号 (Inbound ID)" name="inboundId" value={formData.inboundId} type="text" onChange={handleChange} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase">状态</label>
                                <select 
                                    name="inboundStatus"
                                    value={formData.inboundStatus}
                                    onChange={handleChange}
                                    className={`w-full h-10 bg-white/5 border border-white/10 rounded-lg px-2 text-xs font-bold text-white outline-none focus:border-white/30 ${
                                        formData.inboundStatus === 'Received' ? 'text-neon-green border-neon-green/30' : 'text-neon-yellow border-neon-yellow/30'
                                    }`}
                                >
                                    <option value="Pending" className="text-gray-900 bg-gray-200">⏳ 待入库</option>
                                    <option value="Received" className="text-gray-900 bg-gray-200">✅ 已入库</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex gap-4 text-[10px] font-mono text-gray-500 bg-black/20 p-2 rounded-lg justify-between">
                            <span>总体积: {metrics.cbm.toFixed(2)} m³</span>
                            <span>{formData.totalRestockUnits !== formData.restockCartons * formData.itemsPerBox ? '(非标准装箱)' : '(标准装箱)'}</span>
                        </div>
                    </div>
                </section>

            </div>

            {/* Middle Column (Logistics, Market) */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* Module 4: Logistics */}
                <section className="glass-card p-6 border-l-4 border-l-neon-yellow group hover:border-white/20 transition-all">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Truck size={16} className="text-neon-yellow" /> 头程物流
                    </h3>
                    <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold">运输方式</label>
                                <div className="flex p-1 bg-white/5 rounded-lg border border-white/10">
                                    <button 
                                        onClick={() => setFormData(p => ({...p, transportMethod: 'Air'}))}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded ${formData.transportMethod === 'Air' ? 'bg-neon-blue text-black' : 'text-gray-500'}`}
                                    >空运</button>
                                    <button 
                                        onClick={() => setFormData(p => ({...p, transportMethod: 'Sea'}))}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded ${formData.transportMethod === 'Sea' ? 'bg-neon-blue text-black' : 'text-gray-500'}`}
                                    >海运</button>
                                </div>
                             </div>
                             <InputGroup label="承运商" name="carrier" value={formData.carrier} type="text" onChange={handleChange} />
                         </div>
                         <InputGroup label="运单号" name="trackingNo" value={formData.trackingNo} type="text" placeholder="待定..." onChange={handleChange} />
                         
                         <div className="p-4 bg-neon-yellow/5 border border-neon-yellow/10 rounded-xl space-y-3">
                             <div className="grid grid-cols-2 gap-4">
                                 {/* Explicit Label Change to CNY */}
                                 <InputGroup 
                                    label="头程运费单价 (¥/kg)" 
                                    name="shippingRate" 
                                    value={formData.shippingRate} 
                                    onChange={handleChange} 
                                 />
                                 
                                 {/* NEW: Manual Chargeable Weight Input */}
                                 <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                                        计费总重 (kg) 
                                        <span className="text-[9px] font-normal text-gray-600 bg-white/10 px-1 rounded" title="根据材积计算的理论值">
                                            Auto: {metrics.autoChargeableWeight.toFixed(1)}
                                        </span>
                                    </label>
                                    <input 
                                        type="number"
                                        name="manualChargeableWeight"
                                        value={formData.manualChargeableWeight || ''}
                                        onChange={handleChange}
                                        placeholder={metrics.autoChargeableWeight.toFixed(1)}
                                        className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white font-mono outline-none focus:border-neon-yellow transition-colors placeholder-gray-600"
                                    />
                                 </div>
                             </div>
                             
                             {/* Preview exchange */}
                             <div className="text-[10px] text-gray-500 text-left -mt-2">
                                ≈ ${metrics.unitShippingCostUSD.toFixed(2)} USD /件
                             </div>

                             <div className="pt-2 border-t border-neon-yellow/10 flex justify-between items-center">
                                 <span className="text-xs font-bold text-neon-yellow">总运费 (RMB)</span>
                                 <span className="text-lg font-bold text-white font-display">¥{metrics.totalShippingCostRMB.toFixed(2)}</span>
                             </div>
                         </div>
                         
                         <InputGroup label="目的仓" name="destinationWarehouse" value={formData.destinationWarehouse} type="text" onChange={handleChange} />
                    </div>
                </section>

                {/* Module 5: TikTok Cost Structure (UPDATED) */}
                <section className="glass-card p-6 border-l-4 border-l-neon-pink group hover:border-white/20 transition-all">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Share2 size={16} className="text-neon-pink" /> TIKTOK COST STRUCTURE
                    </h3>
                    
                    <div className="space-y-5">
                         {/* Sales Price */}
                         <div className="flex items-center gap-4">
                              <InputGroup label="销售价 (USD $)" name="sellingPrice" value={formData.sellingPrice} highlight="text-neon-green text-xl" onChange={handleChange} />
                              <button 
                                onClick={() => { if (onChangeView) { onClose(); onChangeView('market_radar'); } }}
                                className="h-10 px-3 mt-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2 transition-all"
                              >
                                 <Anchor size={14}/> 竞品
                              </button>
                         </div>
                         
                         <div className="pt-2 space-y-4">
                             {/* Row 1: Commissions */}
                             <div className="grid grid-cols-2 gap-4">
                                 <InputGroup label="平台佣金 (%)" name="platformCommission" value={formData.platformCommission} onChange={handleChange} />
                                 <InputGroup label="达人佣金 (%)" name="influencerCommission" value={formData.influencerCommission} onChange={handleChange} />
                             </div>
                             
                             {/* Row 2: Fixed Fee */}
                             <InputGroup label="每单固定费 ($)" name="orderFixedFee" value={formData.orderFixedFee} onChange={handleChange} />

                             {/* Row 3: Return & Last Mile */}
                             <div className="grid grid-cols-2 gap-4">
                                 <InputGroup label="预估退货率 (%)" name="returnRate" value={formData.returnRate} onChange={handleChange} />
                                 <InputGroup label="尾程派送费 ($)" name="lastMileShipping" value={formData.lastMileShipping} onChange={handleChange} />
                             </div>

                             {/* Row 4: Ads */}
                             <InputGroup label="预估广告费 ($)" name="adCostPerUnit" value={formData.adCostPerUnit} onChange={handleChange} />
                         </div>
                    </div>
                </section>

            </div>

            {/* Right Column (Profit Analysis) - Sticky */}
            <div className="col-span-12 lg:col-span-4 relative">
                
                {/* Module 6: Profit Analysis */}
                <div className="sticky top-0 space-y-6">
                    <section className="glass-card p-8 border border-neon-green/30 shadow-[0_0_30px_rgba(0,255,157,0.1)] relative overflow-hidden">
                        {/* Background Effect */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-neon-green opacity-10 blur-[50px] pointer-events-none"></div>

                        {/* NEW: Exchange Rate Input */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1 border border-white/10 z-20">
                            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><ArrowRightLeft size={10}/> 汇率</span>
                            <input 
                                type="number"
                                name="exchangeRate"
                                value={formData.exchangeRate}
                                onChange={handleChange}
                                className="w-12 bg-transparent text-xs font-bold text-white text-right outline-none focus:text-neon-blue"
                            />
                        </div>

                        <h3 className="text-sm font-bold text-neon-green uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
                            <Calculator size={16} /> 单品利润分析 (USD)
                        </h3>

                        <div className="relative z-10 text-center space-y-2 mb-10">
                             <div className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">单品净利</div>
                             <div className="text-[56px] font-display font-bold text-white leading-none tracking-tight flex items-center justify-center gap-1">
                                 <span className="text-2xl text-neon-green mt-2">$</span>
                                 {metrics.unitProfit.toFixed(2)}
                             </div>
                             
                             {/* ADDED: Total Profit */}
                             <div className="text-sm font-bold text-neon-green/80 flex items-center justify-center gap-2 mt-2">
                                <span>总利润预测:</span>
                                <span>+${metrics.totalStockProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                             </div>

                             <div className={`text-sm font-bold inline-flex items-center gap-1 px-3 py-1 mt-3 rounded-full ${metrics.netMargin > 15 ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-pink/10 text-neon-pink'}`}>
                                 <TrendingUp size={12} />
                                 {metrics.netMargin.toFixed(1)}% 净利率
                             </div>
                        </div>

                        <div className="space-y-4 border-t border-white/10 pt-6 relative z-10">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">营收</span>
                                <span className="text-white font-bold">${formData.sellingPrice.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between text-xs">
                                <span className="text-gray-500">总成本 (USD折算)</span>
                                <span className="text-neon-pink font-bold">-${metrics.totalUnitCostUSD.toFixed(2)}</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden w-full">
                                <div className="h-full bg-neon-pink" style={{ width: `${Math.min((metrics.totalUnitCostUSD / formData.sellingPrice) * 100, 100)}%` }}></div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="mt-8 grid grid-cols-2 gap-2">
                             <CostItem label={`货值 (¥${formData.unitCost})`} value={metrics.unitCostUSD} color="bg-blue-500" />
                             <CostItem label="头程运费" value={metrics.unitShippingCostUSD} color="bg-yellow-500" />
                             <CostItem label="平台/达人佣金" value={metrics.breakdown.platformFee + metrics.breakdown.influencerFee} color="bg-purple-500" />
                             <CostItem label="尾程/定费" value={formData.lastMileShipping + formData.orderFixedFee} color="bg-orange-500" />
                             <CostItem label="广告/退货" value={formData.adCostPerUnit + metrics.breakdown.estimatedReturnCost} color="bg-red-500" />
                        </div>
                    </section>
                    
                    {/* Total Stock Profit */}
                    <section className="glass-card p-6 flex items-center justify-between border-white/10">
                        <div>
                             <div className="text-[10px] text-gray-500 font-bold uppercase">库存总货值 (USD)</div>
                             <div className="text-xl font-bold text-white">${(metrics.totalUnitCostUSD * product.stock).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] text-gray-500 font-bold uppercase">潜在总利润</div>
                             <div className="text-xl font-bold text-neon-green">+${metrics.totalStockProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="grid grid-cols-4 gap-3">
                         <button 
                             onClick={onDelete}
                             className="col-span-1 py-4 bg-white/5 border border-white/10 hover:bg-neon-pink/20 hover:border-neon-pink text-gray-400 hover:text-neon-pink rounded-xl flex items-center justify-center transition-all"
                             title="删除此 SKU"
                         >
                             <Trash2 size={20} />
                         </button>
                         <button 
                            onClick={handleSave}
                            className="col-span-3 py-4 bg-gradient-neon-green text-black rounded-xl font-bold text-sm shadow-glow-green hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> 保存配置
                        </button>
                    </div>
                </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InputGroup = ({ label, name, value, onChange, type="number", highlight="", placeholder="" }: any) => (
    <div className="space-y-1 w-full">
        <label className="text-[10px] text-gray-500 font-bold uppercase">{label}</label>
        <input 
            type={type} 
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white outline-none focus:border-white/30 transition-colors ${highlight}`}
        />
    </div>
);

const CostItem = ({ label, value, color }: any) => (
    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
        <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
            <span className="text-[10px] text-gray-400 truncate">{label}</span>
        </div>
        <div className="text-xs font-bold text-white">${value.toFixed(2)}</div>
    </div>
)

export default SKUDetailEditor;
