
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, PieChart, 
  ArrowUpRight, ArrowDownRight, CreditCard, FileText, Download, Calendar,
  Plus, X, Tag, AlignLeft, Check, Box, Truck, Megaphone, Settings, Users, Percent,
  ArrowRightLeft, BadgeCent
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface FinanceModuleProps {
    transactions: Transaction[];
    onAddTransaction: (t: Transaction) => void;
}

const FinanceModule: React.FC<FinanceModuleProps> = ({ transactions, onAddTransaction }) => {
  
  // --- Bookkeeping Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'Revenue' | 'Expense'>('Expense');
  
  // New Currency Logic
  const [currency, setCurrency] = useState<'USD' | 'CNY'>('CNY'); // Default to CNY for expenses usually
  const [exchangeRate, setExchangeRate] = useState(7.2);
  const [inputAmount, setInputAmount] = useState(''); // Raw input
  
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Cleared' | 'Pending'>('Cleared');

  // Categories Config
  const EXPENSE_CATEGORIES = [
      { id: 'COGS', label: '采购/货值', icon: <Box size={18}/>, color: '#FF2975' },
      { id: 'Shipping', label: '物流运费', icon: <Truck size={18}/>, color: '#B829FF' },
      { id: 'Marketing', label: '营销广告', icon: <Megaphone size={18}/>, color: '#29D9FF' },
      { id: 'Operations', label: '运营杂支', icon: <Settings size={18}/>, color: '#FFD600' },
      { id: 'Salary', label: '人员薪资', icon: <Users size={18}/>, color: '#00FF9D' },
      { id: 'Tax', label: '税务合规', icon: <Percent size={18}/>, color: '#FF9500' },
  ];

  const REVENUE_CATEGORIES = [
      { id: 'Sales', label: '销售回款', icon: <DollarSign size={18}/> },
      { id: 'Refund', label: '退款/赔偿', icon: <ArrowDownRight size={18}/> },
      { id: 'Investment', label: '融资注资', icon: <TrendingUp size={18}/> },
      { id: 'Other', label: '其他收入', icon: <Plus size={18}/> },
  ];

  const activeCategories = txType === 'Expense' ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES;

  // Computed USD Amount
  const finalUsdAmount = useMemo(() => {
      const val = parseFloat(inputAmount);
      if (isNaN(val)) return 0;
      return currency === 'USD' ? val : val / exchangeRate;
  }, [inputAmount, currency, exchangeRate]);

  // Submit Handler
  const handleSubmit = () => {
      if (!inputAmount || !category) return;
      
      const isRmb = currency === 'CNY';
      // Append original currency note if it was converted
      const finalDesc = isRmb 
        ? `${description} (原币: ¥${parseFloat(inputAmount).toLocaleString()} @ ${exchangeRate})` 
        : description || (txType === 'Revenue' ? '一般收入' : '一般支出');

      const newTx: Transaction = {
          id: `TX-${Date.now().toString().slice(-6)}`,
          date,
          type: txType,
          category,
          amount: parseFloat(finalUsdAmount.toFixed(2)), // Store unified USD
          description: finalDesc,
          status
      };
      
      onAddTransaction(newTx);
      
      // Reset & Close
      setIsModalOpen(false);
      setInputAmount('');
      setCategory('');
      setDescription('');
      setTxType('Expense');
      setCurrency('CNY'); // Reset preference
  };

  const handleExportCSV = () => {
      const headers = ['ID', 'Date', 'Type', 'Category', 'Amount (USD)', 'Status', 'Description'];
      const rows = transactions.map(t => [
          t.id, t.date, t.type, t.category, t.amount.toFixed(2), t.status, `"${t.description.replace(/"/g, '""')}"`
      ]);
      const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FINANCE_EXPORT_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- Real-time Data Aggregation ---
  
  const financials = useMemo(() => {
      const revenue = transactions.filter(t => t.type === 'Revenue').reduce((acc, t) => acc + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
      const net = revenue - expenses;
      const margin = revenue > 0 ? (net / revenue) * 100 : 0;
      return { revenue, expenses, net, margin };
  }, [transactions]);

  // Chart 1: Cash Flow Over Time
  const cashFlowData = useMemo(() => {
      const grouped = new Map<string, { date: string, revenue: number, expenses: number }>();
      
      // Initialize with transactions
      transactions.forEach(t => {
          if (!grouped.has(t.date)) {
              grouped.set(t.date, { date: t.date, revenue: 0, expenses: 0 });
          }
          const entry = grouped.get(t.date)!;
          if (t.type === 'Revenue') entry.revenue += t.amount;
          else entry.expenses += t.amount;
      });

      // Sort by date and format
      let sorted = Array.from(grouped.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // If empty, provide a fallback for visual structure
      if (sorted.length === 0) {
          const today = new Date().toISOString().split('T')[0];
          sorted = [{ date: today, revenue: 0, expenses: 0 }];
      }

      // Format date for X-Axis (e.g. 11/15)
      return sorted.map(item => ({
          ...item,
          name: item.date.slice(5).replace('-', '/')
      }));
  }, [transactions]);

  // Chart 2: Expense Category Breakdown
  const expenseStructure = useMemo(() => {
      const expenseTxs = transactions.filter(t => t.type === 'Expense');
      const grouped = new Map<string, number>();
      let total = 0;

      expenseTxs.forEach(t => {
          const current = grouped.get(t.category) || 0;
          grouped.set(t.category, current + t.amount);
          total += t.amount;
      });

      const result = Array.from(grouped.entries()).map(([catId, value]) => {
          const config = EXPENSE_CATEGORIES.find(c => c.id === catId);
          return {
              name: config?.label || catId,
              value: total > 0 ? Math.round((value / total) * 100) : 0,
              amount: value,
              color: config?.color || '#666'
          };
      }).sort((a, b) => b.value - a.value);

      return result.length > 0 ? result : [{ name: '无支出', value: 100, amount: 0, color: '#333' }];
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20 relative">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              财务中枢
              <span className="text-neon-green/50 font-sans text-sm tracking-widest font-medium border border-neon-green/30 px-2 py-0.5 rounded">FINANCIAL CORE</span>
           </h1>
           <p className="text-gray-400 text-sm mt-2">实时利润核算与现金流监控 (Base: USD)。</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => { setIsModalOpen(true); setInputAmount(''); }}
                className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-bold shadow-glow-white hover:scale-105 transition-all flex items-center gap-2"
            >
                <Plus size={18} strokeWidth={3}/> 记一笔
            </button>
            <button 
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-gradient-neon-blue text-white rounded-xl text-xs font-bold shadow-glow-blue hover:scale-105 transition-all flex items-center gap-2"
            >
                <Download size={14} /> 导出报表
            </button>
        </div>
      </div>

      {/* Bookkeeping Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
              <div className="w-full max-w-lg glass-card border border-white/20 shadow-2xl overflow-hidden animate-scale-in">
                  <div className="relative px-8 py-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">记账 (Bookkeeping)</h3>
                      <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-8 space-y-6">
                      
                      {/* Type Toggle */}
                      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
                          <button 
                              onClick={() => { setTxType('Expense'); setCategory(''); setCurrency('CNY'); }}
                              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${txType === 'Expense' ? 'bg-neon-pink text-white shadow-glow-pink' : 'text-gray-400 hover:text-white'}`}
                          >
                              支出 (Expense)
                          </button>
                          <button 
                              onClick={() => { setTxType('Revenue'); setCategory(''); setCurrency('USD'); }}
                              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${txType === 'Revenue' ? 'bg-neon-green text-black shadow-glow-green' : 'text-gray-400 hover:text-white'}`}
                          >
                              收入 (Revenue)
                          </button>
                      </div>

                      {/* Currency & Amount Input */}
                      <div className="flex gap-4 items-start">
                          <div className="w-24 shrink-0 space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold uppercase">币种</label>
                              <div className="relative">
                                  <select 
                                      value={currency}
                                      onChange={(e) => setCurrency(e.target.value as any)}
                                      className="w-full h-12 bg-black/40 border border-white/10 rounded-xl text-white font-bold px-2 outline-none focus:border-white/30 appearance-none text-center"
                                  >
                                      <option value="CNY">¥ CNY</option>
                                      <option value="USD">$ USD</option>
                                  </select>
                                  <BadgeCent size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                              </div>
                          </div>
                          
                          <div className="flex-1 space-y-1 relative group">
                              <label className="text-[10px] text-gray-500 font-bold uppercase">金额 ({currency})</label>
                              <input 
                                 type="number"
                                 autoFocus
                                 value={inputAmount}
                                 onChange={(e) => setInputAmount(e.target.value)}
                                 placeholder="0.00"
                                 className="w-full h-12 bg-transparent border-b-2 border-white/10 text-3xl font-display font-bold text-white outline-none focus:border-neon-blue placeholder-gray-700"
                              />
                          </div>
                      </div>

                      {/* Exchange Rate Logic */}
                      {currency === 'CNY' && (
                          <div className="flex items-center gap-3 p-3 bg-neon-yellow/5 border border-neon-yellow/10 rounded-xl">
                              <div className="text-[10px] text-neon-yellow font-bold whitespace-nowrap flex items-center gap-1">
                                  <ArrowRightLeft size={12}/> 汇率折算
                              </div>
                              <input 
                                  type="number"
                                  value={exchangeRate}
                                  onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                                  className="w-16 bg-black/20 border-b border-neon-yellow/30 text-xs text-white text-center outline-none"
                              />
                              <div className="flex-1 text-right text-xs font-mono text-gray-300">
                                  ≈ <span className="text-white font-bold">${finalUsdAmount.toFixed(2)}</span> USD
                              </div>
                          </div>
                      )}

                      {/* Category Grid */}
                      <div className="space-y-2">
                          <label className="text-[10px] text-gray-500 font-bold uppercase">选择分类</label>
                          <div className="grid grid-cols-3 gap-3">
                              {activeCategories.map(cat => (
                                  <button 
                                      key={cat.id}
                                      onClick={() => setCategory(cat.id)}
                                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                                          category === cat.id 
                                            ? (txType === 'Revenue' ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'bg-neon-pink/20 border-neon-pink text-neon-pink')
                                            : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                      }`}
                                  >
                                      {cat.icon}
                                      <span className="text-xs font-bold">{cat.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><Calendar size={10}/> 日期</label>
                              <input 
                                  type="date" 
                                  value={date} 
                                  onChange={(e) => setDate(e.target.value)}
                                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white outline-none focus:border-white/30"
                              />
                          </div>
                           <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><Tag size={10}/> 状态</label>
                              <div className="flex bg-white/5 rounded-lg border border-white/10 h-10 p-1">
                                  <button onClick={() => setStatus('Cleared')} className={`flex-1 rounded text-xs font-bold transition-all ${status === 'Cleared' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>已入账</button>
                                  <button onClick={() => setStatus('Pending')} className={`flex-1 rounded text-xs font-bold transition-all ${status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' : 'text-gray-500'}`}>挂账</button>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-1">
                           <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><AlignLeft size={10}/> 备注</label>
                           <textarea 
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="输入交易备注..."
                              className="w-full h-16 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none resize-none focus:bg-white/10"
                           />
                      </div>

                      <button 
                          onClick={handleSubmit}
                          disabled={!inputAmount || !category}
                          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                              !inputAmount || !category 
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : txType === 'Revenue' ? 'bg-neon-green text-black hover:scale-[1.02]' : 'bg-neon-pink text-white hover:scale-[1.02]'
                          }`}
                      >
                          <Check size={20} strokeWidth={3} /> 确认记账
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-l-4 border-l-neon-blue relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowUpRight size={80} className="text-neon-blue"/></div>
               <div className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">总营收 (Revenue USD)</div>
               <div className="text-[32px] font-display font-bold text-white">${financials.revenue.toLocaleString()}</div>
               <div className="flex items-center gap-2 mt-2 text-xs text-neon-blue">
                   <div className="px-2 py-0.5 bg-neon-blue/10 rounded border border-neon-blue/20 flex items-center gap-1">
                       <TrendingUp size={10} /> +12.5%
                   </div>
                   <span className="text-gray-500">vs 上月</span>
               </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-neon-pink relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowDownRight size={80} className="text-neon-pink"/></div>
               <div className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">总支出 (Expenses USD)</div>
               <div className="text-[32px] font-display font-bold text-white">${financials.expenses.toLocaleString()}</div>
               <div className="flex items-center gap-2 mt-2 text-xs text-neon-pink">
                   <div className="px-2 py-0.5 bg-neon-pink/10 rounded border border-neon-pink/20 flex items-center gap-1">
                       <TrendingUp size={10} /> +5.2%
                   </div>
                   <span className="text-gray-500">营销投入增加</span>
               </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-neon-green relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={80} className="text-neon-green"/></div>
               <div className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">净利润 (Net Profit USD)</div>
               <div className="text-[32px] font-display font-bold text-neon-green">{financials.net > 0 ? '+' : ''}${financials.net.toLocaleString()}</div>
               <div className="flex items-center gap-2 mt-2 text-xs">
                   <span className={`font-bold ${financials.margin > 20 ? 'text-neon-green' : 'text-yellow-500'}`}>
                       {financials.margin.toFixed(1)}% 利润率
                   </span>
                   <span className="text-gray-500">| 健康</span>
               </div>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
          
          {/* Main Trend Chart */}
          <div className="lg:col-span-2 glass-card p-6 flex flex-col">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp size={16} className="text-neon-blue" /> 现金流趋势 (Cash Flow)
              </h3>
              <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowData}>
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
                          <XAxis dataKey="name" stroke="#4B5563" tick={{fill: '#9CA3AF', fontSize: 10}} axisLine={false} tickLine={false} />
                          <YAxis stroke="#4B5563" tick={{fill: '#9CA3AF', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#29D9FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="收入" />
                          <Area type="monotone" dataKey="expenses" stroke="#FF2975" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" name="支出" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Cost Structure */}
          <div className="glass-card p-6 flex flex-col">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                  <PieChart size={16} className="text-neon-purple" /> 成本结构 (Cost Structure)
              </h3>
              <div className="flex-1 w-full min-h-0 relative">
                   <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={expenseStructure} layout="vertical" barSize={20}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#9CA3AF" tick={{fill: 'white', fontSize: 11}} width={70} axisLine={false} tickLine={false} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}} 
                                contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                                formatter={(value: number, name: string, props: any) => [`$${props.payload.amount} (${value}%)`, name]}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {expenseStructure.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                   </ResponsiveContainer>
              </div>
              {expenseStructure.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      {expenseStructure.slice(0, 4).map(c => (
                          <div key={c.name} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: c.color}}></div>
                              <span className="text-gray-400">{c.name}</span>
                              <span className="text-white font-bold">{c.value}%</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {/* Transaction List */}
      <div className="glass-card p-0 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
               <h3 className="font-bold text-white flex items-center gap-2">
                   <FileText size={18} /> 近期交易流水
               </h3>
               <div className="text-xs text-gray-500">显示最近 5 笔交易</div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-white/5 uppercase text-xs font-bold text-gray-500">
                      <tr>
                          <th className="px-6 py-4">交易 ID</th>
                          <th className="px-6 py-4">日期</th>
                          <th className="px-6 py-4">类别</th>
                          <th className="px-6 py-4">描述</th>
                          <th className="px-6 py-4">状态</th>
                          <th className="px-6 py-4 text-right">金额 (USD)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {transactions.slice(0, 5).map(t => (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs">{t.id}</td>
                              <td className="px-6 py-4">{t.date}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      t.type === 'Revenue' ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : 'bg-neon-pink/10 text-neon-pink border-neon-pink/20'
                                  }`}>
                                      {activeCategories.find(c => c.id === t.category)?.label || t.category}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-white max-w-xs truncate" title={t.description}>{t.description}</td>
                              <td className="px-6 py-4">
                                  <span className="flex items-center gap-1 text-xs">
                                      {t.status === 'Cleared' ? <div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div> : <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>}
                                      {t.status}
                                  </span>
                              </td>
                              <td className={`px-6 py-4 text-right font-bold font-mono ${t.type === 'Revenue' ? 'text-neon-green' : 'text-white'}`}>
                                  {t.type === 'Revenue' ? '+' : '-'}${t.amount.toLocaleString()}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default FinanceModule;
