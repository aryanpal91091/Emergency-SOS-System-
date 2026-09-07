import React, { useState, useEffect } from 'react';
import { Radio, ShieldAlert, CheckCircle2, Zap, AlertTriangle, ArrowRight, RefreshCw, Sliders } from 'lucide-react';
import { trafficApi, emergencyApi } from '../services/api';
import { socket } from '../services/socket';
import { EmergencyMap, MapMarkerPoint } from '../components/map/EmergencyMap';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';

export const PoliceDashboard: React.FC = () => {
  const [signals, setSignals] = useState<any[]>([]);
  const [activeEmergencies, setActiveEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();

    socket.emit('join', { role: 'POLICE' });

    socket.on('traffic:signal_updated', (data: any) => {
      if (data?.signal) {
        setSignals((prev) =>
          prev.map((sig) => (sig.id === data.signal.id ? data.signal : sig))
        );
      }
    });

    socket.on('alert:green_corridor_active', () => {
      fetchData();
    });

    return () => {
      socket.off('traffic:signal_updated');
      socket.off('alert:green_corridor_active');
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sigRes, emRes] = await Promise.all([trafficApi.getSignals(), emergencyApi.getActive()]);
      if (sigRes.data?.success) setSignals(sigRes.data.signals || []);
      if (emRes.data?.success) setActiveEmergencies(emRes.data.emergencies || []);
    } catch (error) {
      console.error('Fetch police data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSignal = async (signalId: string, currentStatus: string) => {
    try {
      const nextStatus =
        currentStatus === 'GREEN_CORRIDOR'
          ? 'NORMAL'
          : currentStatus === 'NORMAL'
          ? 'PREPARE'
          : 'GREEN_CORRIDOR';

      const res = await trafficApi.updateSignal(signalId, nextStatus);
      if (res.data?.success) {
        setSignals((prev) => prev.map((sig) => (sig.id === signalId ? res.data.signal : sig)));
        socket.emit('traffic:signal_toggle', { signalId, status: nextStatus });
      }
    } catch (error) {
      console.error('Signal update error:', error);
    }
  };

  const activeCorridorsCount = signals.filter((s) => s.status === 'GREEN_CORRIDOR').length;

  const mapMarkers: MapMarkerPoint[] = signals.map((sig) => ({
    id: sig.id,
    lat: sig.latitude,
    lng: sig.longitude,
    type: 'SIGNAL',
    label: `${sig.signalCode} - ${sig.name}`,
    status: sig.status,
    details: `Intersection: ${sig.intersectionGroup}`,
  }));

  activeEmergencies.forEach((em) => {
    if (em.assignedAmbulance) {
      mapMarkers.push({
        id: `amb-${em.id}`,
        lat: em.assignedAmbulance.latitude,
        lng: em.assignedAmbulance.longitude,
        type: 'AMBULANCE',
        label: `Approaching: ${em.assignedAmbulance.vehicleNumber}`,
        details: `Destination: ${em.targetHospital?.name || 'Trauma Center'} (ETA: ${em.etaMinutes || 5} min)`,
      });
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            Intelligent Transportation System (ITS)
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Traffic Control & Green Corridor Hub</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated & manual signal preemptions for emergency ambulance transit corridors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono text-center">
            <span className="text-slate-500 text-[10px] block font-bold uppercase">ACTIVE GREEN CORRIDORS</span>
            <span className="text-emerald-400 font-extrabold text-sm">{activeCorridorsCount} / {signals.length} SIGNALS</span>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Signal Preemption Table & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Signal Preemption Grid / Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Intersection Signal Preemption Grid
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Manual Override Enabled</span>
            </div>

            <div className="space-y-3">
              {signals.map((sig) => {
                const isGreen = sig.status === 'GREEN_CORRIDOR';
                const isPrepare = sig.status === 'PREPARE';

                return (
                  <div
                    key={sig.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isGreen
                        ? 'glass-card-corridor'
                        : isPrepare
                        ? 'bg-amber-950/40 border-amber-500/40'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-200">{sig.signalCode}</span>
                          <span className="text-white font-extrabold text-sm">{sig.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Group: {sig.intersectionGroup} • GPS: {sig.latitude.toFixed(3)}, {sig.longitude.toFixed(3)}
                        </p>
                      </div>

                      <StatusBadge status={sig.status} size="sm" />
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {isGreen
                          ? '⚡ Green Corridor Active — Cross Traffic Held Red'
                          : isPrepare
                          ? '⚠️ Pre-Clearing Intersection Traffic'
                          : 'Normal Signal Phase Cycle'}
                      </span>

                      <button
                        onClick={() => handleToggleSignal(sig.id, sig.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all active:scale-95 ${
                          isGreen
                            ? 'bg-red-950 hover:bg-red-900 text-red-300 border-red-500/40'
                            : isPrepare
                            ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
                            : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border-emerald-500/40 shadow-md'
                        }`}
                      >
                        {isGreen ? 'Deactivate Corridor' : isPrepare ? 'Override to Green' : 'Activate Green Corridor'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Traffic Map View */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Intersection Signal Topography Map
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                SIGNAL SENSORS LIVE
              </span>
            </div>

            <EmergencyMap height="550px" markers={mapMarkers} />
          </div>
        </div>
      </div>
    </div>
  );
};
