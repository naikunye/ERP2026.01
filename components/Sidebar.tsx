import React from 'react';
import { LayoutGrid, Box, Settings, ShoppingBag, BarChart2, Globe, Sparkles, Cpu, Aperture, RefreshCw } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onChangeView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: '总览面板', icon: <LayoutGrid size={20} /> },
    { id: 'products', label: '资产矩阵', icon: <Box size={20} /> },
    { id: 'restock', label: '智能备货', icon: <RefreshCw size={20} /> },
    { id: 'orders', label: '物流追踪', icon: <ShoppingBag size={20} /> },
    { id: 'analytics', label: '数据深潜', icon: <BarChart2 size={20} /> },
    { id: 'market', label: '星际网络', icon: <Globe size={20} /> },
  ];

  return (
    <div className="w-[280px] h-[calc(100vh-48px)] fixed left-6 top-6 glass-card flex flex-col z-50 py-8 px-6 select-none shadow-glow-purple/20">
      
      {/* Brand Header */}
      <div className="flex items-center gap-4 mb-12 px-2">
         <div className="w-12 h-12 rounded-2xl bg-gradient-neon-blue flex items-center justify-center shadow-glow-blue relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/30 skew-x-12 -translate-x-full group-hover:animate-shimmer"></div>
            <Aperture size={28} className="text-white animate-spin-slow" />
         </div>
         <div>
             <h1 className="font-display font-bold text-[24px] text-white tracking-wide drop-shadow-lg">AERO<span className="text-neon-blue">.OS</span></h1>
             <p className="font-sans text-[10px] text-gray-300 font-medium tracking-widest bg-white/10 px-2 py-0.5 rounded-full inline-block mt-1 backdrop-blur-sm border border-white/5">
                V.5.0 HYPER
             </p>
         </div>
      </div>

      <div className="flex-1 space-y-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-medium transition-all duration-300 relative group overflow-hidden ${
              activeView === item.id
                ? 'bg-gradient-neon-blue shadow-glow-blue text-white scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className={`relative z-10 transition-transform ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="relative z-10 font-sans tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>

      {/* AI Status Card - Floating Neon */}
      <div className="mt-auto mb-6">
          <div className="relative rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-black border border-white/10 p-5 group cursor-pointer overflow-hidden shadow-lg hover:shadow-glow-purple transition-all">
             <div className="absolute inset-0 bg-gradient-neon-purple opacity-10 group-hover:opacity-20 transition-opacity"></div>
             
             <div className="relative z-10 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-neon-purple border border-white/10 shadow-[0_0_15px_rgba(184,41,255,0.3)]">
                    <Sparkles size={20} className="animate-pulse" />
                 </div>
                 <div className="flex-1">
                     <div className="text-[14px] font-bold text-white font-display tracking-wide">Gemini 核心</div>
                     <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse"></span>
                        神经链接已激活
                     </div>
                 </div>
             </div>
          </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-white/10 pt-6 flex items-center gap-4 cursor-pointer group px-2">
         <div className="relative">
             <div className="absolute -inset-0.5 bg-gradient-neon-pink rounded-full blur opacity-70 group-hover:opacity-100 transition-opacity"></div>
             <img src="https://ui-avatars.com/api/?name=Admin&background=000&color=fff" className="relative w-10 h-10 rounded-full object-cover border-2 border-black" alt="User" />
         </div>
         <div className="flex-1">
            <div className="text-[14px] font-bold text-white group-hover:text-neon-pink transition-colors font-display tracking-wide">超级管理员</div>
            <div className="text-[10px] text-gray-500 font-mono">L9 最高权限</div>
         </div>
         <Settings size={18} className="text-gray-500 group-hover:text-white transition-colors group-hover:rotate-90 duration-500" />
      </div>
    </div>
  );
};

export default Sidebar;