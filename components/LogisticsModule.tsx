import React, { useState } from 'react';
import { 
  Truck, Plane, Ship, Package, MapPin, 
  Search, Filter, AlertTriangle, CheckCircle2, 
  Clock, ArrowRight, Anchor, Navigation, 
  MoreHorizontal, RefreshCw, Box, ExternalLink,
  CloudLightning, ShieldCheck
} from 'lucide-react';

// --- Types ---
type TransportMethod = 'Air' | 'Sea' | 'Rail' | 'Truck';
type ShipmentStatus = 'Pending' | 'In Transit' | 'Customs' | 'Out for Delivery' | 'Delivered' | 'Exception';

interface ShipmentEvent {
  date: string;
  time: string;
  location: string;
  description: string;
  status: 'Completed' | 'Current' | 'Future';
}

interface Shipment {
  id: string;
  trackingNo: string;
  carrier: string; // Matson, UPS, DHL, FedEx
  method: TransportMethod;
  origin: string;
  destination: string;
  etd: string; // Est. Time of Departure
  eta: string; // Est. Time of Arrival
  status: ShipmentStatus;
  progress: number; // 0-100
  weight: number; // kg
  cartons: number;
  riskLevel: 'Low' | 'Medium' | 'High'; // AI Analysis
  riskReason?: string;
  events: ShipmentEvent[];
}

// --- Mock Data ---
const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'SH-2024-001',
    trackingNo: 'MSN78291029US',
    carrier: 'Matson (CLX)',
    method: 'Sea',
    origin: 'Shenzhen, CN',
    destination: 'Long Beach, US',
    etd: '2023-11-01',
    eta: '2023-11-14',
    status: 'In Transit',
    progress: 65,
    weight: 1200,
    cartons: 85,
    riskLevel: 'Low',
    events: [
      { date: '11-01', time: '14:00', location: 'Yantian Port', description: 'Vessel departed', status: 'Completed' },
      { date: '11-08', time: '09:00', location: 'Pacific Ocean', description: 'En route to destination', status: 'Current' },
      { date: '11-14', time: '10:00', location: 'Long Beach', description: 'Expected arrival', status: 'Future' },
    ]
  },
  {
    id: 'SH-2024-002',
    trackingNo: 'DHL99283711HK',
    carrier: 'DHL Express',
    method: 'Air',
    origin: 'Hong Kong, CN',
    destination: 'Berlin, DE',
    etd: '2023-11-09',
    eta: '2023-11-12',
    status: 'Customs',
    progress: 80,
    weight: 450,
    cartons: 32,
    riskLevel: 'High',
    riskReason: '欧洲暴雪预警，可能导致航班延误 24h',
    events: [
      { date: '11-09', time: '22:00', location: 'HKG Airport', description: 'Departed facility', status: 'Completed' },
      { date: '11-10', time: '05:00', location: 'Leipzig Hub', description: 'Arrived at sort facility', status: 'Completed' },
      { date: '11-10', time: '08:30', location: 'Customs', description: 'Clearance processing', status: 'Current' },
    ]
  },
  {
    id: 'SH-2024-003',
    trackingNo: 'UPS1Z2938402',
    carrier: 'UPS Saver',
    method: 'Air',
    origin: 'Shanghai, CN',
    destination: 'New York, US',
    etd: '2023-11-05',
    eta: '2023-11-08',
    status: 'Delivered',
    progress: 100,
    weight: 200,
    cartons: 15,
    riskLevel: 'Low',
    events: [
      { date: '11-05', time: '18:00', location: 'PVG Airport', description: 'Departure', status: 'Completed' },
      { date: '11-08', time: '14:20', location: 'New York, NY', description: 'Delivered at front door', status: 'Completed' },
    ]
  },
  {
    id: 'SH-2024-004',
    trackingNo: 'ZIM88291002',
    carrier: 'ZIM fast boat',
    method: 'Sea',
    origin: 'Ningbo, CN',
    destination: 'Felixstowe, UK',
    etd: '2023-10-28',
    eta: '2023-11-25',
    status: 'In Transit',
    progress: 40,
    weight: 3500,
    cartons: 210,
    riskLevel: 'Medium',
    riskReason: '港口拥堵指数上升 (Level 4)',
    events: [
        { date: '10-28', time: '10:00', location: 'Ningbo', description: 'Loaded on vessel', status: 'Completed' },
        { date: '11-10', time: '12:00', location: 'Indian Ocean', description: 'In transit', status: 'Current' },
    ]
  }
];

const LogisticsModule: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const getMethodIcon = (method: TransportMethod) => {
    switch (method) {
      case 'Air': return <Plane size={16} />;
      case 'Sea': return <Ship size={16} />;
      case 'Rail': return <Truck size={16} />; // Use truck for rail/ground generic
      default: return <Truck size={16} />;
    }
  };

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case 'Delivered': return 'text-neon-green bg-neon-green/10 border-neon-green/20';
      case 'Exception': return 'text-neon-pink bg-neon-pink/10 border-neon-pink/20';
      case 'Customs': return 'text-neon-yellow bg-neon-yellow/10 border-neon-yellow/20';
      default: return 'text-neon-blue bg-neon-blue/10 border-neon-blue/20';
    }
  };

  const filteredData = MOCK_SHIPMENTS.filter(s => {
    const matchesSearch = s.trackingNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || s.status === filterStatus || 
                          (filterStatus === 'Active' && s.status !== 'Delivered');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20">
      
      {/* 1. Header & Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-b border-white/10 pb-6">
        <div className="md:col-span-5">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              全球物流追踪
              <span className="text-neon-purple/50 font-sans text-sm tracking-widest font-medium border border-neon-purple/30 px-2 py-0.5 rounded">LOGISTICS RADAR</span>
           </h1>
           <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
              卫星链路连接正常 · 数据实时同步中
           </p>
        </div>
        
        {/* KPI Cards */}
        <div className="md:col-span-7 flex gap-4 justify-end">
             <div className="glass-card px-5 py-3 flex items-center gap-4 min-w-[160px] border-white/10 bg-white/5">
                <div className="w-10 h-10 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
                    <Navigation size={20} />
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">在途运单</div>
                    <div className="text-xl font-display font-bold text-white">12</div>
                </div>
             </div>
             
             <div className="glass-card px-5 py-3 flex items-center gap-4 min-w-[160px] border-neon-yellow/20 bg-neon-yellow/5">
                <div className="w-10 h-10 rounded-full bg-neon-yellow/10 flex items-center justify-center text-neon-yellow shadow-glow-yellow/30">
                    <AlertTriangle size={20} />
                </div>
                <div>
                    <div className="text-[10px] text-neon-yellow font-bold uppercase tracking-widest">异常/清关</div>
                    <div className="text-xl font-display font-bold text-white">2</div>
                </div>
             </div>

             <div className="glass-card px-5 py-3 flex items-center gap-4 min-w-[160px] border-neon-green/20 bg-neon-green/5">
                <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green shadow-glow-green/30">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <div className="text-[10px] text-neon-green font-bold uppercase tracking-widest">近7日签收</div>
                    <div className="text-xl font-display font-bold text-white">45</div>
                </div>
             </div>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="flex justify-between items-center sticky top-0 z-30 py-4 backdrop-blur-xl bg-black/10 border-b border-white/5 transition-all">
          <div className="relative w-[400px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={18} />
              <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-neon-blue focus:bg-white/10 outline-none transition-all placeholder-gray-600"
                  placeholder="输入运单号、起始地或目的地..."
              />
          </div>
          
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
              {['All', 'Active', 'Exception', 'Delivered'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                        filterStatus === status 
                        ? 'bg-white/10 text-white shadow-inner-light' 
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                      {status === 'All' ? '全部' : status === 'Active' ? '运输中' : status === 'Exception' ? '异常' : '已签收'}
                  </button>
              ))}
          </div>
      </div>

      {/* 3. Shipment Cards */}
      <div className="grid grid-cols-1 gap-4">
          {filteredData.map((shipment) => (
              <div key={shipment.id} className="glass-card p-0 hover:border-neon-blue/30 transition-all group overflow-visible">
                  {/* Card Header & Main Info */}
                  <div className="p-6 grid grid-cols-12 gap-6 items-center">
                      
                      {/* Carrier & ID */}
                      <div className="col-span-3 flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                              shipment.method === 'Air' ? 'bg-gradient-neon-purple' : 'bg-gradient-neon-blue'
                          }`}>
                              {getMethodIcon(shipment.method)}
                          </div>
                          <div>
                              <div className="text-[16px] font-bold text-white font-mono tracking-wide">{shipment.trackingNo}</div>
                              <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                                  <span>{shipment.carrier}</span>
                                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                  <span>{shipment.cartons} 箱 / {shipment.weight}kg</span>
                              </div>
                          </div>
                      </div>

                      {/* Route Visualization */}
                      <div className="col-span-5 px-4">
                          <div className="flex justify-between items-center text-[12px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
                              <span>{shipment.origin}</span>
                              <span className="text-neon-blue font-mono">{shipment.status === 'Delivered' ? '已送达' : `ETA: ${shipment.eta}`}</span>
                              <span>{shipment.destination}</span>
                          </div>
                          
                          {/* Progress Bar Container */}
                          <div className="relative h-2 bg-white/10 rounded-full w-full overflow-hidden">
                              <div 
                                className={`absolute left-0 top-0 bottom-0 rounded-full ${shipment.riskLevel === 'High' ? 'bg-neon-pink' : 'bg-neon-blue'}`}
                                style={{ width: `${shipment.progress}%` }}
                              >
                                  {/* Animated Gloss */}
                                  <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] skew-x-12"></div>
                              </div>
                          </div>
                          
                          {/* Markers */}
                          <div className="flex justify-between mt-2">
                               <div className="text-[10px] text-gray-600">{shipment.etd}</div>
                               <div className="text-[10px] text-gray-600">目标</div>
                          </div>
                      </div>

                      {/* Status & Risk AI */}
                      <div className="col-span-3 flex flex-col items-start gap-2 border-l border-white/5 pl-6">
                           <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[11px] font-bold uppercase ${getStatusColor(shipment.status)}`}>
                               {shipment.status}
                           </div>
                           
                           {/* AI Risk Analysis */}
                           {shipment.status !== 'Delivered' && (
                               <div className={`flex items-start gap-2 text-[10px] ${
                                   shipment.riskLevel === 'High' ? 'text-neon-pink' : 
                                   shipment.riskLevel === 'Medium' ? 'text-neon-yellow' : 'text-gray-500'
                               }`}>
                                   {shipment.riskLevel === 'High' ? <CloudLightning size={12} className="shrink-0 mt-0.5" /> : <ShieldCheck size={12} className="shrink-0 mt-0.5" />}
                                   <span className="leading-tight">
                                       {shipment.riskReason || 'AI 预测：航路畅通，无显著风险'}
                                   </span>
                               </div>
                           )}
                      </div>

                      {/* Action */}
                      <div className="col-span-1 flex justify-end">
                           <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                               <MoreHorizontal size={16} />
                           </button>
                      </div>
                  </div>

                  {/* Expanded Timeline (Visible on Hover/Click - Simplified for now as footer) */}
                  <div className="px-6 pb-6 pt-0 border-t border-white/5 bg-black/20 hidden group-hover:block transition-all">
                      <div className="flex items-center gap-8 pt-4 overflow-x-auto">
                           {shipment.events.map((event, idx) => (
                               <div key={idx} className="flex flex-col items-center min-w-[100px] relative">
                                    {/* Connector Line */}
                                    {idx < shipment.events.length - 1 && (
                                        <div className={`absolute top-[9px] left-[50%] w-full h-[2px] ${event.status === 'Completed' ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                                    )}
                                    
                                    {/* Dot */}
                                    <div className={`w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center ${
                                        event.status === 'Completed' ? 'bg-black border-neon-blue text-neon-blue' : 
                                        event.status === 'Current' ? 'bg-neon-blue border-neon-blue text-black animate-pulse' : 'bg-black border-gray-600'
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${event.status === 'Completed' || event.status === 'Current' ? 'bg-current' : 'bg-transparent'}`}></div>
                                    </div>

                                    <div className="mt-2 text-center">
                                        <div className="text-[10px] font-bold text-gray-400">{event.date}</div>
                                        <div className="text-[10px] text-white font-bold">{event.location}</div>
                                        <div className="text-[9px] text-gray-500 max-w-[80px] truncate">{event.description}</div>
                                    </div>
                               </div>
                           ))}
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default LogisticsModule;