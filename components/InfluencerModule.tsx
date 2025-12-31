import React, { useState } from 'react';
import { Influencer } from '../types';
import { 
  Search, Filter, Instagram, Youtube, Video, MessageCircle, 
  Send, PackageCheck, DollarSign, TrendingUp, Users, ExternalLink, Star
} from 'lucide-react';

interface InfluencerModuleProps {
  influencers: Influencer[];
}

const InfluencerModule: React.FC<InfluencerModuleProps> = ({ influencers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('All');

  const filteredList = influencers.filter(inf => 
      (filterPlatform === 'All' || inf.platform === filterPlatform) &&
      (inf.name.toLowerCase().includes(searchTerm.toLowerCase()) || inf.handle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPlatformIcon = (platform: string) => {
      switch(platform) {
          case 'TikTok': return <Video size={16} className="text-black fill-current" />; // TikTok usually rep by Music note or Video
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

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
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
      <div className="flex justify-between items-center sticky top-0 z-30 py-4 backdrop-blur-xl bg-black/10 border-b border-white/5">
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
           <button className="px-5 py-2 bg-neon-pink hover:bg-neon-pink/80 text-white rounded-lg font-bold text-xs shadow-glow-pink transition-all flex items-center gap-2">
               <Video size={16} /> 录入新达人
           </button>
      </div>

      {/* Grid View */}
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
                      <button className="text-gray-500 hover:text-white transition-colors">
                          <ExternalLink size={16} />
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
                          <div className={`text-sm font-bold ${inf.roi >= 3 ? 'text-neon-green' : 'text-gray-300'}`}>{inf.roi}x</div>
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
    </div>
  );
};

export default InfluencerModule;