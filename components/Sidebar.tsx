import React from 'react';
import { LayoutGrid, ShoppingBag, BarChart2, Sparkles, Aperture, RefreshCw, Server, Users, Wallet, Sun, Moon, Zap } from 'lucide-react';
import { Theme } from '../types';

interface SidebarProps {
  activeView: string;
  onChangeView: (view: string) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView, currentTheme, onThemeChange }) => {
  const menuItems = [
    { id: 'dashboard', label: '总览面板', icon: <LayoutGrid size={20} /> },
    { id: 'restock', label: '智能备货', icon: <RefreshCw size={20} /> },
    { id: 'orders', label: '物流追踪', icon: <ShoppingBag size={20} /> },
    { id: 'influencers', label: '达人矩阵', icon: <Users size={20} /> },
    { id: 'finance', label: '财务中枢', icon: <Wallet size={20} /> },
    { id: 'analytics', label: '数据深潜', icon: <BarChart2 size={20} /> },
    { id: 'datasync', label: '云端中枢', icon: <Server size={20} /> }, 
  ];

  return (
    <div className="w-[280px] h-[calc(100vh-48px)] fixed left-6 top-6 glass-card flex flex-col z-50 py-8 px-6 select-none shadow-glow-purple/20">
      
      {/* Brand Header */}
      <div className="flex items-center gap-4 mb-8 px-2">
         <div className="w-12 h-12 rounded-2xl bg-gradient-neon-blue flex items-center justify-center shadow-glow-blue relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/30 skew-x-12 -translate-x-full group-hover:animate-shimmer"></div>
            <Aperture size={28} className="text-white animate-spin-slow" />
         </div>
         <div>
             <h1 className="font-display font-bold text-[24px] text-white tracking-wide drop-shadow-lg">AERO<span className="text-neon-blue">.OS</span></h1>
             <p className="font-sans text-[10px] text-gray-300 font-medium tracking-widest bg-white/10 px-2 py-0.5 rounded-full inline-block mt-1 backdrop-blur-sm border border-white/5">
                V.5.2 LITE
             </p>
         </div>
      </div>

      {/* Theme Switcher - Compact Row */}
      <div className="bg-white/5 p-1 rounded-xl flex mb-8 border border-white/10">
          <button 
             onClick={() => onThemeChange('neon')}
             title="Neon Glass"
             className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${currentTheme === 'neon' ? 'bg-black text-neon-blue shadow-glow-blue' : 'text-gray-500 hover:text-white'}`}
          >
             <Zap size={14} />
          </button>
          <button 
             onClick={() => onThemeChange('ivory')}
             title="Ivory Air"
             className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${currentTheme === 'ivory' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
             <Sun size={14} />
          </button>
          <button 
             onClick={() => onThemeChange('midnight')}
             title="Midnight Pro"
             className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${currentTheme === 'midnight' ? 'bg-[#0F172A] text-neon-purple border border-neon-purple/30' : 'text-gray-500 hover:text-white'}`}
          >
             <Moon size={14} />
          </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar px-6 py-4 -mx-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-medium transition-all duration-300 relative group overflow-visible ${
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
      <div className="mt-4 mb-6">
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
      </div>
    </div>
  );
};

export default Sidebar;