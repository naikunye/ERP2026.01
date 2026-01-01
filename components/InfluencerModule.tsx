import React, { useState } from 'react';
import { Influencer } from '../types';
import { 
  Search, Filter, Instagram, Youtube, Video, MessageCircle, 
  Send, PackageCheck, DollarSign, TrendingUp, Users, ExternalLink, Star,
  Plus, Edit2, X, Check, Trash2, Camera, MapPin, Tag, LayoutTemplate, Columns
} from 'lucide-react';

interface InfluencerModuleProps {
  influencers: Influencer[];
  onAddInfluencer?: (inf: Influencer) => void;
  onUpdateInfluencer?: (inf: Influencer) => void;
  onDeleteInfluencer?: (id: string) => void;
}

const InfluencerModule: React.FC<InfluencerModuleProps> = ({ influencers, onAddInfluencer, onUpdateInfluencer, onDeleteInfluencer }) => {
  const [viewMode, setViewMode] = useState<'List' | 'Board'>('List');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Influencer>>({});

  const filteredList = influencers.filter(inf => 
      (filterPlatform === 'All' || inf.platform === filterPlatform) &&
      (inf.name.toLowerCase().includes(searchTerm.toLowerCase()) || inf.handle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPlatformIcon = (platform: string) => {
      switch(platform) {
          case 'TikTok': return <Video size={16} className="text-black fill-current" />;
          case 'Instagram': return <Instagram size={16} />;
          case 'YouTube': return <Youtube size={16} />;
          default: return <Users size={16} />;
      }
  };

  const getPlatformColor = (platform: string) => {
      switch(platform) {
          case 'TikTok': return 'bg-neon-pink text-white shadow-glow-pink';
          case 'Instagram': return 'bg-gradient-to-tr from-yellow-400 to-purple-600 text-white';
          case 'YouTube': return 'bg-red-600 text-white';
          default: return 'bg-gray-600';
      }
  };

  const getStatusBadge = (status: string) => {
      const styles: Record<string, string> = {
          'Contacted': 'bg-white/10 text-gray-300 border-white/20',
          'Sample Sent': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          'Content Live': 'bg-neon-green/20 text-neon-green border-neon-green/30 animate-pulse',
          'Paid': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          'Negotiating': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      };
      return styles[status] || 'bg-gray-800 text-gray-500';
  };

  // --- Actions ---

  const handleOpenAdd = () => {
      setEditMode(false);
      setForm({
          platform: 'TikTok',
          status: 'Contacted',
          region: 'North America',
          category: 'General',
          avatarUrl: `https://ui-avatars.com/api/?name=New+User&background=random`,
          followers: 0,
          engagementRate: 0,
          cost: 0,
          gmv: 0,
          roi: 0,
          sampleSku: 'N/A'
      });
      setIsModalOpen(true);
  };

  const handleOpenEdit = (inf: Influencer) => {
      setEditMode(true);
      setForm({ ...inf });
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if(!form.name || !form.handle) return;

      if(editMode && onUpdateInfluencer) {
          onUpdateInfluencer(form as Influencer);
      } else if (!editMode && onAddInfluencer) {
          const newInf = {
              ...form,
              id: `INF-${Date.now()}`,
              // default values if missing
              roi: form.cost && form.cost > 0 ? (form.gmv || 0) / form.cost : 0
          } as Influencer;
          onAddInfluencer(newInf);
      }
      setIsModalOpen(false);
  };

  const handleDelete = () => {
      if (form.id && onDeleteInfluencer) {
          onDeleteInfluencer(form.id);
          setIsModalOpen(false);
      }
  };

  // KANBAN: Stages
  const stages = ['Contacted', 'Negotiating', 'Sample Sent', 'Content Live', 'Paid'];

  const handleMoveStatus = (inf: Influencer, newStatus: string) => {
      if (onUpdateInfluencer) {
          onUpdateInfluencer({ ...inf, status: newStatus as any });
      }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20 relative h-full flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6 shrink-0">
        <div>
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              达人矩阵 CRM
              <span className="text-neon-pink/50 font-sans text-sm tracking-widest font-medium border border-neon-pink/30 px-2 py-0.5 rounded">INFLUENCER HUB</span>
           </h1>
           <p className="text-gray-400 text-sm mt-2">管理全球创作者，追踪样品寄送与 ROI 转化。</p>
        </div>
        <div className="flex gap-4">
             <div className="text-right">
                 <div className="text-[10px] text-gray-500 uppercase font-bold">总触达粉丝数</div>
                 <div className="text-2xl font-bold text-white font-display">12.5M+</div>
             </div>
             <div className="w-px h-10 bg-white/10"></div>
             <div className="text-right">
                 <div className="text-[10px] text-gray-500 uppercase font-bold">本月带货 GMV</div>
                 <div className="text-2xl font-bold text-neon-green font-display">$84,290</div>
             </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center sticky top-0 z-30 py-4 backdrop-blur-xl bg-transparent border-b border-white/5 shrink-0">
           <div className="flex gap-4 items-center">
              <div className="relative w-[300px] group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-pink transition-colors" size={18} />
                  <input 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-neon-pink outline-none transition-all placeholder-gray-600"
                      placeholder="搜索达人 / Handle..."
                  />
              </div>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                  {['All', 'TikTok', 'Instagram', 'YouTube'].map(p => (
                      <button 
                        key={p}
                        onClick={() => setFilterPlatform(p)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterPlatform === p ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                          {p}
                      </button>
                  ))}
              </div>
           </div>
           
           <div className="flex gap-3">
                {/* View Toggle */}
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={() => setViewMode('List')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'List' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                        title="列表视图"
                    >
                        <LayoutTemplate size={16}/>
                    </button>
                    <button 
                        onClick={() => setViewMode('Board')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'Board' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                        title="看板视图"
                    >
                        <Columns size={16}/>
                    </button>
                </div>
                
                <button 
                    onClick={handleOpenAdd}
                    className="px-5 py-2 bg-neon-pink hover:bg-neon-pink/80 text-white rounded-lg font-bold text-xs shadow-glow-pink transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> 录入新达人
                </button>
           </div>
      </div>

      {/* VIEW: KANBAN BOARD */}
      {viewMode === 'Board' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-4 h-full min-w-max pb-4">
                  {stages.map(stage => {
                      const stageItems = filteredList.filter(i => i.status === stage);
                      return (
                          <div key={stage} className="w-[300px] flex flex-col h-full bg-white/5 rounded-xl border border-white/5">
                              {/* Stage Header */}
                              <div className="p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-white/5 backdrop-blur-md rounded-t-xl z-10">
                                  <div className="text-sm font-bold text-white flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${stage === 'Content Live' ? 'bg-neon-green' : 'bg-gray-400'}`}></div>
                                      {stage}
                                  </div>
                                  <span className="text-xs text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">{stageItems.length}</span>
                              </div>
                              
                              {/* Cards Area */}
                              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                  {stageItems.map(inf => (
                                      <div 
                                        key={inf.id} 
                                        className="bg-black/20 p-3 rounded-lg border border-white/5 hover:border-neon-pink/50 cursor-grab active:cursor-grabbing group relative"
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData("infId", inf.id);
                                        }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            // Handle drop in parent container
                                        }}
                                      >
                                          <div className="flex items-center gap-3 mb-2">
                                              <img src={inf.avatarUrl} className="w-8 h-8 rounded-full border border-white/10" />
                                              <div className="min-w-0">
                                                  <div className="font-bold text-white text-xs truncate">{inf.name}</div>
                                                  <div className="text-[10px] text-gray-500 truncate">{inf.handle}</div>
                                              </div>
                                          </div>
                                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                  {getPlatformIcon(inf.platform)} {inf.platform}
                                              </div>
                                              <button onClick={() => handleOpenEdit(inf)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-white">
                                                  <Edit2 size={12} />
                                              </button>
                                          </div>
                                          
                                          {/* Simple Dropdown for Moving (Simulation of Drag Drop) */}
                                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <select 
                                                value={inf.status}
                                                onChange={(e) => handleMoveStatus(inf, e.target.value)}
                                                className="bg-black text-white text-[10px] border border-white/20 rounded cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                              </select>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )}

      {/* VIEW: GRID LIST (Original) */}
      {viewMode === 'List' && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredList.map(inf => (
              <div key={inf.id} className="glass-card p-6 group hover:border-neon-pink/50 transition-all duration-300 relative overflow-hidden">
                  
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/5 rounded-full blur-[40px] group-hover:bg-neon-pink/10 transition-colors"></div>

                  {/* Header: Identity */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex gap-4">
                          <div className="relative">
                              <img src={inf.avatarUrl} className="w-14 h-14 rounded-full border-2 border-white/10 object-cover group-hover:scale-105 transition-transform" alt={inf.name} />
                              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#14141e] ${getPlatformColor(inf.platform)}`}>
                                  {getPlatformIcon(inf.platform)}
                              </div>
                          </div>
                          <div>
                              <h3 className="font-bold text-white text-lg leading-tight">{inf.name}</h3>
                              <div className="text-gray-400 text-xs font-mono mb-1">{inf.handle}</div>
                              <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(inf.status)}`}>
                                      {inf.status}
                                  </span>
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <Star size={10} className="text-yellow-500 fill-current"/> {inf.region}
                                  </span>
                              </div>
                          </div>
                      </div>
                      <button 
                        onClick={() => handleOpenEdit(inf)}
                        className="text-gray-500 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
                      >
                          <Edit2 size={16} />
                      </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-6 relative z-10">
                      <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                          <div className="text-[10px] text-gray-500 uppercase">粉丝</div>
                          <div className="text-sm font-bold text-white">{(inf.followers / 1000).toFixed(1)}K</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                          <div className="text-[10px] text-gray-500 uppercase">互动率</div>
                          <div className="text-sm font-bold text-neon-blue">{inf.engagementRate}%</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                          <div className="text-[10px] text-gray-500 uppercase">ROI</div>
                          <div className={`text-sm font-bold ${inf.roi >= 3 ? 'text-neon-green' : 'text-gray-300'}`}>{inf.roi.toFixed(1)}x</div>
                      </div>
                  </div>

                  {/* Financials / Sample Info */}
                  <div className="space-y-3 relative z-10 border-t border-white/10 pt-4">
                       <div className="flex justify-between items-center text-xs">
                           <span className="text-gray-500 flex items-center gap-1"><PackageCheck size={12}/> 寄送样品</span>
                           <span className="text-white font-mono">{inf.sampleSku}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                           <span className="text-gray-500 flex items-center gap-1"><DollarSign size={12}/> 合作费用</span>
                           <span className="text-white font-bold">${inf.cost}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                           <span className="text-gray-500 flex items-center gap-1"><TrendingUp size={12}/> 产出 GMV</span>
                           <span className="text-neon-green font-bold text-sm">+${inf.gmv.toLocaleString()}</span>
                       </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 relative z-10">
                      <button className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 flex items-center justify-center gap-2 transition-colors">
                          <MessageCircle size={14} /> 联系
                      </button>
                      <button className="flex-1 py-2 rounded-lg bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink border border-neon-pink/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                          <Send size={14} /> 寄样
                      </button>
                  </div>
              </div>
          ))}
      </div>
      )}

      {/* Add/Edit Modal (Same as before but ensures reuse) */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
              <div className="w-full max-w-2xl glass-card border border-white/20 shadow-2xl overflow-hidden animate-scale-in">
                  
                  {/* Modal Header */}
                  <div className="px-8 py-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {editMode ? <Edit2 size={18} /> : <Plus size={18} />}
                          {editMode ? '编辑达人档案' : '录入新达人'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="hover:text-neon-pink text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
                      
                      <div className="flex gap-6">
                          {/* Avatar */}
                          <div className="flex flex-col items-center gap-3">
                              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group">
                                  {form.avatarUrl ? <img src={form.avatarUrl} className="w-full h-full object-cover" alt="" /> : <Users size={30} className="text-gray-600"/>}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                      <Camera size={20} className="text-white" />
                                  </div>
                              </div>
                              <div className="text-[10px] text-gray-500 uppercase font-bold">Profile Pic</div>
                          </div>

                          {/* Basic Info */}
                          <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-[10px] text-gray-500 font-bold uppercase">姓名 / 昵称</label>
                                      <input 
                                          value={form.name || ''}
                                          onChange={(e) => setForm(p => ({...p, name: e.target.value}))}
                                          className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                          placeholder="例如: Jessica Tech"
                                      />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] text-gray-500 font-bold uppercase">Handle (ID)</label>
                                      <input 
                                          value={form.handle || ''}
                                          onChange={(e) => setForm(p => ({...p, handle: e.target.value}))}
                                          className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none font-mono"
                                          placeholder="@username"
                                      />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-[10px] text-gray-500 font-bold uppercase">平台</label>
                                      <select 
                                          value={form.platform}
                                          onChange={(e) => setForm(p => ({...p, platform: e.target.value as any}))}
                                          className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                      >
                                          <option value="TikTok">TikTok</option>
                                          <option value="Instagram">Instagram</option>
                                          <option value="YouTube">YouTube</option>
                                      </select>
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] text-gray-500 font-bold uppercase">粉丝数</label>
                                      <input 
                                          type="number"
                                          value={form.followers || 0}
                                          onChange={(e) => setForm(p => ({...p, followers: parseInt(e.target.value)}))}
                                          className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      {/* ... (rest of form fields same as before) ... */}
                      <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><MapPin size={10}/> 地区</label>
                                <input 
                                    value={form.region || ''}
                                    onChange={(e) => setForm(p => ({...p, region: e.target.value}))}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                />
                           </div>
                           <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><Tag size={10}/> 垂直领域</label>
                                <input 
                                    value={form.category || ''}
                                    onChange={(e) => setForm(p => ({...p, category: e.target.value}))}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                />
                           </div>
                           <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase">当前状态</label>
                                <select 
                                    value={form.status}
                                    onChange={(e) => setForm(p => ({...p, status: e.target.value as any}))}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                >
                                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                           </div>
                      </div>

                       {/* Performance & Cost */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">合作与绩效数据</h4>
                          <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                   <label className="text-[10px] text-gray-500 font-bold uppercase">合作费用 ($)</label>
                                   <input 
                                      type="number"
                                      value={form.cost || 0}
                                      onChange={(e) => setForm(p => ({...p, cost: parseFloat(e.target.value)}))}
                                      className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-pink outline-none"
                                   />
                               </div>
                               <div className="space-y-1">
                                   <label className="text-[10px] text-gray-500 font-bold uppercase">产出 GMV ($)</label>
                                   <input 
                                      type="number"
                                      value={form.gmv || 0}
                                      onChange={(e) => setForm(p => ({...p, gmv: parseFloat(e.target.value)}))}
                                      className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-neon-green font-bold focus:border-neon-green outline-none"
                                   />
                               </div>
                          </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center">
                      <div>
                          {editMode && (
                              <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors" title="删除">
                                  <Trash2 size={18} />
                              </button>
                          )}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white font-bold text-sm">取消</button>
                        <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-neon-pink text-white font-bold text-sm shadow-glow-pink hover:scale-105 transition-transform flex items-center gap-2">
                            <Check size={16}/> 保存档案
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default InfluencerModule;