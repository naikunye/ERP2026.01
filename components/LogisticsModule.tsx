import React, { useState } from 'react';
import { Shipment } from '../types';
import { 
  Truck, Plane, Ship, Navigation, Search, Plus, MapPin, 
  Anchor, Package, Calendar, Clock, ArrowRight, Container, 
  Scale, Ruler, Box, ExternalLink, Activity, AlertCircle, CheckCircle2,
  Edit2, Save, X, Trash2
} from 'lucide-react';

interface LogisticsModuleProps {
    shipments: Shipment[];
    onAddShipment: (shipment: Shipment) => void;
    onUpdateShipment: (shipment: Shipment) => void;
}

const LogisticsModule: React.FC<LogisticsModuleProps> = ({ shipments, onAddShipment, onUpdateShipment }) => {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(shipments.length > 0 ? shipments[0].id : null);
  const [searchTerm, setSearchTerm] = useState('');
  
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
          cartons: 0
      });
      setIsModalOpen(true);
  };

  // Initialize Modal for Editing
  const openEditModal = (shipment: Shipment) => {
      setModalMode('EDIT');
      setForm({ ...shipment });
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if(!form.trackingNo) return; // Simple validation

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
              skuIds: [],
              riskReason: ''
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

  // Mock Timeline Generator based on status
  const getTimelineEvents = (status: string, etd: string) => {
      const events = [
          { status: 'Order Placed', date: etd, location: 'Shenzhen, CN', completed: true, icon: <Package size={14} /> },
          { status: 'Gate In', date: '2023-11-02', location: 'Yantian Port', completed: true, icon: <Container size={14} /> },
          { status: 'Customs Cleared', date: '2023-11-04', location: 'China Customs', completed: true, icon: <CheckCircle2 size={14} /> },
      ];
      
      if (status === 'In Transit' || status === 'Customs' || status === 'Delivered') {
          events.push({ status: 'Vessel Departed', date: '2023-11-05', location: 'South China Sea', completed: true, icon: <Anchor size={14} /> });
      } else {
          events.push({ status: 'Vessel Departure', date: 'Pending', location: '-', completed: false, icon: <Anchor size={14} /> });
      }

      if (status === 'Delivered') {
           events.push({ status: 'Arrived at Port', date: '2023-11-18', location: 'Long Beach, US', completed: true, icon: <Anchor size={14} /> });
           events.push({ status: 'Delivered', date: '2023-11-20', location: 'FBA Warehouse', completed: true, icon: <CheckCircle2 size={14} /> });
      } else if (status === 'In Transit') {
           events.push({ status: 'Arriving at Port', date: 'Est. 2023-11-18', location: 'Long Beach, US', completed: false, icon: <Anchor size={14} /> });
      }

      return events;
  };

  return (
    <div className="h-full w-full flex flex-col pb-6 animate-fade-in overflow-hidden relative">
      
      {/* 1. Control Tower Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-6 px-2">
        <div>
           <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
                <span className="text-[10px] font-mono text-neon-green tracking-widest uppercase">Global Satellite Link: Active</span>
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
              <div className="w-full max-w-2xl glass-card border border-white/20 shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                  
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
                  <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                      
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
                                   <option value="Pending">待处理 (Pending)</option>
                                   <option value="In Production">生产中 (Production)</option>
                                   <option value="In Transit">运输中 (In Transit)</option>
                                   <option value="Customs">清关中 (Customs)</option>
                                   <option value="Delivered">已送达 (Delivered)</option>
                                   <option value="Exception">异常 (Exception)</option>
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
                                  shipment.status === 'In Transit' ? 'text-neon-blue border-neon-blue/30 bg-neon-blue/10' : 
                                  shipment.status === 'Delivered' ? 'text-neon-green border-neon-green/30 bg-neon-green/10' :
                                  'text-gray-400 border-gray-600'
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
                    <div className="p-8 border-b border-white/10 relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-4xl font-display font-bold text-white tracking-tight">{selectedShipment.trackingNo}</h2>
                                <button className="p-2 hover:bg-white/10 rounded-lg text-neon-blue transition-colors"><ExternalLink size={18} /></button>
                                {/* Edit Button */}
                                <button 
                                    onClick={() => openEditModal(selectedShipment)}
                                    className="px-3 py-1.5 ml-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 flex items-center gap-1 transition-all"
                                >
                                    <Edit2 size={12} /> 编辑详情
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5"><Anchor size={14} className="text-neon-blue"/> Carrier: <span className="text-white font-bold">{selectedShipment.carrier}</span></span>
                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                <span className="flex items-center gap-1.5"><Activity size={14} className="text-neon-green"/> Status: <span className="text-white font-bold">{selectedShipment.status}</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Estimated Arrival</div>
                             <div className="text-3xl font-bold text-neon-blue font-display">{selectedShipment.eta || 'Calculating...'}</div>
                        </div>
                    </div>

                    {/* Visual Progress Nodes */}
                    <div className="px-12 py-8 relative z-10">
                         <div className="flex items-center justify-between relative">
                             {/* Line */}
                             <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/10 z-0"></div>
                             <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-neon-blue to-neon-purple z-0 shadow-[0_0_10px_#29D9FF]" style={{ width: `${selectedShipment.progress}%` }}></div>

                             {/* Nodes */}
                             <Node label="Origin" sub={selectedShipment.origin.split(',')[0]} active={true} icon={<Package size={16}/>} />
                             <Node label="Export Customs" sub="Cleared" active={selectedShipment.progress > 20} icon={<CheckCircle2 size={16}/>} />
                             <Node label="Ocean Transit" sub="In Voyage" active={selectedShipment.progress > 40} icon={<Anchor size={16}/>} />
                             <Node label="Import Customs" sub="Pending" active={selectedShipment.progress > 70} icon={<FileCheck size={16}/>} />
                             <Node label="Destination" sub={selectedShipment.destination.split(',')[0]} active={selectedShipment.progress >= 100} icon={<MapPin size={16}/>} />
                         </div>
                    </div>

                    {/* Bottom Split: Details & Timeline */}
                    <div className="flex-1 flex border-t border-white/10 relative z-10 bg-black/20 backdrop-blur-md">
                        
                        {/* Data Grid */}
                        <div className="w-1/2 p-8 border-r border-white/10 space-y-8">
                             <div>
                                 <h3 className="text-[12px] font-bold text-neon-blue uppercase tracking-widest mb-4 flex items-center gap-2">
                                     <Container size={14} /> 货柜详情 (Container Manifest)
                                 </h3>
                                 <div className="grid grid-cols-2 gap-4">
                                     <DataPoint label="Gross Weight" value={`${selectedShipment.weight} kg`} icon={<Scale size={14}/>} />
                                     <DataPoint label="Total Volume" value={`${(selectedShipment.weight / 167).toFixed(2)} CBM`} icon={<Ruler size={14}/>} />
                                     <DataPoint label="Carton Count" value={`${selectedShipment.cartons} ctns`} icon={<Box size={14}/>} />
                                     <DataPoint label="Service Type" value="FCL (Port to Port)" />
                                 </div>
                             </div>

                             <div>
                                 <h3 className="text-[12px] font-bold text-neon-purple uppercase tracking-widest mb-4 flex items-center gap-2">
                                     <Ship size={14} /> 航运详情 (Vessel Info)
                                 </h3>
                                 <div className="grid grid-cols-2 gap-4">
                                     <DataPoint label="Vessel Name" value="COSCO GALAXY" />
                                     <DataPoint label="Voyage No." value="V.049W" />
                                     <DataPoint label="Departure" value={selectedShipment.etd} icon={<Calendar size={14}/>} />
                                     <DataPoint label="Port of Load" value="Yantian, CN" />
                                 </div>
                             </div>
                        </div>

                        {/* Live Timeline */}
                        <div className="w-1/2 p-8 overflow-y-auto custom-scrollbar">
                             <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                 <Clock size={14} /> 实时动态日志 (Live Events)
                             </h3>
                             <div className="space-y-0 relative border-l border-white/10 ml-2">
                                 {getTimelineEvents(selectedShipment.status, selectedShipment.etd).map((event, i) => (
                                     <div key={i} className="pl-6 pb-8 relative group">
                                         <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 ${event.completed ? 'bg-neon-blue border-neon-blue' : 'bg-black border-gray-600'} transition-colors`}></div>
                                         <div className="flex justify-between items-start">
                                             <div>
                                                 <div className={`font-bold text-sm ${event.completed ? 'text-white' : 'text-gray-500'}`}>{event.status}</div>
                                                 <div className="text-xs text-gray-500 mt-0.5">{event.location}</div>
                                             </div>
                                             <div className="text-right">
                                                 <div className="text-[10px] font-mono text-gray-400">{event.date}</div>
                                                 {event.completed && <div className="text-[10px] text-neon-green mt-0.5">Completed</div>}
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

// Sub-components for clean code
const Node = ({ label, sub, active, icon }: any) => (
    <div className={`relative z-10 flex flex-col items-center gap-3 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-40 grayscale'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-lg transition-all ${active ? 'bg-black border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(41,217,255,0.4)]' : 'bg-black/50 border-white/10 text-gray-500'}`}>
            {icon}
        </div>
        <div className="text-center">
            <div className={`text-[11px] font-bold uppercase tracking-wide ${active ? 'text-white' : 'text-gray-500'}`}>{label}</div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5 max-w-[80px] truncate">{sub}</div>
        </div>
    </div>
);

const DataPoint = ({ label, value, icon }: any) => (
    <div className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
        <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1.5">
            {icon} {label}
        </div>
        <div className="text-sm font-bold text-white font-mono">{value}</div>
    </div>
);

// Fallback icon definition since FileCheck might not be in standard Lucide import sometimes, using generic
const FileCheck = ({size}: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
)

export default LogisticsModule;