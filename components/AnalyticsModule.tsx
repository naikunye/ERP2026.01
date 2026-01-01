import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Zap, Globe, ShoppingCart, 
  Target, Activity, ArrowUpRight, ArrowDownRight, MousePointerClick, 
  BrainCircuit, LayoutDashboard, Calendar
} from 'lucide-react';
import { Transaction } from '../types';

interface AnalyticsModuleProps {
    transactions: Transaction[];
}

const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState('30D');

  // --- REAL-TIME DATA PROCESSING ---

  const analyticsData = useMemo(() => {
      // 1. Sort Transactions by Date
      const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // 2. Aggregate Sales Trend (Group by Date)
      const trendMap = new Map<string, { date: string, revenue: number, expenses: number }>();
      
      sorted.forEach(tx => {
          if (!trendMap.has(tx.date)) {
              trendMap.set(tx.date, { date: tx.date, revenue: 0, expenses: 0 });
          }
          const entry = trendMap.get(tx.date)!;
          if (tx.type === 'Revenue') entry.revenue += tx.amount;
          else entry.expenses += tx.amount;
      });

      // Fill in gaps if needed, but for now just use available data points
      const trendData = Array.from(trendMap.values());

      // 3. KPIs
      const totalRevenue = transactions.filter(t => t.type === 'Revenue').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
      const netProfit = totalRevenue - totalExpenses;
      const orderCount = transactions.filter(t => t.type === 'Revenue').length;
      const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
      const roas = totalExpenses > 0 ? (totalRevenue / totalExpenses) : 0; // Simple ROAS approx (Rev / Total Exp)

      // 4. Mock Category Data (Since transactions don't strictly have platform info in this simplified model, we simulate distribution based on existing volume)
      const platformData = [
          { name: 'Amazon US', value: Math.round(totalRevenue * 0.45), fill: '#FF9900' },
          { name: 'TikTok Shop', value: Math.round(totalRevenue * 0.30), fill: '#FF2975' },
          { name: 'Shopify', value: Math.round(totalRevenue * 0.15), fill: '#00FF9D' },
          { name: 'B2B/Offline', value: Math.round(totalRevenue * 0.10), fill: '#29D9FF' },
      ].filter(d => d.value > 0);

      return { trendData, totalRevenue, totalExpenses, netProfit, aov, roas, platformData };
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/20 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-gray-400 text-xs mb-1 font-mono">{label}</p>
          {payload.map((p: any, index: number) => (
             <p key={index} className="text-xs font-bold flex items-center gap-2" style={{color: p.color}}>
                 <span className="w-2 h-2 rounded-full" style={{backgroundColor: p.color}}></span>
                 {p.name === 'revenue' ? '营收' : p.name === 'expenses' ? '支出' : p.name}: ${p.value.toLocaleString()}
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
                    数据罗盘
                    <span className="text-neon-purple/50 font-sans text-sm tracking-widest font-medium border border-neon-purple/30 px-2 py-0.5 rounded">DATA INTELLIGENCE</span>
                </h1>
                <p className="text-gray-400 text-sm mt-2">基于实时财务流水的商业智能分析 (BI)。</p>
            </div>
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                {['All Time'].map(range => (
                    <button 
                        key={range}
                        className="px-4 py-1.5 text-xs font-bold rounded-lg bg-neon-purple text-white shadow-glow-purple transition-all"
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
                          当前总营收 <strong className="text-white">${analyticsData.totalRevenue.toLocaleString()}</strong>，
                          净利润率约为 <strong className={analyticsData.totalRevenue > 0 && (analyticsData.netProfit/analyticsData.totalRevenue) > 0.2 ? "text-neon-green" : "text-neon-yellow"}>
                              {analyticsData.totalRevenue > 0 ? ((analyticsData.netProfit / analyticsData.totalRevenue) * 100).toFixed(1) : 0}%
                          </strong>。
                          {analyticsData.roas > 3 
                            ? " 整体 ROI 表现优异，建议加大爆款 SKU 的备货量。" 
                            : " 整体 ROI 偏低，建议检查物流成本或广告投放效率。"}
                      </p>
                  </div>
                  <button className="ml-auto px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-bold text-white flex items-center gap-2 whitespace-nowrap transition-all">
                      <Zap size={14} className="text-neon-yellow"/> 生成报告
                  </button>
             </div>
        </div>
      </div>

      {/* 2. Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
             label="全渠道总销售 (GMV)" 
             value={`$${analyticsData.totalRevenue.toLocaleString()}`}
             change="+Realtime" 
             isPositive={true} 
             icon={<LayoutDashboard size={18}/>}
             color="text-neon-blue"
          />
          <KPICard 
             label="投入产出比 (ROI/ROAS)" 
             value={`${analyticsData.roas.toFixed(2)}x`}
             change={analyticsData.roas > 2 ? "Healthy" : "Low"} 
             isPositive={analyticsData.roas > 2} 
             icon={<Target size={18}/>}
             color="text-neon-pink"
          />
          <KPICard 
             label="平均客单价 (AOV estimate)" 
             value={`$${analyticsData.aov.toFixed(1)}`}
             change="Est." 
             isPositive={true} 
             icon={<ShoppingCart size={18}/>}
             color="text-neon-green"
          />
          <KPICard 
             label="净利润 (Net Profit)" 
             value={`$${analyticsData.netProfit.toLocaleString()}`}
             change="Net" 
             isPositive={analyticsData.netProfit > 0} 
             icon={<Activity size={18}/>}
             color="text-neon-yellow"
          />
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Sales Trend */}
          <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[400px]">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-sm font-bold text-white flex items-center gap-2">
                       <Activity size={16} className="text-neon-blue"/> 实时营收趋势 (Revenue Flow)
                   </h3>
                   <div className="flex items-center gap-4 text-[10px] font-bold">
                        <span className="flex items-center gap-2 text-gray-400"><div className="w-2 h-2 rounded-full bg-neon-blue"></div> 收入</span>
                        <span className="flex items-center gap-2 text-gray-400"><div className="w-2 h-2 rounded-full bg-neon-pink"></div> 支出</span>
                   </div>
               </div>
               <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#29D9FF" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#29D9FF" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF2975" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#FF2975" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} dy={10} tickFormatter={d => d.substring(5)} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} tickFormatter={(v) => `$${v}`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                            <Area type="monotone" dataKey="revenue" stroke="#29D9FF" fill="url(#colorRev)" strokeWidth={2} />
                            <Area type="monotone" dataKey="expenses" stroke="#FF2975" fill="url(#colorExp)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
               </div>
          </div>

          {/* Platform Distribution */}
          <div className="glass-card p-6 flex flex-col h-[400px]">
               <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                   <Globe size={16} className="text-neon-green"/> 收入来源估算
               </h3>
               <div className="flex-1 w-full min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={analyticsData.platformData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {analyticsData.platformData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-display font-bold text-white">4</span>
                        <span className="text-[10px] text-gray-500 uppercase">Sources</span>
                    </div>
               </div>
               <div className="space-y-3 mt-2">
                   {analyticsData.platformData.map((p, i) => (
                       <div key={i} className="flex items-center justify-between text-xs">
                           <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full" style={{backgroundColor: p.fill}}></div>
                               <span className="text-gray-300">{p.name}</span>
                           </div>
                           <span className="font-bold text-white">${p.value.toLocaleString()}</span>
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