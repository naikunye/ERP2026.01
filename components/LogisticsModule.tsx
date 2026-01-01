import React, { useState, useEffect } from 'react';
import { Shipment, Product } from '../types';
import { 
  Truck, Plane, Ship, Navigation, Search, Plus, MapPin, 
  Anchor, Package, Calendar, Clock, ArrowRight, Container, 
  Scale, Ruler, Box, ExternalLink, Activity, AlertCircle, CheckCircle2,
  Edit2, Save, X, Trash2, CheckSquare, Square, ShieldCheck, FileText, UserCheck, Timer
} from 'lucide-react';

interface LogisticsModuleProps {
    shipments: Shipment[];
    products: Product[];
    onAddShipment: (shipment: Shipment) => void;
    onUpdateShipment: (shipment: Shipment) => void;
}

const LogisticsModule: React.FC<LogisticsModuleProps> = ({ shipments, products, onAddShipment, onUpdateShipment }) => {
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
  const [form, setForm] = useState<Partial<Shipment>>({});

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
          skuIds: [],
          customsStatus: 'Pending'
      });
      setIsModalOpen(true);
  };

  // Initialize Modal for Editing
  const openEditModal = (shipment: Shipment) => {
      setModalMode('EDIT');
      setForm({ ...shipment, skuIds: shipment.skuIds || [] });
      setIsModalOpen(true);
  };

  const handleToggleSku = (sku: string) => {
      setForm(prev => {
          const currentSkus = prev.skuIds || [];
          if (currentSkus.includes(sku)) {
              return { ...prev, skuIds: currentSkus.filter(id => id !== sku) };
          } else {
              return { ...prev, skuIds: [...currentSkus, sku] };
          }
      });
  };

  const handleSave = () => {
      if(!form.trackingNo) return; 

      const now = new Date().toISOString();
      
      if (modalMode === 'ADD') {
          const newShip: Shipment = {
              id: crypto.randomUUID(),
              trackingNo: form.trackingNo,
              carrier: form.carrier || 'Unknown',
              method: form.method || 'Sea',
              origin: form.origin || '',
              destination: form.destination || '',
              etd: form.etd || now,
              eta: form.eta || '',
              status: form.status || 'Pending',
              progress: form.progress || 0,
              weight: form.weight || 0,
              cartons: form.cartons || 0,
              skuIds: form.skuIds || [],
              riskReason: '',
              // Enhanced fields
              vesselName: form.vesselName,
              containerNo: form.containerNo,
              customsStatus: form.customsStatus || 'Pending'
          } as Shipment;
          onAddShipment(newShip);
          setSelectedShipmentId(newShip.id);
      } else {
          onUpdateShipment(form as Shipment);
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

  // --- TOP TIER TIMELINE GENERATOR ---
  const getDetailedTimeline = (s: Shipment) => {
      const events = [];
      const today = new Date().toISOString().split('T')[0];

      // 1. Origin Events
      events.push({ 
          title: 'Shipment Created', 
          desc: 'Order received and processing started', 
          date: s.etd, 
          status: 'completed', 
          icon: <FileText size={14}/> 
      });

      if (s.progress > 10) {
          events.push({ 
              title: 'Cargo Received', 
              desc: `Received at ${s.origin.split(',')[0]} Warehouse`, 
              date: s.etd, 
              status: 'completed', 
              icon: <Package size={14}/> 
          });
      }

      // 2. Export Customs
      if (s.progress > 20) {
          events.push({ 
              title: 'Export Customs Cleared', 
              desc: 'Customs release granted', 
              date: s.etd, // Simplified date logic
              status: 'completed', 
              icon: <ShieldCheck size={14} className="text-neon-green"/> 
          });
      }

      // 3. Departure
      if (s.progress > 30) {
          events.push({ 
              title: `Departed from ${s.origin.split(',')[0]}`, 
              desc: s.vesselName ? `Vessel: ${s.vesselName}` : 'Flight departed', 
              date: s.etd, 
              status: 'completed', 
              icon: s.method === 'Sea' ? <Anchor size={14}/> : <Plane size={14}/>
          });
      }

      // 4. In Transit / Arrival
      if (s.progress > 60) {
          events.push({ 
              title: `Arrived at ${s.destination.split(',')[0]}`, 
              desc: 'Port/Airport Arrival', 
              date: s.eta, 
              status: 'completed', 
              icon: <MapPin size={14}/> 
          });
      } else if (s.status === 'In Transit') {
          events.push({ 
              title: 'In Transit', 
              desc: 'En route to destination', 
              date: 'Live', 
              status: 'active', 
              icon: <Activity size={14} className="animate-pulse text-neon-blue"/> 
          });
      }

      // 5. Import Customs
      if (s.progress > 80) {
          const customsStatus = s.customsStatus || 'Pending';
          const isHeld = customsStatus === 'Held' || customsStatus === 'Inspection';
          events.push({ 
              title: `Import Customs: ${customsStatus}`, 
              desc: isHeld ? 'Shipment held for inspection' : 'Customs entry released', 
              date: s.eta, 
              status: isHeld ? 'exception' : 'completed', 
              icon: isHeld ? <AlertCircle size={14} className="text-neon-pink"/> : <ShieldCheck size={14} className="text-neon-green"/> 
          });
      }

      // 6. Delivery
      if (s.status === 'Delivered') {
          events.push({ 
              title: 'Delivered', 
              desc: s.podName ? `Signed by: ${s.podName}` : 'Delivered to consignee', 
              date: s.podTime || s.eta, 
              status: 'completed', 
              icon: <CheckCircle2 size={14} className="text-neon-green"/> 
          });
      } else if (s.status === 'Out for Delivery') {
           events.push({ 
              title: 'Out for Delivery', 
              desc: 'Courier is on the way', 
              date: today, 
              status: 'active', 
              icon: <Truck size={14} className="animate-bounce"/> 
          });
      }

      return events;
  };

  const timelineEvents = selectedShipment ? getDetailedTimeline(selectedShipment) : [];

  return (
    <div className="h-full w-full flex flex-col pb-6 animate-fade-in overflow-hidden relative">
      
      {/* 1. Control Tower Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-6 px-2">
        <div>
           <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
                <span className="text-[10px] font-mono text-neon-green tracking-widest uppercase">
                    Satellite Link Active • {currentTime} UTC
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
                className="h-10 px-4 bg-white/5 border border-white/10 hover:bg-neon-purple hover:border-neon-purple hover:text-white text-gray-400 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
             >
                 <Plus size={16} /> 录入运单
             </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
              <div className="w-full max-w-4xl glass-card border border-white/20 shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="px-8 py-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {modalMode === 'ADD' ? <Plus size={20}/> : <Edit2 size={20}/>}
                          {modalMode === 'ADD' ? '录入新运单' : '编辑运单详情'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="hover:text-neon-pink text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex">
                      
                      {/* Left: Form Fields */}
                      <div className="w-1/2 p-8 space-y-6 border-r border-white/10">
                          
                          {/* Section 1: Core Info */}
                          <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">运单号 (Tracking No)</label>
                                  <input 
                                      value={form.trackingNo || ''}
                                      onChange={(e) => setForm(p => ({...p, trackingNo: e.target.value}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none font-mono"
                                      placeholder="例如: MSN..."
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">承运商 (Carrier)</label>
                                  <input 
                                      value={form.carrier || ''}
                                      onChange={(e) => setForm(p => ({...p, carrier: e.target.value}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                      placeholder="例如: Matson, DHL..."
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">运输方式</label>
                                  <select 
                                      value={form.method}
                                      onChange={(e) => setForm(p => ({...p, method: e.target.value as any}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                  >
                                      <option value="Sea">海运 (Sea)</option>
                                      <option value="Air">空运 (Air)</option>
                                      <option value="Rail">铁路 (Rail)</option>
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">当前状态</label>
                                  <select 
                                      value={form.status}
                                      onChange={(e) => setForm(p => ({...p, status: e.target.value as any}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                  >
                                      <option value="Pending">待处理</option>
                                      <option value="In Production">生产中</option>
                                      <option value="In Transit">运输中</option>
                                      <option value="Customs">清关中</option>
                                      <option value="Out for Delivery">派送中</option>
                                      <option value="Delivered">已送达</option>
                                      <option value="Exception">异常</option>
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">进度 (%)</label>
                                  <input 
                                      type="number"
                                      min="0" max="100"
                                      value={form.progress || 0}
                                      onChange={(e) => setForm(p => ({...p, progress: parseInt(e.target.value)}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                  />
                              </div>
                          </div>

                           {/* Section 1.5: Detailed Info (New) */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">船名/航班 (Vessel)</label>
                                  <input 
                                      value={form.vesselName || ''}
                                      onChange={(e) => setForm(p => ({...p, vesselName: e.target.value}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">柜号 (Container No)</label>
                                  <input 
                                      value={form.containerNo || ''}
                                      onChange={(e) => setForm(p => ({...p, containerNo: e.target.value}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none font-mono"
                                  />
                              </div>
                          </div>

                           <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-bold uppercase">清关状态 (Customs)</label>
                                <select 
                                    value={form.customsStatus || 'Pending'}
                                    onChange={(e) => setForm(p => ({...p, customsStatus: e.target.value as any}))}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                >
                                    <option value="Pending">待申报 (Pending)</option>
                                    <option value="Cleared">已放行 (Cleared)</option>
                                    <option value="Inspection">查验中 (Inspection)</option>
                                    <option value="Held">扣留 (Held)</option>
                                </select>
                            </div>

                          {/* Section 2: Route */}
                          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">出发地 (Origin)</label>
                                        <input 
                                            value={form.origin || ''}
                                            onChange={(e) => setForm(p => ({...p, origin: e.target.value}))}
                                            className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">目的地 (Destination)</label>
                                        <input 
                                            value={form.destination || ''}
                                            onChange={(e) => setForm(p => ({...p, destination: e.target.value}))}
                                            className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                        />
                                    </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">ETD (预计发货)</label>
                                        <input 
                                            type="date"
                                            value={form.etd || ''}
                                            onChange={(e) => setForm(p => ({...p, etd: e.target.value}))}
                                            className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">ETA (预计到达)</label>
                                        <input 
                                            type="date"
                                            value={form.eta || ''}
                                            onChange={(e) => setForm(p => ({...p, eta: e.target.value}))}
                                            className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                        />
                                    </div>
                              </div>
                          </div>

                          {/* Section 3: Cargo */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">总重量 (kg)</label>
                                  <input 
                                      type="number"
                                      value={form.weight || 0}
                                      onChange={(e) => setForm(p => ({...p, weight: parseFloat(e.target.value)}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">箱数 (Cartons)</label>
                                  <input 
                                      type="number"
                                      value={form.cartons || 0}
                                      onChange={(e) => setForm(p => ({...p, cartons: parseInt(e.target.value)}))}
                                      className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:border-neon-blue outline-none"
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Right: SKU Selection */}
                      <div className="w-1/2 p-8 bg-black/10">
                           <label className="text-[12px] text-neon-blue font-bold uppercase mb-4 block flex items-center gap-2">
                               <Container size={14}/> 关联装载商品 (Cargo Content)
                           </label>
                           <div className="space-y-2 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                               {products.map(product => {
                                   const isSelected = form.skuIds?.includes(product.id);
                                   return (
                                       <div 
                                          key={product.id}
                                          onClick={() => handleToggleSku(product.id)}
                                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                              isSelected 
                                              ? 'bg-neon-blue/10 border-neon-blue text-white' 
                                              : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-400'
                                          }`}
                                       >
                                           <div className={`shrink-0 ${isSelected ? 'text-neon-blue' : 'text-gray-600'}`}>
                                               {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                           </div>
                                           <img src={product.imageUrl} className="w-10 h-10 rounded-md object-cover bg-black/50" />
                                           <div className="flex-1 min-w-0">
                                               <div className="text-xs font-bold truncate">{product.sku}</div>
                                               <div className="text-[10px] opacity-70 truncate">{product.name}</div>
                                           </div>
                                       </div>
                                   )
                               })}
                           </div>
                      </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white font-bold text-sm">取消</button>
                      <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-neon-purple text-white font-bold text-sm shadow-glow-purple hover:scale-105 transition-transform flex items-center gap-2">
                          <Save size={16}/> 保存
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 2. Main Content: Split View */}
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
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  shipment.status === 'Exception' ? 'text-neon-pink border-neon-pink/30 bg-neon-pink/10' :
                                  shipment.status === 'Delivered' ? 'text-neon-green border-neon-green/30 bg-neon-green/10' :
                                  'text-neon-blue border-neon-blue/30 bg-neon-blue/10'
                              }`}>
                                  {shipment.status}
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
                    {/* Background Map Effect */}
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2329D9FF' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`
                    }}></div>

                    {/* Header Info */}
                    <div className="p-8 border-b border-white/10 relative z-10">
                        <div className="flex justify-between items-start mb-6">
                             <div>
                                <div className="text-[10px] uppercase font-bold text-neon-blue tracking-widest mb-1 flex items-center gap-2">
                                    <Activity size={12} className="animate-pulse"/> Real-time Tracker
                                </div>
                                <div className="flex items-center gap-4">
                                    <h2 className="text-4xl font-display font-bold text-white tracking-tight">{selectedShipment.trackingNo}</h2>
                                    {selectedShipment.vesselName && (
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 flex items-center gap-2">
                                            <Ship size={12}/> {selectedShipment.vesselName} {selectedShipment.voyageNo}
                                        </div>
                                    )}
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-lg text-neon-blue transition-colors border border-white/5"><ExternalLink size={18} /></button>
                                <button 
                                    onClick={() => openEditModal(selectedShipment)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 transition-all"
                                >
                                    <Edit2 size={14} /> Update
                                </button>
                             </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <StatCard 
                                label="Customs Status" 
                                value={selectedShipment.customsStatus || 'Pending'} 
                                icon={<ShieldCheck size={16}/>}
                                statusColor={
                                    selectedShipment.customsStatus === 'Cleared' ? 'text-neon-green' : 
                                    selectedShipment.customsStatus === 'Inspection' ? 'text-neon-pink' : 'text-yellow-500'
                                }
                            />
                            <StatCard 
                                label="Estimated Delivery" 
                                value={selectedShipment.eta || 'Calculating...'} 
                                icon={<Timer size={16}/>}
                                statusColor="text-white"
                            />
                            <StatCard 
                                label="POD Status" 
                                value={selectedShipment.podName ? 'Signed' : 'Pending'} 
                                icon={<UserCheck size={16}/>}
                                statusColor={selectedShipment.podName ? 'text-neon-green' : 'text-gray-500'}
                            />
                             <StatCard 
                                label="Carrier" 
                                value={selectedShipment.carrier} 
                                icon={<Truck size={16}/>}
                                statusColor="text-white"
                            />
                        </div>
                    </div>

                    {/* Progress & Visual Nodes */}
                    <div className="px-12 py-8 relative z-10 border-b border-white/10">
                         <div className="flex items-center justify-between relative">
                             {/* Line */}
                             <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/10 z-0"></div>
                             <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-neon-blue to-neon-purple z-0 shadow-[0_0_10px_#29D9FF]" style={{ width: `${selectedShipment.progress}%` }}></div>

                             {/* Nodes */}
                             <Node label="Booked" active={true} icon={<FileText size={14}/>} />
                             <Node label="Received" active={selectedShipment.progress > 10} icon={<Package size={14}/>} />
                             <Node label="Export" active={selectedShipment.progress > 20} icon={<ShieldCheck size={14}/>} />
                             <Node label="Transit" active={selectedShipment.progress > 40} icon={<Ship size={14}/>} />
                             <Node label="Import" active={selectedShipment.progress > 80} icon={<ShieldCheck size={14}/>} />
                             <Node label="Delivered" active={selectedShipment.progress >= 100} icon={<CheckCircle2 size={14}/>} />
                         </div>
                    </div>

                    {/* Bottom Split: Details & Timeline */}
                    <div className="flex-1 flex relative z-10 bg-black/20 backdrop-blur-md">
                        
                        {/* Data Grid */}
                        <div className="w-1/2 p-8 border-r border-white/10 space-y-8 overflow-y-auto custom-scrollbar">
                             <div>
                                 <h3 className="text-[12px] font-bold text-neon-blue uppercase tracking-widest mb-4 flex items-center gap-2">
                                     <Container size={14} /> 货柜与关务详情 (Manifest & Customs)
                                 </h3>
                                 <div className="grid grid-cols-2 gap-4">
                                     <DataPoint label="Container No" value={selectedShipment.containerNo || '-'} icon={<Box size={14}/>} />
                                     <DataPoint label="Seal No" value={selectedShipment.sealNo || '-'} icon={<ShieldCheck size={14}/>} />
                                     <DataPoint label="Gross Weight" value={`${selectedShipment.weight} kg`} icon={<Scale size={14}/>} />
                                     <DataPoint label="Volume" value={`${(selectedShipment.weight / 167).toFixed(2)} CBM`} icon={<Ruler size={14}/>} />
                                     <DataPoint label="Service Type" value="FCL / Port-to-Door" />
                                     <DataPoint label="Customs Entry" value={selectedShipment.customsStatus === 'Cleared' ? 'Rel. 772910' : '-'} />
                                 </div>
                             </div>

                             {selectedShipment.podName && (
                                <div className="p-4 bg-neon-green/10 border border-neon-green/20 rounded-xl">
                                    <div className="text-[10px] text-neon-green font-bold uppercase mb-2 flex items-center gap-2">
                                        <CheckCircle2 size={12} /> Proof of Delivery
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-sm text-white font-bold">{selectedShipment.podName}</div>
                                            <div className="text-[10px] text-gray-400">{selectedShipment.podTime}</div>
                                        </div>
                                        <div className="h-8 w-24 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-500 font-mono italic border border-white/10">
                                            Signature
                                        </div>
                                    </div>
                                </div>
                             )}
                             
                             {/* Connected SKU Display */}
                             <div>
                                 <h3 className="text-[12px] font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                     <Package size={14} /> 包含商品 ({selectedShipment.skuIds?.length || 0})
                                 </h3>
                                 <div className="space-y-2">
                                     {selectedShipment.skuIds && selectedShipment.skuIds.length > 0 ? (
                                         selectedShipment.skuIds.map(skuId => {
                                             const p = products.find(prod => prod.id === skuId);
                                             return p ? (
                                                 <div key={p.id} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                                     <img src={p.imageUrl} className="w-8 h-8 rounded object-cover" />
                                                     <div className="min-w-0">
                                                         <div className="text-xs font-bold text-white truncate">{p.sku}</div>
                                                         <div className="text-[10px] text-gray-500 truncate">{p.name}</div>
                                                     </div>
                                                 </div>
                                             ) : null;
                                         })
                                     ) : (
                                         <div className="text-[10px] text-gray-500 italic">未关联 SKU</div>
                                     )}
                                 </div>
                             </div>
                        </div>

                        {/* Enhanced Vertical Timeline */}
                        <div className="w-1/2 p-8 overflow-y-auto custom-scrollbar">
                             <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                 <Clock size={14} /> 节点动态 (Milestones)
                             </h3>
                             <div className="space-y-0 relative border-l-2 border-white/10 ml-2">
                                 {timelineEvents.map((event, i) => (
                                     <div key={i} className="pl-6 pb-8 relative group">
                                         {/* Dot */}
                                         <div className={`absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all z-10 ${
                                             event.status === 'completed' ? 'bg-neon-green border-neon-green shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 
                                             event.status === 'active' ? 'bg-neon-blue border-neon-blue animate-pulse' :
                                             event.status === 'exception' ? 'bg-neon-pink border-neon-pink' :
                                             'bg-black border-gray-700'
                                         }`}></div>
                                         
                                         <div className="flex justify-between items-start">
                                             <div className="flex-1 pr-4">
                                                 <div className={`font-bold text-sm mb-0.5 ${event.status === 'completed' ? 'text-white' : event.status === 'active' ? 'text-neon-blue' : event.status === 'exception' ? 'text-neon-pink' : 'text-gray-500'}`}>
                                                     {event.title}
                                                 </div>
                                                 <div className="text-xs text-gray-500 leading-snug">{event.desc}</div>
                                             </div>
                                             <div className="text-right shrink-0">
                                                 <div className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                                     {event.date}
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                  </>
              ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-4">
                      <Navigation size={40} className="text-white/20" />
                      <div>Select a shipment to view details</div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

// Sub-components
const Node = ({ label, active, icon }: any) => (
    <div className={`relative z-10 flex flex-col items-center gap-3 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-30 grayscale'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${active ? 'bg-black border-neon-blue text-neon-blue shadow-[0_0_10px_rgba(41,217,255,0.4)]' : 'bg-black/50 border-white/10 text-gray-500'}`}>
            {icon}
        </div>
        <div className={`text-[10px] font-bold uppercase tracking-wide ${active ? 'text-white' : 'text-gray-500'}`}>{label}</div>
    </div>
);

const StatCard = ({ label, value, icon, statusColor }: any) => (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-1.5 uppercase font-bold">
            {icon} {label}
        </div>
        <div className={`text-lg font-bold font-display truncate ${statusColor}`}>{value}</div>
    </div>
);

const DataPoint = ({ label, value, icon }: any) => (
    <div className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors flex justify-between items-center">
        <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
            {icon} {label}
        </div>
        <div className="text-xs font-bold text-white font-mono">{value}</div>
    </div>
);

const FileCheck = ({size}: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
)

export default LogisticsModule;