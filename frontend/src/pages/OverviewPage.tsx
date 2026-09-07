import React, { useState, useEffect } from 'react';
import { ShieldAlert, Navigation, Radio, Hospital, Activity, ArrowRight, Zap, RefreshCw, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmergencyTimeline } from '../components/ui/EmergencyTimeline';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { EmergencyMap, MapMarkerPoint } from '../components/map/EmergencyMap';
import { emergencyApi, ambulanceApi, hospitalApi, trafficApi } from '../services/api';
import { socket } from '../services/socket';

interface OverviewPageProps {
  onNavigate: (tab: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    socket.on('emergency:created', () => fetchData());
    socket.on('emergency:status_changed', () => fetchData());
    socket.on('traffic:signal_updated', () => fetchData());

    return () => {
      socket.off('emergency:created');
      socket.off('emergency:status_changed');
      socket.off('traffic:signal_updated');
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [emRes, ambRes, hospRes, sigRes] = await Promise.all([
        emergencyApi.getActive(),
        ambulanceApi.getAll(),
        hospitalApi.getAll(),
        trafficApi.getSignals(),
      ]);

      if (emRes.data?.success) setEmergencies(emRes.data.emergencies || []);
      if (ambRes.data?.success) setAmbulances(ambRes.data.ambulances || []);
      if (hospRes.data?.success) setHospitals(hospRes.data.hospitals || []);
      if (sigRes.data?.success) setSignals(sigRes.data.signals || []);
    } catch (err: any) {
      console.warn('Overview fetch notice:', err);
      setErrorMsg(err.message || 'Unable to connect to backend service at http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  const activeCorridors = signals.filter((s) => s.status === 'GREEN_CORRIDOR').length;
  const availableAmbulances = ambulances.filter((a) => a.status === 'AVAILABLE').length;
  const availableBeds = hospitals.reduce((acc, h) => acc + (h.availableBeds || 0), 0);

  // Build Map Markers
  const mapMarkers: MapMarkerPoint[] = [];

  signals.forEach((s) => {
    mapMarkers.push({
      id: `sig-${s.id}`,
      lat: s.latitude,
      lng: s.longitude,
      type: 'SIGNAL',
      label: `${s.signalCode} - ${s.name}`,
      status: s.status,
      details: `Intersection: ${s.intersectionGroup}`,
    });
  });

  hospitals.forEach((h) => {
    mapMarkers.push({
      id: `hosp-${h.id}`,
      lat: h.latitude,
      lng: h.longitude,
      type: 'HOSPITAL',
      label: h.name,
      details: `Beds: ${h.availableBeds}/${h.totalBeds} Available | ICU: ${h.icuBeds}`,
    });
  });

  emergencies.forEach((em) => {
    mapMarkers.push({
      id: `em-${em.id}`,
      lat: em.latitude,
      lng: em.longitude,
      type: 'PATIENT',
      label: `Emergency: ${em.patientName}`,
      status: em.status,
      details: `${em.emergencyType} • ${em.address}`,
    });

    if (em.assignedAmbulance) {
      mapMarkers.push({
        id: `amb-${em.assignedAmbulance.id}`,
        lat: em.assignedAmbulance.latitude,
        lng: em.assignedAmbulance.longitude,
        type: 'AMBULANCE',
        label: `Ambulance ${em.assignedAmbulance.vehicleNumber}`,
        status: em.assignedAmbulance.status,
        details: `Assigned to ${em.patientName} (ETA: ${em.etaMinutes || 5} min)`,
      });
    }
  });

  const primaryActiveEmergency = emergencies.length > 0 ? emergencies[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 lg:pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-widest mb-1">
            <Activity className="w-4 h-4 animate-pulse text-red-500" />
            Global Tactical Operations
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Mission Control & Dispatch Hub</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ambulance dispatch, traffic signal green corridor coordination & trauma triage telemetry.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all active:scale-95 shrink-0 shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Backend Disconnected Alert */}
      {errorMsg && (
        <div className="bg-red-950/90 border border-red-500/50 p-4 rounded-xl text-red-200 text-xs font-mono flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={fetchData}
            className="bg-red-900 hover:bg-red-800 text-white px-3 py-1 rounded font-bold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Emergencies"
          value={emergencies.length}
          subtitle={emergencies.length > 0 ? `${emergencies.filter(e => e.priority === 'CRITICAL').length} Critical Response Active` : 'No Critical Incidents'}
          icon={ShieldAlert}
          variant="danger"
          badge="LIVE"
        />
        <MetricCard
          title="Active Green Corridors"
          value={activeCorridors}
          subtitle={`Of ${signals.length} Traffic Intersections`}
          icon={Zap}
          variant="success"
          badge="AUTOMATED"
        />
        <MetricCard
          title="Available Ambulances"
          value={availableAmbulances}
          subtitle={`Fleet Total: ${ambulances.length} Units`}
          icon={Navigation}
          variant="info"
          badge="READY"
        />
        <MetricCard
          title="Hospital Bed Capacity"
          value={availableBeds}
          subtitle={`Across ${hospitals.length} Trauma Centers`}
          icon={Hospital}
          variant="neutral"
          badge="TRIAGE"
        />
      </div>

      {/* Primary Map & Live Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Map (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Live Operations Map & Fleet Radar
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                ● CARTO DARK ENGINE
              </span>
            </div>

            <EmergencyMap height="460px" markers={mapMarkers} />
          </div>
        </div>

        {/* Live Active Emergency Feed */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Active Incident Dispatch
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('citizen')}
                  className="text-[10px] font-mono text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                >
                  Trigger SOS <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {loading ? (
                <div className="pt-4">
                  <LoadingSkeleton count={3} height="h-20" />
                </div>
              ) : primaryActiveEmergency ? (
                <div className="pt-4 space-y-4">
                  <div className="glass-card-emergency p-4 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-red-400 uppercase">
                          ID: {primaryActiveEmergency.id.slice(0, 8)}
                        </span>
                        <h4 className="text-base font-extrabold text-white mt-0.5">
                          {primaryActiveEmergency.patientName}
                        </h4>
                      </div>
                      <StatusBadge status={primaryActiveEmergency.status} size="sm" />
                    </div>

                    <div className="text-xs space-y-1 text-slate-300 font-mono">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="truncate">{primaryActiveEmergency.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Type: {primaryActiveEmergency.emergencyType} • Priority: {primaryActiveEmergency.priority}</span>
                      </div>
                    </div>

                    {primaryActiveEmergency.assignedAmbulance && (
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                        <div className="text-blue-400 font-bold flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Ambulance: {primaryActiveEmergency.assignedAmbulance.vehicleNumber}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] flex justify-between">
                          <span>Destination: {primaryActiveEmergency.targetHospital?.name || 'Trauma Center'}</span>
                          <span className="text-emerald-400 font-bold">ETA: {primaryActiveEmergency.etaMinutes || 6} min</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Emergency Visual Timeline */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                      Response Timeline Protocol
                    </div>
                    <EmergencyTimeline currentStatus={primaryActiveEmergency.status} compact />
                  </div>
                </div>
              ) : (
                <div className="pt-8">
                  <EmptyState
                    title="No Active Emergency Incidents"
                    description="All system operations normal. Dispatch fleet is currently on standby."
                    icon={CheckCircle2}
                    action={{
                      label: 'Launch SOS Simulator',
                      onClick: () => onNavigate('citizen'),
                    }}
                  />
                </div>
              )}
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="border-t border-slate-800 pt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('driver')}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl text-left transition-colors"
              >
                <Navigation className="w-4 h-4 text-blue-400 mb-1" />
                <div className="text-xs font-bold text-slate-200 font-mono">Driver Unit</div>
                <div className="text-[10px] text-slate-500">Dispatch Nav</div>
              </button>

              <button
                onClick={() => onNavigate('police')}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl text-left transition-colors"
              >
                <Radio className="w-4 h-4 text-emerald-400 mb-1" />
                <div className="text-xs font-bold text-slate-200 font-mono">Traffic Police</div>
                <div className="text-[10px] text-slate-500">Green Corridor</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
