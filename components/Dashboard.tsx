import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  BarChart, Bar, Cell, LineChart, Line, ComposedChart, ReferenceLine 
} from 'recharts';
import { Product, Shipment, Transaction, Influencer } from '../types';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Globe, Users, Zap, 
  Activity, Radio, Truck, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  Layers, Wallet, Anchor, Clock, AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react';

interface DashboardProps {
  products: Product[];
  shipments: Shipment[];
  transactions: Transaction[];
  influencers: Influencer[];
  onChangeView: (view: string) => void;
}

// --- Sub-components for Atomic Design ---

// 1. Sparkline Widget (Mini Chart inside Card)
const KPIWidget = ({ title, value, subValue, trend, trendUp, data, color, icon: Icon, delay }: any) => {
    return (
        <div 
            className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 border-white/10"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Background Gradient */}
            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20 ${color.bg}`}></div>
            
            <div className="p-5 flex flex-col h-full justify-between relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                            {title}
                        </div>
                        <div className="text-3xl font-display font-bold text-white tracking-tight">{value}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${color.iconBg} ${color.text}`}>
                        <Icon size={20} />
                    </div>
                </div>

                <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col">
                        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-neon-green' : 'text-neon-pink'}`}>
                            {trendUp ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                            {trend}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{subValue}</div>
                    </div>
                    
                    {/* Mini Sparkline */}
                    <div className="w-24 h-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={trendUp ? '#00FF9D' : '#FF2975'} 
                                    strokeWidth={2} 
                                    dot={false} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. Action Item Row
const ActionItem = ({ icon: Icon, color, title, desc, actionLabel, onClick }: any) => (
    <div 
        onClick={onClick}
        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all group"
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} bg-opacity-20`}>
                <Icon size={18} className={color.replace('bg-', 'text-').replace('/20', '')} />
            </div>
            <div>
                <div className="text-xs font-bold text-white group-hover:text-neon-blue transition-colors">{title}</div>
                <div className="text-[10px] text-gray-500">{desc}</div>
            </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors">
            {actionLabel} <ChevronRight size={12} />
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ products, shipments, transactions, influencers, onChangeView }) => {
  
  // --- 1. Data Processing Core ---

  const metrics = useMemo(() => {
      // Financials
      const revenueTx = transactions.filter(t => t.type === 'Revenue');
      const expenseTx = transactions.filter(t => t.type === 'Expense');
      const totalRev = revenueTx.reduce((acc, t) => acc + t.amount, 0);
      const totalExp = expenseTx.reduce((acc, t) => acc + t.amount, 0);
      const netProfit = totalRev - totalExp;
      const profitMargin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;

      // Inventory
      const lowStockCount = products.filter(p => p.stock < 50).length;
      const totalStockVal = products.reduce((acc, p) => acc + ((p.financials?.costOfGoods || 0) * p.stock), 0);
      const activeSKUs = products.filter(p => p.status === 'Active').length;

      // Logistics
      const activeShipments = shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Pending');
      const delayedShipments = shipments.filter(s => s.status === 'Exception').length;

      // Influencers
      const activeCollabs = influencers.filter(i => i.status === 'Content Live' || i.status === 'Sample Sent').length;
      const totalInfCost = influencers.reduce((acc, i) => acc + (i.cost || 0), 0);
      const totalInfGMV = influencers.reduce((acc, i) => acc + (i.gmv || 0), 0);
      const marketROI = totalInfCost > 0 ? (totalInfGMV / totalInfCost) : 0;

      return { 
          totalRev, totalExp, netProfit, profitMargin, 
          lowStockCount, totalStockVal, activeSKUs,
          activeShipments, delayedShipments,
          activeCollabs, marketROI
      };
  }, [products, shipments, transactions, influencers]);

  // Chart Data: Composed Revenue vs Profit
  const mainChartData = useMemo(() => {
      const grouped = new Map<string, { name: string, revenue: number, expense: number, profit: number }>();
      const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      sortedTx.forEach(tx => {
          const date = tx.date.substring(5); // MM-DD
          if (!grouped.has(date)) grouped.set(date, { name: date, revenue: 0, expense: 0, profit: 0 });
          const entry = grouped.get(date)!;
          if (tx.type === 'Revenue') entry.revenue += tx.amount;
          else entry.expense += tx.amount;
          entry.profit = entry.revenue - entry.expense;
      });
      // Fallback for empty state
      if (grouped.size === 0) return Array(7).fill(0).map((_, i) => ({ name: `D-${i}`, revenue: 0, expense: 0, profit: 0 }));
      return Array.from(grouped.values()).slice(-10); // Last 10 points
  }, [transactions]);

  // Mock Sparkline Data generators
  const genSpark = (base: number, volatility: number) => Array(10).fill(0).map(() => ({ value: base + Math.random() * volatility - volatility/2 }));

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full">
      
      {/* 1. Header & Global Status */}
      <div className="flex justify-between items-end pb-4 border-b border-white/5">
        <div>
           <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neon-green/10 border border-neon-green/20 rounded text-[10px] font-bold text-neon-green">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                    </span>
                    AERO CORE ONLINE
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{new Date().toLocaleDateString()} UTC+8</span>
           </div>
           <h1 className="text-[40px] font-display font-bold text-white tracking-tight leading-none text-shadow-lg flex items-center gap-3">
              指挥中心 <span className="text-gray-600 text-lg font-mono font-normal opacity-50">/ COMMAND CENTER</span>
           </h1>
        </div>
        <div className="flex gap-3">
            <button onClick={() => onChangeView('datasync')} className="h-10 px-4 rounded-xl border border-white/10 bg-black/20 text-gray-400 hover:text-white hover:border-white/30 text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all">
                <Globe size={16} /> 数据源同步
            </button>
            <button className="h-10 px-4 rounded-xl bg-white text-black text-xs font-bold hover:scale-105 shadow-glow-white transition-all flex items-center gap-2">
                <Zap size={16} fill="black" /> 生成简报
            </button>
        </div>
      </div>

      {/* 2. Strategic KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIWidget 
              title="净利润 (Net Profit)"
              value={`$${metrics.netProfit.toLocaleString()}`}
              subValue={`${metrics.profitMargin.toFixed(1)}% 利润率`}
              trend="15.4%"
              trendUp={true}
              data={genSpark(5000, 2000)}
              color={{ bg: 'bg-neon-green', iconBg: 'bg-neon-green/10', text: 'text-neon-green' }}
              icon={Wallet}
              delay={0}
          />
          <KPIWidget 
              title="库存总资产 (Assets)"
              value={`$${(metrics.totalStockVal / 1000).toFixed(1)}k`}
              subValue={`${metrics.activeSKUs} 活跃 SKU`}
              trend="2.1%"
              trendUp={true}
              data={genSpark(80000, 5000)}
              color={{ bg: 'bg-neon-purple', iconBg: 'bg-neon-purple/10', text: 'text-neon-purple' }}
              icon={Layers}
              delay={100}
          />
          <KPIWidget 
              title="营销回报 (ROI)"
              value={`${metrics.marketROI.toFixed(2)}x`}
              subValue={`${metrics.activeCollabs} 进行中合作`}
              trend="0.5%"
              trendUp={false}
              data={genSpark(3, 1)}
              color={{ bg: 'bg-neon-pink', iconBg: 'bg-neon-pink/10', text: 'text-neon-pink' }}
              icon={Activity}
              delay={200}
          />
           <KPIWidget 
              title="在途运单 (Logistics)"
              value={metrics.activeShipments.length.toString()}
              subValue={`${metrics.delayedShipments} 异常件`}
              trend="Stable"
              trendUp={true}
              data={genSpark(10, 2)}
              color={{ bg: 'bg-neon-blue', iconBg: 'bg-neon-blue/10', text: 'text-neon-blue' }}
              icon={Truck}
              delay={300}
          />
      </div>

      {/* 3. Main Data Visualization Section */}
      <div className="grid grid-cols-12 gap-6 min-h-[450px]">
          
          {/* Left: Financial Ecology (Composed Chart) */}
          <div className="col-span-12 lg:col-span-8 glass-card p-6 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 relative z-10">
                  <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Radio size={18} className="text-neon-blue" /> 财务生态概览
                      </h2>
                      <p className="text-[10px] text-gray-500 font-mono mt-1">REVENUE VS EXPENSE / NET CASHFLOW</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold">
                      <div className="flex items-center gap-2 text-gray-400"><div className="w-2 h-2 rounded-full bg-neon-blue"></div> 营收</div>
                      <div className="flex items-center gap-2 text-gray-400"><div className="w-2 h-2 rounded-full bg-neon-pink"></div> 支出</div>
                      <div className="flex items-center gap-2 text-gray-400"><div className="w-2 h-0.5 bg-neon-green"></div> 净利趋势</div>
                  </div>
              </div>

              {/* Chart Container */}
              <div className="flex-1 w-full min-h-0 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mainChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#29D9FF" stopOpacity={0.8}/>
                                  <stop offset="100%" stopColor="#29D9FF" stopOpacity={0.2}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} tickFormatter={(val) => `$${val/1000}k`} />
                          <Tooltip 
                              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                              cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          />
                          <Bar dataKey="revenue" fill="url(#barGradient)" barSize={20} radius={[4, 4, 0, 0]} />
                          <Area type="monotone" dataKey="expense" fill="#FF2975" fillOpacity={0.1} stroke="#FF2975" strokeWidth={2} />
                          <Line type="monotone" dataKey="profit" stroke="#00FF9D" strokeWidth={3} dot={{r: 4, fill: '#09090b', strokeWidth: 2}} />
                      </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Right: Supply Chain Radar (Vertical Status Stack) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              
              {/* Inventory Health Card */}
              <div className="glass-card p-6 flex-1 flex flex-col relative overflow-hidden border-neon-yellow/20">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Package size={80} className="text-neon-yellow"/></div>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Layers size={16} className="text-neon-yellow" /> 库存健康度
                  </h3>
                  
                  <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
                      {/* Meter 1 */}
                      <div>
                          <div className="flex justify-between text-xs mb-2">
                              <span className="text-gray-400">低库存 SKU</span>
                              <span className={`font-bold ${metrics.lowStockCount > 0 ? 'text-neon-pink' : 'text-gray-400'}`}>{metrics.lowStockCount} Items</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-neon-pink" style={{ width: `${Math.min((metrics.lowStockCount / products.length) * 100, 100)}%` }}></div>
                          </div>
                      </div>

                       {/* Meter 2 */}
                       <div>
                          <div className="flex justify-between text-xs mb-2">
                              <span className="text-gray-400">资金周转 (Turnover)</span>
                              <span className="font-bold text-neon-blue">Healthy</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-neon-blue" style={{ width: '75%' }}></div>
                          </div>
                      </div>
                  </div>
              </div>

               {/* Logistics Efficiency Card */}
               <div className="glass-card p-6 flex-1 flex flex-col relative overflow-hidden border-neon-blue/20">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Globe size={80} className="text-neon-blue"/></div>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Anchor size={16} className="text-neon-blue" /> 全球物流网络
                  </h3>
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                       <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                           <div className="text-[10px] text-gray-500 uppercase font-bold">海运 (Sea)</div>
                           <div className="text-xl font-bold text-white mt-1">
                               {shipments.filter(s => s.method === 'Sea').length} <span className="text-[10px] text-gray-500">单</span>
                           </div>
                       </div>
                       <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                           <div className="text-[10px] text-gray-500 uppercase font-bold">空运 (Air)</div>
                           <div className="text-xl font-bold text-white mt-1">
                               {shipments.filter(s => s.method === 'Air').length} <span className="text-[10px] text-gray-500">单</span>
                           </div>
                       </div>
                  </div>
              </div>

          </div>
      </div>

      {/* 4. Action Stream (The Bottom Deck) */}
      <div className="glass-card p-0 overflow-hidden border-t-4 border-t-neon-purple">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-white flex items-center gap-2">
                  <AlertCircle size={18} className="text-neon-purple" /> 
                  智能行动流 (Smart Action Stream)
              </h3>
              <span className="text-[10px] bg-neon-purple/20 text-neon-purple border border-neon-purple/30 px-2 py-0.5 rounded font-bold">
                  {metrics.lowStockCount + metrics.delayedShipments} Pending Actions
              </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 p-1 bg-black/20">
               {/* Column 1: Inventory Alerts */}
               <div className="p-2 space-y-2">
                   <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-2">库存预警</div>
                   {metrics.lowStockCount === 0 ? (
                       <div className="p-4 text-center text-gray-500 text-xs italic">所有 SKU 库存充足</div>
                   ) : (
                       products.filter(p => p.stock < 50).slice(0, 3).map(p => (
                           <ActionItem 
                               key={p.id}
                               icon={Package}
                               color="bg-neon-pink"
                               title={`库存不足: ${p.sku}`}
                               desc={`剩余 ${p.stock} 件，建议补货`}
                               actionLabel="补货"
                               onClick={() => onChangeView('restock')}
                           />
                       ))
                   )}
               </div>

               {/* Column 2: Logistics Exceptions */}
               <div className="p-2 space-y-2 border-l border-white/5">
                   <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-2">物流异常</div>
                   {metrics.delayedShipments === 0 ? (
                       <div className="p-4 text-center text-gray-500 text-xs italic">全链路运输正常</div>
                   ) : (
                       shipments.filter(s => s.status === 'Exception').slice(0, 3).map(s => (
                           <ActionItem 
                               key={s.id}
                               icon={AlertTriangle}
                               color="bg-neon-yellow"
                               title={`异常: ${s.trackingNo}`}
                               desc={s.riskReason || "运输延误/清关滞留"}
                               actionLabel="查看"
                               onClick={() => onChangeView('orders')}
                           />
                       ))
                   )}
                   {/* Fallback to show active shipments if no exceptions */}
                   {metrics.delayedShipments === 0 && shipments.slice(0, 2).map(s => (
                       <ActionItem 
                           key={s.id}
                           icon={Truck}
                           color="bg-neon-blue"
                           title={`运输中: ${s.trackingNo}`}
                           desc={`${s.carrier} - ${s.status}`}
                           actionLabel="追踪"
                           onClick={() => onChangeView('orders')}
                       />
                   ))}
               </div>

               {/* Column 3: Finance/Ops */}
               <div className="p-2 space-y-2 border-l border-white/5">
                   <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-2">财务 & 待办</div>
                   <ActionItem 
                        icon={Clock}
                        color="bg-neon-purple"
                        title="月末财务结算"
                        desc="还有 3 天截止本月账期"
                        actionLabel="处理"
                        onClick={() => onChangeView('finance')}
                   />
                    <ActionItem 
                        icon={Users}
                        color="bg-gray-500"
                        title="达人样品寄送"
                        desc={`${influencers.filter(i => i.status === 'Contacted').length} 位达人等待寄样`}
                        actionLabel="查看"
                        onClick={() => onChangeView('influencers')}
                   />
               </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;