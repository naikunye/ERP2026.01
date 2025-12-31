import React, { useState } from 'react';
import { Product, ProductStatus, Currency } from '../types';
import { Sparkles, X, Globe, Check, Loader2, Image as ImageIcon, Activity, Layers, Cpu, Scan, Terminal, Tag } from 'lucide-react';
import { generateProductDescription, translateProductContent, analyzeMarketFit } from '../services/geminiService';

interface ProductEditorProps {
  onClose: () => void;
  onSave: (product: Product) => void;
  initialProduct?: Product | null;
}

const ProductEditor: React.FC<ProductEditorProps> = ({ onClose, onSave, initialProduct }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'intelligence'>('details');
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
      category: ''
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value
    }));
  };

  const handleAiGenerate = async () => {
    if (!formData.name) return;
    setIsLoadingAi(true);
    // Request Chinese content
    const desc = await generateProductDescription(formData.name!, formData.category || 'General', 'Futuristic and Compelling, in Chinese');
    setFormData(prev => ({ ...prev, description: desc }));
    setIsLoadingAi(false);
  };

  const handleTranslate = async (lang: string) => {
    if (!formData.description) return;
    setIsLoadingAi(true);
    const translated = await translateProductContent(formData.description!, lang);
    setFormData(prev => ({ ...prev, description: translated }));
    setIsLoadingAi(false);
  };

  const handleMarketAnalysis = async () => {
      if(!formData.name || !formData.price) return;
      setIsLoadingAi(true);
      const result = await analyzeMarketFit(formData.name, formData.price);
      setAiAnalysis(result);
      setIsLoadingAi(false);
  }

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 perspective-1000">
      {/* Colorful Blur Backdrop */}
      <div className="absolute inset-0 bg-[#050510]/80 backdrop-blur-xl animate-fade-in" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="w-full max-w-5xl h-[85vh] glass-card flex flex-col animate-scale-in z-10 border-white/20 shadow-2xl">
        
        {/* Header */}
        <div className="h-[80px] border-b border-white/10 flex items-center px-8 z-20 justify-between bg-white/5 backdrop-blur-md">
             <div className="flex items-center gap-6">
                 <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all" onClick={onClose}>
                    <X size={20} />
                 </button>
                 <div>
                    <h2 className="text-[22px] font-bold text-white leading-none tracking-wide flex items-center gap-3">
                        {initialProduct ? '编辑资产' : '初始化资产'}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neon-blue/20 text-neon-blue border border-neon-blue/30">安全</span>
                    </h2>
                    <p className="text-[11px] text-gray-400 font-mono mt-1">
                        ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}
                    </p>
                 </div>
             </div>
             
             <button 
                onClick={handleSubmit} 
                className="px-8 py-3 bg-gradient-neon-blue text-white rounded-xl font-bold text-[14px] shadow-glow-blue hover:scale-105 transition-all flex items-center gap-2"
            >
                <Check size={18} strokeWidth={3} />
                保存变更
            </button>
        </div>

        <div className="flex-1 overflow-hidden flex bg-transparent">
            
            {/* Navigation Rail */}
            <div className="w-[260px] border-r border-white/10 pt-8 px-4 space-y-2 bg-black/10">
                 <div className="px-4 mb-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">功能模块</div>
                 {[
                    { id: 'details', label: '核心数据', icon: <Layers size={18} /> },
                    { id: 'media', label: '视觉素材', icon: <ImageIcon size={18} /> },
                    { id: 'intelligence', label: 'AI 矩阵', icon: <Cpu size={18} /> }
                 ].map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-[14px] font-bold transition-all ${
                            activeTab === tab.id 
                            ? 'bg-gradient-neon-purple text-white shadow-glow-purple' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                     >
                        {tab.icon}
                        {tab.label}
                     </button>
                 ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-12 bg-transparent relative">
                
                {activeTab === 'details' && (
                    <div className="max-w-3xl mx-auto space-y-12 animate-fade-in relative z-10">
                        
                        {/* Section 1 */}
                        <div className="space-y-6">
                            <h3 className="text-[18px] font-bold text-white flex items-center gap-3">
                                <span className="w-2 h-8 bg-neon-blue rounded-full shadow-glow-blue"></span> 身份标识
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-gray-400 ml-1">资产名称</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full h-14 px-5 input-glass rounded-xl text-[18px] font-bold tracking-wide placeholder-gray-500"
                                        placeholder="输入产品名称..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-gray-400 ml-1">SKU</label>
                                        <input
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            className="w-full h-12 px-4 input-glass rounded-xl font-mono text-[14px]"
                                            placeholder="XXXX-0000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-gray-400 ml-1">类目</label>
                                        <div className="relative">
                                            <Tag size={18} className="absolute left-4 top-3 text-neon-blue" />
                                            <input
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className="w-full h-12 pl-12 pr-4 input-glass rounded-xl font-bold text-[14px]"
                                                placeholder="输入类目..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* Section 2 */}
                         <div className="space-y-6">
                            <h3 className="text-[18px] font-bold text-white flex items-center gap-3">
                                <span className="w-2 h-8 bg-neon-purple rounded-full shadow-glow-purple"></span> 估值
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-gray-400 ml-1">单价 (USD)</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-3.5 text-gray-400 font-mono text-lg">$</span>
                                        <input
                                            name="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="w-full h-14 pl-10 pr-4 input-glass rounded-xl font-display font-bold text-[22px] text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-gray-400 ml-1">库存量</label>
                                    <input
                                        name="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        className="w-full h-14 px-5 input-glass rounded-xl font-mono font-bold text-[18px] text-neon-green"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="space-y-4">
                             <div className="flex justify-between items-center">
                                <h3 className="text-[18px] font-bold text-white flex items-center gap-3">
                                    <span className="w-2 h-8 bg-neon-pink rounded-full shadow-glow-pink"></span> 描述
                                </h3>
                                <button 
                                    type="button"
                                    onClick={handleAiGenerate}
                                    disabled={isLoadingAi || !formData.name}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[12px] font-bold transition-all flex items-center gap-2 border border-white/10"
                                >
                                    {isLoadingAi ? <Loader2 className="animate-spin w-3 h-3"/> : <Sparkles className="w-3 h-3 text-neon-yellow" />}
                                    <span>AI 生成</span>
                                </button>
                            </div>
                            <div className="relative group">
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="relative w-full min-h-[200px] p-6 input-glass border border-white/10 text-[15px] leading-relaxed resize-none rounded-2xl focus:bg-black/40"
                                    placeholder="输入产品描述..."
                                />
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'media' && (
                    <div className="h-full flex flex-col items-center justify-center animate-fade-in relative z-10">
                        <div className="w-[600px] h-[350px] border-2 border-dashed border-white/20 rounded-[32px] flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-all cursor-pointer group hover:border-neon-blue/50">
                             <div className="w-24 h-24 bg-gradient-neon-blue rounded-full shadow-glow-blue flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                <ImageIcon className="text-white" size={40} />
                             </div>
                             <h4 className="text-white font-bold text-3xl tracking-tight">上传视觉素材</h4>
                             <p className="text-gray-400 text-sm mt-3">拖拽文件到此处或点击浏览</p>
                        </div>
                    </div>
                )}

                {activeTab === 'intelligence' && (
                    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pt-4 relative z-10">
                        
                        {/* Gemini Core Banner */}
                        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-black to-[#1a1a2e] border border-white/10 p-12 text-white shadow-2xl group">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple opacity-20 blur-[100px] group-hover:opacity-30 transition-opacity"></div>
                             
                             <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-glow-purple border border-white/20 backdrop-blur-md">
                                    <Cpu size={40} className="text-neon-purple animate-pulse" />
                                </div>
                                <h3 className="text-5xl font-display font-bold mb-4 tracking-tight">Gemini<span className="text-neon-purple"> 智能</span></h3>
                                <p className="text-gray-300 text-lg max-w-lg leading-relaxed">
                                    先进的神经处理单元，随时准备进行市场分析和语言翻译。
                                </p>
                             </div>
                        </div>

                        {/* Action Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <button 
                                onClick={() => handleTranslate('Spanish')}
                                className="glass-card p-8 hover:bg-white/10 transition-all text-left group border-white/10"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-neon-blue flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Globe size={28} className="text-white" />
                                    </div>
                                    <Scan size={20} className="text-gray-500 group-hover:text-neon-blue" />
                                </div>
                                <h4 className="font-bold text-white text-2xl mb-2">翻译矩阵</h4>
                                <p className="text-sm text-gray-400">目标语言: 西班牙语 (ES)</p>
                            </button>

                             <button 
                                onClick={handleMarketAnalysis}
                                className="glass-card p-8 hover:bg-white/10 transition-all text-left group border-white/10"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-neon-green flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Activity size={28} className="text-black" />
                                    </div>
                                    <Scan size={20} className="text-gray-500 group-hover:text-neon-green" />
                                </div>
                                <h4 className="font-bold text-white text-2xl mb-2">市场预测</h4>
                                <p className="text-sm text-gray-400">运行可行性算法</p>
                            </button>
                        </div>

                        {/* Result Console */}
                        {aiAnalysis && (
                            <div className="rounded-[32px] bg-black/60 border border-neon-green/30 p-10 shadow-glow-green/20 animate-scale-in relative overflow-hidden">
                                 <div className="flex items-start gap-10 relative z-10">
                                    <div className="flex flex-col items-center justify-center p-6 bg-neon-green/10 rounded-3xl border border-neon-green/20 min-w-[140px]">
                                        <span className="text-6xl font-display font-bold text-neon-green drop-shadow-lg">{aiAnalysis.score}</span>
                                        <span className="text-[12px] font-bold text-neon-green mt-2 uppercase tracking-widest">评分</span>
                                    </div>
                                    <div className="flex-1 pt-2">
                                        <h5 className="text-neon-green font-bold mb-4 flex items-center gap-3 text-xl">
                                            <Terminal size={24} /> 分析完成
                                        </h5>
                                        <p className="text-lg text-gray-200 leading-relaxed typing-effect">
                                            {aiAnalysis.reasoning}
                                        </p>
                                    </div>
                                 </div>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEditor;