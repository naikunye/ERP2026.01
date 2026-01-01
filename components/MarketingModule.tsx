import React, { useState } from 'react';
import { 
  Megaphone, Video, Mail, PenTool, Hash, Sparkles, Copy, 
  Check, RefreshCw, Wand2, Layers, AlertCircle, Save, Trash2, FileText
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const TOOLS = [
    { 
        id: 'tiktok', 
        name: 'TikTok 爆款脚本', 
        icon: <Video size={20}/>, 
        desc: '生成带有 Hook、分镜描述和 CTA 的短视频脚本。',
        color: 'text-neon-pink border-neon-pink/30 bg-neon-pink/10',
        promptTemplate: (product: string, point: string, tone: string) => `
            Act as a viral TikTok content strategist.
            Product: "${product}"
            Key Selling Point: "${point}"
            Tone: ${tone}
            
            Task: Write a high-converting TikTok script (15-30 seconds).
            Format:
            - **Hook (0-3s):** Visual/Audio hook to stop scrolling.
            - **Body:** Demonstrate the problem and solution using the product.
            - **CTA:** Strong call to action.
            - **Visual Cues:** Describe what should happen on screen in brackets [Like this].
            
            Language: English (US Native slang where appropriate).
        `
    },
    { 
        id: 'email', 
        name: 'EDM 营销邮件', 
        icon: <Mail size={20}/>, 
        desc: '撰写挽回购物车、新品发布或节日促销邮件。',
        color: 'text-neon-blue border-neon-blue/30 bg-neon-blue/10',
        promptTemplate: (product: string, point: string, tone: string) => `
            Act as a world-class email copywriter (like David Ogilvy but modern).
            Product: "${product}"
            Objective: "${point}" (e.g., Abandoned Cart, New Launch)
            Tone: ${tone}
            
            Task: Write an email subject line and body copy.
            - Subject Line: High open rate, intriguing.
            - Body: Storytelling approach, focus on benefits, clean structure.
            
            Language: English.
        `
    },
    { 
        id: 'social', 
        name: 'Instagram/FB 贴文', 
        icon: <Hash size={20}/>, 
        desc: '生成高互动率的配文和热门标签组合。',
        color: 'text-neon-purple border-neon-purple/30 bg-neon-purple/10',
        promptTemplate: (product: string, point: string, tone: string) => `
            Act as a Social Media Manager for a lifestyle brand.
            Product: "${product}"
            Focus: "${point}"
            Tone: ${tone}
            
            Task: Write an Instagram caption.
            - Style: Aesthetic, engaging, use emojis.
            - Structure: Hook -> Value -> Question for engagement.
            - Hashtags: Include 10-15 relevant, high-traffic hashtags mixed with niche ones.
            
            Language: English.
        `
    },
    { 
        id: 'blog', 
        name: 'SEO 种草文章', 
        icon: <PenTool size={20}/>, 
        desc: '生成符合 SEO 逻辑的长篇种草博文。',
        color: 'text-neon-green border-neon-green/30 bg-neon-green/10',
        promptTemplate: (product: string, point: string, tone: string) => `
            Act as an SEO Content Specialist.
            Product: "${product}"
            Keywords/Topic: "${point}"
            Tone: ${tone}
            
            Task: Write a blog post outline and intro.
            - Title: SEO optimized.
            - Structure: H1, H2 tags structure.
            - Content: Write the full Introduction and the first 2 paragraphs focusing on "Why you need this".
            
            Language: English.
        `
    }
];

interface SavedContent {
    id: string;
    type: string;
    product: string;
    content: string;
    date: string;
}

const MarketingModule: React.FC = () => {
    const [activeToolId, setActiveToolId] = useState('tiktok');
    const [productName, setProductName] = useState('');
    const [sellingPoint, setSellingPoint] = useState('');
    const [tone, setTone] = useState('Excited & Energetic');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [savedDrafts, setSavedDrafts] = useState<SavedContent[]>([]);

    const activeTool = TOOLS.find(t => t.id === activeToolId) || TOOLS[0];

    const handleGenerate = async () => {
        if (!productName || !sellingPoint) return;
        setIsGenerating(true);
        setGeneratedContent('');
        setShowSaved(false);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = activeTool.promptTemplate(productName, sellingPoint, tone);
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            setGeneratedContent(response.text || "生成失败，请重试。");
        } catch (error) {
            console.error("AI Error:", error);
            setGeneratedContent("API 连接错误，请检查网络设置。");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveDraft = () => {
        if (!generatedContent) return;
        const newDraft: SavedContent = {
            id: Date.now().toString(),
            type: activeTool.name,
            product: productName,
            content: generatedContent,
            date: new Date().toLocaleDateString()
        };
        setSavedDrafts([newDraft, ...savedDrafts]);
        setShowSaved(true); // Switch view to show it's saved
    };

    const handleDeleteDraft = (id: string) => {
        setSavedDrafts(prev => prev.filter(d => d.id !== id));
    };

    return (
        <div className="space-y-6 animate-fade-in w-full pb-20 h-full flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/10 pb-6 shrink-0">
                <div>
                    <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
                        AI 创意工坊
                        <span className="text-neon-pink/50 font-sans text-sm tracking-widest font-medium border border-neon-pink/30 px-2 py-0.5 rounded">MARKETING STUDIO</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">无需外包，让 AI 为您生成世界级的跨境营销素材。</p>
                </div>
                <button 
                    onClick={() => setShowSaved(!showSaved)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${showSaved ? 'bg-neon-purple text-white border-neon-purple shadow-glow-purple' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                >
                    <FileText size={16}/> 创意库 ({savedDrafts.length})
                </button>
            </div>

            <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
                
                {/* Left: Tool Selection & Inputs */}
                <div className="w-[400px] flex flex-col gap-6 overflow-y-auto custom-scrollbar shrink-0">
                    
                    {/* Tool Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {TOOLS.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => { setActiveToolId(tool.id); setShowSaved(false); }}
                                className={`p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group ${
                                    activeToolId === tool.id && !showSaved
                                    ? `${tool.color} shadow-lg` 
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-400'
                                }`}
                            >
                                <div className="mb-2">{tool.icon}</div>
                                <div className={`text-sm font-bold ${activeToolId === tool.id && !showSaved ? 'text-white' : ''}`}>{tool.name}</div>
                                {activeToolId === tool.id && !showSaved && (
                                    <div className="absolute right-2 top-2">
                                        <Sparkles size={12} className="animate-pulse"/>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Input Form */}
                    <div className="glass-card p-6 border-white/10 space-y-5">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14} /> 配置参数
                        </h3>
                        
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">产品名称 / 品牌</label>
                            <input 
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                placeholder="例如: Aero ANC Headphones"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">
                                {activeToolId === 'email' ? '邮件目的 (Topic)' : '核心卖点 (Selling Point)'}
                            </label>
                            <textarea 
                                value={sellingPoint}
                                onChange={(e) => setSellingPoint(e.target.value)}
                                className="w-full h-24 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-neon-blue outline-none resize-none"
                                placeholder={activeToolId === 'tiktok' ? "例如: 降噪效果超强，但在办公室用会被老板发现..." : "输入您想突出的内容..."}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">语气语调 (Tone)</label>
                            <select 
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                            >
                                <option>Excited & Energetic (High Energy)</option>
                                <option>Professional & Trustworthy</option>
                                <option>Friendly & Casual</option>
                                <option>Urgent (FOMO)</option>
                                <option>Humorous & Witty</option>
                                <option>Luxury & Elegant</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !productName || !sellingPoint}
                            className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
                                isGenerating 
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                : 'bg-gradient-neon-blue text-black hover:scale-[1.02]'
                            }`}
                        >
                            {isGenerating ? <RefreshCw size={16} className="animate-spin"/> : <Wand2 size={16} />}
                            {isGenerating ? 'AI 正在创作中...' : '立即生成素材'}
                        </button>
                    </div>
                </div>

                {/* Right: Output Area or Saved Drafts */}
                <div className="flex-1 glass-card border-white/10 flex flex-col overflow-hidden relative bg-[#0a0a10]">
                    {showSaved ? (
                        <div className="flex-1 flex flex-col">
                            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <FileText size={16}/> 已保存的创意
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {savedDrafts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                                        <FileText size={48} className="opacity-20"/>
                                        <p className="text-xs">暂无保存的创意。生成内容后点击“保存”即可归档。</p>
                                    </div>
                                ) : (
                                    savedDrafts.map(draft => (
                                        <div key={draft.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <span className="text-[10px] bg-neon-blue/10 text-neon-blue px-2 py-0.5 rounded border border-neon-blue/20">{draft.type}</span>
                                                    <span className="text-xs text-gray-400 ml-2">{draft.date}</span>
                                                    <div className="text-white font-bold text-sm mt-1">{draft.product}</div>
                                                </div>
                                                <button onClick={() => handleDeleteDraft(draft.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-300 font-mono bg-black/30 p-3 rounded-lg max-h-32 overflow-hidden relative">
                                                {draft.content.slice(0, 200)}...
                                                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/50 to-transparent"></div>
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <button 
                                                    onClick={() => { navigator.clipboard.writeText(draft.content); alert('Copied!'); }}
                                                    className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1"
                                                >
                                                    <Copy size={12}/> 复制全文
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${generatedContent ? 'bg-neon-green' : 'bg-gray-500'}`}></div>
                                    <span className="text-xs font-bold text-white">AI 输出结果</span>
                                </div>
                                {generatedContent && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleSaveDraft}
                                            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-bold text-neon-purple flex items-center gap-2 transition-all"
                                        >
                                            <Save size={14} /> 保存
                                        </button>
                                        <button 
                                            onClick={handleCopy}
                                            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-bold text-gray-300 flex items-center gap-2 transition-all"
                                        >
                                            {copied ? <Check size={14} className="text-neon-green"/> : <Copy size={14}/>}
                                            {copied ? '已复制' : '复制内容'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {generatedContent ? (
                                    <div className="prose prose-invert max-w-none animate-fade-in">
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200 font-mono">
                                            {generatedContent}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-4">
                                        <Megaphone size={64} strokeWidth={1} />
                                        <div className="text-center">
                                            <p className="text-sm font-bold">准备就绪</p>
                                            <p className="text-xs mt-1">在左侧输入信息，让 AI 为您生成爆款文案。</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Decoration */}
                            <div className="absolute bottom-0 right-0 p-8 pointer-events-none opacity-20">
                                <Sparkles size={100} className="text-neon-purple/20 blur-sm"/>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MarketingModule;