import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { ChartDataPoint } from '../types';
import { TrendingUp, DollarSign, Package, Globe, Users, Zap, Activity, Radio, Sun } from 'lucide-react';

const data: ChartDataPoint[] = [
  { name: '00:00', value: 4000, sales: 2400 },
  { name: '04:00', value: 3000, sales: 1398 },
  { name: '08:00', value: 2000, sales: 9800 },
  { name: '12:00', value: 2780, sales: 3908 },
  { name: '16:00', value: 1890, sales: 4800 },
  { name: '20:00', value: 2390, sales: 3800 },
  { name: '24:00', value: 3490, sales: 4300 },
];

const StatWidget: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string; gradient: string; delay: number }> = ({ title, value, icon, trend, gradient, delay }) => (
  <div 
    className="glass-card p-6 flex flex-col justify-between h-[180px] hover:-translate-y-2 transition-transform duration-300 w-full"
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
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-neon-green">
                    <TrendingUp size={14} />
                    <span>+{trend}%</span>
                </div>
             </div>
        )}
     </div>

     <div className="z-10 mt-auto">
        <h3 className="text-[13px] font-medium text-gray-400 tracking-wide mb-1">{title}</h3>
        <p className="text-[36px] font-display font-bold text-white tracking-tight drop-shadow-md">{value}</p>
     </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-12 w-full">
      {/* Header Section */}
      <div className="flex justify-between items-end pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-[11px] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
                  SYSTEM ONLINE
              </span>
              <span className="text-[11px] text-gray-500 font-mono">TOKYO_NODE_01</span>
          </div>
          <h1 className="text-[48px] font-display font-bold text-white tracking-tight leading-none text-shadow-lg">
            Command Center
          </h1>
        </div>
        
        <div className="flex gap-4">
            <button className="h-[50px] px-6 rounded-xl border border-white/10 bg-white/5 text-neon-blue text-sm font-bold hover:bg-white/10 hover:border-neon-blue/50 transition-all flex items-center gap-2 backdrop-blur-md">
                <Activity size={18} /> Live Feed
            </button>
            <button className="h-[50px] bg-gradient-neon-blue text-white px-8 rounded-xl text-sm font-bold shadow-glow-blue hover:scale-105 transition-all flex items-center gap-2">
                <Zap size={18} fill="currentColor" /> Quick Action
            </button>
        </div>
      </div>

      {/* Colorful Widgets Grid - Updated breakpoints for wide screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-6 w-full">
        <StatWidget delay={0} title="Total Revenue" value="$124,592" icon={<DollarSign size={24} />} trend="12.5" gradient="from-cyan-400 to-blue-500" />
        <StatWidget delay={100} title="Active Assets" value="1,432" icon={<Package size={24} />} trend="3.2" gradient="from-purple-400 to-pink-500" />
        <StatWidget delay={200} title="Global Nodes" value="24" icon={<Globe size={24} />} trend="5.8" gradient="from-pink-500 to-rose-500" />
        <StatWidget delay={300} title="User Base" value="8.9k" icon={<Users size={24} />} gradient="from-emerald-400 to-teal-500" />
      </div>

      {/* Glass Chart Area */}
      <div className="glass-card p-8 h-[540px] w-full">
        {/* Decorative Grid Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
              <h2 className="text-[24px] font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neon-blue border border-white/10">
                     <Radio size={20} />
                  </div>
                  Revenue Visualization
              </h2>
          </div>
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
             {['1H', '1D', '1W', '1M', '1Y'].map((t, i) => (
                 <button key={t} className={`px-5 py-2 text-[12px] font-bold rounded-lg transition-all ${i===2 ? 'bg-white/10 text-white shadow-inner-light' : 'text-gray-500 hover:text-white'}`}>
                     {t}
                 </button>
             ))}
          </div>
        </div>
        
        <div className="h-[400px] w-full -ml-4 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#29D9FF" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#29D9FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 12, fontFamily: 'Inter', fontWeight: 500}} 
                dy={20}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 12, fontFamily: 'Inter', fontWeight: 500}} 
                tickFormatter={(value) => `$${value}`}
                dx={-15}
              />
              <Tooltip 
                contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    background: 'rgba(20, 20, 40, 0.8)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    padding: '16px',
                    color: '#fff',
                }}
                itemStyle={{ color: '#29D9FF', fontWeight: 'bold' }}
                cursor={{ stroke: '#29D9FF', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#29D9FF" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                activeDot={{ r: 8, strokeWidth: 4, stroke: 'rgba(41, 217, 255, 0.3)', fill: '#fff', boxShadow: '0 0 20px #29D9FF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;