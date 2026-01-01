import React, { useState } from 'react';
import { 
  Radar, Target, ArrowUp, ArrowDown, Search, Plus, 
  TrendingUp, Activity, AlertTriangle, ExternalLink, Zap, Save, X
} from 'lucide-react';
import { Competitor } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';

interface MarketRadarProps {
    competitors: Competitor[];
    onAddCompetitor: (comp: Competitor) => void;
}

const MarketRadarModule: React.FC<MarketRadarProps> = ({ competitors, onAddCompetitor }) => {
    const [selectedComp, setSelectedComp] = useState<Competitor | null>(competitors[0] || null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [form, setForm] = useState<Partial<Competitor>>({});

    const handleOpenAdd = () => {
        setForm({
            asin: '',
            name: '',
            price: 0,
            brand: ''
        });
        setIsAddModalOpen(true);
    };

    const handleSave = () => {
        if (!form.name || !form.price) return;
        const newComp: Competitor = {
            id: `C-${Date.now()}`,
            asin: form.asin || 'UNKNOWN',
            brand: form.brand || 'Generic',
            name: form.name,
            price: Number(form.price),
            priceHistory: Array(5).fill(0).map((_, i) => ({ date: `D-${5-i}`, price: Number(form.price) + (Math.random() * 10 - 5) })),
            rating: 0,
            reviewCount: 0,
            imageUrl: 'https://placehold.co/150x150/1a1a2e/FFF?text=Product',
            dailySalesEst: Math.floor(Math.random() * 100),
            keywords: [],
            lastUpdate: 'Just now',
            status: 'Tracking'
        };
        onAddCompetitor(newComp);
        setIsAddModalOpen(false);
        setSelectedComp(newComp);
    };

    return (
        <div className="space-y-6 animate-fade-in w-full pb-20 h-full flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/10 pb-6 shrink-0">
                <div>
                    <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
                        市场雷达
                        <span className="text-neon-pink/50 font-sans text-sm tracking-widest font-medium border border-neon-pink/30 px-2 py-0.5 rounded">MARKET RADAR</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">实时竞对监控与价格战术分析。</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="h-10 px-4 bg-neon-pink text-white rounded-xl font-bold text-xs shadow-glow-pink hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Plus size={16} strokeWidth={3} /> 添加监控目标
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                
                {/* Left: Competitor List */}
                <div className="w-[400px] flex flex-col gap-4 overflow-hidden shrink-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-neon-pink outline-none"
                            placeholder="输入 ASIN 或品牌搜索..."
                        />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {competitors.map(comp => (
                            <div 
                                key={comp.id}
                                onClick={() => setSelectedComp(comp)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${
                                    selectedComp?.id === comp.id 
                                    ? 'bg-white/10 border-neon-pink/50 shadow-glow-pink/20' 
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <div className="flex gap-4">
                                    <img src={comp.imageUrl} className="w-16 h-16 rounded-lg object-cover bg-white" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-[10px] font-bold text-neon-pink uppercase tracking-wider">{comp.brand}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">{comp.lastUpdate}</div>
                                        </div>
                                        <h3 className="text-sm font-bold text-white truncate mb-2">{comp.name}</h3>
                                        <div className="flex justify-between items-end">
                                            <div className="text-lg font-bold text-white font-display">${comp.price}</div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Activity size={10} /> 日销 {comp.dailySalesEst}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Analysis Dashboard */}
                <div className="flex-1 glass-card border-white/10 flex flex-col overflow-y-auto custom-scrollbar relative">
                    {selectedComp ? (
                        <div className="p-8 space-y-8">
                            
                            {/* Header Info */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-gray-300 border border-white/10">ASIN: {selectedComp.asin}</span>
                                        <a href="#" className="text-neon-pink hover:text-white transition-colors"><ExternalLink size={14}/></a>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white max-w-2xl leading-tight">{selectedComp.name}</h2>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                                            {'★'.repeat(Math.floor(selectedComp.rating))} 
                                            <span className="text-gray-400 ml-1 font-normal">({selectedComp.reviewCount})</span>
                                        </div>
                                        <div className="h-4 w-px bg-white/10"></div>
                                        <div className="text-sm text-gray-400">主要竞对</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">当前售价</div>
                                    <div className="text-4xl font-display font-bold text-white text-shadow-lg">${selectedComp.price}</div>
                                </div>
                            </div>

                            {/* Chart: Price War */}
                            <div className="h-[300px] w-full bg-white/5 rounded-xl p-4 border border-white/5">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-neon-pink"/> 价格博弈历史 (Price History)
                                </h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <AreaChart data={selectedComp.priceHistory}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FF2975" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#FF2975" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} tickFormatter={v => `$${v}`}/>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                                            itemStyle={{ color: '#FF2975' }}
                                        />
                                        <Area type="stepAfter" dataKey="price" stroke="#FF2975" strokeWidth={2} fill="url(#colorPrice)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* AI Insights Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-neon-pink/10 to-transparent border border-neon-pink/30 p-6 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-20"><Zap size={40} className="text-neon-pink"/></div>
                                    <h3 className="text-neon-pink font-bold text-sm mb-3 flex items-center gap-2">
                                        <Target size={16}/> 弱点狙击 (AI Analysis)
                                    </h3>
                                    <ul className="space-y-2 text-xs text-gray-300">
                                        <li className="flex gap-2">
                                            <span className="text-red-500 font-bold">[-]</span>
                                            近期评论频繁提及“头梁断裂”，这是质量硬伤。
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-red-500 font-bold">[-]</span>
                                            降噪模式下底噪明显，用户抱怨增多。
                                        </li>
                                        <li className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                                            <span className="text-neon-green font-bold">[+]</span>
                                            <span className="text-white">建议策略：</span>
                                            在您的 Listing 中着重强调“加强型合金头梁”和“无底噪静音技术”。
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                                        <Search size={16} className="text-neon-blue"/> 流量关键词 (Organic Keywords)
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedComp.keywords.map(kw => (
                                            <span key={kw} className="px-3 py-1 bg-black/30 border border-white/10 rounded-full text-xs text-gray-300">
                                                {kw}
                                            </span>
                                        ))}
                                        <span className="px-3 py-1 bg-neon-blue/10 border border-neon-blue/30 rounded-full text-xs text-neon-blue cursor-pointer hover:bg-neon-blue/20">
                                            + 查看更多
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Radar size={48} className="mb-4 opacity-20" />
                            <p>选择一个竞品查看深度报告</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
                    <div className="w-full max-w-md glass-card border border-white/20 shadow-2xl overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">添加监控目标</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">产品 ASIN / ID</label>
                                <input 
                                    value={form.asin || ''}
                                    onChange={e => setForm({...form, asin: e.target.value})}
                                    className="w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">产品名称</label>
                                <input 
                                    value={form.name || ''}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">当前价格 ($)</label>
                                <input 
                                    type="number"
                                    value={form.price || ''}
                                    onChange={e => setForm({...form, price: parseFloat(e.target.value)})}
                                    className="w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">品牌</label>
                                <input 
                                    value={form.brand || ''}
                                    onChange={e => setForm({...form, brand: e.target.value})}
                                    className="w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleSave}
                                className="w-full py-3 bg-neon-pink text-white rounded-lg font-bold text-sm shadow-glow-pink hover:scale-105 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={16}/> 开始监控
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketRadarModule;