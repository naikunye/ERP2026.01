
import React, { useState, useMemo } from 'react';
import { Product, ProductStatus, Currency, ProductVariant, InventoryLog } from '../types';
import { 
  X, Check, Loader2, Layers, Box, Plus, Trash2, Calculator, TrendingUp, Search, History, ArrowRightLeft, Factory, Truck, Package
} from 'lucide-react';
import ImageUpload from './ImageUpload';

interface ProductEditorProps {
  onClose: () => void;
  onSave: (product: Product) => void;
  initialProduct?: Product | null;
  inventoryLogs?: InventoryLog[];
}

const ProductEditor: React.FC<ProductEditorProps> = ({ onClose, onSave, initialProduct, inventoryLogs = [] }) => {
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Product>>(
    initialProduct || {
      name: '',
      sku: '',
      price: 0,
      currency: Currency.USD,
      stock: 0,
      description: '',
      status: ProductStatus.Draft,
      marketplaces: [],
      category: '',
      variants: [],
      seoKeywords: [],
      imageUrl: '',
      exchangeRate: 7.2,
      supplier: '',
      moq: 100,
      leadTimeProduction: 15,
      procurementLossRate: 0,
      paymentTerms: '30/70',
      unitWeight: 0.1,
      itemsPerBox: 20,
      boxLength: 40,
      boxWidth: 30,
      boxHeight: 30,
      boxWeight: 10,
      logistics: {
          method: 'Sea',
          carrier: '',
          shippingRate: 10,
          minWeight: 0,
          customsMode: 'DDP',
          dutyRate: 0,
          riskBuffer: 2,
          volumetricDivisor: 6000
      }
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'price' || name === 'stock' || name === 'exchangeRate') ? parseFloat(value) : value
    }));
  };

  const handleNestedUpdate = (path: string, value: any) => {
      const keys = path.split('.');
      setFormData(prev => {
          if (keys.length === 2) {
              return { ...prev, [keys[0]]: { ...(prev[keys[0] as any] || {}), [keys[1]]: value } };
          }
          return { ...prev, [path]: value };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialProduct?.id || `PROD-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
      imageUrl: formData.imageUrl || `https://picsum.photos/400/400?random=${Math.random()}`,
      lifecycle: 'New',
      ...formData as Product
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-fade-in" onClick={onClose} />
      
      <div className="w-full max-w-6xl h-[95vh] glass-card flex flex-col animate-scale-in z-10 border-white/10 shadow-2xl relative overflow-hidden bg-zinc-950">
        
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center px-8 z-20 justify-between bg-zinc-900/40 backdrop-blur-md">
             <div className="flex items-center gap-4">
                 <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all" onClick={onClose}>
                    <X size={16} />
                 </button>
                 <h2 className="text-sm font-bold text-white tracking-wide">
                    {initialProduct ? '编辑资产 (Edit Asset)' : '新建资产 (New Asset)'}
                 </h2>
             </div>
             <button 
                onClick={handleSubmit} 
                className="px-6 py-2 bg-white text-black rounded-xl font-bold text-xs shadow-glow-white hover:scale-105 transition-all flex items-center gap-2"
            >
                <Check size={14} strokeWidth={3} />
                保存资产
            </button>
        </div>

        {/* Single Scrollable Page */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
            
            {/* Block 1: Basic Info */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-4">
                    <ImageUpload 
                        currentImage={formData.imageUrl} 
                        onImageChange={(newImg) => setFormData(prev => ({...prev, imageUrl: newImg}))}
                        productName={formData.name}
                    />
                </div>
                <div className="col-span-8 space-y-6">
                    <InputField label="产品名称 (Official Name)" name="name" value={formData.name} onChange={handleInputChange} placeholder="输入官方名称" />
                    <div className="grid grid-cols-2 gap-6">
                        <InputField label="SKU 代码" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="AUTO-GEN-001" isMono />
                        <InputField label="初始库存" type="number" name="stock" value={formData.stock} onChange={handleInputChange} />
                    </div>
                </div>
            </div>

            {/* Block 2: Supply Chain (Restore Logic) */}
            <Section title="产品与供应链" icon={Factory}>
                <div className="grid grid-cols-3 gap-8">
                    <InputField label="供应商名称" value={formData.supplier} onChange={v => handleNestedUpdate('supplier', v)} />
                    <InputField label="起订量 (MOQ)" type="number" value={formData.moq} onChange={v => handleNestedUpdate('moq', parseInt(v))} />
                    <InputField label="单价 (CNY)" type="number" value={(formData as any).financials?.costOfGoods} onChange={v => handleNestedUpdate('financials.costOfGoods', parseFloat(v))} />
                </div>
            </Section>

            {/* Block 3: Packaging */}
            <Section title="包装与装箱" icon={Package}>
                <div className="grid grid-cols-4 gap-6">
                    <InputField label="单品重量 (kg)" type="number" value={formData.unitWeight} onChange={v => handleNestedUpdate('unitWeight', parseFloat(v))} />
                    <InputField label="装箱数 (pcs)" type="number" value={formData.itemsPerBox} onChange={v => handleNestedUpdate('itemsPerBox', parseInt(v))} />
                    <InputField label="外箱重量 (kg)" type="number" value={formData.boxWeight} onChange={v => handleNestedUpdate('boxWeight', parseFloat(v))} />
                    <div className="grid grid-cols-3 gap-2">
                         <InputField label="L" minimal value={formData.boxLength} onChange={v => handleNestedUpdate('boxLength', parseFloat(v))} />
                         <InputField label="W" minimal value={formData.boxWidth} onChange={v => handleNestedUpdate('boxWidth', parseFloat(v))} />
                         <InputField label="H" minimal value={formData.boxHeight} onChange={v => handleNestedUpdate('boxHeight', parseFloat(v))} />
                    </div>
                </div>
            </Section>

            {/* Block 4: Logistics */}
            <Section title="头程物流配置" icon={Truck}>
                <div className="grid grid-cols-3 gap-8">
                    <SelectField label="默认运输方式" value={formData.logistics?.method} onChange={v => handleNestedUpdate('logistics.method', v)} options={['Sea', 'Air', 'Rail', 'Truck']} />
                    <InputField label="物流单价 (RMB/kg)" type="number" value={formData.logistics?.shippingRate} onChange={v => handleNestedUpdate('logistics.shippingRate', parseFloat(v))} />
                    <InputField label="预估关税率 (%)" type="number" value={formData.logistics?.dutyRate} onChange={v => handleNestedUpdate('logistics.dutyRate', parseFloat(v))} />
                </div>
            </Section>

            {/* Block 5: Financial Lab (Embedded) */}
            <Section title="利润实验室" icon={Calculator}>
                <div className="grid grid-cols-3 gap-8">
                    <InputField label="建议售价 ($)" type="number" value={formData.price} onChange={v => handleNestedUpdate('price', parseFloat(v))} />
                    <InputField label="平台佣金 (%)" type="number" value={formData.platformCommission} onChange={v => handleNestedUpdate('platformCommission', parseFloat(v))} />
                    <InputField label="广告单次成本 ($)" type="number" value={formData.adCostPerUnit} onChange={v => handleNestedUpdate('adCostPerUnit', parseFloat(v))} />
                </div>
            </Section>

        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---
const Section = ({ title, icon: Icon, children }: any) => (
    <div className="space-y-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
            <Icon size={14} className="text-white" /> {title}
        </h3>
        <div className="p-8 bg-zinc-900 rounded-[32px] border border-white/5">{children}</div>
    </div>
);

const InputField = ({ label, type = "text", name, value, onChange, placeholder, isMono, minimal }: any) => (
    <div className="space-y-1.5">
        {!minimal && <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>}
        <input 
            type={type} 
            name={name}
            value={value} 
            onChange={e => onChange(name ? e : e.target.value)} 
            placeholder={placeholder || (minimal ? label : '')}
            className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 text-sm font-bold text-white outline-none focus:border-white/20 transition-all ${minimal ? 'h-9 text-xs text-center' : 'h-11'} ${isMono ? 'font-mono text-neon-blue' : ''}`}
        />
    </div>
);

const SelectField = ({ label, value, onChange, options }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
        <select 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm font-bold text-white focus:bg-white/10 outline-none appearance-none cursor-pointer"
        >
            {options.map((opt: string) => <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>)}
        </select>
    </div>
);

export default ProductEditor;
