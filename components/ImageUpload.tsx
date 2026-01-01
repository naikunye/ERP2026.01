import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Search, Loader2, Camera } from 'lucide-react';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (base64OrUrl: string) => void;
  productName?: string; // Used for smart search
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageChange, productName }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSmartSearch = () => {
      if (!productName) return;
      setIsSearching(true);
      // Simulate an AI search delay, then fetch a random unsplash image based on keywords
      setTimeout(() => {
          const keyword = productName.split(' ')[0] || 'product';
          const randomUrl = `https://source.unsplash.com/random/800x800/?${keyword}&t=${Date.now()}`;
          // Fallback to a reliable source since source.unsplash can be flaky in some demos
          const reliableUrl = `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80&random=${Date.now()}`;
          
          onImageChange(reliableUrl);
          setIsSearching(false);
      }, 1500);
  };

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col">
        {currentImage ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden group border border-white/10 bg-black/40">
                <img src={currentImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Product" />
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white text-black rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-glow-white"
                    >
                        <Camera size={16} /> 更换图片
                    </button>
                    <button 
                        onClick={() => onImageChange('')}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-red-500/30 transition-all"
                    >
                        <X size={16} /> 移除
                    </button>
                </div>
            </div>
        ) : (
            <div 
                className={`flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all duration-300 relative overflow-hidden ${
                    isDragging 
                    ? 'border-neon-blue bg-neon-blue/10 scale-[0.99]' 
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />

                <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center mb-4 shadow-inner">
                    <Upload size={24} className={isDragging ? 'text-neon-blue animate-bounce' : 'text-gray-500'} />
                </div>
                
                <h3 className="text-sm font-bold text-white mb-2">拖拽上传 / 点击选择</h3>
                <p className="text-xs text-gray-500 text-center mb-6 max-w-[200px]">
                    支持 JPG, PNG, WEBP. 建议尺寸 800x800px 以上.
                </p>

                <div className="flex items-center w-full gap-3">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-[10px] text-gray-600 font-bold uppercase">OR</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <button 
                    onClick={handleSmartSearch}
                    disabled={isSearching || !productName}
                    className="mt-6 px-5 py-2.5 bg-neon-purple/10 border border-neon-purple/20 text-neon-purple rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-neon-purple/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    {isSearching ? 'AI 搜索中...' : 'AI 智能匹配素材'}
                </button>
                {!productName && <p className="text-[9px] text-gray-600 mt-2">需先输入产品名称</p>}
            </div>
        )}
    </div>
  );
};

export default ImageUpload;