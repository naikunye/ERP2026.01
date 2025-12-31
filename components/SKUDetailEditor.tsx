import React, { useState, useMemo, useEffect } from 'react';
import { Product, Currency } from '../types';
import { 
  X, Save, History, Box, Layers, Truck, 
  DollarSign, TrendingUp, Calculator, Package, 
  Scale, Anchor, Globe, Share2, AlertCircle
} from 'lucide-react';

interface SKUDetailEditorProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: any) => void;
}

// Complex Interface for the detailed form state
interface SKUFormData {
  // M1: Product & Supply Chain
  lifecycle: 'Growing' | 'Stable' | 'Declining';
  leadTimeProduction: number;
  leadTimeShipping: number;
  safetyStockDays: number;
  restockDate: string;

  // M2: Procurement (CRM)
  supplierName: string;
  supplierContact: string;
  unitCost: number; // Purchase Price
  unitWeight: number; // kg
  dailySales: number;

  // M3: Boxing & Inbound
  boxLength: number; // cm
  boxWidth: number;
  boxHeight: number;
  boxWeight: number; // kg
  itemsPerBox: number;
  restockCartons: number;
  inboundId: string;

  // M4: First Leg Logistics
  transportMethod: 'Air' | 'Sea';
  carrier: string;
  trackingNo: string;
  shippingRate: number; // per kg
  destinationWarehouse: string;

  // M5: Market & Sales
  sellingPrice: number;
  tiktokCommission: number; // %
  fulfillmentFee: number; // fixed amount
  adCostPerUnit: number; // CPA
}

const SKUDetailEditor: React.FC<SKUDetailEditorProps> = ({ product, onClose, onSave }) => {
  // Initialize with product data + mock defaults for the new fields
  const [formData, setFormData] = useState<SKUFormData>({
    lifecycle: 'Growing',
    leadTimeProduction: 15,
    leadTimeShipping: 30,
    safetyStockDays: 14,
    restockDate: new Date().toISOString().split('T')[0],
    supplierName: '深圳科技实业有限公司',
    supplierContact: 'WeChat: sz_tech_001',
    unitCost: product.price * 0.3,
    unitWeight: 0.5,
    dailySales: Math.floor(Math.random() * 20) + 5,
    boxLength: 50,
    boxWidth: 40,
    boxHeight: 30,
    boxWeight: 12,
    itemsPerBox: 24,
    restockCartons: 10,
    inboundId: `IB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    transportMethod: 'Sea',
    carrier: '美森快船',
    trackingNo: '',
    shippingRate: 1.5, // $1.5 per kg for sea
    destinationWarehouse: 'US-WEST-01',
    sellingPrice: product.price,
    tiktokCommission: 5, // 5%
    fulfillmentFee: 4.5,
    adCostPerUnit: 8.0,
  });

  // --- Real-time Calculations ---
  const metrics = useMemo(() => {
    // 1. Inventory Analysis
    const totalRestockUnits = formData.restockCartons * formData.itemsPerBox;
    const currentAvailableDays = Math.floor(product.stock / (formData.dailySales || 1));
    
    // 2. Logistics Calcs
    const singleBoxVol = (formData.boxLength * formData.boxWidth * formData.boxHeight) / 6000; // Volumetric divisor
    const totalVolWeight = singleBoxVol * formData.restockCartons;
    const totalRealWeight = formData.boxWeight * formData.restockCartons;
    const chargeableWeight = Math.max(totalVolWeight, totalRealWeight);
    const totalShippingCost = chargeableWeight * formData.shippingRate;
    const unitShippingCost = totalShippingCost / (totalRestockUnits || 1);
    
    // 3. Profit Analysis
    const revenue = formData.sellingPrice;
    const commissionCost = (formData.sellingPrice * formData.tiktokCommission) / 100;
    const totalUnitCost = formData.unitCost + unitShippingCost + commissionCost + formData.fulfillmentFee + formData.adCostPerUnit;
    const unitProfit = revenue - totalUnitCost;
    const netMargin = (unitProfit / revenue) * 100;
    const totalStockProfit = unitProfit * product.stock;

    return {
      totalRestockUnits,
      currentAvailableDays,
      chargeableWeight,
      totalShippingCost,
      unitShippingCost,
      totalUnitCost,
      unitProfit,
      netMargin,
      totalStockProfit,
      cbm: (formData.boxLength * formData.boxWidth * formData.boxHeight * formData.restockCartons) / 1000000
    };
  }, [formData, product.stock]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value
    }));
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
                 调整参数以重新校准智能补货建议。
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
                        <div className="w-20 h-20 rounded-xl bg-black/50 border border-white/10 overflow-hidden shrink-0">
                            <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="space-y-2 flex-1">
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
                             <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold">备货日期</label>
                                <input type="date" name="restockDate" value={formData.restockDate} onChange={handleChange} className="w-full h-8 bg-white/5 border border-white/10 rounded-lg text-xs px-2 text-white outline-none" />
                             </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="生产周期 (天)" name="leadTimeProduction" value={formData.leadTimeProduction} onChange={handleChange} />
                        <InputGroup label="运输周期 (天)" name="leadTimeShipping" value={formData.leadTimeShipping} onChange={handleChange} />
                        <InputGroup label="安全库存 (天)" name="safetyStockDays" value={formData.safetyStockDays} onChange={handleChange} />
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
                            <InputGroup label="采购单价 ($)" name="unitCost" value={formData.unitCost} highlight="text-neon-blue" onChange={handleChange} />
                            <InputGroup label="单件重量 (kg)" name="unitWeight" value={formData.unitWeight} onChange={handleChange} />
                        </div>
                        
                        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between border border-white/5">
                            <div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase">日均销量</div>
                                <div className="text-lg font-bold text-white">{formData.dailySales} <span className="text-xs text-gray-600">件/天</span></div>
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
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                         <InputGroup label="补货箱数" name="restockCartons" value={formData.restockCartons} highlight="text-white bg-white/10 rounded px-2" onChange={handleChange} />
                         <InputGroup label="入库单号" name="inboundId" value={formData.inboundId} type="text" onChange={handleChange} />
                    </div>
                    <div className="mt-4 flex gap-4 text-[10px] font-mono text-gray-500 bg-black/20 p-2 rounded-lg">
                        <span>总体积: {metrics.cbm.toFixed(2)} m³</span>
                        <span>总件数: {metrics.totalRestockUnits}</span>
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
                                 <InputGroup label="费率 ($/kg)" name="shippingRate" value={formData.shippingRate} onChange={handleChange} />
                                 <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold">计费重</label>
                                    <div className="text-sm font-bold text-white font-mono">{metrics.chargeableWeight.toFixed(1)} kg</div>
                                 </div>
                             </div>
                             <div className="pt-2 border-t border-neon-yellow/10 flex justify-between items-center">
                                 <span className="text-xs font-bold text-neon-yellow">总运费</span>
                                 <span className="text-lg font-bold text-white font-display">${metrics.totalShippingCost.toFixed(2)}</span>
                             </div>
                         </div>
                         
                         <InputGroup label="目的仓" name="destinationWarehouse" value={formData.destinationWarehouse} type="text" onChange={handleChange} />
                    </div>
                </section>

                {/* Module 5: Market Intel */}
                <section className="glass-card p-6 border-l-4 border-l-neon-pink group hover:border-white/20 transition-all">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Share2 size={16} className="text-neon-pink" /> 市场与 TikTok 成本
                    </h3>
                    <div className="space-y-5">
                         <div className="flex items-center gap-4">
                              <InputGroup label="销售价 ($)" name="sellingPrice" value={formData.sellingPrice} highlight="text-neon-green text-xl" onChange={handleChange} />
                              <button className="h-10 px-3 mt-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-gray-400 flex items-center gap-2">
                                 <Anchor size={14}/> 竞品
                              </button>
                         </div>
                         
                         <div className="space-y-3 pt-2">
                             <div className="flex justify-between items-center">
                                 <span className="text-xs text-gray-400">佣金 ({formData.tiktokCommission}%)</span>
                                 <input 
                                    name="tiktokCommission"
                                    type="number"
                                    value={formData.tiktokCommission}
                                    onChange={handleChange}
                                    className="w-16 h-6 bg-transparent text-right text-xs font-bold text-white border-b border-white/20 outline-none focus:border-neon-pink"
                                 />
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-xs text-gray-400">履约费 ($)</span>
                                 <input 
                                    name="fulfillmentFee"
                                    type="number"
                                    value={formData.fulfillmentFee}
                                    onChange={handleChange}
                                    className="w-16 h-6 bg-transparent text-right text-xs font-bold text-white border-b border-white/20 outline-none focus:border-neon-pink"
                                 />
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-xs text-gray-400">广告费 (CPA) ($)</span>
                                 <input 
                                    name="adCostPerUnit"
                                    type="number"
                                    value={formData.adCostPerUnit}
                                    onChange={handleChange}
                                    className="w-16 h-6 bg-transparent text-right text-xs font-bold text-white border-b border-white/20 outline-none focus:border-neon-pink"
                                 />
                             </div>
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

                        <h3 className="text-sm font-bold text-neon-green uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
                            <Calculator size={16} /> 单品利润分析
                        </h3>

                        <div className="relative z-10 text-center space-y-2 mb-10">
                             <div className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">单品净利</div>
                             <div className="text-[56px] font-display font-bold text-white leading-none tracking-tight flex items-center justify-center gap-1">
                                 <span className="text-2xl text-neon-green mt-2">$</span>
                                 {metrics.unitProfit.toFixed(2)}
                             </div>
                             <div className={`text-sm font-bold inline-flex items-center gap-1 px-3 py-1 rounded-full ${metrics.netMargin > 15 ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-pink/10 text-neon-pink'}`}>
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
                                <span className="text-gray-500">总成本</span>
                                <span className="text-neon-pink font-bold">-${metrics.totalUnitCost.toFixed(2)}</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden w-full">
                                <div className="h-full bg-neon-pink" style={{ width: `${(metrics.totalUnitCost / formData.sellingPrice) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="mt-8 grid grid-cols-2 gap-2">
                             <CostItem label="货值" value={formData.unitCost} total={metrics.totalUnitCost} color="bg-blue-500" />
                             <CostItem label="运费" value={metrics.unitShippingCost} total={metrics.totalUnitCost} color="bg-yellow-500" />
                             <CostItem label="履约" value={formData.fulfillmentFee} total={metrics.totalUnitCost} color="bg-purple-500" />
                             <CostItem label="广告" value={formData.adCostPerUnit} total={metrics.totalUnitCost} color="bg-red-500" />
                        </div>
                    </section>
                    
                    {/* Total Stock Profit */}
                    <section className="glass-card p-6 flex items-center justify-between border-white/10">
                        <div>
                             <div className="text-[10px] text-gray-500 font-bold uppercase">库存总货值</div>
                             <div className="text-xl font-bold text-white">${(metrics.totalUnitCost * product.stock).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] text-gray-500 font-bold uppercase">潜在总利润</div>
                             <div className="text-xl font-bold text-neon-green">+${metrics.totalStockProfit.toLocaleString()}</div>
                        </div>
                    </section>

                    {/* Actions */}
                    <button 
                        onClick={() => onSave(formData)}
                        className="w-full py-4 bg-gradient-neon-green text-black rounded-xl font-bold text-sm shadow-glow-green hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> 保存配置
                    </button>
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

const CostItem = ({ label, value, total, color }: any) => (
    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
        <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
            <span className="text-[10px] text-gray-400">{label}</span>
        </div>
        <div className="text-xs font-bold text-white">${value.toFixed(2)}</div>
    </div>
)

export default SKUDetailEditor;