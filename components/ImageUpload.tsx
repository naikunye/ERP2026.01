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
    if (!file.type.startsWith('image/')) {
        alert('请上传图片文件 (JPG/PNG/WEBP)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          processFile(e.target.files[0]);
      }
      // CRITICAL FIX: Reset value so onChange triggers again for the same file
      e.target.value = '';
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
          const keyword = productName.split(' ')[0] || 'technology';
          // Using a more reliable image source to avoid broken links
          const randomId = Math.floor(Math.random() * 1000);
          const reliableUrl = `https://picsum.photos/seed/${keyword}-${randomId}/800/800`;
          
          onImageChange(reliableUrl);
          setIsSearching(false);
      }, 1500);
  };

  return (
    <div className="w-full h-full min-h-[120px] flex flex-col">
        <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileSelect}
        />

        {currentImage ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden group border border-white/10 bg-black/40 min-h-[120px]">
                <img src={currentImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Product" />
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                    <button 
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="px-4 py-2 bg-white text-black rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-glow-white"
                    >
                        <Camera size={16} /> 更换
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onImageChange(''); }}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-red-500/30 transition-all"
                    >
                        <X size={16} /> 移除
                    </button>
                </div>
            </div>
        ) : (
            <div 
                className={`flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all duration-300 relative overflow-hidden min-h-[120px] ${
                    isDragging 
                    ? 'border-neon-blue bg-neon-blue/10 scale-[0.99]' 
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center mb-3 shadow-inner">
                    <Upload size={20} className={isDragging ? 'text-neon-blue animate-bounce' : 'text-gray-500'} />
                </div>
                
                <h3 className="text-xs font-bold text-white mb-1">点击或拖拽上传</h3>
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white hover:bg-white/20 transition-all"
                >
                    选择文件
                </button>

                {productName && (
                    <button 
                        onClick={handleSmartSearch}
                        disabled={isSearching}
                        className="mt-2 text-[10px] text-neon-purple flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                        {isSearching ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                        AI 自动匹配
                    </button>
                )}
            </div>
        )}
    </div>
  );
};

export default ImageUpload;