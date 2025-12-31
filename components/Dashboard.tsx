import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Product, Shipment, Transaction, Influencer } from '../types';
import { TrendingUp, DollarSign, Package, Globe, Users, Zap, Activity, Radio, Truck, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  shipments: Shipment[];
  transactions: Transaction[];
  influencers: Influencer[];
  onChangeView: (view: string) => void;
}

const StatWidget: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string; trendUp?: boolean; gradient: string; delay: number }> = ({ title, value, icon, trend, trendUp = true, gradient, delay }) => (
  <div 
    className="glass-card p-6 flex flex-col justify-between h-[180px] hover:-translate-y-2 transition-transform duration-300 w-full relative overflow-hidden group"
    style={{ animationDelay: `${delay}ms` }}
  >
     {/* Gradient Blob Background */}
     <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`}></div>

     <div className="flex justify-between items-start z-10 relative">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
            {icon}
        </div>
        
        {trend && (
             <div className="flex flex-col items-end bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                <div className={`flex items-center gap-1.5 text-[12px] font-bold ${trendUp ? 'text-neon-green' : 'text-neon-pink'}`}>
                    <TrendingUp size={14} className={!trendUp ? 'rotate-180' : ''} />
                    <span>{trend}%</span>
                </div>
             </div>
        )}
     </div>

     <div className="z-10 mt-auto">
        <h3 className="text-[13px] font-medium text-gray-400 tracking-wide mb-1">{title}</h3>
        <p className="text-[32px] font-display font-bold text-white tracking-tight drop-shadow-md truncate">{value}</p>
     </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ products, shipments, transactions, influencers, onChangeView }) => {
  
  // --- 1. Real-time Calculations ---
  
  const metrics = useMemo(() => {
    // Finance
    const totalRevenue = transactions.filter(t => t.type === 'Revenue').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
    const netProfit = totalRevenue - totalExpense;
    
    // Inventory
    const totalStockValue = products.reduce((acc, p) => {
        const cost = (p.financials?.costOfGoods || 0) + (p.financials?.shippingCost || 0);
        return acc + (cost * p.stock);
    }, 0);
    const activeProducts = products.filter(p => p.status === 'Active').length;
    
    // Logistics
    const pendingShipments = shipments.filter(s => s.status !== 'Delivered').length;
    
    // Influencers
    const totalReach = influencers.reduce((acc, i) => acc + i.followers, 0);

    return { totalRevenue, totalStockValue, pendingShipments, totalReach, netProfit };
  }, [products, shipments, transactions, influencers]);

  // --- 2. Chart Data Aggregation (Group Transactions by Date) ---
  const chartData = useMemo(() => {
      const grouped = new Map<string, { name: string, revenue: number, expense: number, profit: number }>();
      
      // Sort transactions by date first
      const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      sortedTx.forEach(tx => {
          const date = tx.date.substring(5); // MM-DD
          if (!grouped.has(date)) {
              grouped.set(date, { name: date, revenue: 0, expense: 0, profit: 0 });
          }
          const entry = grouped.get(date)!;
          if (tx.type === 'Revenue') entry.revenue += tx.amount;
          else entry.expense += tx.amount;
          entry.profit = entry.revenue - entry.expense;
      });

      // If no data, provide placeholder
      if (grouped.size === 0) {
          return [
              { name: 'Mon', revenue: 0, expense: 0, profit: 0 },
              { name: 'Tue', revenue: 0, expense: 0, profit: 0 },
              { name: 'Wed', revenue: 0, expense: 0, profit: 0 },
              { name: 'Thu', revenue: 0, expense: 0, profit: 0 },
              { name: 'Fri', revenue: 0, expense: 0, profit: 0 },
          ];
      }

      return Array.from(grouped.values()).slice(-7); // Last 7 days with data
  }, [transactions]);

  // Helper formatting
  const formatK = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 w-full">
      {/* Header Section */}
      <div className="flex justify-between items-end pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-[11px] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
                  系统在线
              </span>
              <span className="text-[11px] text-gray-500 font-mono">LIVE_DATA_FEED</span>
          </div>
          <h1 className="text-[48px] font-display font-bold text-white tracking-tight leading-none text-shadow-lg">
            中央指挥中心
          </h1>
        </div>
        
        <div className="flex gap-4">
            <button onClick={() => onChangeView('restock')} className="h-[50px] px-6 rounded-xl border border-white/10 bg-white/5 text-neon-blue text-sm font-bold hover:bg-white/10 hover:border-neon-blue/50 transition-all flex items-center gap-2 backdrop-blur-md">
                <Activity size={18} /> 库存预警
                {products.some(p => p.stock < 50) && <span className="w-2 h-2 rounded-full bg-neon-pink animate-ping"></span>}
            </button>
            <button onClick={() => onChangeView('finance')} className="h-[50px] bg-gradient-neon-blue text-white px-8 rounded-xl text-sm font-bold shadow-glow-blue hover:scale-105 transition-all flex items-center gap-2">
                <Zap size={18} fill="currentColor" /> 财务速览
            </button>
        </div>
      </div>

      {/* Real Metrics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-6 w-full">
        <StatWidget 
            delay={0} 
            title="总营收 (Revenue)" 
            value={`$${metrics.totalRevenue.toLocaleString()}`} 
            icon={<DollarSign size={24} />} 
            trend="12.5" // You could calculate this vs previous period if data existed
            gradient="from-cyan-400 to-blue-500" 
        />
        <StatWidget 
            delay={100} 
            title="库存资产 (Asset Value)" 
            value={`¥${metrics.totalStockValue.toLocaleString()}`} 
            icon={<Package size={24} />} 
            trend="Active"
            trendUp={true}
            gradient="from-purple-400 to-pink-500" 
        />
        <StatWidget 
            delay={200} 
            title="在途运单 (In Transit)" 
            value={metrics.pendingShipments.toString()} 
            icon={<Truck size={24} />} 
            trend={metrics.pendingShipments > 0 ? "Busy" : "Idle"} 
            gradient="from-pink-500 to-rose-500" 
        />
        <StatWidget 
            delay={300} 
            title="达人覆盖 (Reach)" 
            value={formatK(metrics.totalReach)} 
            icon={<Users size={24} />} 
            gradient="from-emerald-400 to-teal-500" 
        />
      </div>

      {/* Grid: Main Chart & Alerts */}
      <div className="grid grid-cols-12 gap-6 h-[500px]">
          
          {/* Main Chart */}
          <div className="col-span-12 lg:col-span-8 glass-card p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                  <h2 className="text-[24px] font-bold text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neon-blue border border-white/10">
                        <Radio size={20} />
                      </div>
                      财务动态可视化
                  </h2>
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full bg-neon-blue"></span> 收入
                      <span className="w-3 h-3 rounded-full bg-neon-pink ml-2"></span> 支出
                  </div>
              </div>
            </div>
            
            <div className="flex-1 w-full -ml-4 relative z-10 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#29D9FF" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#29D9FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF2975" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#FF2975" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9CA3AF', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9CA3AF', fontSize: 12}} 
                    tickFormatter={(value) => `$${value}`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        background: 'rgba(20, 20, 40, 0.9)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#29D9FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expense" stroke="#FF2975" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions / Alerts */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="glass-card p-6 flex-1 border-l-4 border-l-neon-yellow relative overflow-hidden">
                   <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                       <AlertTriangle size={18} className="text-neon-yellow"/> 需关注事项
                   </h3>
                   <div className="space-y-3 overflow-y-auto max-h-[160px] custom-scrollbar">
                       {products.filter(p => p.stock < 50).map(p => (
                           <div key={p.id} className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors cursor-pointer" onClick={() => onChangeView('restock')}>
                               <div className="truncate flex-1 pr-2">
                                   <div className="text-xs text-gray-400">{p.sku}</div>
                                   <div className="text-sm font-bold text-white truncate">{p.name}</div>
                               </div>
                               <div className="text-xs font-bold text-neon-pink px-2 py-1 bg-neon-pink/10 rounded">
                                   缺货 ({p.stock})
                               </div>
                           </div>
                       ))}
                       {products.filter(p => p.stock >= 50).length === products.length && (
                           <div className="text-gray-500 text-sm italic text-center py-4">暂无紧急缺货预警</div>
                       )}
                   </div>
              </div>

              <div className="glass-card p-6 flex-1 flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-neon-purple/20 to-transparent border-neon-purple/30">
                   <div className="absolute right-[-20px] bottom-[-20px] opacity-20"><Globe size={100} /></div>
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">全球净利润</h3>
                   <div className="text-4xl font-display font-bold text-white mb-2">
                       ${metrics.netProfit.toLocaleString()}
                   </div>
                   <div className="flex gap-2 mt-2">
                       <button onClick={() => onChangeView('finance')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors backdrop-blur-md">
                           查看报表
                       </button>
                   </div>
              </div>
          </div>

      </div>
    </div>
  );
};

export default Dashboard;