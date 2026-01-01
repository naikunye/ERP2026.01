import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ArrowRight, LayoutGrid, RefreshCw, ShoppingBag, 
  Users, Wallet, CheckSquare, Server, Plus, Box, FileText, X
} from 'lucide-react';
import { Product } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeView: (view: string) => void;
  products: Product[];
  onAddNewProduct: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onChangeView, products, onAddNewProduct }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, query]); // dependencies need to include query-dependent list

  const navigationItems = [
    { id: 'nav-dash', label: '前往 总览面板 (Dashboard)', icon: <LayoutGrid size={14}/>, action: () => onChangeView('dashboard'), group: 'Navigation' },
    { id: 'nav-task', label: '前往 任务协作 (Tasks)', icon: <CheckSquare size={14}/>, action: () => onChangeView('tasks'), group: 'Navigation' },
    { id: 'nav-restock', label: '前往 智能备货 (Restock)', icon: <RefreshCw size={14}/>, action: () => onChangeView('restock'), group: 'Navigation' },
    { id: 'nav-orders', label: '前往 物流追踪 (Orders)', icon: <ShoppingBag size={14}/>, action: () => onChangeView('orders'), group: 'Navigation' },
    { id: 'nav-inf', label: '前往 达人矩阵 (Influencers)', icon: <Users size={14}/>, action: () => onChangeView('influencers'), group: 'Navigation' },
    { id: 'nav-fin', label: '前往 财务中枢 (Finance)', icon: <Wallet size={14}/>, action: () => onChangeView('finance'), group: 'Navigation' },
    { id: 'act-new', label: '新建 SKU 资产', icon: <Plus size={14}/>, action: () => { onChangeView('restock'); setTimeout(onAddNewProduct, 100); }, group: 'Actions' },
  ];

  // Search Products logic
  const productItems = products
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)
    .map(p => ({
        id: `prod-${p.id}`,
        label: `查看资产: ${p.sku} - ${p.name}`,
        icon: <Box size={14}/>,
        action: () => { onChangeView('restock'); /* Ideally trigger edit modal here too */ },
        group: 'Assets'
    }));

  const allItems = [...navigationItems, ...productItems];
  
  const filteredItems = query 
    ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl flex flex-col glass-card border-white/20 shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-white/10 h-14">
          <Search className="text-gray-400 mr-3" size={20} />
          <input 
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-sans text-lg"
            placeholder="输入命令或搜索资产..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-400 border border-white/10">ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
           {filteredItems.length === 0 ? (
               <div className="p-8 text-center text-gray-500 text-sm">无匹配结果</div>
           ) : (
               <>
                   {['Navigation', 'Actions', 'Assets'].map(group => {
                       const groupItems = filteredItems.filter(i => i.group === group);
                       if (groupItems.length === 0) return null;
                       
                       return (
                           <div key={group}>
                               <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest sticky top-0 bg-[#16161e]/90 backdrop-blur-md z-10">
                                   {group}
                               </div>
                               {groupItems.map((item) => {
                                   const isSelected = filteredItems.indexOf(item) === selectedIndex;
                                   return (
                                       <div 
                                           key={item.id}
                                           className={`flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all ${
                                               isSelected 
                                               ? 'bg-neon-blue/20 text-white shadow-[inset_0_0_0_1px_rgba(41,217,255,0.3)]' 
                                               : 'text-gray-400 hover:bg-white/5'
                                           }`}
                                           onClick={() => { item.action(); onClose(); }}
                                           onMouseEnter={() => setSelectedIndex(filteredItems.indexOf(item))}
                                       >
                                           <div className="flex items-center gap-3">
                                               <div className={`w-6 h-6 rounded flex items-center justify-center ${isSelected ? 'text-neon-blue' : 'text-gray-500'}`}>
                                                   {item.icon}
                                               </div>
                                               <span className={isSelected ? 'text-neon-blue font-medium' : ''}>{item.label}</span>
                                           </div>
                                           {isSelected && <ArrowRight size={14} className="text-neon-blue animate-pulse"/>}
                                       </div>
                                   );
                               })}
                           </div>
                       )
                   })}
               </>
           )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
             <div className="flex gap-4">
                 <span className="flex items-center gap-1"><span className="bg-white/10 px-1 rounded">↑</span> <span className="bg-white/10 px-1 rounded">↓</span> 导航</span>
                 <span className="flex items-center gap-1"><span className="bg-white/10 px-1 rounded">↵</span> 确认</span>
             </div>
             <div>Aero Command Nexus v2.0</div>
        </div>

      </div>
    </div>
  );
};

export default CommandPalette;