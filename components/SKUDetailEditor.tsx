
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Currency, ProductVariant } from '../types';
import { 
  X, Save, History, Box, Layers, Truck, 
  DollarSign, TrendingUp, Calculator, Package, 
  Scale, Anchor, Globe, Share2, AlertCircle, Trash2, FileText, CheckCircle2, Clock,
  RefreshCcw, ArrowRightLeft, LayoutGrid, ChevronDown, ChevronUp, Edit3, Plus, HelpCircle,
  Container, Sigma
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import ImageUpload from './ImageUpload';

interface SKUDetailEditorProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: any) => void;
  onDelete?: () => void;
  onChangeView?: (view: string) => void; 
}

interface SKUFormData {
  name: string;
  variants: ProductVariant[];
  note: string;
  imageUrl?: string; 
  lifecycle: 'Growing' | 'Stable' | 'Declining';
  leadTimeProduction: number;
  leadTimeShipping: number;
  safetyStockDays: number;
  restockDate: string;
  supplierName: string;
  supplierContact: string;
  unitCost: number; 
  unitWeight: number; 
  dailySales: number;
  boxLength: number; 
  boxWidth: number;
  boxHeight: number;
  boxWeight: number; 
  itemsPerBox: number;
  restockCartons: number;
  totalRestockUnits: number; 
  variantRestockMap: Record<string, number>; 
  inboundId: string;
  inboundStatus: 'Pending' | 'Received'; 
  transportMethod: 'Air' | 'Sea' | 'Rail' | 'Truck';
  carrier: string;
  trackingNo: string;
  shippingRate: number; 
  manualChargeableWeight: number; 
  destinationWarehouse: string;
  sellingPrice: number; 
  platformCommission: number; 
  influencerCommission: number; 
  orderFixedFee: number; 
  returnRate: number; 
  lastMileShipping: number; 
  adCostPerUnit: number; 
  exchangeRate: number; 
  otherCost: number; 
}

const SKUDetailEditor: React.FC<SKUDetailEditorProps> = ({ product, onClose, onSave, onDelete, onChangeView }) => {
  
  // New Variant State
  const [newVariantName, setNewVariantName] = useState('');

  // Initialize state flattened
  const [formData, setFormData] = useState<SKUFormData>(() => {
      const savedMap: Record<string, number> = product.variantRestockMap || {};
      const variantSum: number = Object.values(savedMap).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
      const hasVariants = product.variants && product.variants.length > 0; 
      
      let initialTotal = 0;
      if (hasVariants && variantSum > 0) {
          initialTotal = variantSum;
      } else {
          initialTotal = product.totalRestockUnits || ((product.restockCartons || 10) * (product.itemsPerBox || 24));
      }

      return {
        name: product.name, 
        variants: product.variants ? JSON.parse(JSON.stringify(product.variants)) : [], 

        note: product.note || '',
        imageUrl: product.imageUrl,
        lifecycle: 'Growing',
        leadTimeProduction: 15,
        leadTimeShipping: 30,
        safetyStockDays: 14,
        restockDate: product.restockDate || new Date().toISOString().split('T')[0],
        supplierName: product.supplier || '未指定供应商',
        supplierContact: '', 
        
        // FINANCIALS - Flattened & Normalized
        unitCost: product.financials?.costOfGoods || 0,
        otherCost: product.financials?.otherCost || 0,
        sellingPrice: product.financials?.sellingPrice || product.price,
        platformCommission: product.platformCommission ?? product.financials?.platformFee ?? 15, 
        influencerCommission: product.influencerCommission ?? 10,
        orderFixedFee: product.orderFixedFee ?? 0.3,
        returnRate: product.returnRate ?? 5,
        lastMileShipping: product.lastMileShipping ?? 5,
        adCostPerUnit: product.financials?.adCost || 0,
        
        unitWeight: product.unitWeight || 0.5,
        dailySales: product.dailySales || 0,
        boxLength: product.boxLength || 50,
        boxWidth: product.boxWidth || 40,
        boxHeight: product.boxHeight || 30,
        boxWeight: product.boxWeight || 12,
        itemsPerBox: product.itemsPerBox || 24,
        restockCartons: product.restockCartons || 10,
        
        totalRestockUnits: initialTotal || 0, 
        variantRestockMap: savedMap,
        
        inboundId: product.inboundId || `IB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        inboundStatus: product.inboundStatus || 'Pending', 
        transportMethod: product.logistics?.method || 'Sea',
        carrier: product.logistics?.carrier || '',
        trackingNo: product.logistics?.trackingNo || '',
        
        // Strict Logic: Use saved rate or default 0. Avoid magic numbers.
        shippingRate: product.logistics?.shippingRate || 0, 
        manualChargeableWeight: product.logistics?.manualChargeableWeight || 0, 
        destinationWarehouse: product.logistics?.destination || '',
        
        exchangeRate: (product as any).exchangeRate || 7.2
      };
  });

  // --- UNIFIED CALCULATION CORE ---
  const metrics = useMemo(() => {
    const rate = formData.exchangeRate || 7.2;
    
    // --- 1. PROCUREMENT ---
    const unitProcurementRMB = formData.unitCost;
    // FORMULA: Total Goods Value = Unit Cost * Total Quantity
    const totalBatchProcurementRMB = unitProcurementRMB * formData.totalRestockUnits;

    // --- 2. LOGISTICS ---
    let unitChargeableWeight = formData.unitWeight; 
    
    // Priority: Manual Override > Box Calc > Unit Weight
    if (formData.manualChargeableWeight > 0) {
        unitChargeableWeight = formData.manualChargeableWeight;
    } else if (formData.itemsPerBox > 0 && formData.boxLength > 0 && formData.boxWeight > 0) {
        const boxVolWeight = (formData.boxLength * formData.boxWidth * formData.boxHeight) / 6000;
        const boxRealWeight = formData.boxWeight;
        const boxChargeable = Math.max(boxVolWeight, boxRealWeight);
        unitChargeableWeight = boxChargeable / formData.itemsPerBox;
    }

    // FORMULA: Total Weight = Unit Weight * Total Quantity
    const totalBatchWeight = unitChargeableWeight * formData.totalRestockUnits;
    
    // FORMULA: Total Shipping = Shipping Rate * Total Weight
    const totalBatchShippingRMB = formData.shippingRate * totalBatchWeight;
    
    const unitShippingCostRMB = totalBatchWeight > 0 && formData.totalRestockUnits > 0 
        ? totalBatchShippingRMB / formData.totalRestockUnits 
        : 0;
    
    // Total Hard Cost in RMB
    const totalHardCostRMB = unitProcurementRMB + unitShippingCostRMB;
    
    // CONVERT TO USD
    const totalHardCostUSD = totalHardCostRMB / rate;

    // --- 3. USD SOFT COSTS ---
    const revenue = formData.sellingPrice;
    
    const platformFeeUSD = revenue * (formData.platformCommission / 100);
    const influencerFeeUSD = revenue * (formData.influencerCommission / 100);
    const estimatedReturnCostUSD = revenue * (formData.returnRate / 100);
    const fixedFeeUSD = formData.orderFixedFee;
    
    // EXCLUDED per user request: Last Mile Shipping (Customer pays)
    const lastMileUSD = 0; 
    
    const adCostUSD = formData.adCostPerUnit;
    const otherCostUSD = formData.otherCost;

    const totalSoftCostUSD = platformFeeUSD + influencerFeeUSD + estimatedReturnCostUSD + fixedFeeUSD + lastMileUSD + adCostUSD + otherCostUSD;

    
    // --- 4. PROFITABILITY ---
    const totalUnitCostUSD = totalHardCostUSD + totalSoftCostUSD;
    const unitProfit = revenue - totalUnitCostUSD;
    const netMargin = revenue > 0 ? (unitProfit / revenue) * 100 : 0;
    const totalStockProfit = unitProfit * product.stock;

    return {
      unitChargeableWeight, 
      unitShippingCostRMB,
      unitProcurementRMB,
      totalBatchProcurementRMB, // EXPOSED
      totalBatchWeight, // EXPOSED
      totalBatchShippingRMB, // EXPOSED
      
      totalHardCostRMB,
      
      // USD Values
      unitShippingCostUSD: unitShippingCostRMB / rate,
      unitCostUSD: unitProcurementRMB / rate,
      
      totalHardCostUSD,
      totalSoftCostUSD,
      totalUnitCostUSD,
      
      unitProfit,
      netMargin,
      totalStockProfit,
      
      breakdown: { platformFeeUSD, influencerFeeUSD, estimatedReturnCostUSD, fixedFeeUSD, lastMileUSD, adCostUSD, otherCostUSD }
    };
  }, [formData, product.stock]);

  // Handler for all inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numVal = e.target.type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => {
        const updates: any = { [name]: numVal };
        // Auto-calc total units if no variants
        const hasVariants = (prev.variants?.length || 0) > 0;
        if (!hasVariants) {
            if (name === 'restockCartons') updates.totalRestockUnits = (numVal as number) * prev.itemsPerBox;
            if (name === 'itemsPerBox') updates.totalRestockUnits = prev.restockCartons * (numVal as number);
        }
        return { ...prev, ...updates };
    });
  };

  const handleTotalWeightChange = (val: number) => {
      // Reverse calculate unit weight: Unit Weight = Total Weight / Total Units
      // Safe Guard: Prevent Division by Zero if totalRestockUnits is 0
      const totalUnits = formData.totalRestockUnits || 0;
      
      if (totalUnits > 0) {
          const newUnitWeight = val / totalUnits;
          setFormData(prev => ({
              ...prev,
              manualChargeableWeight: newUnitWeight
          }));
      } else {
          setFormData(prev => ({
              ...prev,
              manualChargeableWeight: 0 
          }));
      }
  };

  const handleVariantQtyChange = (variantSku: string, qty: number) => {
      setFormData(prev => {
          const newMap = { ...prev.variantRestockMap, [variantSku]: qty };
          const total = Object.values(newMap).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
          return {
              ...prev,
              variantRestockMap: newMap,
              totalRestockUnits: total
          };
      });
  };

  // --- NEW VARIANT HANDLERS ---
  const handleAddNewVariant = () => {
      if (!newVariantName.trim()) return;
      const newSku = `${product.sku}-${newVariantName.toUpperCase().slice(0,3)}`;
      const newVar: ProductVariant = {
          id: `VAR-${Date.now()}`,
          sku: newSku,
          name: newVariantName,
          price: product.price,
          stock: 0,
          attributes: { name: newVariantName }
      };
      
      setFormData(prev => ({
          ...prev,
          variants: [...prev.variants, newVar],
          variantRestockMap: { ...prev.variantRestockMap, [newSku]: 0 }
      }));
      setNewVariantName('');
  };

  const handleDeleteVariant = (skuToDelete: string) => {
      setFormData(prev => {
          const updatedVars = prev.variants.filter(v => v.sku !== skuToDelete);
          
          // Completely remove key from map to prevent dirty data
          const updatedMap = { ...prev.variantRestockMap };
          delete updatedMap[skuToDelete];
          
          // Re-sum
          const total = Object.values(updatedMap).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
          
          return {
              ...prev,
              variants: updatedVars,
              variantRestockMap: updatedMap,
              totalRestockUnits: total
          };
      });
  };

  const handleSave = () => {
      // FORCE SAVE THE EFFECTIVE CHARGEABLE WEIGHT
      // Even if the user didn't type it manually (e.g. calculated from box dims), 
      // we must save what the user SEES as the calculation basis.
      // This solves the issue where list view falls back to unitWeight (0.5) instead of calculated weight (0.6).
      const effectiveWeightToSave = metrics.unitChargeableWeight || formData.unitWeight;

      onSave({
          ...formData,
          financials: {
              costOfGoods: formData.unitCost, // RMB
              shippingCost: parseFloat(metrics.unitShippingCostUSD.toFixed(3)), // USD
              otherCost: formData.otherCost, // USD
              sellingPrice: formData.sellingPrice, // USD
              platformFee: parseFloat(metrics.breakdown.platformFeeUSD.toFixed(2)), // USD
              adCost: formData.adCostPerUnit // USD
          },
          logistics: {
              method: formData.transportMethod,
              carrier: formData.carrier,
              trackingNo: formData.trackingNo,
              shippingRate: formData.shippingRate, // RMB per KG
              manualChargeableWeight: effectiveWeightToSave, // CRITICAL FIX: Save the metrics-derived weight
              destination: formData.destinationWarehouse
          },
          platformCommission: formData.platformCommission,
          influencerCommission: formData.influencerCommission,
          orderFixedFee: formData.orderFixedFee,
          returnRate: formData.returnRate,
          lastMileShipping: formData.lastMileShipping,
          exchangeRate: formData.exchangeRate,
          unitWeight: formData.unitWeight
      });
  };

  // Charts Data
  const chartData = [
    { name: '货值', value: metrics.unitCostUSD, color: '#3b82f6' }, // Blue
    { name: '头程', value: metrics.unitShippingCostUSD, color: '#eab308' }, // Yellow
    { name: '平台/达人', value: metrics.breakdown.platformFeeUSD + metrics.breakdown.influencerFeeUSD, color: '#a855f7' }, // Purple
    { name: '定费/杂', value: metrics.breakdown.fixedFeeUSD + metrics.breakdown.otherCostUSD, color: '#f97316' }, // Orange (Removed Last Mile)
    { name: '广告/退货', value: metrics.breakdown.adCostUSD + metrics.breakdown.estimatedReturnCostUSD, color: '#ef4444' }, // Red
    { name: '净利', value: Math.max(0, metrics.unitProfit), color: '#22c55e' } // Green
  ].filter(d => d.value > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-[95vw] h-[92vh] glass-card flex flex-col border-white/20 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-white/5 backdrop-blur-xl z-20">
          <div className="flex items-center gap-6 flex-1 mr-8">
            <div className="w-10 h-10 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center text-neon-blue shrink-0">
                <Box size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-gray-500 shrink-0 select-none">编辑:</span>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-neon-blue text-xl font-bold text-white w-full focus:outline-none transition-all px-1"/>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-gray-400 border border-white/10 font-mono shrink-0">{product.sku}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2"><AlertCircle size={12} className="text-neon-blue"/> 财务数据已校准 (Strict Mode).</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
             <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white transition-all"><X size={20} /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-transparent custom-scrollbar">
          <div className="grid grid-cols-12 gap-6 pb-20">
            
            {/* LEFT COLUMN: PRODUCT & SUPPLY */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                <section className="glass-card p-6 border-l-4 border-l-neon-purple group hover:border-white/20 transition-all">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers size={16} className="text-neon-purple" /> 产品与供应链</h3>
                    <div className="flex gap-4 mb-6">
                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            <ImageUpload currentImage={formData.imageUrl || product.imageUrl} onImageChange={(url) => setFormData(p => ({...p, imageUrl: url}))} productName={product.name}/>
                        </div>
                        <div className="space-y-4 flex-1">
                             <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><FileText size={10} /> 备注</label>
                                <textarea name="note" value={formData.note} onChange={handleChange} className="w-full h-16 bg-white/5 border border-white/10 rounded-lg text-xs p-2 text-neon-yellow outline-none resize-none focus:border-neon-yellow/50 focus:bg-white/10" placeholder="备注..."/>
                             </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold">生命周期</label>
                            <select name="lifecycle" value={formData.lifecycle} onChange={handleChange} className="w-full h-8 bg-white/5 border border-white/10 rounded-lg text-xs px-2 text-white outline-none focus:border-neon-purple">
                                <option value="Growing">上升期 🚀</option>
                                <option value="Stable">平稳期 ⚓</option>
                                <option value="Declining">衰退期 📉</option>
                            </select>
                        </div>
                        <InputGroup label="备货日期" name="restockDate" value={formData.restockDate} type="date" onChange={handleChange} />
                    </div>
                </section>

                <section className="glass-card p-6 border-l-4 border-l-neon-blue group hover:border-white/20 transition-all">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Globe size={16} className="text-neon-blue" /> 采购参数 (RMB)</h3>
                    <div className="space-y-4">
                        <InputGroup label="供应商名称" name="supplierName" value={formData.supplierName} type="text" onChange={handleChange} />
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                            <InputGroup label="采购单价 (¥ CNY)" name="unitCost" value={formData.unitCost} highlight="text-neon-blue" onChange={handleChange} />
                            <InputGroup label="单品实重 (kg)" name="unitWeight" value={formData.unitWeight} onChange={handleChange} />
                        </div>
                        {/* TOTAL PROCUREMENT COST DISPLAY */}
                        <div className="p-3 bg-neon-blue/5 border border-neon-blue/10 rounded-xl mt-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">本批次总货值 (Total Goods Value)</span>
                                <span className="text-sm font-bold text-neon-blue">¥{metrics.totalBatchProcurementRMB.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            </div>
                            <div className="text-[9px] text-gray-500 font-mono text-right">
                                {formData.unitCost} (单价) × {formData.totalRestockUnits} (数量)
                            </div>
                        </div>
                    </div>
                </section>

                <section className="glass-card p-6 border-l-4 border-l-gray-500 group hover:border-white/20 transition-all">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Package size={16} className="text-gray-300" /> 装箱配置</h3>
                    
                    {/* Multi-SKU Variant Manager (ADD/EDIT ENABLED) */}
                    <div className="mb-4">
                        <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="text-[10px] font-bold text-neon-purple uppercase mb-2 flex items-center gap-2 justify-between">
                                <span className="flex items-center gap-2"><Box size={10}/> Multi-SKU 补货矩阵</span>
                                <span className="text-gray-500">{formData.variants.length} items</span>
                            </div>
                            
                            {/* Scrollable List */}
                            <div className="max-h-[150px] overflow-y-auto custom-scrollbar space-y-2">
                                {formData.variants.map((v) => (
                                    <div key={v.sku} className="flex items-center justify-between gap-2 bg-black/20 p-2 rounded-lg group">
                                        <div className="text-xs text-white truncate w-1/3" title={v.name}>{v.name}</div>
                                        <div className="flex-1">
                                            <input 
                                                type="number"
                                                value={formData.variantRestockMap[v.sku] || 0}
                                                onChange={(e) => handleVariantQtyChange(v.sku, parseInt(e.target.value) || 0)}
                                                className="w-full bg-transparent text-right text-sm font-bold text-neon-purple outline-none border-b border-neon-purple/30 focus:border-neon-purple"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="text-[10px] text-gray-500">pcs</div>
                                        <button onClick={() => handleDeleteVariant(v.sku)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Variant Interface */}
                            <div className="flex gap-2 pt-2 border-t border-white/5">
                                <input 
                                    value={newVariantName}
                                    onChange={(e) => setNewVariantName(e.target.value)}
                                    placeholder="新增变体 (e.g. XL/Red)"
                                    className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-neon-purple"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewVariant()}
                                />
                                <button 
                                    onClick={handleAddNewVariant}
                                    className="bg-neon-purple text-white px-2 rounded text-xs font-bold hover:bg-neon-purple/80"
                                >
                                    <Plus size={14}/>
                                </button>
                            </div>

                            <div className="text-right text-xs font-bold text-white pt-2 border-t border-white/5">
                                Total: {formData.totalRestockUnits} pcs
                            </div>
                        </div>
                    </div>

                    {/* Standard Inputs (Always Visible for Box Dimensions) */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <InputGroup label="长 (cm)" name="boxLength" value={formData.boxLength} onChange={handleChange} />
                        <InputGroup label="宽 (cm)" name="boxWidth" value={formData.boxWidth} onChange={handleChange} />
                        <InputGroup label="高 (cm)" name="boxHeight" value={formData.boxHeight} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <InputGroup label="单箱实重 (kg)" name="boxWeight" value={formData.boxWeight} onChange={handleChange} />
                        <InputGroup label="单箱数量" name="itemsPerBox" value={formData.itemsPerBox} onChange={handleChange} />
                    </div>
                    
                    {/* Fallback Single Input if no variants */}
                    {(!formData.variants || formData.variants.length === 0) && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 mb-4">
                            <InputGroup label="补货箱数" name="restockCartons" value={formData.restockCartons} highlight="text-white bg-white/10 rounded px-2" onChange={handleChange} />
                            <div className="space-y-1 w-full">
                                <label className="text-[10px] text-neon-yellow font-bold uppercase">总数量 (pcs)</label>
                                <input type="number" name="totalRestockUnits" value={formData.totalRestockUnits} onChange={handleChange} className={`w-full h-10 bg-black/40 border border-neon-yellow/30 rounded-lg px-3 text-sm text-neon-yellow font-bold outline-none focus:border-neon-yellow transition-colors`}/>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* MIDDLE COLUMN: LOGISTICS & FEES */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                <section className="glass-card p-6 border-l-4 border-l-neon-yellow group hover:border-white/20 transition-all">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Truck size={16} className="text-neon-yellow" /> 头程物流 (RMB)</h3>
                    <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold">运输方式</label>
                                <div className="flex p-1 bg-white/5 rounded-lg border border-white/10">
                                    <button onClick={() => setFormData(p => ({...p, transportMethod: 'Air'}))} className={`flex-1 py-1 text-[10px] font-bold rounded ${formData.transportMethod === 'Air' ? 'bg-neon-blue text-black' : 'text-gray-500'}`}>空运</button>
                                    <button onClick={() => setFormData(p => ({...p, transportMethod: 'Sea'}))} className={`flex-1 py-1 text-[10px] font-bold rounded ${formData.transportMethod === 'Sea' ? 'bg-neon-blue text-black' : 'text-gray-500'}`}>海运</button>
                                </div>
                             </div>
                             <InputGroup label="承运商" name="carrier" value={formData.carrier} type="text" onChange={handleChange} />
                         </div>
                         <InputGroup label="运单号" name="trackingNo" value={formData.trackingNo} type="text" placeholder="待定..." onChange={handleChange} />
                         
                         <div className="p-4 bg-neon-yellow/5 border border-neon-yellow/10 rounded-xl space-y-3">
                             <div className="grid grid-cols-2 gap-4">
                                 <InputGroup label="头程费率 (¥/kg)" name="shippingRate" value={formData.shippingRate} onChange={handleChange} />
                                 <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                                        本批次总重量 (kg)
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={metrics.totalBatchWeight.toFixed(3)}
                                            onChange={(e) => handleTotalWeightChange(parseFloat(e.target.value))}
                                            className="w-full h-10 px-3 bg-black/20 border border-white/10 rounded-lg text-sm text-neon-yellow font-mono focus:border-neon-yellow/50 outline-none"
                                        />
                                    </div>
                                 </div>
                             </div>
                             
                             {/* Logistics Summary Block (TOTALS) */}
                             <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                <div className="flex justify-between items-center text-[10px] text-gray-400">
                                    <span className="flex items-center gap-1"><Scale size={10}/> 总发货重量 (Total Weight)</span>
                                    <span className="text-white font-mono font-bold">{metrics.totalBatchWeight.toFixed(2)} kg</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-gray-400">
                                    <span className="flex items-center gap-1"><Sigma size={10}/> 总头程运费 (Total Shipping)</span>
                                    <span className="text-neon-yellow font-mono font-bold">¥{metrics.totalBatchShippingRMB.toFixed(2)}</span>
                                </div>
                                <div className="text-[9px] text-gray-600 text-right">
                                    公式: {metrics.totalBatchWeight.toFixed(2)}kg × ¥{formData.shippingRate}
                                </div>
                             </div>
                         </div>
                    </div>
                </section>

                <section className="glass-card p-6 border-l-4 border-l-neon-pink group hover:border-white/20 transition-all">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Share2 size={16} className="text-neon-pink" /> TIKTOK COST STRUCTURE (USD)</h3>
                    <div className="space-y-5">
                         <div className="flex items-center gap-4">
                              <InputGroup label="销售价 (USD $)" name="sellingPrice" value={formData.sellingPrice} highlight="text-neon-green text-xl" onChange={handleChange} />
                         </div>
                         <div className="pt-2 space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                 <InputGroup label="平台佣金 (%)" name="platformCommission" value={formData.platformCommission} onChange={handleChange} />
                                 <InputGroup label="达人佣金 (%)" name="influencerCommission" value={formData.influencerCommission} onChange={handleChange} />
                             </div>
                             <InputGroup label="每单固定费 ($)" name="orderFixedFee" value={formData.orderFixedFee} onChange={handleChange} />
                             <div className="grid grid-cols-2 gap-4">
                                 <InputGroup label="预估退货率 (%)" name="returnRate" value={formData.returnRate} onChange={handleChange} />
                                 <InputGroup label="尾程派送费 ($)" name="lastMileShipping" value={formData.lastMileShipping} onChange={handleChange} placeholder="0 (Excluded)" />
                             </div>
                             <InputGroup label="预估广告费 ($)" name="adCostPerUnit" value={formData.adCostPerUnit} onChange={handleChange} />
                             <InputGroup label="其他杂费 ($)" name="otherCost" value={formData.otherCost} onChange={handleChange} />
                         </div>
                    </div>
                </section>
            </div>

            {/* RIGHT COLUMN: PROFIT ANALYSIS */}
            <div className="col-span-12 lg:col-span-4 relative">
                <div className="sticky top-0 space-y-6">
                    <section className="glass-card p-8 border border-neon-green/30 shadow-[0_0_30px_rgba(0,255,157,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-neon-green opacity-10 blur-[50px] pointer-events-none"></div>
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1 border border-white/10 z-20">
                            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><ArrowRightLeft size={10}/> 汇率</span>
                            <input type="number" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} className="w-12 bg-transparent text-xs font-bold text-white text-right outline-none focus:text-neon-blue"/>
                        </div>

                        <h3 className="text-sm font-bold text-neon-green uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10"><Calculator size={16} /> 单品利润分析 (USD)</h3>

                        <div className="w-48 h-48 mx-auto mb-6 relative z-10">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: '1px solid #333' }} formatter={(val: number) => `$${val.toFixed(2)}`} />
                                </PieChart>
                             </ResponsiveContainer>
                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                 <span className="text-2xl font-bold text-white">{metrics.netMargin.toFixed(1)}%</span>
                                 <span className="text-[10px] text-gray-400">Margin</span>
                             </div>
                        </div>

                        <div className="relative z-10 text-center space-y-2 mb-6">
                             <div className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">单品净利</div>
                             <div className="text-[40px] font-display font-bold text-white leading-none tracking-tight flex items-center justify-center gap-2 drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                                 <span className="text-xl text-neon-green mt-2">$</span>
                                 {metrics.unitProfit.toFixed(2)}
                             </div>
                             <div className="text-xs text-gray-500 font-mono mt-2">
                                ≈ ¥{(metrics.unitProfit * formData.exchangeRate).toFixed(2)} RMB
                             </div>
                        </div>

                        {/* PROFIT EQUATION DISPLAY */}
                        <div className="relative z-10 bg-black/40 rounded-xl p-3 border border-white/10 space-y-2 mb-6">
                            <div className="flex justify-between items-center text-[10px] text-gray-400 border-b border-white/5 pb-1 mb-1">
                                <span>PROFIT EQUATION</span>
                                <HelpCircle size={10}/>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-white font-bold">${formData.sellingPrice.toFixed(2)}</span>
                                <span className="text-gray-500">-</span>
                                <span className="text-blue-400 font-bold">${metrics.totalHardCostUSD.toFixed(2)}</span>
                                <span className="text-gray-500">-</span>
                                <span className="text-pink-400 font-bold">${metrics.totalSoftCostUSD.toFixed(2)}</span>
                                <span className="text-gray-500">=</span>
                                <span className="text-neon-green font-bold">${metrics.unitProfit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-500 px-1">
                                <span>Revenue</span>
                                <span>Hard Cost</span>
                                <span>Soft Cost</span>
                                <span>Profit</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-2">
                             <CostItem label={`货值 (¥${formData.unitCost})`} value={metrics.unitCostUSD} color="bg-blue-500" />
                             <CostItem label={`头程 (¥${metrics.unitShippingCostRMB.toFixed(1)})`} value={metrics.unitShippingCostUSD} color="bg-yellow-500" />
                             <CostItem label="平台/达人佣金" value={metrics.breakdown.platformFeeUSD + metrics.breakdown.influencerFeeUSD} color="bg-purple-500" />
                             <CostItem label="定费/杂 (Excl. LastMile)" value={metrics.breakdown.fixedFeeUSD + metrics.breakdown.otherCostUSD} color="bg-orange-500" />
                             <CostItem label="广告/退货" value={metrics.breakdown.adCostUSD + metrics.breakdown.estimatedReturnCostUSD} color="bg-red-500" />
                        </div>
                    </section>
                    
                    <div className="grid grid-cols-4 gap-3">
                         <button onClick={onDelete} className="col-span-1 py-4 bg-white/5 border border-white/10 hover:bg-neon-pink/20 hover:border-neon-pink text-gray-400 hover:text-neon-pink rounded-xl flex items-center justify-center transition-all" title="删除此 SKU"><Trash2 size={20} /></button>
                         <button onClick={handleSave} className="col-span-3 py-4 bg-gradient-neon-green text-black rounded-xl font-bold text-sm shadow-glow-green hover:scale-105 transition-all flex items-center justify-center gap-2"><Save size={18} /> 保存配置</button>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, name, value, onChange, type="number", highlight="", placeholder="" }: any) => (
    <div className="space-y-1 w-full">
        <label className="text-[10px] text-gray-500 font-bold uppercase">{label}</label>
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white outline-none focus:border-white/30 transition-colors ${highlight}`}/>
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
