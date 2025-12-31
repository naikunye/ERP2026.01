import React, { useState } from 'react';
import { Shipment } from '../types';
import { 
  Truck, Plane, Ship, Navigation, Search, Plus, Package, MapPin
} from 'lucide-react';

interface LogisticsModuleProps {
    shipments: Shipment[];
    onAddShipment: (shipment: Shipment) => void;
}

const LogisticsModule: React.FC<LogisticsModuleProps> = ({ shipments, onAddShipment }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State for new shipment
  const [newTracking, setNewTracking] = useState('');

  const handleAdd = () => {
      if(!newTracking) return;
      const newShip: Shipment = {
          id: crypto.randomUUID(),
          trackingNo: newTracking,
          carrier: 'Unknown',
          method: 'Sea',
          origin: 'China',
          destination: 'USA',
          etd: new Date().toISOString().split('T')[0],
          eta: 'Pending',
          status: 'Pending',
          progress: 0,
          weight: 0,
          cartons: 0,
          skuIds: [],
          riskReason: 'Waiting for carrier update...'
      };
      onAddShipment(newShip);
      setIsAdding(false);
      setNewTracking('');
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Air': return <Plane size={16} />;
      case 'Sea': return <Ship size={16} />;
      default: return <Truck size={16} />;
    }
  };

  const filteredData = shipments.filter(s => {
    const matchesSearch = s.trackingNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20">
      
      {/* 1. Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-b border-white/10 pb-6">
        <div className="md:col-span-6">
           <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
              物流控制塔
              <span className="text-neon-purple/50 font-sans text-sm tracking-widest font-medium border border-neon-purple/30 px-2 py-0.5 rounded">CONTROL TOWER</span>
           </h1>
        </div>
        
        {/* Real Stats */}
        <div className="md:col-span-6 flex gap-4 justify-end">
             <div className="glass-card px-5 py-3 flex items-center gap-4 min-w-[160px] border-white/10 bg-white/5">
                <div className="w-10 h-10 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                    <Navigation size={20} />
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">总运单</div>
                    <div className="text-xl font-display font-bold text-white">{shipments.length}</div>
                </div>
             </div>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="flex justify-between items-center sticky top-0 z-30 py-4 backdrop-blur-xl bg-black/10 border-b border-white/5">
          <div className="relative w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-neon-blue outline-none"
                  placeholder="搜索运单号..."
              />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="h-12 px-6 bg-gradient-neon-purple text-white rounded-xl font-bold text-sm shadow-glow-purple flex items-center gap-2"
          >
              <Plus size={18} /> 新增运单
          </button>
      </div>

      {/* Add Modal (Simple) */}
      {isAdding && (
          <div className="p-6 glass-card border-neon-purple/50">
              <h3 className="text-white font-bold mb-4">录入新运单</h3>
              <div className="flex gap-4">
                  <input 
                    value={newTracking}
                    onChange={(e) => setNewTracking(e.target.value)}
                    placeholder="输入运单号 (Tracking No)"
                    className="flex-1 h-12 px-4 bg-black/40 border border-white/20 rounded-xl text-white outline-none focus:border-neon-purple"
                  />
                  <button onClick={handleAdd} className="px-6 bg-neon-purple text-white rounded-xl font-bold">确定</button>
                  <button onClick={() => setIsAdding(false)} className="px-6 bg-white/10 text-white rounded-xl">取消</button>
              </div>
          </div>
      )}

      {/* 3. List */}
      <div className="grid grid-cols-1 gap-4">
          {filteredData.length === 0 ? (
              <div className="text-center py-20 text-gray-500">暂无物流运单，请点击右上角新增。</div>
          ) : filteredData.map((shipment) => (
              <div key={shipment.id} className="glass-card p-6 grid grid-cols-12 gap-6 items-center hover:border-neon-blue/30 transition-all">
                  
                  <div className="col-span-3 flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg bg-white/5`}>
                          {getMethodIcon(shipment.method)}
                      </div>
                      <div>
                          <div className="text-[16px] font-bold text-white font-mono">{shipment.trackingNo}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{shipment.carrier}</div>
                      </div>
                  </div>

                  <div className="col-span-5 px-4">
                      <div className="flex justify-between text-[12px] font-bold text-gray-400 mb-2">
                          <span>{shipment.origin}</span>
                          <span className="text-neon-blue">ETA: {shipment.eta}</span>
                          <span>{shipment.destination}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full w-full overflow-hidden">
                          <div className="h-full bg-neon-blue" style={{ width: `${shipment.progress}%` }}></div>
                      </div>
                  </div>

                  <div className="col-span-3">
                       <div className="inline-flex px-3 py-1 rounded-lg border border-white/10 text-[11px] font-bold uppercase text-white bg-white/5">
                           {shipment.status}
                       </div>
                  </div>

                  <div className="col-span-1 flex justify-end">
                       <button className="w-8 h-8 rounded-full bg-white/5 hover:text-white text-gray-400 flex items-center justify-center">
                           <MapPin size={16} />
                       </button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default LogisticsModule;
