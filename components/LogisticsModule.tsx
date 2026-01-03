
import React, { useState, useEffect } from 'react';
import { Shipment, Product, ShipmentItem } from '../types';
import { 
  Truck, Plane, Ship, Navigation, Search, Plus, MapPin, 
  Anchor, Package, Calendar, Clock, ArrowRight, Container, 
  Scale, Ruler, Box, ExternalLink, Activity, AlertCircle, CheckCircle2,
  Edit2, Save, X, Trash2, CheckSquare, Square, ShieldCheck, FileText, UserCheck, Timer, MinusCircle
} from 'lucide-react';

interface LogisticsModuleProps {
    shipments: Shipment[];
    products: Product[];
    onAddShipment: (shipment: Shipment) => void;
    onUpdateShipment: (shipment: Shipment) => void;
    onDeleteShipment?: (id: string) => void;
}

const LogisticsModule: React.FC<LogisticsModuleProps> = ({ shipments, products, onAddShipment, onUpdateShipment, onDeleteShipment }) => {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(shipments.length > 0 ? shipments[0].id : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  
  // Enhanced Form State
  const [form, setForm] = useState<Partial<Shipment>>({});
  // Specialized state for managing shipment items (SKU + Qty)
  const [shipmentItems, setShipmentItems] = useState<ShipmentItem[]>([]);
  const [searchSkuTerm, setSearchSkuTerm] = useState('');

  // Helper: Status Translation
  const getStatusLabel = (status: string) => {
      switch (status) {
          case 'Pending': return '⏳ 待发货';
          case 'In Production': return '🏭 生产中';
          case 'In Transit': return '🚚 运输中';
          case 'Customs': return '🛃 清关中';
          case 'Out for Delivery': return '📦 派送中';
          case 'Delivered': return '✅ 已送达';
          case 'Exception': return '⚠️ 异常';
          default: return status;
      }
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'Pending': return 'text-neon-yellow border-neon-yellow/30 bg-neon-yellow/10';
          case 'In Transit': 
          case 'Out for Delivery': return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10';
          case 'Delivered': return 'text-neon-green border-neon-green/30 bg-neon-green/10';
          case 'Exception': return 'text-neon-pink border-neon-pink/30 bg-neon-pink/10';
          default: return 'text-gray-400 border-gray-600/30 bg-gray-600/10';
      }
  };

  // Initialize Modal for Adding
  const openAddModal = () => {
      setModalMode('ADD');
      setForm({
          method: 'Sea',
          origin: 'Shenzhen, CN',
          destination: 'Los Angeles, USA',
          etd: new Date().toISOString().split('T')[0],
          status: 'Pending',
          progress: 0,
          weight: 0,
          cartons: 0,
          customsStatus: 'Pending'
      });
      setShipmentItems([]);
      setIsModalOpen(true);
  };

  // Initialize Modal for Editing
  const openEditModal = (shipment: Shipment) => {
      setModalMode('EDIT');
      setForm({ ...shipment });
      // Legacy support: if items doesn't exist but skuIds does (old data), convert it
      if (shipment.items && shipment.items.length > 0) {
          setShipmentItems([...shipment.items]);
      } else if ((shipment as any).skuIds) {
          // Migration for old mocks
          const oldIds = (shipment as any).skuIds as string[];
          setShipmentItems(oldIds.map(id => ({ skuId: id, skuCode: 'LEGACY', quantity: 1 })));
      } else {
          setShipmentItems([]);
      }
      setIsModalOpen(true);
  };

  const handleAddItem = (product: Product) => {
      // Check if already added
      if (shipmentItems.find(i => i.skuId === product.id)) return;
      
      setShipmentItems(prev => [...prev, {
          skuId: product.id,
          skuCode: product.sku,
          quantity: 1 // Default quantity
      }]);
  };

  const handleUpdateItemQty = (skuId: string, qty: number) => {
      setShipmentItems(prev => prev.map(item => 
          item.skuId === skuId ? { ...item, quantity: Math.max(1, qty) } : item
      ));
  };

  const handleRemoveItem = (skuId: string) => {
      setShipmentItems(prev => prev.filter(item => item.skuId !== skuId));
  };

  // Auto-calculate Weight Estimation based on items (Mock logic: 0.5kg per item avg)
  useEffect(() => {
      if (shipmentItems.length > 0) {
          const estimatedWeight = shipmentItems.reduce((acc, item) => acc + (item.quantity * 0.5), 0);
          setForm(prev => ({ ...prev, weight: estimatedWeight }));
      }
  }, [shipmentItems]);

  const handleSave = () => {
      if(!form.trackingNo) {
          alert("请输入运单号 (Tracking No is required)");
          return;
      }
      if(shipmentItems.length === 0) {
          alert("请至少添加一个商品 (Add at least one product)");
          return;
      }

      const now = new Date().toISOString();
      const payload: any = {
          ...form,
          items: shipmentItems, // Attach items
          lastUpdate: now
      };
      
      if (modalMode === 'ADD') {
          const newShip: Shipment = {
              id: crypto.randomUUID(),
              carrier: form.carrier || 'Unknown',
              method: form.method || 'Sea',
              origin: form.origin || '',
              destination: form.destination || '',
              etd: form.etd || now,
              eta: form.eta || '',
              status: form.status || 'Pending',
              progress: form.progress || 0,
              cartons: form.cartons || 0,
              riskReason: '',
              // Enhanced fields
              vesselName: form.vesselName,
              containerNo: form.containerNo,
              customsStatus: form.customsStatus || 'Pending',
              ...payload
          } as Shipment;
          onAddShipment(newShip);
          setSelectedShipmentId(newShip.id);
      } else {
          onUpdateShipment(payload as Shipment);
      }
      setIsModalOpen(false);
  };

  const getMethodIcon = (method: string, size=16) => {
    switch (method) {
      case 'Air': return <Plane size={size} />;
      case 'Sea': return <Ship size={size} />;
      default: return <Truck size={size} />;
    }
  };

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0];

  const filteredList = shipments.filter(s => 
      s.trackingNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
      p.sku.toLowerCase().includes(searchSkuTerm.toLowerCase()) || 
      p.name.toLowerCase().includes(searchSkuTerm.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col pb-6 animate-fade-in overflow-hidden relative">
      
      {/* 1. Control Tower Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-6 px-2">
        <div>
           <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
                <span className="text-[10px] font-mono text-neon-green tracking-widest uppercase">
                    卫星链路已连接 • {currentTime} UTC
                </span>
           </div>
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              全球物流控制塔
              <span className="text-neon-purple/50 font-sans text-sm tracking-widest font-medium border border-neon-purple/30 px-2 py-0.5 rounded">CONTROL TOWER</span>
           </h1>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={openAddModal}
                className="h-10 px-4 bg-gradient-neon-blue text-black shadow-glow-blue hover:scale-105 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
             >
                 <Plus size={16} /> 录入运单
             </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
              <div className="w-full max-w-5xl glass-card border border-white/20 shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="px-8 py-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {modalMode === 'ADD' ? <Plus size={20}/> : <Edit2 size={20}/>}
                          {modalMode === 'ADD' ? '录入新运单 (Create Shipment)' : '编辑运单详情 (Edit Shipment)'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="hover:text-neon-pink text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex">
                      
                      {/* Left: Shipment Info */}
                      <div className="w-[55%] p-8 space-y-6 border-r border-white/10">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">核心信息</h4>
                          
                          <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">运单号 *</label>
                                  <input 
                                      value={form.trackingNo || ''}
                                      onChange={(e) => setForm(p => ({...p, trackingNo: e.target.value}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none font-mono"
                                      placeholder="MSN..."
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">承运商</label>
                                  <input 
                                      value={form.carrier || ''}
                                      onChange={(e) => setForm(p => ({...p, carrier: e.target.value}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                      placeholder="DHL, Matson..."
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">运输方式</label>
                                  <select 
                                      value={form.method}
                                      onChange={(e) => setForm(p => ({...p, method: e.target.value as any}))}
                                      className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                  >
                                      <option value="Sea" className="bg-[#1a1a2e] text-white">海运 (Sea)</option>
                                      <option value="Air" className="bg-[#1a1a2e] text-white">空运 (Air)</option>
                                      <option value="Rail" className="bg-[#1a1a2e] text-white">铁路 (Rail)</option>
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">状态</label>
                                  <select 
                                      value={form.status}
                                      onChange={(e) => setForm(p => ({...p, status: e.target.value as any}))}
                                      className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                  >
                                      <option value="Pending" className="bg-[#1a1a2e] text-white">⏳ 待发货 (Pending)</option>
                                      <option value="In Transit" className="bg-[#1a1a2e] text-white">🚚 运输中 (In Transit)</option>
                                      <option value="Delivered" className="bg-[#1a1a2e] text-white">✅ 已送达 (Delivered)</option>
                                      <option disabled className="bg-[#1a1a2e] text-gray-500">──────────</option>
                                      <option value="In Production" className="bg-[#1a1a2e] text-white">🏭 生产中</option>
                                      <option value="Customs" className="bg-[#1a1a2e] text-white">🛃 清关中</option>
                                      <option value="Out for Delivery" className="bg-[#1a1a2e] text-white">📦 派送中</option>
                                      <option value="Exception" className="bg-[#1a1a2e] text-white">⚠️ 异常</option>
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">箱数</label>
                                  <input 
                                      type="number"
                                      value={form.cartons || 0}
                                      onChange={(e) => setForm(p => ({...p, cartons: parseInt(e.target.value)}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                  />
                              </div>
                          </div>

                          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">出发地</label>
                                        <input 
                                            value={form.origin || ''}
                                            onChange={(e) => setForm(p => ({...p, origin: e.target.value}))}
                                            className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">目的地</label>
                                        <input 
                                            value={form.destination || ''}
                                            onChange={(e) => setForm(p => ({...p, destination: e.target.value}))}
                                            className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                        />
                                    </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">预计发货 (ETD)</label>
                                        <input 
                                            type="date"
                                            value={form.etd || ''}
                                            onChange={(e) => setForm(p => ({...p, etd: e.target.value}))}
                                            className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">预计到达 (ETA)</label>
                                        <input 
                                            type="date"
                                            value={form.eta || ''}
                                            onChange={(e) => setForm(p => ({...p, eta: e.target.value}))}
                                            className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                        />
                                    </div>
                              </div>
                          </div>
                      </div>

                      {/* Right: SKU Selection (Refactored) */}
                      <div className="w-[45%] p-8 bg-black/10 flex flex-col">
                           <div className="flex justify-between items-center mb-4">
                               <h4 className="text-xs font-bold text-neon-blue uppercase tracking-widest flex items-center gap-2">
                                   <Container size={14}/> 装箱清单 (Cargo Manifest)
                               </h4>
                               <div className="text-[10px] text-gray-400">总重估算: {form.weight} kg</div>
                           </div>

                           {/* SKU Search */}
                           <div className="relative mb-4">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                               <input 
                                   value={searchSkuTerm}
                                   onChange={(e) => setSearchSkuTerm(e.target.value)}
                                   className="w-full h-10 pl-9 pr-4 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:border-neon-blue outline-none"
                                   placeholder="搜索 SKU 添加商品..."
                               />
                               {/* Dropdown Results */}
                               {searchSkuTerm && (
                                   <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a20] border border-white/10 rounded-lg shadow-xl max-h-[200px] overflow-y-auto z-50">
                                       {filteredProducts.map(p => (
                                           <div 
                                               key={p.id}
                                               onClick={() => { handleAddItem(p); setSearchSkuTerm(''); }}
                                               className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0"
                                           >
                                               <img src={p.imageUrl} className="w-8 h-8 rounded object-cover" />
                                               <div className="flex-1">
                                                   <div className="text-xs font-bold text-white">{p.sku}</div>
                                                   <div className="text-[10px] text-gray-500 truncate">{p.name}</div>
                                               </div>
                                               <div className="text-[10px] text-gray-400">Stock: {p.stock}</div>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>

                           {/* Selected Items List */}
                           <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar bg-black/20 rounded-xl p-2 border border-white/5">
                               {shipmentItems.length === 0 ? (
                                   <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                                       <Box size={24} className="opacity-30"/>
                                       <span className="text-xs">请添加发货商品</span>
                                   </div>
                               ) : (
                                   shipmentItems.map(item => {
                                       const product = products.find(p => p.id === item.skuId);
                                       return (
                                           <div key={item.skuId} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 group">
                                               {product && <img src={product.imageUrl} className="w-10 h-10 rounded object-cover" />}
                                               <div className="flex-1 min-w-0">
                                                   <div className="text-xs font-bold text-white truncate">{product?.sku || item.skuCode}</div>
                                                   <div className="text-[10px] text-gray-500 truncate">{product?.name}</div>
                                               </div>
                                               <div className="flex flex-col items-end gap-1">
                                                   <span className="text-[9px] text-gray-500 uppercase">Qty</span>
                                                   <input 
                                                       type="number"
                                                       value={item.quantity}
                                                       onChange={(e) => handleUpdateItemQty(item.skuId, parseInt(e.target.value))}
                                                       className="w-16 h-7 bg-black/30 border border-white/10 rounded px-2 text-xs text-white text-right focus:border-neon-blue outline-none"
                                                   />
                                               </div>
                                               <button onClick={() => handleRemoveItem(item.skuId)} className="text-gray-500 hover:text-red-500 p-1">
                                                   <MinusCircle size={16} />
                                               </button>
                                           </div>
                                       )
                                   })
                               )}
                           </div>
                      </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                          <span className="text-neon-yellow">注意:</span> 保存后将自动扣除本地库存并生成财务运费记录。
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white font-bold text-sm">取消</button>
                          <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-neon-purple text-white font-bold text-sm shadow-glow-purple hover:scale-105 transition-transform flex items-center gap-2">
                              <Save size={16}/> 确认发货
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Main Content: Split View (Unchanged from visual perspective, but using new types) */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          
          {/* LEFT: Shipment List */}
          <div className="w-[380px] flex flex-col gap-4 overflow-hidden flex-shrink-0">
             {/* Search */}
             <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:border-neon-blue outline-none placeholder-gray-600 backdrop-blur-sm"
                      placeholder="搜索运单号 / 目的地..."
                  />
             </div>

             {/* Scrollable List */}
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {filteredList.map(shipment => (
                      <div 
                        key={shipment.id}
                        onClick={() => setSelectedShipmentId(shipment.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${
                            selectedShipmentId === shipment.id 
                            ? 'bg-white/10 border-neon-blue/50 shadow-glow-blue/20' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                          {selectedShipmentId === shipment.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue"></div>}
                          
                          <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                   <div className={`p-1.5 rounded-md ${selectedShipmentId === shipment.id ? 'bg-neon-blue text-black' : 'bg-white/10 text-gray-400'}`}>
                                       {getMethodIcon(shipment.method, 14)}
                                   </div>
                                   <span className="font-mono text-sm font-bold text-white">{shipment.trackingNo}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(shipment.status)}`}>
                                  {getStatusLabel(shipment.status)}
                              </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                              <span>{shipment.origin.split(',')[0]}</span>
                              <ArrowRight size={12} className="text-gray-600" />
                              <span>{shipment.destination.split(',')[0]}</span>
                          </div>

                          <div className="h-1 bg-black/50 rounded-full overflow-hidden w-full">
                              <div className={`h-full ${shipment.status === 'Exception' ? 'bg-neon-pink' : 'bg-neon-blue'}`} style={{ width: `${shipment.progress}%` }}></div>
                          </div>
                      </div>
                  ))}
             </div>
          </div>

          {/* RIGHT: Detail Control Tower */}
          <div className="flex-1 glass-card border-white/10 flex flex-col relative overflow-hidden bg-[#0a0a12]">
              {selectedShipment ? (
                  <>
                    {/* Header Info */}
                    <div className="p-8 border-b border-white/10 relative z-10">
                        <div className="flex justify-between items-start mb-6">
                             <div>
                                <div className="text-[10px] uppercase font-bold text-neon-blue tracking-widest mb-1 flex items-center gap-2">
                                    <Activity size={12} className="animate-pulse"/> 实时追踪 (Real-time Tracker)
                                </div>
                                <div className="flex items-center gap-4">
                                    <h2 className="text-4xl font-display font-bold text-white tracking-tight">{selectedShipment.trackingNo}</h2>
                                    {selectedShipment.vesselName && (
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 flex items-center gap-2">
                                            <Ship size={12}/> {selectedShipment.vesselName}
                                        </div>
                                    )}
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => openEditModal(selectedShipment)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 transition-all"
                                >
                                    <Edit2 size={14} /> 更新状态
                                </button>
                                {onDeleteShipment && (
                                    <button 
                                        onClick={() => onDeleteShipment(selectedShipment.id)}
                                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center transition-all"
                                        title="删除运单"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                             </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <StatCard 
                                label="当前状态" 
                                value={getStatusLabel(selectedShipment.status)} 
                                icon={<Activity size={16}/>}
                                statusColor="text-white"
                            />
                            <StatCard 
                                label="预计送达" 
                                value={selectedShipment.eta || '计算中...'} 
                                icon={<Timer size={16}/>}
                                statusColor="text-white"
                            />
                            <StatCard 
                                label="总箱数" 
                                value={selectedShipment.cartons.toString()} 
                                icon={<Box size={16}/>}
                                statusColor="text-white"
                            />
                             <StatCard 
                                label="承运商" 
                                value={selectedShipment.carrier} 
                                icon={<Truck size={16}/>}
                                statusColor="text-white"
                            />
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 p-8 bg-black/20 overflow-y-auto custom-scrollbar">
                         <h3 className="text-[12px] font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Package size={14} /> 包含商品 ({selectedShipment.items?.length || 0})
                         </h3>
                         <div className="grid grid-cols-2 gap-3">
                             {selectedShipment.items && selectedShipment.items.length > 0 ? (
                                 selectedShipment.items.map((item, idx) => {
                                     // Try to find product for image/name
                                     const p = products.find(prod => prod.id === item.skuId);
                                     return (
                                         <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                             <img src={p?.imageUrl || ''} className="w-12 h-12 rounded-lg object-cover bg-black/50" />
                                             <div className="min-w-0 flex-1">
                                                 <div className="text-xs font-bold text-white truncate">{p?.sku || item.skuCode}</div>
                                                 <div className="text-[10px] text-gray-500 truncate">{p?.name || 'Unknown Product'}</div>
                                             </div>
                                             <div className="text-right">
                                                 <div className="text-[10px] text-gray-500 uppercase">Qty</div>
                                                 <div className="text-sm font-bold text-neon-blue">{item.quantity}</div>
                                             </div>
                                         </div>
                                     );
                                 })
                             ) : (
                                 <div className="col-span-2 text-center text-gray-500 py-8 italic border border-dashed border-white/10 rounded-xl">
                                     暂无商品明细 (Legacy Data)
                                 </div>
                             )}
                         </div>
                    </div>
                  </>
              ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-4">
                      <Navigation size={40} className="text-white/20" />
                      <div>请选择运单查看详情</div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

// Sub-components
const StatCard = ({ label, value, icon, statusColor }: any) => (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-1.5 uppercase font-bold">
            {icon} {label}
        </div>
        <div className={`text-lg font-bold font-display truncate ${statusColor}`}>{value}</div>
    </div>
);

export default LogisticsModule;
