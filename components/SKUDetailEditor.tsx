
import React, { useState, useMemo } from 'react';
import { Product, ProductVariant, InventoryLog } from '../types';
import { 
  X, Save, Box, Truck, DollarSign, Package, 
  Scale, ArrowRightLeft, LayoutGrid, Info,
  Factory, Plane, Ship, AlertTriangle, TrendingUp, ShieldCheck, 
  Ruler, CreditCard, Clock, Lock, Unlock, Tag, AlertCircle, CheckCircle2,
  FileText, Anchor, ListTree, History, Container, AlertOctagon,
  Calendar, Layers
} from 'lucide-react';
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import ImageUpload from './ImageUpload';

interface SKUDetailEditorProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: any) => void;
  onDelete?: () => void;
  onChangeView?: (view: string) => void; 
  inventoryLogs?: InventoryLog[];
}

// --- Extended Types for New Modules ---

interface VariantOverride extends ProductVariant {
    weightOverride?: number;
    priceOverride?: number;
    fbaFeeOverride?: number;
    adCostOverride?: number;
    returnRateOverride?: number;
}

interface LogisticsExecutionRecord {
    id: string;
    method: 'Air' | 'Sea' | 'Rail' | 'Truck';
    carrier: string;
    trackingNos: string[]; // Support multiple tracking numbers
    shipDate: string;
    arrivalDate?: string;
    status: 'In Transit' | 'Customs' | 'Delivered' | 'Receiving' | 'Closed';
    
    // Inbound Data
    inboundId?: string; // FBA/WMS ID
    sentQty: number;
    receivedQty: number;
    shelvedQty: number;
}

interface BatchAttribution {
    id: string;
    batchName: string; // e.g. "2023-10-BATCH-A"
    skuId: string; // Variant SKU or Parent
    trackingRef: string;
    inboundRef: string;
    
    // Locked Financials at time of batch closure
    lockedUnitCost: number;
    lockedLogisticsCost: number;
    lockedProfit: number;
    status: 'Open' | 'Locked';
}

// --- V2 Data Model ---
interface SKUFormDataV2 {
  // Identity
  sku: string;
  name: string;
  variants: VariantOverride[];
  imageUrl?: string; 
  lifecycle: 'New' | 'Growth' | 'Stable' | 'Clearance';
  tags: string[];

  // 1. Supply Chain & Procurement (Master)
  supplierName: string;
  moq: number; 
  leadTimeProduction: number;
  unitCostCNY: number; 
  procurementLossRate: number; 
  paymentTerms: '100% Prepay' | '30/70' | 'Net 30' | 'Net 60'; 
  
  // 2. Packaging & Dimensions (Master)
  unitWeight: number; 
  packageWeight: number; 
  itemsPerBox: number; 
  boxLength: number; 
  boxWidth: number; 
  boxHeight: number; 
  boxWeight: number; 
  boxType: 'Standard' | 'Irregular'; 
  
  fulfillmentLength: number; 
  fulfillmentWidth: number; 
  fulfillmentHeight: number; 

  // Restock Plan
  restockCartons: number; 
  totalRestockUnits: number; 
  variantRestockMap: Record<string, number>; 

  // 3. Logistics Config (Master Rules)
  logisticsMethod: 'Air' | 'Sea' | 'Rail' | 'Truck';
  logisticsCarrier: string; 
  shippingRate: number; 
  quoteCurrency: 'RMB' | 'USD'; 
  exchangeRateLock: boolean; 
  exchangeRate: number; 
  minChargeableWeight: number; 
  volumetricDivisor: 5000 | 6000 | 7000 | 8000; 
  customsMode: 'DDP' | 'DDU' | 'DoubleClear'; 
  customsDutyRate: number; 
  riskBufferCostCNY: number; 
  logisticsTag: 'Fast' | 'Eco' | 'Stable'; 
  destinationWarehouse: string;

  // 4. Fulfillment & Platform (Master Rules)
  sellingPriceUSD: number;
  platformCommissionRate: number; 
  paymentFeeRate: number; 
  fbaFeeUSD: number; 
  lastMileShippingUSD: number; 
  storageFeeUSD: number; 
  returnRate: number; 
  actualReturnCostUSD: number; 
  payoutCycleDays: number; 
  adCostPerUnitUSD: number; 
  
  // Metadata
  costLock: boolean; 
  source?: 'manual' | 'imported';

  // --- NEW MODULE DATA ---
  logisticsRecords: LogisticsExecutionRecord[];
  batchAttribution: BatchAttribution[];
}

const SKUDetailEditor: React.FC<SKUDetailEditorProps> = ({ product, onClose, onSave, onDelete, onChangeView, inventoryLogs = [] }) => {
  
  const [activeSection, setActiveSection] = useState<'overview' | 'matrix' | 'logs'>('overview');

  // --- MIGRATION & INIT ---
  const [formData, setFormData] = useState<SKUFormDataV2>(() => {
      const getVal = (key: string, fallback: any) => (product as any)[key] ?? fallback;
      const getFin = (key: string, fallback: number) => product.financials?.[key as keyof typeof product.financials] ?? fallback;
      const getLog = (key: string, fallback: any) => product.logistics?.[key as keyof typeof product.logistics] ?? fallback;

      const savedMap = (product.variantRestockMap || {}) as Record<string, number>;
      const initialRestock = Object.values(savedMap).reduce((a: number, b: number) => a + Number(b), 0) || product.totalRestockUnits || 0;

      return {
        sku: product.sku,
        name: product.name,
        variants: product.variants ? JSON.parse(JSON.stringify(product.variants)) : [],
        imageUrl: product.imageUrl,
        lifecycle: getVal('lifecycle', 'Growth'),
        tags: getVal('tags', []),

        supplierName: product.supplier || '',
        moq: getVal('moq', 100),
        leadTimeProduction: getVal('leadTimeProduction', 15),
        unitCostCNY: getFin('costOfGoods', 0),
        procurementLossRate: getVal('procurementLossRate', 0), 
        paymentTerms: getVal('paymentTerms', '30/70'),

        unitWeight: product.unitWeight || 0.1,
        packageWeight: getVal('packageWeight', (product.unitWeight || 0.1) * 1.1),
        itemsPerBox: product.itemsPerBox || 20,
        boxLength: product.boxLength || 40,
        boxWidth: product.boxWidth || 30,
        boxHeight: product.boxHeight || 30,
        boxWeight: product.boxWeight || 10,
        boxType: getVal('boxType', 'Standard'),
        fulfillmentLength: getVal('fulfillmentLength', product.boxLength || 0),
        fulfillmentWidth: getVal('fulfillmentWidth', product.boxWidth || 0),
        fulfillmentHeight: getVal('fulfillmentHeight', product.boxHeight || 0),

        restockCartons: product.restockCartons || 0,
        totalRestockUnits: initialRestock,
        variantRestockMap: savedMap,

        logisticsMethod: getLog('method', 'Sea'),
        logisticsCarrier: getLog('carrier', ''),
        shippingRate: getLog('shippingRate', 10),
        quoteCurrency: getVal('quoteCurrency', 'RMB'),
        exchangeRateLock: getVal('exchangeRateLock', false),
        exchangeRate: (product as any).exchangeRate || 7.2,
        minChargeableWeight: getVal('minChargeableWeight', 0),
        volumetricDivisor: getVal('volumetricDivisor', 6000),
        customsMode: getVal('customsMode', 'DDP'),
        customsDutyRate: getVal('customsDutyRate', 0),
        riskBufferCostCNY: getVal('riskBufferCostCNY', 0),
        logisticsTag: getVal('logisticsTag', 'Stable'),
        destinationWarehouse: getLog('destination', 'US-WEST'),

        sellingPriceUSD: getFin('sellingPrice', product.price),
        platformCommissionRate: product.platformCommission ?? 15,
        paymentFeeRate: getVal('paymentFeeRate', 3),
        fbaFeeUSD: product.orderFixedFee || 4.5,
        lastMileShippingUSD: product.lastMileShipping || 0,
        storageFeeUSD: getVal('storageFeeUSD', 0.2),
        returnRate: product.returnRate ?? 5,
        actualReturnCostUSD: getVal('actualReturnCostUSD', 8.0), 
        payoutCycleDays: getVal('payoutCycleDays', 14),
        adCostPerUnitUSD: getFin('adCost', 5),

        costLock: getVal('costLock', false),
        source: (product as any).source || 'manual',

        logisticsRecords: getVal('logisticsRecords', []),
        batchAttribution: getVal('batchAttribution', [])
      };
  });

  // --- ENGINE: Master Financial Calculation ---
  const masterMetrics = useMemo(() => {
    const rate = formData.exchangeRate || 7.2;
    
    // Procurement
    const effectiveUnitCostCNY = formData.unitCostCNY / (1 - (formData.procurementLossRate / 100));
    const effectiveUnitCostUSD = effectiveUnitCostCNY / rate;

    // Logistics
    const boxVolWeight = (formData.boxLength * formData.boxWidth * formData.boxHeight) / formData.volumetricDivisor;
    const boxRealWeight = formData.boxWeight;
    const boxChargeable = Math.max(boxVolWeight, boxRealWeight);
    const shipmentChargeableRaw = boxChargeable * formData.restockCartons;
    const finalShipmentChargeable = Math.max(shipmentChargeableRaw, formData.minChargeableWeight);
    
    const baseShippingRate = formData.quoteCurrency === 'RMB' ? formData.shippingRate : formData.shippingRate * rate;
    const totalShippingCNY = finalShipmentChargeable * baseShippingRate;
    const totalDutyCNY = (effectiveUnitCostCNY * formData.totalRestockUnits) * (formData.customsDutyRate / 100);
    const totalBufferCNY = formData.riskBufferCostCNY;
    
    const totalLogisticsCNY = totalShippingCNY + totalDutyCNY + totalBufferCNY;
    const unitLogisticsUSD = formData.totalRestockUnits > 0 ? (totalLogisticsCNY / formData.totalRestockUnits) / rate : 0;

    // Profit
    const revenue = formData.sellingPriceUSD;
    const platformFee = revenue * (formData.platformCommissionRate / 100);
    const paymentFee = revenue * (formData.paymentFeeRate / 100);
    const weightedReturnCost = formData.actualReturnCostUSD * (formData.returnRate / 100);
    const fulfillmentTotal = formData.fbaFeeUSD + formData.lastMileShippingUSD + formData.storageFeeUSD;
    
    const totalUnitCostUSD = effectiveUnitCostUSD + unitLogisticsUSD + platformFee + paymentFee + fulfillmentTotal + formData.adCostPerUnitUSD + weightedReturnCost;
    const unitProfit = revenue - totalUnitCostUSD;
    const grossMargin = revenue > 0 ? (unitProfit / revenue) * 100 : 0;
    const roi = totalUnitCostUSD > 0 ? (unitProfit / totalUnitCostUSD) * 100 : 0;

    // Safety
    let safetyStatus: 'Safe' | 'Scale' | 'Risk' | 'Critical' = 'Risk';
    if (grossMargin >= 40 && roi >= 100) safetyStatus = 'Safe';
    else if (grossMargin >= 25) safetyStatus = 'Scale';
    else if (grossMargin >= 10) safetyStatus = 'Risk';
    else safetyStatus = 'Critical';

    return {
        effectiveUnitCostUSD,
        unitLogisticsUSD,
        platformFee,
        paymentFee,
        fulfillmentTotal,
        weightedReturnCost,
        totalUnitCostUSD,
        unitProfit,
        grossMargin,
        roi,
        safetyStatus,
        boxVolWeight,
        boxChargeable,
        finalShipmentChargeable,
        isVolumetric: boxVolWeight > boxRealWeight,
        breakdown: [
            { name: 'Goods', value: effectiveUnitCostUSD, color: '#3b82f6' }, 
            { name: 'Logistics', value: unitLogisticsUSD, color: '#8b5cf6' },
            { name: 'Platform', value: platformFee + paymentFee, color: '#f59e0b' },
            { name: 'Fulfill', value: fulfillmentTotal, color: '#10b981' },
            { name: 'Ads', value: formData.adCostPerUnitUSD, color: '#ef4444' },
            { name: 'Return', value: weightedReturnCost, color: '#71717a' },
        ]
    };
  }, [formData]);

  const handleChange = (field: keyof SKUFormDataV2, value: any) => {
      if (formData.costLock) return;
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveWrapper = () => {
      onSave({
          ...product,
          ...formData,
          financials: {
              costOfGoods: formData.unitCostCNY,
              sellingPrice: formData.sellingPriceUSD,
              shippingCost: parseFloat(masterMetrics.unitLogisticsUSD.toFixed(2)),
              platformFee: parseFloat(masterMetrics.platformFee.toFixed(2)),
              adCost: formData.adCostPerUnitUSD,
              otherCost: parseFloat(masterMetrics.weightedReturnCost.toFixed(2))
          },
          logistics: {
              method: formData.logisticsMethod,
              carrier: formData.logisticsCarrier,
              trackingNo: product.logistics?.trackingNo || '',
              status: product.logistics?.status || 'Pending',
              shippingRate: formData.shippingRate,
              manualChargeableWeight: masterMetrics.finalShipmentChargeable / (formData.totalRestockUnits || 1)
          }
      });
  };

  // --- Helper to calculate Variant Metrics ---
  const getVariantMetrics = (v: VariantOverride) => {
      // Inherit or Override
      const sellingPrice = v.priceOverride ?? formData.sellingPriceUSD;
      const fbaFee = v.fbaFeeOverride ?? formData.fbaFeeUSD;
      const adCost = v.adCostOverride ?? formData.adCostPerUnitUSD;
      const returnRate = v.returnRateOverride ?? formData.returnRate;
      
      // We assume unit cost and logistics unit cost are inherited (complex allocation logic omitted for brevity)
      const unitCost = masterMetrics.effectiveUnitCostUSD;
      const logisticsCost = masterMetrics.unitLogisticsUSD; 
      
      const platformFee = sellingPrice * (formData.platformCommissionRate / 100);
      const paymentFee = sellingPrice * (formData.paymentFeeRate / 100);
      const returnCost = formData.actualReturnCostUSD * (returnRate / 100);
      
      const totalCost = unitCost + logisticsCost + platformFee + paymentFee + fbaFee + formData.lastMileShippingUSD + formData.storageFeeUSD + adCost + returnCost;
      const profit = sellingPrice - totalCost;
      const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
      
      return { profit, margin, totalCost };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-[95vw] h-[95vh] max-w-[1600px] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-300">
        
        {/* --- HEADER --- */}
        <div className="h-16 px-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 backdrop-blur-xl z-20">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-sm">
                    <Box size={20} strokeWidth={1.5} />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-white font-semibold tracking-tight text-lg">{formData.name}</h2>
                        {formData.source === 'imported' && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/20 flex items-center gap-1">
                                <Info size={10}/> Imported
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-medium">
                            {formData.lifecycle}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mt-0.5">
                        <span>SKU: {formData.sku}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    {['overview', 'matrix', 'logs'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveSection(tab as any)}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                activeSection === tab 
                                ? 'bg-zinc-800 text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="h-6 w-px bg-zinc-800 mx-2"></div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors">
                    <X size={20} strokeWidth={1.5} />
                </button>
                <button onClick={handleSaveWrapper} className="px-6 py-2 bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors shadow-lg shadow-white/5">
                    Save Changes
                </button>
            </div>
        </div>

        {/* --- MAIN CONTENT (Single Page Cockpit) --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-zinc-950">
            {activeSection === 'overview' && (
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* 1. MASTER CONFIGURATION ROW */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Supply Chain */}
                    <div className="col-span-12 xl:col-span-3">
                        <SectionCard title="供应链与包装 (Master Supply)" icon={Factory}>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                                        <ImageUpload currentImage={formData.imageUrl} onImageChange={url => handleChange('imageUrl', url)} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <V2Input label="Supplier" value={formData.supplierName} onChange={v => handleChange('supplierName', v)} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <V2Input label="MOQ" type="number" value={formData.moq} onChange={v => handleChange('moq', Number(v))} />
                                            <V2Input label="Lead Time" type="number" value={formData.leadTimeProduction} onChange={v => handleChange('leadTimeProduction', Number(v))} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-zinc-400">Unit Cost (CNY)</span>
                                        <input 
                                            type="number" 
                                            value={formData.unitCostCNY} 
                                            onChange={e => handleChange('unitCostCNY', parseFloat(e.target.value))}
                                            className="w-20 bg-transparent text-right font-mono font-bold outline-none text-white" 
                                        />
                                    </div>
                                    <div className="h-px bg-zinc-800 w-full mb-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-zinc-500 uppercase">Loss Rate %</span>
                                        <input 
                                            type="number" 
                                            value={formData.procurementLossRate} 
                                            onChange={e => handleChange('procurementLossRate', parseFloat(e.target.value))}
                                            className="w-12 bg-transparent text-xs text-red-400 font-mono outline-none text-right"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <V2Input label="Unit Wgt (kg)" type="number" value={formData.unitWeight} onChange={v => handleChange('unitWeight', Number(v))} />
                                    <V2Input label="Gross Wgt (kg)" type="number" value={formData.packageWeight} onChange={v => handleChange('packageWeight', Number(v))} />
                                </div>
                                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded flex justify-between text-[10px] text-zinc-500">
                                    <span>{formData.itemsPerBox} pcs/box</span>
                                    <span>Box: {formData.boxLength}x{formData.boxWidth}x{formData.boxHeight}</span>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Logistics Config */}
                    <div className="col-span-12 xl:col-span-4">
                        <SectionCard title="物流与关务 (Logistics Rules)" icon={Truck}>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <V2Select label="Method" value={formData.logisticsMethod} onChange={v => handleChange('logisticsMethod', v)} options={['Sea', 'Air', 'Rail', 'Truck']} />
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Rate ({formData.quoteCurrency}/kg)</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                value={formData.shippingRate} 
                                                onChange={e => handleChange('shippingRate', Number(e.target.value))}
                                                className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm font-mono font-bold text-white outline-none"
                                            />
                                            <select value={formData.quoteCurrency} onChange={e => handleChange('quoteCurrency', e.target.value)} className="bg-zinc-900 text-[10px] h-10 rounded border border-zinc-800 outline-none">
                                                <option value="RMB">¥</option><option value="USD">$</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                                        <span>Single Shipment Analysis</span>
                                        <span>Billable: {masterMetrics.finalShipmentChargeable.toFixed(1)} kg</span>
                                    </div>
                                    <div className="h-8 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center relative overflow-hidden">
                                        <div className="h-full bg-blue-600/20 border-r border-blue-600/50 absolute left-0" style={{ width: `${Math.min((formData.boxWeight * formData.restockCartons / masterMetrics.finalShipmentChargeable) * 100, 100)}%` }}></div>
                                        <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-mono pointer-events-none">
                                            <span className="text-blue-400">Real</span>
                                            <span className="text-orange-400">Vol</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <V2Input label="Min Weight (kg)" type="number" value={formData.minChargeableWeight} onChange={v => handleChange('minChargeableWeight', Number(v))} />
                                    <V2Input label="Duty Rate %" type="number" value={formData.customsDutyRate} onChange={v => handleChange('customsDutyRate', Number(v))} />
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Financial Config */}
                    <div className="col-span-12 xl:col-span-5">
                        <SectionCard title="利润模型 (Profit Model)" icon={DollarSign}>
                            <div className="flex gap-6 mb-6">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Selling Price ($)</label>
                                    <input type="number" value={formData.sellingPriceUSD} onChange={e => handleChange('sellingPriceUSD', parseFloat(e.target.value))} className="w-full h-12 bg-zinc-900 border border-zinc-700 rounded-xl px-4 text-2xl font-bold text-white outline-none focus:border-blue-500 transition-all"/>
                                </div>
                                <div className="text-right flex flex-col justify-end pb-1">
                                    <div className={`text-3xl font-semibold tracking-tighter ${masterMetrics.unitProfit > 0 ? 'text-white' : 'text-red-400'}`}>${masterMetrics.unitProfit.toFixed(2)}</div>
                                    <div className={`text-xs font-bold ${masterMetrics.safetyStatus === 'Safe' ? 'text-green-400' : 'text-orange-400'}`}>Net Profit / Unit</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <V2Input label="Plat. Fee %" type="number" value={formData.platformCommissionRate} onChange={v => handleChange('platformCommissionRate', Number(v))} />
                                <V2Input label="FBA/Ops $" type="number" value={formData.fbaFeeUSD} onChange={v => handleChange('fbaFeeUSD', Number(v))} />
                                <V2Input label="Ads $" type="number" value={formData.adCostPerUnitUSD} onChange={v => handleChange('adCostPerUnitUSD', Number(v))} />
                            </div>
                            <div className="h-20 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={masterMetrics.breakdown} layout="vertical" barSize={8}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={50} tick={{fill: '#71717a', fontSize: 9}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', fontSize: '10px'}} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {masterMetrics.breakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </SectionCard>
                    </div>
                </div>

                {/* 2. VARIANT MATRIX (NEW Embedded Block) */}
                <SectionCard title="SKU 变体配置 (Variant Matrix)" icon={ListTree}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900 text-[10px] font-bold text-zinc-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Variant Name / SKU</th>
                                    <th className="px-4 py-3">Weight (kg)</th>
                                    <th className="px-4 py-3">Sell Price ($)</th>
                                    <th className="px-4 py-3">FBA/Ops ($)</th>
                                    <th className="px-4 py-3">Ad Cost ($)</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Net Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {formData.variants.map((v, i) => {
                                    const metrics = getVariantMetrics(v);
                                    return (
                                        <tr key={v.id} className="group hover:bg-zinc-900/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-white">{v.name}</div>
                                                <div className="text-[10px] font-mono text-zinc-500">{v.sku}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    placeholder={formData.unitWeight.toString()} 
                                                    value={v.weightOverride ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                                        const newVars = [...formData.variants];
                                                        newVars[i] = { ...v, weightOverride: val };
                                                        handleChange('variants', newVars);
                                                    }}
                                                    className="w-20 bg-transparent border-b border-zinc-800 focus:border-blue-500 outline-none text-zinc-300 placeholder-zinc-700 text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    placeholder={formData.sellingPriceUSD.toString()} 
                                                    value={v.priceOverride ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                                        const newVars = [...formData.variants];
                                                        newVars[i] = { ...v, priceOverride: val };
                                                        handleChange('variants', newVars);
                                                    }}
                                                    className="w-20 bg-transparent border-b border-zinc-800 focus:border-green-500 outline-none text-green-400 placeholder-zinc-800 text-sm font-bold"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    placeholder={formData.fbaFeeUSD.toString()} 
                                                    value={v.fbaFeeOverride ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                                        const newVars = [...formData.variants];
                                                        newVars[i] = { ...v, fbaFeeOverride: val };
                                                        handleChange('variants', newVars);
                                                    }}
                                                    className="w-20 bg-transparent border-b border-zinc-800 focus:border-blue-500 outline-none text-zinc-300 placeholder-zinc-700 text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    placeholder={formData.adCostPerUnitUSD.toString()} 
                                                    value={v.adCostOverride ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                                        const newVars = [...formData.variants];
                                                        newVars[i] = { ...v, adCostOverride: val };
                                                        handleChange('variants', newVars);
                                                    }}
                                                    className="w-20 bg-transparent border-b border-zinc-800 focus:border-blue-500 outline-none text-zinc-300 placeholder-zinc-700 text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-mono font-bold ${metrics.profit > 0 ? 'text-white' : 'text-red-400'}`}>
                                                    ${metrics.profit.toFixed(2)}
                                                </span>
                                                <div className="text-[9px] text-zinc-500">{metrics.margin.toFixed(1)}%</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {formData.variants.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-600 text-xs italic">无变体数据 (No Variants Configured)</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>

                {/* 3. LOGISTICS EXECUTION (NEW Embedded Block) */}
                <SectionCard title="物流与入库执行 (Execution Records)" icon={Anchor}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-900 text-[10px] font-bold text-zinc-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Status / Date</th>
                                    <th className="px-4 py-3">Method / Carrier</th>
                                    <th className="px-4 py-3">Tracking / Inbound ID</th>
                                    <th className="px-4 py-3 text-center">Sent</th>
                                    <th className="px-4 py-3 text-center">Rcvd</th>
                                    <th className="px-4 py-3 text-center rounded-r-lg">Diff</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {formData.logisticsRecords?.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-zinc-900/30">
                                        <td className="px-4 py-3">
                                            <div className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${
                                                rec.status === 'Delivered' ? 'border-green-800 bg-green-900/20 text-green-400' : 
                                                rec.status === 'In Transit' ? 'border-blue-800 bg-blue-900/20 text-blue-400' : 
                                                'border-zinc-700 bg-zinc-800 text-zinc-400'
                                            }`}>
                                                {rec.status}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-1">{rec.shipDate}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-white font-bold">{rec.method}</div>
                                            <div className="text-zinc-500">{rec.carrier}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono">
                                            <div className="text-blue-400">{rec.trackingNos[0]}</div>
                                            <div className="text-zinc-500 text-[10px]">{rec.inboundId}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-zinc-300">{rec.sentQty}</td>
                                        <td className="px-4 py-3 text-center text-white font-bold">{rec.receivedQty}</td>
                                        <td className="px-4 py-3 text-center">
                                            {rec.sentQty - rec.receivedQty !== 0 ? (
                                                <span className="text-red-400 font-bold">{rec.receivedQty - rec.sentQty}</span>
                                            ) : <span className="text-green-500"><CheckCircle2 size={12} className="inline"/></span>}
                                        </td>
                                    </tr>
                                ))}
                                {(!formData.logisticsRecords || formData.logisticsRecords.length === 0) && (
                                    <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-600 text-xs italic">暂无执行记录</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>

                {/* 4. BATCH ATTRIBUTION (NEW Embedded Block) */}
                <SectionCard title="批次利润归因 (Batch Attribution)" icon={History}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formData.batchAttribution?.map(batch => (
                            <div key={batch.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl relative group hover:border-zinc-700 transition-colors">
                                <div className="absolute top-4 right-4 text-zinc-600">
                                    {batch.status === 'Locked' ? <Lock size={14}/> : <Unlock size={14}/>}
                                </div>
                                <div className="text-xs font-bold text-zinc-400 uppercase mb-1">{batch.batchName}</div>
                                <div className="text-sm font-bold text-white mb-3">{batch.skuId}</div>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Locked Unit Cost</span>
                                        <span className="font-mono text-zinc-300">${batch.lockedUnitCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Locked Profit</span>
                                        <span className={`font-mono font-bold ${batch.lockedProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${batch.lockedProfit.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex gap-2">
                                    <span className="bg-black/30 px-1.5 rounded">{batch.trackingRef}</span>
                                    <span className="bg-black/30 px-1.5 rounded">{batch.inboundRef}</span>
                                </div>
                            </div>
                        ))}
                        {(!formData.batchAttribution || formData.batchAttribution.length === 0) && (
                            <div className="col-span-full py-8 text-center text-zinc-600 text-xs italic border border-dashed border-zinc-800 rounded-xl">
                                暂无批次归因数据 (No Batch History)
                            </div>
                        )}
                    </div>
                </SectionCard>

            </div>
            )}

            {activeSection === 'matrix' && (
                <div className="flex items-center justify-center h-full text-zinc-600 font-medium">Matrix View Placeholder</div>
            )}
            
            {activeSection === 'logs' && (
                <div className="flex items-center justify-center h-full text-zinc-600 font-medium">Inventory Logs Placeholder</div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- V2 UI Components (Apple Style) ---

const SectionCard = ({ title, icon: Icon, children }: any) => (
    <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-6 shadow-sm hover:border-zinc-700 transition-colors">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Icon size={16} strokeWidth={2} className="text-zinc-500" /> {title}
        </h3>
        {children}
    </div>
);

const V2Input = ({ label, type = "text", value, onChange }: any) => (
    <div className="space-y-1 w-full group">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide group-focus-within:text-blue-500 transition-colors">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none focus:bg-zinc-800 focus:border-zinc-600 transition-all placeholder-zinc-700"
        />
    </div>
);

const V2Select = ({ label, value, onChange, options }: any) => (
    <div className="space-y-1 w-full group">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide group-focus-within:text-blue-500 transition-colors">{label}</label>
        <div className="relative">
            <select 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none focus:bg-zinc-800 focus:border-zinc-600 transition-all appearance-none cursor-pointer"
            >
                {options.map((opt: string) => <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <ArrowRightLeft size={12} className="rotate-90"/>
            </div>
        </div>
    </div>
);

export default SKUDetailEditor;
