import React from 'react';
import { Product, ProductStatus } from '../types';
import { Search, Plus, ListFilter, SlidersHorizontal, Image as ImageIcon, MoreVertical, Box } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onAddNew: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onAddNew }) => {
  return (
    <div className="space-y-8 animate-fade-in flex flex-col h-full pb-10">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-8">
        <div>
            <h1 className="text-[40px] font-bold text-white tracking-tight leading-none drop-shadow-lg">Inventory <span className="text-neon-purple font-display font-light">Matrix</span></h1>
            <p className="text-gray-400 text-sm mt-3 font-medium flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-white font-mono text-xs">{products.length} ENTITIES</span>
                <span className="text-neon-green flex items-center gap-1 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></div> SYNCED</span>
            </p>
        </div>
        <button 
            onClick={onAddNew}
            className="px-8 py-3.5 bg-gradient-neon-purple text-white rounded-xl font-bold text-sm shadow-glow-purple hover:scale-105 transition-all flex items-center gap-2"
        >
            <Plus size={18} strokeWidth={3} /> 
            <span>Add New Asset</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center">
         <div className="relative flex-1 max-w-[600px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neon-blue transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Search asset ID, name or tag..." 
                className="w-full pl-14 pr-6 py-4 input-glass rounded-2xl font-sans text-sm tracking-wide"
            />
         </div>
         <div className="flex gap-3">
            <button className="h-[54px] px-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-bold text-xs backdrop-blur-md">
                <ListFilter size={18} /> FILTER
            </button>
         </div>
      </div>

      {/* Glass Table */}
      <div className="flex-1 overflow-hidden glass-card flex flex-col relative">
        {/* Table Header */}
        <div className="flex items-center px-8 py-6 border-b border-white/10 bg-black/10 backdrop-blur-xl sticky top-0 z-20">
             <div className="w-[45%] text-[11px] font-bold text-gray-400 tracking-widest uppercase pl-2">Entity Description</div>
             <div className="w-[15%] text-[11px] font-bold text-gray-400 tracking-widest uppercase">Status</div>
             <div className="w-[15%] text-[11px] font-bold text-gray-400 tracking-widest uppercase">Price</div>
             <div className="w-[15%] text-[11px] font-bold text-gray-400 tracking-widest uppercase">Stock</div>
             <div className="w-[10%] text-right text-[11px] font-bold text-gray-400 tracking-widest uppercase pr-4">Action</div>
        </div>
        
        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {products.map((product) => (
              <div 
                key={product.id} 
                onClick={() => onEdit(product)}
                className="group flex items-center px-6 py-4 rounded-2xl cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300 relative overflow-hidden"
              >
                {/* Neon Hover Glow */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-neon-blue opacity-0 group-hover:opacity-100 transition-opacity rounded-l-full shadow-glow-blue"></div>

                {/* Product Info */}
                <div className="w-[45%] flex items-center gap-6">
                    <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 relative group-hover:border-neon-blue/50 transition-colors shadow-lg">
                        {product.imageUrl ? (
                             <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center bg-black/50 text-gray-500">
                                <ImageIcon size={24} />
                             </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-sans font-bold text-[16px] text-white group-hover:text-neon-blue transition-colors tracking-wide">{product.name}</span>
                        <span className="text-[12px] text-gray-500 mt-1 font-mono tracking-wider flex items-center gap-2">
                             <Box size={12} />
                             {product.sku}
                        </span>
                    </div>
                </div>
                
                {/* Status */}
                <div className="w-[15%]">
                     <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide border backdrop-blur-md ${
                        product.status === ProductStatus.Active 
                            ? 'bg-neon-green/10 text-neon-green border-neon-green/20 shadow-[0_0_10px_rgba(0,255,157,0.1)]' 
                            : 'bg-white/5 text-gray-400 border-white/10'
                     }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${product.status === ProductStatus.Active ? 'bg-neon-green animate-pulse' : 'bg-gray-500'}`}></span>
                        {product.status}
                     </span>
                </div>
                
                {/* Price */}
                <div className="w-[15%] text-[16px] font-display font-bold text-white">
                    <span className="text-neon-purple mr-1 text-sm">$</span>{product.price.toFixed(2)}
                </div>
                
                {/* Stock */}
                <div className="w-[15%]">
                     <div className="w-24">
                         <div className="flex justify-between text-[11px] font-medium text-gray-400 mb-1.5">
                             <span>{product.stock} units</span>
                         </div>
                         <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                             <div 
                                className={`h-full relative rounded-full ${product.stock > 50 ? 'bg-gradient-neon-blue' : 'bg-neon-pink'}`} 
                                style={{ width: `${Math.min(product.stock, 100)}%` }}
                             ></div>
                         </div>
                     </div>
                </div>

                {/* Arrow */}
                <div className="w-[10%] flex justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-neon-blue hover:text-black transition-all">
                         <MoreVertical size={18} />
                    </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProductList;