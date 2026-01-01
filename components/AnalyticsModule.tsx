import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, RadialBarChart, RadialBar, Legend, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Zap, Globe, Smartphone, ShoppingCart, 
  Target, Activity, ArrowUpRight, ArrowDownRight, Search, Share2, MousePointerClick, 
  BrainCircuit, LayoutDashboard, Calendar, RefreshCw
} from 'lucide-react';

// --- MOCK DATA FOR ANALYTICS ---

const SALES_TREND_DATA = [
  { date: '11/01', revenue: 4000, organic: 2400, ads: 1600 },
  { date: '11/05', revenue: 3000, organic: 1398, ads: 1602 },
  { date: '11/10', revenue: 5000, organic: 3000, ads: 2000 },
  { date: '11/15', revenue: 2780, organic: 1908, ads: 872 },
  { date: '11/20', revenue: 6890, organic: 4800, ads: 2090 },
  { date: '11/25', revenue: 8390, organic: 3800, ads: 4590 },
  { date: '11/30', revenue: 9490, organic: 4300, ads: 5190 },
];

const PLATFORM_DATA = [
  { name: 'Amazon US', value: 45, fill: '#FF9900' },
  { name: 'TikTok Shop', value: 30, fill: '#FF2975' },
  { name: 'Shopify', value: 15, fill: '#00FF9D' },
  { name: 'Offline/B2B', value: 10, fill: '#29D9FF' },
];

const FUNNEL_DATA = [
  { name: 'Impressions', value: 120000, fill: '#29D9FF' },
  { name: 'Clicks', value: 45000, fill: '#B829FF' },
  { name: 'Add to Cart', value: 12000, fill: '#FF2975' },
  { name: 'Purchases', value: 3800, fill: '#00FF9D' },
];

const REGIONAL_DATA = [
    { region: 'North America', sales: 85, growth: '+12%' },
    { region: 'Western Europe', sales: 64, growth: '+5%' },
    { region: 'Southeast Asia', sales: 42, growth: '+28%' },
    { region: 'Oceania', sales: 20, growth: '-2%' },
];

const AnalyticsModule: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30D');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/20 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          {payload.map((p: any, index: number) => (
             <p key={index} className="text-sm font-bold flex items-center gap-2" style={{color: p.color}}>
                 <span className="w-2 h-2 rounded-full" style={{backgroundColor: p.color}}></span>
                 {p.name}: ${p.value.toLocaleString()}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20">
      
      {/* 1. Header with AI Insight Banner */}
      <div className="flex flex-col gap-6 border-b border-white/10 pb-6">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
                    数据深潜
                    <span className="text-neon-purple/50 font-sans text-sm tracking-widest font-medium border border-neon-purple/30 px-2 py-0.5 rounded">DEEP DIVE</span>
                </h1>
                <p className="text-gray-400 text-sm mt-2">全渠道商业智能 (BI) 与 AI 预测分析。</p>
            </div>
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                {['7D', '30D', '90D', 'YTD'].map(range => (
                    <button 
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === range ? 'bg-neon-purple text-white shadow-glow-purple' : 'text-gray-500 hover:text-white'}`}
                    >
                        {range}
                    </button>
                ))}
            </div>
        </div>

        {/* AI Insight Card */}
        <div className="glass-card p-0 overflow-hidden relative border-neon-purple/30 group">
             <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/10 to-transparent opacity-50"></div>
             <div className="p-5 flex items-start gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-neon-purple/20 flex items-center justify-center border border-neon-purple/30 shadow-[0_0_15px_rgba(184,41,255,0.3)] shrink-0">
                      <BrainCircuit size={20} className="text-neon-purple animate-pulse" />
                  </div>
                  <div>
                      <h3 className="text-neon-purple font-bold text-sm flex items-center gap-2 mb-1">
                          Gemini 智能洞察
                          <span className="text-[10px] bg-neon-purple/20 px-1.5 rounded text-white border border-neon-purple/20">LIVE</span>
                      </h3>
                      <p className="text-sm text-gray-200 leading-relaxed">
                          基于过去 30 天的数据，TikTok 渠道的转化率 (CVR) 增长了 <strong className="text-neon-green">28%</strong>，表现优于 Amazon。建议将 <strong className="text-white">AERO-ANC-PRO</strong> 的广告预算向短视频平台倾斜，预计可提升整体 ROAS 至 4.2。
                      </p>
                  </div>
                  <button className="ml-auto px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-bold text-white flex items-center gap-2 whitespace-nowrap transition-all">
                      <Zap size={14} className="text-neon-yellow"/> 应用策略
                  </button>
             </div>
        </div>
      </div>

      {/* 2. Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
             label="全渠道总销售 (GMV)" 
             value="$142,890" 
             change="+14.2%" 
             isPositive={true} 
             icon={<LayoutDashboard size={18}/>}
             color="text-neon-blue"
          />
          <KPICard 
             label="广告回报率 (ROAS)" 
             value="3.8x" 
             change="-2.1%" 
             isPositive={false} 
             icon={<Target size={18}/>}
             color="text-neon-pink"
          />
          <KPICard 
             label="平均客单价 (AOV)" 
             value="$84.50" 
             change="+5.4%" 
             isPositive={true} 
             icon={<ShoppingCart size={18}/>}
             color="text-neon-green"
          />
          <KPICard 
             label="转化率 (CVR)" 
             value="2.85%" 
             change="+0.4%" 
             isPositive={true} 
             icon={<MousePointerClick size={18}/>}
             color="text-neon-yellow"
          />
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Sales Trend */}
          <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[400px]">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-sm font-bold text-white flex items-center gap-2">
                       <Activity size={16} className="text-neon-blue"/> 营收趋势分析
                   </h3>
                   <div className="flex items-center gap-4 text-[10px] font-bold">
                        <span className="flex items-center gap-2 text-gray-400"><div className="w-2 h-2 rounded-full bg-neon-blue"></div> 自然流量</span>
                        <span className="flex items-center gap-2 text-gray-400"><div className="w-2 h-2 rounded-full bg-neon-pink"></div> 广告投放</span>
                   </div>
               </div>
               <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={SALES_TREND_DATA} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#29D9FF" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#29D9FF" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF2975" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#FF2975" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} tickFormatter={(v) => `$${v}`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                            <Area type="monotone" dataKey="organic" stackId="1" stroke="#29D9FF" fill="url(#colorOrganic)" strokeWidth={2} />
                            <Area type="monotone" dataKey="ads" stackId="1" stroke="#FF2975" fill="url(#colorAds)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
               </div>
          </div>

          {/* Platform Distribution */}
          <div className="glass-card p-6 flex flex-col h-[400px]">
               <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                   <Globe size={16} className="text-neon-green"/> 渠道占比
               </h3>
               <div className="flex-1 w-full min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={PLATFORM_DATA}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {PLATFORM_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-display font-bold text-white">4</span>
                        <span className="text-[10px] text-gray-500 uppercase">Channels</span>
                    </div>
               </div>
               <div className="space-y-3 mt-2">
                   {PLATFORM_DATA.map((p, i) => (
                       <div key={i} className="flex items-center justify-between text-xs">
                           <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full" style={{backgroundColor: p.fill}}></div>
                               <span className="text-gray-300">{p.name}</span>
                           </div>
                           <span className="font-bold text-white">{p.value}%</span>
                       </div>
                   ))}
               </div>
          </div>
      </div>

      {/* 4. Bottom Grid: Funnel & Regions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Conversion Funnel */}
          <div className="glass-card p-6">
               <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                   <Target size={16} className="text-neon-blue"/> 营销转化漏斗 (Funnel)
               </h3>
               <div className="space-y-4">
                   {FUNNEL_DATA.map((stage, i) => {
                       const maxVal = FUNNEL_DATA[0].value;
                       const percent = (stage.value / maxVal) * 100;
                       
                       return (
                           <div key={i} className="group">
                               <div className="flex justify-between items-end mb-1">
                                   <span className="text-xs font-bold text-gray-400 uppercase">{stage.name}</span>
                                   <div className="text-right">
                                       <span className="text-sm font-bold text-white block">{stage.value.toLocaleString()}</span>
                                       {i > 0 && (
                                            <span className="text-[10px] text-gray-500">
                                                {((stage.value / FUNNEL_DATA[i-1].value) * 100).toFixed(1)}% conv.
                                            </span>
                                       )}
                                   </div>
                               </div>
                               <div className="h-2 bg-white/5 rounded-r-full overflow-hidden relative">
                                   <div 
                                      className="h-full rounded-r-full transition-all duration-1000 group-hover:brightness-125" 
                                      style={{ width: `${percent}%`, backgroundColor: stage.fill }}
                                   ></div>
                               </div>
                           </div>
                       )
                   })}
               </div>
          </div>

          {/* Regional Performance */}
          <div className="glass-card p-6">
               <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Globe size={16} className="text-neon-yellow"/> 区域热力表现
                    </h3>
                    <button className="text-[10px] text-neon-blue hover:underline">查看地图模式</button>
               </div>
               
               <div className="space-y-4">
                    {REGIONAL_DATA.map((r, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                             <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-gray-400 border border-white/5">
                                 {i + 1}
                             </div>
                             <div className="flex-1">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-sm font-bold text-white">{r.region}</span>
                                     <span className={`text-xs font-bold ${r.growth.startsWith('+') ? 'text-neon-green' : 'text-neon-pink'}`}>{r.growth}</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
                                        style={{ width: `${r.sales}%` }}
                                     ></div>
                                 </div>
                             </div>
                        </div>
                    ))}
               </div>
          </div>
      </div>

    </div>
  );
};

// --- Sub-components ---

const KPICard = ({ label, value, change, isPositive, icon, color }: any) => (
    <div className="glass-card p-5 hover:border-white/20 transition-all group">
        <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg bg-white/5 border border-white/5 group-hover:scale-110 transition-transform ${color}`}>
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                isPositive ? 'text-neon-green bg-neon-green/10 border-neon-green/20' : 'text-neon-pink bg-neon-pink/10 border-neon-pink/20'
            }`}>
                {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {change}
            </div>
        </div>
        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-display font-bold text-white">{value}</div>
    </div>
);

export default AnalyticsModule;