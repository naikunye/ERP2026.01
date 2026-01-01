import React, { useState } from 'react';
import { Task } from '../types';
import { 
  CheckCircle2, Circle, Clock, MoreVertical, Plus, 
  AlertCircle, Calendar, User, Search, Filter,
  ArrowRight, Layout
} from 'lucide-react';

const INITIAL_TASKS: Task[] = [
  {
    id: 'T-101',
    title: '审核 Q4 备货计划',
    desc: '根据 AI 预测数据，审核主要 SKU 的补货建议量。',
    priority: 'High',
    status: 'Todo',
    assignee: 'https://ui-avatars.com/api/?name=Admin&background=random',
    dueDate: '2023-11-20',
    tags: ['Inventory', 'Audit']
  },
  {
    id: 'T-102',
    title: '联系 Matson 确认船期',
    desc: '运单 SH-001 出现延误预警，需确认靠港时间。',
    priority: 'High',
    status: 'In Progress',
    assignee: 'https://ui-avatars.com/api/?name=Logistics&background=random',
    dueDate: 'Today',
    tags: ['Logistics', 'Urgent']
  },
  {
    id: 'T-103',
    title: 'TikTok 达人样品寄送',
    desc: '向 @jessicamania 寄送新款降噪耳机样品。',
    priority: 'Medium',
    status: 'In Progress',
    assignee: 'https://ui-avatars.com/api/?name=Marketing&background=random',
    dueDate: '2023-11-22',
    tags: ['Influencer', 'Sample']
  },
  {
    id: 'T-104',
    title: '月度财务报表归档',
    desc: '导出 10 月份所有收支明细并发送给财务。',
    priority: 'Low',
    status: 'Done',
    assignee: 'https://ui-avatars.com/api/?name=Finance&background=random',
    dueDate: '2023-11-15',
    tags: ['Finance', 'Report']
  },
   {
    id: 'T-105',
    title: '更新亚马逊 Listing 图片',
    desc: '替换 AERO-ANC-PRO 的主图为圣诞主题。',
    priority: 'Medium',
    status: 'Todo',
    assignee: 'https://ui-avatars.com/api/?name=Design&background=random',
    dueDate: '2023-12-01',
    tags: ['Content', 'Amazon']
  }
];

const TaskModule: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState('All');

  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'High': return 'text-neon-pink border-neon-pink/30 bg-neon-pink/10';
          case 'Medium': return 'text-neon-yellow border-neon-yellow/30 bg-neon-yellow/10';
          default: return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10';
      }
  };

  const columns = [
      { id: 'Todo', label: '待处理', icon: <Circle size={16}/>, color: 'border-gray-500' },
      { id: 'In Progress', label: '进行中', icon: <Clock size={16}/>, color: 'border-neon-blue' },
      { id: 'Done', label: '已完成', icon: <CheckCircle2 size={16}/>, color: 'border-neon-green' }
  ];

  const moveTask = (taskId: string, newStatus: any) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6 shrink-0">
        <div>
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              任务协作中枢
              <span className="text-neon-yellow/50 font-sans text-sm tracking-widest font-medium border border-neon-yellow/30 px-2 py-0.5 rounded">WORKFLOW</span>
           </h1>
           <p className="text-gray-400 text-sm mt-2">团队任务分配、进度追踪与异常处理。</p>
        </div>
        <div className="flex gap-3">
             <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input 
                      placeholder="搜索任务..." 
                      className="h-10 pl-9 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-neon-yellow outline-none w-48"
                  />
             </div>
             <button className="h-10 px-4 bg-gradient-neon-yellow text-black rounded-xl font-bold text-xs shadow-glow-yellow hover:scale-105 transition-all flex items-center gap-2">
                 <Plus size={16} strokeWidth={3} /> 新建任务
             </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-6 h-full min-w-full">
              {columns.map(col => {
                  const colTasks = tasks.filter(t => 
                    (filter === 'All' || true) && // Placeholder filter logic
                    (col.id === 'Done' ? t.status === 'Done' : (col.id === 'In Progress' ? t.status === 'In Progress' || t.status === 'Review' : t.status === 'Todo'))
                  );

                  return (
                      <div key={col.id} className="flex-1 min-w-[320px] flex flex-col glass-card border-white/5 bg-transparent">
                          {/* Column Header */}
                          <div className={`p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl ${col.id === 'In Progress' ? 'border-b-neon-blue/50' : ''}`}>
                              <div className="flex items-center gap-2 font-bold text-white">
                                  <div className={`text-gray-400`}>{col.icon}</div>
                                  {col.label}
                                  <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full ml-2">{colTasks.length}</span>
                              </div>
                              <button className="text-gray-500 hover:text-white"><MoreVertical size={16}/></button>
                          </div>

                          {/* Task List */}
                          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-black/20">
                              {colTasks.map(task => (
                                  <div 
                                    key={task.id} 
                                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all group relative cursor-pointer"
                                  >
                                      {/* Priority & Tags */}
                                      <div className="flex justify-between items-start mb-3">
                                          <div className="flex gap-2">
                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                                                  {task.priority}
                                              </span>
                                              {task.tags.map(tag => (
                                                  <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-700 text-gray-400 bg-gray-800/50">
                                                      {tag}
                                                  </span>
                                              ))}
                                          </div>
                                          {/* Quick Move (Mock) */}
                                          {task.status !== 'Done' && (
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); moveTask(task.id, task.status === 'Todo' ? 'In Progress' : 'Done'); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neon-green/20 text-neon-green rounded transition-all"
                                                title="推进状态"
                                              >
                                                  <ArrowRight size={14} />
                                              </button>
                                          )}
                                      </div>

                                      <h3 className="text-sm font-bold text-white mb-1 leading-snug group-hover:text-neon-yellow transition-colors">{task.title}</h3>
                                      <p className="text-xs text-gray-500 mb-4 line-clamp-2">{task.desc}</p>

                                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                          <div className="flex items-center gap-2">
                                              <img src={task.assignee} className="w-5 h-5 rounded-full border border-white/10" alt="Assignee" />
                                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                  {task.status === 'In Progress' ? 'Processing' : task.assignee.includes('Admin') ? 'Admin' : 'Staff'}
                                              </span>
                                          </div>
                                          <div className={`text-[10px] font-mono flex items-center gap-1 ${task.dueDate === 'Today' ? 'text-neon-pink' : 'text-gray-500'}`}>
                                              <Calendar size={10} /> {task.dueDate}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                              
                              {/* Add Button */}
                              <button className="w-full py-3 rounded-xl border border-dashed border-white/10 text-gray-500 text-xs font-bold hover:bg-white/5 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2">
                                  <Plus size={14} /> 添加卡片
                              </button>
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>
    </div>
  );
};

export default TaskModule;
