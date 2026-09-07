import React, { useState, useEffect } from 'react';
import {
  Navigation,
  ShieldCheck,
  MapPin,
  Hospital,
  CheckCircle2,
  ArrowRight,
  Play,
  AlertCircle,
  PhoneCall,
  Radio,
  UserCheck,
  Zap,
  Clock,
  Check,
  Loader2,
} from 'lucide-react';
import { emergencyApi } from '../services/api';
import { socket } from '../services/socket';
import { EmergencyMap, MapMarkerPoint } from '../components/map/EmergencyMap';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmergencyTimeline } from '../components/ui/EmergencyTimeline';
import { EmptyState } from '../components/ui/EmptyState';

export const DriverApp: React.FC = () => {
  const [activeEmergency, setActiveEmergency] = useState<any>(null);
  const [driverPos, setDriverPos] = useState({ lat: 28.6139, lng: 77.209 });
  const [isSimulatingMove, setIsSimulatingMove] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveEmergency();

    socket.emit('join', { role: 'DRIVER' });

    socket.on('alert:new_emergency', (data: any) => {
      if (data?.emergency) setActiveEmergency(data.emergency);
    });

    socket.on('emergency:status_changed', (data: any) => {
      if (activeEmergency && data.emergencyId === activeEmergency.id) {
        setActiveEmergency((prev: any) => ({ ...prev, status: data.status }));
      }
    });

    return () => {
      socket.off('alert:new_emergency');
      socket.off('emergency:status_changed');
    };
  }, [activeEmergency?.id]);

  const fetchActiveEmergency = async () => {
    try {
      setLoading(true);
      const res = await emergencyApi.getActive();
      if (res.data?.success && res.data.emergencies.length > 0) {
        setActiveEmergency(res.data.emergencies[0]);
      } else {
        setActiveEmergency(null);
      }
    } catch (error) {
      console.error('Fetch driver emergency error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (!activeEmergency) return;
    try {
      const res = await emergencyApi.updateStatus(activeEmergency.id, nextStatus);
      if (res.data?.success) {
        setActiveEmergency(res.data.emergency);
      }
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const startGPSNavigation = () => {
    if (!activeEmergency) return;
    setIsSimulatingMove(true);

    const targetLat =
      activeEmergency.status === 'PATIENT_PICKED_UP' || activeEmergency.status === 'EN_ROUTE_TO_HOSPITAL'
        ? activeEmergency.targetHospital?.latitude || 28.6289
        : activeEmergency.latitude;

    const targetLng =
      activeEmergency.status === 'PATIENT_PICKED_UP' || activeEmergency.status === 'EN_ROUTE_TO_HOSPITAL'
        ? activeEmergency.targetHospital?.longitude || 77.2065
        : activeEmergency.longitude;

    let step = 0;
    const totalSteps = 10;
    const startLat = driverPos.lat;
    const startLng = driverPos.lng;

    const interval = setInterval(() => {
      step++;
      const currentLat = startLat + ((targetLat - startLat) * step) / totalSteps;
      const currentLng = startLng + ((targetLng - startLng) * step) / totalSteps;

      setDriverPos({ lat: currentLat, lng: currentLng });

      socket.emit('driver:location_update', {
        ambulanceId: activeEmergency.assignedAmbulanceId || 'amb-101',
        emergencyId: activeEmergency.id,
        latitude: currentLat,
        longitude: currentLng,
      });

      if (step >= totalSteps) {
        clearInterval(interval);
        setIsSimulatingMove(false);
      }
    }, 1200);
  };

  // Build map markers
  const mapMarkers: MapMarkerPoint[] = [
    {
      id: 'driver-pos',
      lat: driverPos.lat,
      lng: driverPos.lng,
      type: 'AMBULANCE',
      label: 'Ambulance Unit AMB-101 (Your Unit)',
      details: 'Current Vehicle Position',
    },
  ];

  if (activeEmergency) {
    mapMarkers.push({
      id: 'patient-target',
      lat: activeEmergency.latitude,
      lng: activeEmergency.longitude,
      type: 'PATIENT',
      label: `Patient: ${activeEmergency.patientName}`,
      details: activeEmergency.address,
    });

    if (activeEmergency.targetHospital) {
      mapMarkers.push({
        id: 'hosp-target',
        lat: activeEmergency.targetHospital.latitude,
        lng: activeEmergency.targetHospital.longitude,
        type: 'HOSPITAL',
        label: activeEmergency.targetHospital.name,
        details: 'Destination Trauma Center',
      });
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-widest mb-1">
            <Navigation className="w-4 h-4 text-blue-500 animate-pulse" />
            Tactical Ambulance Console
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Driver Dispatch & Navigation Unit</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit AMB-101 • Advanced ICU Equipment • Live GPS Telemetry Connected
          </p>
        </div>

        <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span className="text-emerald-400 font-bold">SYSTEM DISPATCH ACTIVE</span>
        </div>
      </div>

      {activeEmergency ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active Dispatch Action Card */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-card p-6 rounded-3xl space-y-5 shadow-2xl border border-blue-500/30">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                    DISPATCH TARGET • ID: {activeEmergency.id.slice(0, 8)}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-0.5">{activeEmergency.patientName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Phone: {activeEmergency.patientPhone || '+1-555-019-2834'}
                  </p>
                </div>
                <StatusBadge status={activeEmergency.status} size="md" />
              </div>

              {/* Location Box */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-bold text-white">Pickup Location:</span>
                </div>
                <div className="text-slate-400 pl-6 leading-relaxed">{activeEmergency.address}</div>

                {activeEmergency.targetHospital && (
                  <>
                    <div className="border-t border-slate-800 pt-2 flex items-center gap-2 text-slate-300">
                      <Hospital className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="font-bold text-white">Destination Hospital:</span>
                    </div>
                    <div className="text-slate-400 pl-6">{activeEmergency.targetHospital.name}</div>
                  </>
                )}
              </div>

              {/* Workflow Status Trigger Controls */}
              <div className="space-y-2 pt-1 font-mono">
                <span className="text-[10px] font-bold uppercase text-slate-400">Response Action Protocol:</span>

                {activeEmergency.status === 'SOS_TRIGGERED' || activeEmergency.status === 'AMBULANCE_ASSIGNED' ? (
                  <button
                    onClick={() => handleStatusChange('EN_ROUTE_TO_PATIENT')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/60 border border-blue-400/40 active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START RESPONSE — EN ROUTE TO PATIENT</span>
                  </button>
                ) : activeEmergency.status === 'EN_ROUTE_TO_PATIENT' ? (
                  <button
                    onClick={() => handleStatusChange('PATIENT_PICKED_UP')}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 border border-amber-400/40 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PATIENT PICKED UP & STABILIZED</span>
                  </button>
                ) : activeEmergency.status === 'PATIENT_PICKED_UP' ? (
                  <button
                    onClick={() => handleStatusChange('EN_ROUTE_TO_HOSPITAL')}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/60 border border-blue-400/40 active:scale-95 transition-all"
                  >
                    <Hospital className="w-4 h-4" />
                    <span>TRANSIT TO TRAUMA HOSPITAL</span>
                  </button>
                ) : activeEmergency.status === 'EN_ROUTE_TO_HOSPITAL' ? (
                  <button
                    onClick={() => handleStatusChange('PATIENT_ARRIVED')}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 border border-emerald-400/40 active:scale-95 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>ARRIVED AT HOSPITAL & TRANSFERRED</span>
                  </button>
                ) : (
                  <div className="bg-emerald-950/80 border border-emerald-500/40 p-3 rounded-xl text-center text-emerald-400 font-bold text-xs">
                    ✓ Emergency Completed & Transferred to Triage Bay
                  </div>
                )}

                {/* GPS Navigation Simulator Button */}
                <button
                  onClick={startGPSNavigation}
                  disabled={isSimulatingMove}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs border border-slate-800 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 text-blue-400 ${isSimulatingMove ? 'animate-spin' : ''}`} />
                  <span>{isSimulatingMove ? 'Simulating GPS Driving Route...' : 'Simulate GPS Driving Navigation'}</span>
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Driver Response Sequence
              </div>
              <EmergencyTimeline currentStatus={activeEmergency.status} />
            </div>
          </div>

          {/* Right Column: Driver Map View */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Driver Turn-by-Turn Route Guidance
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-500/30 font-bold">
                  AMB-101 GPS LOCK
                </span>
              </div>

              <EmergencyMap height="520px" markers={mapMarkers} />
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Active Emergency Dispatches"
          description="Your ambulance unit AMB-101 is currently on standby in sector 1. You will receive an audio/visual alert as soon as a citizen triggers an SOS."
          icon={CheckCircle2}
        />
      )}
    </div>
  );
};
