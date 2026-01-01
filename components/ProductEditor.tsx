import React, { useState, useMemo } from 'react';
import { Product, ProductStatus, Currency, ProductVariant } from '../types';
import { 
  Sparkles, X, Globe, Check, Loader2, Image as ImageIcon, Activity, Layers, Cpu, Scan, 
  Terminal, Tag, Box, Plus, Trash2, DollarSign, Calculator, Wand2, TrendingUp, Search
} from 'lucide-react';
import { 
  generateProductDescription, 
  translateProductContent, 
  analyzeMarketFit, 
  optimizeProductTitle,
  generateSeoKeywords
} from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface ProductEditorProps {
  onClose: () => void;
  onSave: (product: Product) => void;
  initialProduct?: Product | null;
}

const ProductEditor: React.FC<ProductEditorProps> = ({ onClose, onSave, initialProduct }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'variants' | 'financials' | 'intelligence'>('details');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ score: number; reasoning: string } | null>(null);
  
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
      seoKeywords: []
    }
  );

  // Variant Generation State
  const [variantColor, setVariantColor] = useState('');
  const [variantSize, setVariantSize] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value
    }));
  };

  const handleFinancialChange = (key: string, value: string) => {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({
          ...prev,
          financials: {
              ...prev.financials,
              costOfGoods: 0,
              shippingCost: 0,
              otherCost: 0,
              sellingPrice: 0,
              platformFee: 0,
              adCost: 0,
              [key]: numValue
          } as any
      }));
  };

  // --- AI Actions ---
  const handleAiGenerate = async () => {
    if (!formData.name) return;
    setIsLoadingAi(true);
    const desc = await generateProductDescription(formData.name!, formData.category || 'General', 'Futuristic and Compelling, in Chinese');
    setFormData(prev => ({ ...prev, description: desc }));
    setIsLoadingAi(false);
  };

  const handleAiOptimizeTitle = async () => {
      if(!formData.name) return;
      setIsLoadingAi(true);
      const optimized = await optimizeProductTitle(formData.name, formData.category || '');
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

  const handleMarketAnalysis = async () => {
      if(!formData.name || !formData.price) return;
      setIsLoadingAi(true);
      const result = await analyzeMarketFit(formData.name, formData.price);
      setAiAnalysis(result);
      setIsLoadingAi(false);
  }

  // --- Variant Logic ---
  const handleAddVariant = () => {
      if(!variantColor || !variantSize) return;
      const newVariant: ProductVariant = {
          id: `VAR-${Date.now()}`,
          sku: `${formData.sku}-${variantColor.slice(0,2).toUpperCase()}-${variantSize}`,
          name: `${variantColor} / ${variantSize}`,
          price: formData.price || 0,
          stock: 0,
          attributes: { color: variantColor, size: variantSize }
      };
      setFormData(prev => ({
          ...prev,
          variants: [...(prev.variants || []), newVariant],
          hasVariants: true
      }));
      setVariantColor('');
      setVariantSize('');
  };

  const handleRemoveVariant = (id: string) => {
      setFormData(prev => ({
          ...prev,
          variants: prev.variants?.filter(v => v.id !== id)
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialProduct?.id || Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString(),
      imageUrl: initialProduct?.imageUrl || `https://picsum.photos/400/400?random=${Math.random()}`,
      ...formData as Product
    });
    onClose();
  };

  // --- Profit Calculation ---
  const profitMetrics = useMemo(() => {
      const f = formData.financials || { costOfGoods: 0, shippingCost: 0, otherCost: 0, sellingPrice: 0, platformFee: 0, adCost: 0 };
      // Fallback: If financials aren't set, use base price and estimated costs
      const sellingPrice = f.sellingPrice || formData.price || 0;
      const cost = f.costOfGoods + f.shippingCost + f.otherCost + f.platformFee + f.adCost;
      const profit = sellingPrice - cost;
      const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
      return { sellingPrice, cost, profit, margin, f };
  }, [formData]);

  const chartData = [
    { name: 'Cost', value: profitMetrics.f.costOfGoods, color: '#FF2975' },
    { name: 'Shipping', value: profitMetrics.f.shippingCost, color: '#B829FF' },
    { name: 'Fees/Ads', value: profitMetrics.f.platformFee + profitMetrics.f.adCost, color: '#29D9FF' },
    { name: 'Profit', value: profitMetrics.profit, color: '#00FF9D' }
  ].filter(d => d.value > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 perspective-1000">
      <div className="absolute inset-0 bg-[#050510]/90 backdrop-blur-xl animate-fade-in" onClick={onClose} />
      
      <div className="w-full max-w-6xl h-[90vh] glass-card flex flex-col animate-scale-in z-10 border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Top Navigation Bar */}
        <div className="h-16 border-b border-white/10 flex items-center px-6 z-20 justify-between bg-black/20 backdrop-blur-md">
             <div className="flex items-center gap-4">
                 <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all" onClick={onClose}>
                    <X size={16} />
                 </button>
                 <div className="h-6 w-px bg-white/10"></div>
                 <div>
                    <h2 className="text-sm font-bold text-white leading-none tracking-wide flex items-center gap-2">
                        {formData.name || 'Untitled Asset'}
                        {formData.hasVariants && <span className="px-1.5 py-0.5 rounded text-[9px] bg-neon-purple/20 text-neon-purple border border-neon-purple/30">MULTI-SKU</span>}
                    </h2>
                 </div>
             </div>
             
             {/* Tabs */}
             <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                {[
                    { id: 'details', label: '基础信息', icon: <Layers size={14} /> },
                    { id: 'variants', label: 'SKU 矩阵', icon: <Box size={14} /> },
                    { id: 'financials', label: '利润实验室', icon: <Calculator size={14} /> },
                    { id: 'intelligence', label: 'AI 营销', icon: <Cpu size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white/10 text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
             </div>

             <button 
                onClick={handleSubmit} 
                className="px-6 py-2 bg-neon-blue text-black rounded-lg font-bold text-xs shadow-glow-blue hover:scale-105 transition-all flex items-center gap-2"
            >
                <Check size={14} strokeWidth={3} />
                保存资产
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-black/30">
            <div className="max-w-5xl mx-auto p-8 pb-20">
                
                {activeTab === 'details' && (
                    <div className="grid grid-cols-12 gap-8 animate-fade-in">
                        {/* Left: Image & Quick Stats */}
                        <div className="col-span-12 md:col-span-4 space-y-6">
                            <div className="aspect-square rounded-2xl bg-black/40 border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group hover:border-neon-blue/30 transition-all cursor-pointer">
                                {formData.imageUrl ? (
                                    <img src={formData.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <ImageIcon className="text-gray-600 mb-2 group-hover:text-neon-blue group-hover:scale-110 transition-all" size={40} />
                                        <span className="text-xs text-gray-500 font-bold">上传主图</span>
                                    </>
                                )}
                            </div>
                            
                            <div className="glass-card p-4 border-white/5 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">创建时间</span>
                                    <span className="text-white font-mono">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">最后更新</span>
                                    <span className="text-white font-mono">{new Date().toLocaleTimeString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                                    <span className="text-gray-500">状态</span>
                                    <span className="text-neon-green font-bold">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Inputs */}
                        <div className="col-span-12 md:col-span-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">产品名称</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full h-14 px-5 input-glass rounded-xl text-lg font-bold tracking-wide placeholder-gray-600 focus:border-neon-blue"
                                    placeholder="输入产品名称 (Official Name)"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">SKU Code</label>
                                    <input
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                        className="w-full h-12 px-4 input-glass rounded-xl font-mono text-sm text-neon-blue"
                                        placeholder="AUTO-GEN-001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Category</label>
                                    <input
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full h-12 px-4 input-glass rounded-xl text-sm"
                                        placeholder="e.g. Electronics"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">产品描述</label>
                                    <button onClick={handleAiGenerate} disabled={isLoadingAi} className="text-[10px] text-neon-blue hover:text-white flex items-center gap-1">
                                        {isLoadingAi ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} AI Writer
                                    </button>
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full h-40 p-4 input-glass rounded-xl text-sm leading-relaxed resize-none focus:border-neon-blue"
                                    placeholder="Detailed product specifications..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'variants' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Variant Generator */}
                        <div className="glass-card p-6 border-white/5 bg-gradient-to-r from-neon-purple/5 to-transparent">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Box size={16} className="text-neon-purple" /> 快速生成变体 (Variant Generator)
                            </h3>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">颜色 (Color)</label>
                                    <input 
                                        value={variantColor} onChange={e => setVariantColor(e.target.value)}
                                        className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-purple outline-none"
                                        placeholder="e.g. Midnight Blue"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">尺码 (Size)</label>
                                    <input 
                                        value={variantSize} onChange={e => setVariantSize(e.target.value)}
                                        className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-purple outline-none"
                                        placeholder="e.g. XL"
                                    />
                                </div>
                                <button 
                                    onClick={handleAddVariant}
                                    className="h-10 px-6 bg-neon-purple text-white rounded-lg font-bold text-xs hover:bg-neon-purple/80 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} /> 添加
                                </button>
                            </div>
                        </div>

                        {/* Variants Table */}
                        <div className="rounded-xl border border-white/10 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] font-bold text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Variant Name</th>
                                        <th className="px-6 py-3">SKU Suffix</th>
                                        <th className="px-6 py-3">Price Override</th>
                                        <th className="px-6 py-3">Stock</th>
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
                                                <input defaultValue={v.price} className="w-20 bg-transparent border-b border-white/10 text-sm text-white focus:border-neon-purple outline-none" />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input defaultValue={v.stock} className="w-20 bg-transparent border-b border-white/10 text-sm text-white focus:border-neon-purple outline-none" />
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button onClick={() => handleRemoveVariant(v.id)} className="text-gray-500 hover:text-red-500 transition-colors">
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

                {activeTab === 'financials' && (
                    <div className="grid grid-cols-12 gap-8 animate-fade-in">
                        {/* Interactive Calculator */}
                        <div className="col-span-12 md:col-span-7 space-y-6">
                            <h3 className="text-lg font-bold text-white mb-6">成本结构录入</h3>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">最终售价 ($)</label>
                                    <input 
                                        type="number"
                                        value={formData.financials?.sellingPrice || formData.price} 
                                        onChange={e => handleFinancialChange('sellingPrice', e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xl font-bold text-white focus:border-neon-green outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">采购成本 ($)</label>
                                    <input 
                                        type="number"
                                        value={formData.financials?.costOfGoods} 
                                        onChange={e => handleFinancialChange('costOfGoods', e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-neon-pink outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">头程运费</label>
                                    <input type="number" value={formData.financials?.shippingCost} onChange={e => handleFinancialChange('shippingCost', e.target.value)} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">平台佣金</label>
                                    <input type="number" value={formData.financials?.platformFee} onChange={e => handleFinancialChange('platformFee', e.target.value)} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase">广告预算/单</label>
                                    <input type="number" value={formData.financials?.adCost} onChange={e => handleFinancialChange('adCost', e.target.value)} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Visualization */}
                        <div className="col-span-12 md:col-span-5">
                            <div className="glass-card p-6 border-neon-green/30 bg-gradient-to-b from-neon-green/5 to-transparent h-full flex flex-col items-center justify-center relative">
                                <h4 className="text-xs font-bold text-neon-green uppercase tracking-widest absolute top-6 left-6">实时利润预测</h4>
                                
                                <div className="w-48 h-48 my-4 relative">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: '1px solid #333' }} />
                                        </PieChart>
                                     </ResponsiveContainer>
                                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                         <span className="text-2xl font-bold text-white">{profitMetrics.margin.toFixed(1)}%</span>
                                         <span className="text-[10px] text-gray-400">Margin</span>
                                     </div>
                                </div>

                                <div className="w-full space-y-2 mt-4">
                                    <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                                        <span className="text-gray-400">净利润 (Net Profit)</span>
                                        <span className={`font-bold ${profitMetrics.profit > 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
                                            ${profitMetrics.profit.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>总成本</span>
                                        <span>${profitMetrics.cost.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'intelligence' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* 1. SEO Title Optimizer */}
                        <section className="glass-card p-6 border-white/10">
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                     <h3 className="font-bold text-white flex items-center gap-2"><Search size={16} className="text-neon-blue"/> SEO 标题优化</h3>
                                     <p className="text-xs text-gray-400 mt-1">根据品类和属性生成高点击率标题。</p>
                                 </div>
                                 <button onClick={handleAiOptimizeTitle} disabled={isLoadingAi} className="px-3 py-1.5 bg-neon-blue/10 text-neon-blue rounded-lg text-xs font-bold hover:bg-neon-blue/20 transition-all">
                                     {isLoadingAi ? <Loader2 className="animate-spin" size={12}/> : '立即优化'}
                                 </button>
                             </div>
                             <div className="bg-black/20 p-4 rounded-xl border border-white/5 font-mono text-sm text-white">
                                 {formData.seoTitle || "点击优化按钮生成..."}
                             </div>
                        </section>

                        {/* 2. Keyword Generator */}
                        <section className="glass-card p-6 border-white/10">
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                     <h3 className="font-bold text-white flex items-center gap-2"><Tag size={16} className="text-neon-purple"/> 关键词提取</h3>
                                     <p className="text-xs text-gray-400 mt-1">自动分析描述提取 Amazon/TikTok 后台关键词。</p>
                                 </div>
                                 <button onClick={handleAiKeywords} disabled={isLoadingAi} className="px-3 py-1.5 bg-neon-purple/10 text-neon-purple rounded-lg text-xs font-bold hover:bg-neon-purple/20 transition-all">
                                     {isLoadingAi ? <Loader2 className="animate-spin" size={12}/> : '提取 Tags'}
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

                         {/* 3. Market Fit Analysis (Legacy) */}
                         <section className="glass-card p-6 border-white/10">
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                     <h3 className="font-bold text-white flex items-center gap-2"><TrendingUp size={16} className="text-neon-green"/> 市场可行性评分</h3>
                                 </div>
                                 <button onClick={handleMarketAnalysis} disabled={isLoadingAi} className="px-3 py-1.5 bg-neon-green/10 text-neon-green rounded-lg text-xs font-bold hover:bg-neon-green/20 transition-all">
                                     运行算法
                                 </button>
                             </div>
                             {aiAnalysis && (
                                <div className="flex gap-6 items-center">
                                    <div className="w-16 h-16 rounded-full border-4 border-neon-green flex items-center justify-center text-xl font-bold text-neon-green shadow-glow-green/30">
                                        {aiAnalysis.score}
                                    </div>
                                    <p className="text-sm text-gray-300 flex-1">{aiAnalysis.reasoning}</p>
                                </div>
                             )}
                        </section>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEditor;
