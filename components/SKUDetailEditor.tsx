
import React, { useState, useMemo } from 'react';
import { Product, ProductVariant, ExecutionRecord, InventoryLog, Currency } from '../types';
import { 
  X, Save, Box, Truck, DollarSign, Package, 
  ArrowRightLeft, Factory, Plane, Ship, TrendingUp, ShieldCheck, 
  Clock, ListTree, Anchor, Container, Plus, Trash2, Edit3, 
  ChevronRight, Calculator, Activity, LayoutGrid, Scale
} from 'lucide-react';
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';

interface SKUDetailEditorProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
  onDelete?: () => void;
  inventoryLogs?: InventoryLog[];
  onChangeView?: (view: string) => void;
}

const SKUDetailEditor: React.FC<SKUDetailEditorProps> = ({ product, onClose, onSave, inventoryLogs = [] }) => {
  
  // --- 成本视角状态 ---
  const [costPerspective, setCostPerspective] = useState<'Theory' | 'Actual' | 'Weighted'>('Theory');

  // --- 数据持久化与映射 ---
  const [formData, setFormData] = useState<Product>(() => {
      const p = product;
      const oldFin = p.financials || {};
      const oldLog = (p as any).logistics || {};

      return {
        ...p,
        lifecycle: p.lifecycle || 'Growth',
        supplier: p.supplier || (p as any).supplierName || '',
        moq: p.moq || 100,
        leadTimeProduction: p.leadTimeProduction || 15,
        procurementLossRate: p.procurementLossRate || 0,
        paymentTerms: p.paymentTerms || '30/70',
        unitWeight: p.unitWeight || 0.1,
        packageWeight: p.packageWeight || (p.unitWeight || 0.1) * 1.1,
        itemsPerBox: p.itemsPerBox || 20,
        boxLength: p.boxLength || 40,
        boxWidth: p.boxWidth || 30,
        boxHeight: p.boxHeight || 30,
        boxWeight: p.boxWeight || 10,
        logistics: {
            method: oldLog.method || 'Sea',
            carrier: oldLog.carrier || '',
            shippingRate: oldLog.shippingRate || 10,
            minWeight: oldLog.minWeight || 0,
            customsMode: oldLog.customsMode || 'DDP',
            dutyRate: oldLog.dutyRate || 0,
            riskBuffer: oldLog.riskBuffer || 2,
            volumetricDivisor: oldLog.volumetricDivisor || 6000
        },
        price: p.price || oldFin.sellingPrice || 0,
        platformCommission: p.platformCommission || 15,
        fbaFee: p.fbaFee || (p as any).orderFixedFee || 4.5,
        adCostPerUnit: p.adCostPerUnit || oldFin.adCost || 5,
        returnRate: p.returnRate || 5,
        exchangeRate: p.exchangeRate || 7.2,
        variants: p.variants ? JSON.parse(JSON.stringify(p.variants)) : [],
        executionRecords: p.executionRecords || []
      };
  });

  // --- 财务计算引擎 (三维视角升级) ---
  const metrics = useMemo(() => {
    const rate = formData.exchangeRate || 7.2;
    
    // 1. 基础参数
    const theoryProcurementCNY = (formData as any).financials?.costOfGoods || 0;
    
    // 实际执行平均运费 (从执行记录中汇总)
    const activeRecords = formData.executionRecords?.filter(r => r.status === 'Received' || r.status === 'Delivered') || [];
    const avgActualShippingRate = activeRecords.length > 0 
        ? activeRecords.reduce((acc, r) => acc + (r.actualShippingRate || formData.logistics?.shippingRate || 0), 0) / activeRecords.length
        : formData.logistics?.shippingRate || 0;

    // 选择计算单价 (基于视角)
    const currentShippingRate = costPerspective === 'Actual' ? avgActualShippingRate : formData.logistics?.shippingRate || 0;

    // 2. 货值计算
    const unitProcurementUSD = (theoryProcurementCNY * (1 + (formData.procurementLossRate || 0) / 100)) / rate;

    // 3. 物流计算 (Master Logic)
    const boxVolWeight = (formData.boxLength! * formData.boxWidth! * formData.boxHeight!) / (formData.logistics?.volumetricDivisor || 6000);
    const boxRealWeight = formData.boxWeight || 0;
    const boxChargeable = Math.max(boxVolWeight, boxRealWeight);
    const unitShippingCNY = (boxChargeable / (formData.itemsPerBox || 1)) * currentShippingRate;
    const unitDutyUSD = (unitProcurementUSD * (formData.logistics?.dutyRate || 0)) / 100;
    const unitLogisticsUSD = (unitShippingCNY / rate) * (1 + (formData.logistics?.riskBuffer || 0) / 100) + unitDutyUSD;

    // 4. 运营成本
    const revenue = formData.price || 0;
    const platformFee = (revenue * (formData.platformCommission || 0)) / 100;
    const returnCost = (revenue * (formData.returnRate || 0)) / 100;
    const opsTotalUSD = platformFee + (formData.fbaFee || 0) + (formData.adCostPerUnit || 0) + returnCost;

    // 5. 最终利润
    const totalCostUSD = unitProcurementUSD + unitLogisticsUSD + opsTotalUSD;
    const profit = revenue - totalCostUSD;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
        unitProcurementUSD, unitLogisticsUSD, opsTotalUSD, totalCostUSD, profit, margin, boxVolWeight,
        breakdown: [
            { name: '商品 (Goods)', value: unitProcurementUSD, color: '#3b82f6' }, 
            { name: '物流 (Logistics)', value: unitLogisticsUSD, color: '#8b5cf6' },
            { name: '平台 (Platform)', value: platformFee + (formData.fbaFee || 0), color: '#f59e0b' },
            { name: '营销/退货 (Ads/Ret)', value: (formData.adCostPerUnit || 0) + returnCost, color: '#ef4444' },
        ]
    };
  }, [formData, costPerspective]);

  const handleUpdate = (field: string, value: any) => {
      setFormData(prev => {
          const keys = field.split('.');
          if (keys.length === 2) {
              return { ...prev, [keys[0]]: { ...(prev[keys[0] as keyof Product] as any), [keys[1]]: value } };
          }
          return { ...prev, [field]: value };
      });
  };

  const addVariant = () => {
      const newV: ProductVariant = {
          id: `V-${Date.now()}`,
          sku: `${formData.sku}-VAR${(formData.variants?.length || 0) + 1}`,
          name: '新规格 (New Spec)',
          price: formData.price,
          stock: 0,
          attributes: {}
      };
      setFormData(prev => ({ ...prev, variants: [...(prev.variants || []), newV] }));
  };

  const addExecution = () => {
      const newE: ExecutionRecord = {
          id: `EX-${Date.now()}`,
          batchNo: `BATCH-${new Date().toISOString().slice(0,10)}`,
          method: formData.logistics?.method || 'Sea',
          carrier: formData.logistics?.carrier || '',
          trackingNos: [''],
          inboundId: '',
          sentQty: 0,
          receivedQty: 0,
          status: 'In Transit',
          shipDate: new Date().toISOString().slice(0,10)
      };
      setFormData(prev => ({ ...prev, executionRecords: [...(prev.executionRecords || []), newE] }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xl animate-fade-in font-sans">
      <div className="w-[98vw] h-[98vh] max-w-[1700px] bg-zinc-950 border border-white/10 rounded-[40px] shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* --- 顶部操作栏 (Header) --- */}
        <div className="h-20 px-10 border-b border-white/5 flex items-center justify-between bg-zinc-900/40 backdrop-blur-xl z-20">
            <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-white shadow-xl">
                    <Box size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">{formData.name || '未命名 SKU'}</h2>
                    <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs font-mono font-medium text-zinc-500 bg-white/5 px-2 py-0.5 rounded">ID: {formData.sku}</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2 py-0.5 rounded-full">{formData.lifecycle}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                    <ArrowRightLeft size={14} className="text-zinc-500" />
                    <span className="text-xs font-bold text-zinc-400">当前汇率 (Rate):</span>
                    <input 
                        type="number" 
                        value={formData.exchangeRate} 
                        onChange={e => handleUpdate('exchangeRate', parseFloat(e.target.value))}
                        className="w-14 bg-transparent font-mono font-bold text-white outline-none"
                    />
                </div>
                <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
                    <X size={20} strokeWidth={2} />
                </button>
                <button onClick={() => onSave(formData)} className="px-8 py-3 bg-white text-black rounded-2xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow-white/10">
                    保存配置 (Save Asset)
                </button>
            </div>
        </div>

        {/* --- 核心配置单页 (Main Scrollable Body) --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-20 space-y-12">
            
            {/* 1. 利润驾驶舱 (Cockpit & Financial Perspective) */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 xl:col-span-8">
                    <div className="bg-zinc-900 rounded-[32px] p-8 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 text-white"><Calculator size={120} /></div>
                        
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <TrendingUp size={16} className="text-neon-green" /> 利润分析模型 (Profit Center)
                                </h3>
                                
                                {/* 视角切换 (Segmented Control) */}
                                <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 w-fit mb-6">
                                    {[
                                        { id: 'Theory', label: '理论成本 (Theory)' },
                                        { id: 'Actual', label: '实际成本 (Actual)' },
                                        { id: 'Weighted', label: '加权平均 (Weighted)' }
                                    ].map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setCostPerspective(opt.id as any)}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${costPerspective === opt.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-baseline gap-4">
                                    <span className={`text-6xl font-bold tracking-tighter ${metrics.profit > 0 ? 'text-white' : 'text-neon-pink'}`}>
                                        ${isNaN(metrics.profit) ? '0.00' : metrics.profit.toFixed(2)}
                                    </span>
                                    <span className={`text-xl font-bold ${metrics.margin > 20 ? 'text-neon-green' : 'text-zinc-500'}`}>
                                        {isNaN(metrics.margin) ? '0.0' : metrics.margin.toFixed(1)}% 预期毛利
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-zinc-500 uppercase mb-1">销售价格 (Selling Price)</div>
                                <div className="text-2xl font-bold flex items-center gap-2 justify-end">
                                    <span className="text-zinc-500">$</span>
                                    <input 
                                        type="number" 
                                        value={formData.price} 
                                        onChange={e => handleUpdate('price', parseFloat(e.target.value))}
                                        className="w-24 text-right bg-white/5 border-b-2 border-white/20 focus:border-neon-blue transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* iOS 堆叠条形图 */}
                        <div className="space-y-6 relative z-10">
                            <div className="h-6 w-full flex rounded-full overflow-hidden bg-white/5 shadow-inner">
                                {metrics.breakdown.map((b, i) => (
                                    <div key={i} style={{ width: `${(b.value / formData.price) * 100}%`, backgroundColor: b.color }} className="h-full border-r border-black/20 last:border-0" title={b.name} />
                                ))}
                                <div className="flex-1 bg-neon-green/10" />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {metrics.breakdown.map((b, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{b.name}</span>
                                        </div>
                                        <div className="text-sm font-bold text-white">${isNaN(b.value) ? '0.00' : b.value.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-4 grid grid-cols-2 gap-4">
                    <StatusCard title="当前现货" value={`${formData.stock} pcs`} sub="本地+海外仓" icon={Package} color="text-neon-blue" />
                    <StatusCard title="日均销量" value={`${formData.dailySales || 0} /D`} sub="近30天加权" icon={Activity} color="text-neon-purple" />
                    <StatusCard title="补货交期" value={`${formData.leadTimeProduction} 天`} sub="工厂生产周期" icon={Clock} color="text-zinc-500" />
                    <StatusCard title="运营状态" value={formData.status === 'Active' ? '在售' : '草稿'} sub="Market Status" icon={ShieldCheck} color={formData.status === 'Active' ? 'text-neon-green' : 'text-zinc-600'} />
                </div>
            </div>

            {/* 2. 供应链与包装 (Supply & Packaging) */}
            <div className="grid grid-cols-12 gap-8">
                <ConfigCard title="产品与供应链 (Master Supply)" icon={Factory} className="col-span-12 md:col-span-6">
                    <div className="space-y-5">
                        <InputField label="供应商名称 (Supplier)" value={formData.supplier!} onChange={v => handleUpdate('supplier', v)} />
                        <div className="grid grid-cols-2 gap-6">
                            <InputField label="起订量 (MOQ)" type="number" value={formData.moq!} onChange={v => handleUpdate('moq', parseInt(v))} />
                            <InputField label="生产交期 (Days)" type="number" value={formData.leadTimeProduction!} onChange={v => handleUpdate('leadTimeProduction', parseInt(v))} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <InputField label="采购单价 (CNY)" type="number" value={(formData as any).financials?.costOfGoods} onChange={v => handleUpdate('financials.costOfGoods', parseFloat(v))} highlight color="text-neon-pink" />
                            <InputField label="生产损耗率 (%)" type="number" value={formData.procurementLossRate!} onChange={v => handleUpdate('procurementLossRate', parseFloat(v))} />
                        </div>
                        <SelectField label="付款条件 (Payment Terms)" value={formData.paymentTerms!} onChange={v => handleUpdate('paymentTerms', v)} options={['100% Prepay', '30/70', 'Net 30', 'Net 60']} />
                    </div>
                </ConfigCard>

                <ConfigCard title="包装与外箱规格 (Packaging)" icon={Package} className="col-span-12 md:col-span-6">
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-6">
                            <InputField label="单品净重 (Net kg)" type="number" value={formData.unitWeight!} onChange={v => handleUpdate('unitWeight', parseFloat(v))} />
                            <InputField label="含包装毛重 (Gross kg)" type="number" value={formData.packageWeight!} onChange={v => handleUpdate('packageWeight', parseFloat(v))} />
                        </div>
                        <div className="p-5 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                             <div className="text-[10px] font-bold text-zinc-500 uppercase flex justify-between">
                                 <span>标准大货外箱 (Master Box)</span>
                                 <span className="text-white">材积重: {metrics.boxVolWeight.toFixed(2)} kg</span>
                             </div>
                             <div className="grid grid-cols-3 gap-3">
                                <InputField label="长 (L/cm)" type="number" value={formData.boxLength!} onChange={v => handleUpdate('boxLength', parseFloat(v))} minimal />
                                <InputField label="宽 (W/cm)" type="number" value={formData.boxWidth!} onChange={v => handleUpdate('boxWidth', parseFloat(v))} minimal />
                                <InputField label="高 (H/cm)" type="number" value={formData.boxHeight!} onChange={v => handleUpdate('boxHeight', parseFloat(v))} minimal />
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                                <InputField label="单箱总重 (kg)" type="number" value={formData.boxWeight!} onChange={v => handleUpdate('boxWeight', parseFloat(v))} />
                                <InputField label="每箱装箱数 (pcs)" type="number" value={formData.itemsPerBox!} onChange={v => handleUpdate('itemsPerBox', parseInt(v))} />
                             </div>
                        </div>
                    </div>
                </ConfigCard>
            </div>

            {/* 3. 头程物流配置 (Logistics) */}
            <ConfigCard title="头程物流运营配置 (Logistics Strategy)" icon={Truck} className="col-span-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-5">
                        <SelectField label="默认运输方式" value={formData.logistics?.method!} onChange={v => handleUpdate('logistics.method', v)} options={['Sea', 'Air', 'Rail', 'Truck']} />
                        <InputField label="指定物流商 (Carrier)" value={formData.logistics?.carrier!} onChange={v => handleUpdate('logistics.carrier', v)} />
                    </div>
                    <div className="space-y-5">
                        <InputField label="物流单价 (RMB/kg)" type="number" value={formData.logistics?.shippingRate!} onChange={v => handleUpdate('logistics.shippingRate', parseFloat(v))} highlight color="text-neon-blue" />
                        <InputField label="最低计费重 (Min Wt)" type="number" value={formData.logistics?.minWeight!} onChange={v => handleUpdate('logistics.minWeight', parseFloat(v))} />
                    </div>
                    <div className="space-y-5">
                        <SelectField label="清关方式" value={formData.logistics?.customsMode!} onChange={v => handleUpdate('logistics.customsMode', v)} options={['DDP', 'DDU']} />
                        <InputField label="预估关税率 (%)" type="number" value={formData.logistics?.dutyRate!} onChange={v => handleUpdate('logistics.dutyRate', parseFloat(v))} />
                    </div>
                    <div className="flex flex-col justify-center gap-4">
                        <div className="p-4 bg-neon-blue/5 border border-neon-blue/10 rounded-2xl">
                            <div className="text-[10px] font-bold text-neon-blue uppercase mb-2">物流风险缓冲 (Risk Buffer %)</div>
                            <div className="flex items-center justify-between">
                                <input 
                                    type="range" min="0" max="20" step="0.5"
                                    value={formData.logistics?.riskBuffer}
                                    onChange={e => handleUpdate('logistics.riskBuffer', parseFloat(e.target.value))}
                                    className="flex-1 accent-neon-blue mr-4"
                                />
                                <span className="text-sm font-mono font-bold text-white">{formData.logistics?.riskBuffer}%</span>
                            </div>
                        </div>
                        <div className="px-4 py-2 text-[10px] text-zinc-500 italic bg-white/5 rounded-xl border border-white/5">
                            * 自动计费逻辑：取“实际重量”与“体积重”之大者进行单价核算。
                        </div>
                    </div>
                </div>
            </ConfigCard>

            {/* 4. SKU 变体矩阵 (Variant Matrix) */}
            <ConfigCard 
                title="多变体 SKU 矩阵配置 (Variant Matrix)" 
                icon={ListTree}
                action={<button onClick={addVariant} className="px-5 py-2 bg-white text-black rounded-xl text-xs font-bold hover:opacity-90 flex items-center gap-2 transition-all"><Plus size={14}/> 添加子变体</button>}
            >
                <div className="overflow-x-auto -mx-8 px-8">
                    <table className="w-full text-left">
                        <thead className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th className="py-4 px-2 w-[25%]">变体信息 (Code/Spec)</th>
                                <th className="py-4 px-2 text-center">覆盖价格 ($)</th>
                                <th className="py-4 px-2 text-center">覆盖重量 (kg)</th>
                                <th className="py-4 px-2 text-center">独立 FBA 成本</th>
                                <th className="py-4 px-2 text-center">当前库存</th>
                                <th className="py-4 px-2 text-right">预计毛利</th>
                                <th className="py-4 px-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {formData.variants?.map((v, i) => (
                                <tr key={v.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-5 px-2">
                                        <input value={v.name} onChange={e => {
                                            const newV = [...formData.variants!];
                                            newV[i].name = e.target.value;
                                            handleUpdate('variants', newV);
                                        }} className="font-bold text-white text-sm bg-transparent outline-none focus:text-neon-blue w-full" />
                                        <div className="text-[10px] font-mono text-zinc-500 mt-1">{v.sku}</div>
                                    </td>
                                    <td className="py-5 px-2 text-center">
                                        <input type="number" placeholder={formData.price.toString()} value={v.priceOverride} onChange={e => {
                                            const newV = [...formData.variants!];
                                            newV[i].priceOverride = parseFloat(e.target.value);
                                            handleUpdate('variants', newV);
                                        }} className="w-24 text-center bg-white/5 border border-white/5 rounded-lg py-1.5 text-sm font-bold text-white outline-none focus:border-neon-blue" />
                                    </td>
                                    <td className="py-5 px-2 text-center">
                                        <input type="number" placeholder={formData.packageWeight?.toString()} value={v.weightOverride} onChange={e => {
                                            const newV = [...formData.variants!];
                                            newV[i].weightOverride = parseFloat(e.target.value);
                                            handleUpdate('variants', newV);
                                        }} className="w-20 text-center bg-white/5 border border-white/5 rounded-lg py-1.5 text-sm text-zinc-300 outline-none focus:border-neon-blue" />
                                    </td>
                                    <td className="py-5 px-2 text-center">
                                        <input type="number" placeholder={formData.fbaFee?.toString()} value={v.fbaFeeOverride} onChange={e => {
                                            const newV = [...formData.variants!];
                                            newV[i].fbaFeeOverride = parseFloat(e.target.value);
                                            handleUpdate('variants', newV);
                                        }} className="w-20 text-center bg-white/5 border border-white/5 rounded-lg py-1.5 text-sm text-zinc-300 outline-none focus:border-neon-blue" />
                                    </td>
                                    <td className="py-5 px-2 text-center font-bold text-sm text-zinc-400">{v.stock}</td>
                                    <td className="py-5 px-2 text-right">
                                        <span className="text-neon-green font-bold text-sm">24.8%</span>
                                    </td>
                                    <td className="py-5 px-2 text-right">
                                        <button className="text-zinc-600 hover:text-neon-pink opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                                    </td>
                                </tr>
                            ))}
                            {formData.variants?.length === 0 && (
                                <tr><td colSpan={7} className="py-12 text-center text-zinc-600 text-xs italic">无变体数据，变体将继承主 SKU 的采购与物流参数</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </ConfigCard>

            {/* 5. 物流与入库执行记录 (Execution Records) */}
            <ConfigCard 
                title="物流与入库执行记录 (Execution Records)" 
                icon={Anchor}
                action={<button onClick={addExecution} className="px-5 py-2 bg-neon-blue text-black rounded-xl text-xs font-bold hover:opacity-90 flex items-center gap-2 transition-all"><Plus size={14}/> 录入发货记录</button>}
            >
                <div className="overflow-x-auto -mx-8 px-8">
                    <table className="w-full text-left text-sm">
                        <thead className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th className="py-4 px-2">发货批次 (Batch No)</th>
                                <th className="py-4 px-2">运单号 (Tracking)</th>
                                <th className="py-4 px-2">入库单 (Inbound)</th>
                                <th className="py-4 px-2 text-center">发货数</th>
                                <th className="py-4 px-2 text-center">实收数</th>
                                <th className="py-4 px-2 text-center">状态</th>
                                <th className="py-4 px-2 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {formData.executionRecords?.map((rec, i) => (
                                <tr key={rec.id} className="hover:bg-white/5 group transition-colors">
                                    <td className="py-5 px-2">
                                        <div className="font-bold text-white">{rec.batchNo}</div>
                                        <div className="text-[10px] text-zinc-500 mt-0.5">{rec.shipDate}</div>
                                    </td>
                                    <td className="py-5 px-2">
                                        <div className="flex items-center gap-2 text-neon-blue font-mono text-xs">
                                            <Truck size={12}/> {rec.trackingNos[0] || '未录入'}
                                        </div>
                                    </td>
                                    <td className="py-5 px-2">
                                        <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs">
                                            <Container size={12}/> {rec.inboundId || '无单号'}
                                        </div>
                                    </td>
                                    <td className="py-5 px-2 text-center font-bold">{rec.sentQty}</td>
                                    <td className="py-5 px-2 text-center">
                                        <input type="number" value={rec.receivedQty} onChange={e => {
                                             const newR = [...formData.executionRecords!];
                                             newR[i].receivedQty = parseInt(e.target.value);
                                             handleUpdate('executionRecords', newR);
                                        }} className="w-16 text-center bg-white/5 border border-white/10 rounded-lg py-1 outline-none font-bold text-white focus:border-neon-green" />
                                    </td>
                                    <td className="py-5 px-2 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                                            rec.status === 'Received' ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : 'bg-neon-blue/10 text-neon-blue border-neon-blue/20'
                                        }`}>{rec.status}</span>
                                    </td>
                                    <td className="py-5 px-2 text-right">
                                        <button className="text-zinc-500 hover:text-white"><Edit3 size={14}/></button>
                                    </td>
                                </tr>
                            ))}
                            {formData.executionRecords?.length === 0 && (
                                <tr><td colSpan={7} className="py-12 text-center text-zinc-600 text-xs italic">暂无发货记录，此处数据将参与“实际成本”视角核算</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </ConfigCard>
        </div>
      </div>
    </div>
  );
};

// --- 子组件 (Sub-Components in Apple Pro Dark Style) ---

const ConfigCard = ({ title, icon: Icon, children, className, action }: any) => (
    <div className={`bg-zinc-900 rounded-[40px] p-8 border border-white/5 shadow-sm flex flex-col ${className}`}>
        <div className="flex justify-between items-center mb-10">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white border border-white/5">
                    <Icon size={16} />
                </div>
                {title}
            </h3>
            {action}
        </div>
        <div className="flex-1">{children}</div>
    </div>
);

const StatusCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-zinc-900 rounded-[32px] p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-all">
        <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-2xl bg-white/5 ${color} border border-white/5`}>
                <Icon size={20} />
            </div>
            <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        </div>
        <div className="mt-4">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{title}</div>
            <div className="text-xl font-bold text-white tracking-tight">{value}</div>
            <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>
        </div>
    </div>
);

const InputField = ({ label, type = "text", value, onChange, highlight, color, minimal }: any) => (
    <div className="space-y-2">
        {!minimal && <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>}
        <div className={`relative flex items-center ${minimal ? 'h-9' : 'h-12'}`}>
            <input 
                type={type} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                className={`w-full h-full bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white transition-all focus:bg-white/10 focus:border-white/20 outline-none ${highlight ? (color || 'text-neon-pink') : ''} ${minimal ? 'text-center px-1 text-xs' : ''}`}
                placeholder={minimal ? label : ''}
            />
        </div>
    </div>
);

const SelectField = ({ label, value, onChange, options }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative h-12">
            <select 
                value={value} 
                onChange={e => onChange(e.target.value)}
                className="w-full h-full bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer"
            >
                {options.map((opt: string) => <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <ChevronRight size={14} className="rotate-90" />
            </div>
        </div>
    </div>
);

export default SKUDetailEditor;
