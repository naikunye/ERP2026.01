
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Currency, ProductVariant, InventoryLog } from '../types';
import { 
  X, Save, History, Box, Layers, Truck, 
  DollarSign, TrendingUp, Calculator, Package, 
  Scale, Anchor, Globe, Share2, AlertCircle, Trash2, FileText, CheckCircle2, Clock,
  RefreshCcw, ArrowRightLeft, LayoutGrid, ChevronDown, ChevronUp, Edit3, Plus, HelpCircle,
  Container, Sigma, Search, Sparkles, Tag, Loader2, Cpu
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { generateProductDescription, optimizeProductTitle, generateSeoKeywords } from '../services/geminiService';
import ImageUpload from './ImageUpload';

interface SKUDetailEditorProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: any) => void;
  onDelete?: () => void;
  onChangeView?: (view: string) => void; 
  inventoryLogs?: InventoryLog[]; // Added Logs support
}

interface SKUFormData {
  sku: string; // Added editable SKU
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
  seoTitle?: string;
  seoKeywords?: string[];
  description?: string;
}

const SKUDetailEditor: React.FC<SKUDetailEditorProps> = ({ product, onClose, onSave, onDelete, onChangeView, inventoryLogs = [] }) => {
  
  const [activeTab, setActiveTab] = useState<'core' | 'ai' | 'matrix' | 'logs'>('core');
  
  // New Variant State
  const [newVariantName, setNewVariantName] = useState('');
  
  // AI State
  const [isLoadingAi, setIsLoadingAi] = useState(false);

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
        sku: product.sku, // Init SKU
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
        
        exchangeRate: (product as any).exchangeRate || 7.2,
        seoTitle: product.seoTitle || '',
        seoKeywords: product.seoKeywords || [],
        description: product.description || ''
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
      const newSku = `${formData.sku}-${newVariantName.toUpperCase().slice(0,3)}`; // Use formData.sku to reflect edits
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
          const updatedMap = { ...prev.variantRestockMap };
          delete updatedMap[skuToDelete];
          const total = Object.values(updatedMap).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
          
          return {
              ...prev,
              variants: updatedVars,
              variantRestockMap: updatedMap,
              totalRestockUnits: total
          };
      });
  };

  // --- AI HANDLERS ---
  const handleAiOptimizeTitle = async () => {
      if(!formData.name) return;
      setIsLoadingAi(true);
      const optimized = await optimizeProductTitle(formData.name, product.category || '');
      setFormData(prev => ({ ...prev, seoTitle: optimized }));
      setIsLoadingAi(false);
  };

  const handleAiKeywords = async () => {
      if(!formData.name) return;
      setIsLoadingAi(true);
      const keywords = await generateSeoKeywords(formData.name, formData.description || '');
      setFormData(prev => ({ ...prev, seoKeywords: keywords }));
      setIsLoadingAi(false);
  };

  const handleSave = () => {
      const effectiveWeightToSave = metrics.unitChargeableWeight || formData.unitWeight;

      onSave({
          ...formData,
          sku: formData.sku, // Explicitly save SKU
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
          unitWeight: formData.unitWeight,
          seoTitle: formData.seoTitle,
          seoKeywords: formData.seoKeywords,
          description: formData.description
      });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-[95vw] h-[92vh] glass-card flex flex-col border-white/20 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="h-auto min-h-[80px] border-b border-white/10 flex flex-col px-8 bg-white/5 backdrop-blur-xl z-20">
          <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-6 flex-1 mr-8">
                <div className="w-10 h-10 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center text-neon-blue shrink-0">
                    <Box size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-500 shrink-0 select-none">编辑:</span>
                      {/* PRODUCT NAME INPUT - Fully Editable */}
                      <input 
                          type="text" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleChange} 
                          className="bg-transparent border border-transparent hover:border-white/20 focus:border-neon-blue rounded-lg px-2 py-1 text-xl font-bold text-white w-full focus:outline-none transition-all placeholder-gray-600"
                          placeholder="产品名称 (Editable)"
                      />
                      {/* SKU CODE INPUT - Fully Editable */}
                      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 border border-white/10 group focus-within:border-neon-blue/50 transition-colors">
                          <span className="text-[10px] text-gray-500 font-bold shrink-0">SKU:</span>
                          <input 
                              type="text" 
                              name="sku"
                              value={formData.sku}
                              onChange={handleChange}
                              className="bg-transparent text-[10px] font-mono text-neon-blue font-bold outline-none w-28 focus:w-36 transition-all"
                              placeholder="SKU-CODE"
                          />
                      </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                 <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white transition-all"><X size={20} /></button>
              </div>
          </div>

          {/* TAB BAR */}
          <div className="flex gap-1 overflow-x-auto pb-0">
              {[
                  { id: 'core', label: '运营配置 (Operations)', icon: <LayoutGrid size={14}/> },
                  { id: 'matrix', label: 'SKU 矩阵 (Variants)', icon: <Box size={14}/> },
                  { id: 'ai', label: 'AI 营销 (Intelligence)', icon: <Cpu size={14}/> },
                  { id: 'logs', label: '库存流水 (Logs)', icon: <History size={14}/> },
              ].map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-xs font-bold rounded-t-lg flex items-center gap-2 border-t border-x border-transparent transition-all ${
                          activeTab === tab.id 
                          ? 'bg-white/10 border-white/10 text-white' 
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                      {tab.icon} {tab.label}
                  </button>
              ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-transparent custom-scrollbar">
          
          {/* TAB: CORE OPERATIONS */}
          {activeTab === 'core' && (
              <div className="grid grid-cols-12 gap-6 pb-20 animate-fade-in">
                
                {/* 1: PRODUCT & SUPPLY (Basic) */}
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
                </div>

                {/* 2: PACKING & LOGISTICS (Operations) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <section className="glass-card p-6 border-l-4 border-l-gray-500 group hover:border-white/20 transition-all">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Package size={16} className="text-gray-300" /> 装箱配置</h3>
                        
                        {/* Quick Matrix Input (Mini Version) */}
                        <div className="mb-4 space-y-2 bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="text-[10px] font-bold text-neon-purple uppercase flex items-center justify-between">
                                <span>快速补货 (Quick Qty)</span>
                                <span className="text-white">{formData.totalRestockUnits} pcs</span>
                            </div>
                            {formData.variants.length > 0 ? (
                                <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-1">
                                    {formData.variants.map(v => (
                                        <div key={v.sku} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400 truncate w-24">{v.name}</span>
                                            <input 
                                                type="number"
                                                value={formData.variantRestockMap[v.sku] || 0}
                                                onChange={(e) => handleVariantQtyChange(v.sku, parseInt(e.target.value) || 0)}
                                                className="w-16 bg-black/30 border border-white/10 rounded px-1 text-right text-white focus:border-neon-purple outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <InputGroup label="箱数" name="restockCartons" value={formData.restockCartons} onChange={handleChange} />
                                    <InputGroup label="每箱数量" name="itemsPerBox" value={formData.itemsPerBox} onChange={handleChange} />
                                </div>
                            )}
                        </div>

                        {/* Box Dims */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <InputGroup label="长 (cm)" name="boxLength" value={formData.boxLength} onChange={handleChange} />
                            <InputGroup label="宽 (cm)" name="boxWidth" value={formData.boxWidth} onChange={handleChange} />
                            <InputGroup label="高 (cm)" name="boxHeight" value={formData.boxHeight} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InputGroup label="单箱实重 (kg)" name="boxWeight" value={formData.boxWeight} onChange={handleChange} />
                        </div>
                    </section>

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
                                 </div>
                             </div>
                        </div>
                    </section>
                </div>

                {/* 3: COSTS & ACTIONS (Financial Input) */}
                <div className="col-span-12 lg:col-span-4 relative space-y-6">
                    <section className="glass-card p-6 border-l-4 border-l-neon-pink group hover:border-white/20 transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Share2 size={16} className="text-neon-pink" /> 成本与定价 (USD)</h3>
                            <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1 border border-white/10">
                                <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><ArrowRightLeft size={10}/> 汇率</span>
                                <input type="number" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} className="w-12 bg-transparent text-xs font-bold text-white text-right outline-none focus:text-neon-blue"/>
                            </div>
                        </div>
                        
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

                    <div className="grid grid-cols-4 gap-3 pt-4">
                         <button onClick={onDelete} className="col-span-1 py-4 bg-white/5 border border-white/10 hover:bg-neon-pink/20 hover:border-neon-pink text-gray-400 hover:text-neon-pink rounded-xl flex items-center justify-center transition-all" title="删除此 SKU"><Trash2 size={20} /></button>
                         <button onClick={handleSave} className="col-span-3 py-4 bg-gradient-neon-green text-black rounded-xl font-bold text-sm shadow-glow-green hover:scale-105 transition-all flex items-center justify-center gap-2"><Save size={18} /> 保存配置</button>
                    </div>
                </div>

              </div>
          )}

          {/* TAB: SKU MATRIX (Full Variant Management) */}
          {activeTab === 'matrix' && (
              <div className="space-y-8 animate-fade-in">
                  <div className="glass-card p-6 border-white/5 bg-gradient-to-r from-neon-purple/5 to-transparent">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <Box size={16} className="text-neon-purple" /> 快速生成变体 (Variant Generator)
                      </h3>
                      <div className="flex gap-4 items-end">
                          <div className="flex-1 space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold uppercase">变体名 (e.g. Red/XL)</label>
                              <input 
                                  value={newVariantName} onChange={e => setNewVariantName(e.target.value)}
                                  className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-purple outline-none"
                                  placeholder="New Variant Name"
                              />
                          </div>
                          <button 
                              onClick={handleAddNewVariant}
                              className="h-10 px-6 bg-neon-purple text-white rounded-lg font-bold text-xs hover:bg-neon-purple/80 transition-all flex items-center gap-2"
                          >
                              <Plus size={14} /> 添加
                          </button>
                      </div>
                  </div>
                  <div className="rounded-xl border border-white/10 overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-white/5 text-[10px] font-bold text-gray-500 uppercase">
                              <tr>
                                  <th className="px-6 py-3">Variant Name</th>
                                  <th className="px-6 py-3">SKU Suffix</th>
                                  <th className="px-6 py-3">Price Override</th>
                                  <th className="px-6 py-3">Restock Plan</th>
                                  <th className="px-6 py-3 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {formData.variants?.length === 0 && (
                                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-xs italic">暂无变体，请添加</td></tr>
                              )}
                              {formData.variants?.map(v => (
                                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                                      <td className="px-6 py-3 font-bold text-white text-sm">{v.name}</td>
                                      <td className="px-6 py-3 font-mono text-xs text-neon-blue">{v.sku}</td>
                                      <td className="px-6 py-3">
                                          <input defaultValue={v.price} className="w-20 bg-transparent border-b border-white/10 text-sm text-white focus:border-neon-purple outline-none" disabled placeholder="继承" />
                                      </td>
                                      <td className="px-6 py-3">
                                          <input 
                                              type="number"
                                              value={formData.variantRestockMap[v.sku] || 0}
                                              onChange={(e) => handleVariantQtyChange(v.sku, parseInt(e.target.value) || 0)}
                                              className="w-24 bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white text-center font-bold focus:border-neon-purple outline-none"
                                          />
                                      </td>
                                      <td className="px-6 py-3 text-right">
                                          <button onClick={() => handleDeleteVariant(v.sku)} className="text-gray-500 hover:text-red-500 transition-colors">
                                              <Trash2 size={14} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* TAB: AI INTELLIGENCE */}
          {activeTab === 'ai' && (
              <div className="space-y-8 animate-fade-in">
                  <section className="glass-card p-6 border-white/10">
                       <div className="flex justify-between items-start mb-4">
                           <div>
                               <h3 className="font-bold text-white flex items-center gap-2"><Search size={16} className="text-neon-blue"/> SEO 标题优化</h3>
                               <p className="text-xs text-gray-400 mt-1">根据品类和属性生成高点击率标题。</p>
                           </div>
                           <button onClick={handleAiOptimizeTitle} disabled={isLoadingAi} className="px-3 py-1.5 bg-neon-blue/10 text-neon-blue rounded-lg text-xs font-bold hover:bg-neon-blue/20 transition-all flex items-center gap-2">
                               {isLoadingAi ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} 立即优化
                           </button>
                       </div>
                       <div className="bg-black/20 p-4 rounded-xl border border-white/5 font-mono text-sm text-white">
                           {formData.seoTitle || "点击优化按钮生成..."}
                       </div>
                  </section>
                  <section className="glass-card p-6 border-white/10">
                       <div className="flex justify-between items-start mb-4">
                           <div>
                               <h3 className="font-bold text-white flex items-center gap-2"><Tag size={16} className="text-neon-purple"/> 关键词提取</h3>
                               <p className="text-xs text-gray-400 mt-1">自动分析描述提取 Amazon/TikTok 后台关键词。</p>
                           </div>
                           <button onClick={handleAiKeywords} disabled={isLoadingAi} className="px-3 py-1.5 bg-neon-purple/10 text-neon-purple rounded-lg text-xs font-bold hover:bg-neon-purple/20 transition-all flex items-center gap-2">
                               {isLoadingAi ? <Loader2 className="animate-spin" size={12}/> : <Cpu size={12}/>} 提取 Tags
                           </button>
                       </div>
                       <div className="flex flex-wrap gap-2">
                           {formData.seoKeywords && formData.seoKeywords.length > 0 ? (
                               formData.seoKeywords.map((kw, i) => (
                                   <span key={i} className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs text-gray-300">
                                       {kw}
                                   </span>
                               ))
                           ) : (
                               <span className="text-xs text-gray-600 italic">暂无关键词</span>
                           )}
                       </div>
                  </section>
              </div>
          )}

          {/* TAB: INVENTORY LOGS */}
          {activeTab === 'logs' && (
              <div className="animate-fade-in space-y-4">
                  <div className="glass-card p-0 overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-white/5 text-[10px] font-bold text-gray-500 uppercase">
                              <tr>
                                  <th className="px-6 py-4">时间 (Time)</th>
                                  <th className="px-6 py-4">类型 (Type)</th>
                                  <th className="px-6 py-4">变动数量 (Qty)</th>
                                  <th className="px-6 py-4">变动原因 (Reason)</th>
                                  <th className="px-6 py-4">操作人</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {inventoryLogs && inventoryLogs.length > 0 ? (
                                  inventoryLogs.map(log => (
                                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                          <td className="px-6 py-4 text-xs font-mono text-gray-400">
                                              {new Date(log.timestamp).toLocaleString()}
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                  log.type === 'Inbound' ? 'text-neon-green border-neon-green/30 bg-neon-green/10' :
                                                  log.type === 'Outbound' ? 'text-neon-pink border-neon-pink/30 bg-neon-pink/10' :
                                                  'text-neon-blue border-neon-blue/30 bg-neon-blue/10'
                                              }`}>
                                                  {log.type === 'Inbound' ? '入库' : log.type === 'Outbound' ? '出库' : '调整'}
                                              </span>
                                          </td>
                                          <td className={`px-6 py-4 font-bold font-mono text-sm ${log.quantity > 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
                                              {log.quantity > 0 ? '+' : ''}{log.quantity}
                                          </td>
                                          <td className="px-6 py-4 text-xs text-white">
                                              {log.reason}
                                          </td>
                                          <td className="px-6 py-4 text-xs text-gray-500">
                                              {log.operator}
                                          </td>
                                      </tr>
                                  ))
                              ) : (
                                  <tr>
                                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-xs italic">
                                          暂无库存变动记录
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

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

export default SKUDetailEditor;
