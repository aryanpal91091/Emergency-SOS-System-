import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Navigation,
  PhoneCall,
  Hospital,
  Clock,
  MapPin,
  CheckCircle2,
  Check,
  Loader2,
  AlertTriangle,
  Radio,
  UserCheck,
  Zap,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { emergencyApi } from '../services/api';
import { socket } from '../services/socket';
import { EmergencyMap, MapMarkerPoint } from '../components/map/EmergencyMap';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmergencyTimeline } from '../components/ui/EmergencyTimeline';

const EMERGENCY_TYPES = [
  { id: 'ACCIDENT', label: 'Road Accident', icon: '🚗', color: 'border-red-500/40 text-red-400 bg-red-950/40' },
  { id: 'CARDIAC', label: 'Cardiac Arrest', icon: '🫀', color: 'border-rose-500/40 text-rose-400 bg-rose-950/40' },
  { id: 'STROKE', label: 'Stroke & Brain', icon: '🧠', color: 'border-purple-500/40 text-purple-400 bg-purple-950/40' },
  { id: 'TRAUMA', label: 'Severe Trauma', icon: '🩸', color: 'border-amber-500/40 text-amber-400 bg-amber-950/40' },
];

export const CitizenApp: React.FC = () => {
  const [sosActive, setSosActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [emergencyType, setEmergencyType] = useState('ACCIDENT');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState('Detecting GPS location...');
  const [liveAmbulancePos, setLiveAmbulancePos] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto detect GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStatus('GPS Location Verified (High Precision)');
        },
        () => {
          // Default fallback (Delhi Central Hub)
          setUserLocation({ lat: 28.6175, lng: 77.213 });
          setLocationStatus('GPS Fallback Active (Central Hub)');
        },
        { timeout: 8000 }
      );
    } else {
      setUserLocation({ lat: 28.6175, lng: 77.213 });
      setLocationStatus('GPS Fallback Active (Central Hub)');
    }
  }, []);

  // Socket.IO Listeners for live emergency updates
  useEffect(() => {
    socket.on('emergency:created', (data: any) => {
      if (data?.emergency) {
        setEmergencyData(data.emergency);
        setSosActive(true);
        if (data.assignedAmbulance) {
          setLiveAmbulancePos({
            lat: data.assignedAmbulance.latitude,
            lng: data.assignedAmbulance.longitude,
          });
        }
      }
    });

    socket.on('live:ambulance_position', (data: any) => {
      setLiveAmbulancePos({ lat: data.latitude, lng: data.longitude });
    });

    socket.on('emergency:status_changed', (data: any) => {
      if (emergencyData && data.emergencyId === emergencyData.id) {
        setEmergencyData((prev: any) => ({ ...prev, status: data.status }));
      }
    });

    return () => {
      socket.off('emergency:created');
      socket.off('live:ambulance_position');
      socket.off('emergency:status_changed');
    };
  }, [emergencyData]);

  const handleTriggerSOS = async () => {
    if (!userLocation) return;
    setErrorMessage(null);
    try {
      setLoading(true);
      const res = await emergencyApi.triggerSOS({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        address: 'Connaught Circle Emergency Zone, Sector 1',
        emergencyType,
        priority: 'CRITICAL',
      });

      if (res.data?.success) {
        setEmergencyData(res.data.emergency);
        setSosActive(true);
        if (res.data.assignedAmbulance) {
          setLiveAmbulancePos({
            lat: res.data.assignedAmbulance.latitude,
            lng: res.data.assignedAmbulance.longitude,
          });
        }
      }
    } catch (err: any) {
      console.error('Trigger SOS error:', err);
      setErrorMessage(err.message || 'Failed to connect to backend emergency services at http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  const handleResetEmergency = () => {
    setSosActive(false);
    setEmergencyData(null);
    setLiveAmbulancePos(null);
    setErrorMessage(null);
  };

  // Build map markers
  const mapMarkers: MapMarkerPoint[] = [];

  if (userLocation) {
    mapMarkers.push({
      id: 'patient-location',
      lat: userLocation.lat,
      lng: userLocation.lng,
      type: 'PATIENT',
      label: emergencyData?.patientName || 'Emergency Victim Location',
      details: emergencyData?.address || 'GPS Coordinates Locked',
    });
  }

  if (liveAmbulancePos || emergencyData?.assignedAmbulance) {
    const ambLat = liveAmbulancePos?.lat || emergencyData.assignedAmbulance.latitude;
    const ambLng = liveAmbulancePos?.lng || emergencyData.assignedAmbulance.longitude;
    mapMarkers.push({
      id: 'dispatched-ambulance',
      lat: ambLat,
      lng: ambLng,
      type: 'AMBULANCE',
      label: `Dispatched Unit: ${emergencyData.assignedAmbulance?.vehicleNumber || 'AMB-101'}`,
      details: `Speed: 65 km/h • ETA: ${emergencyData.etaMinutes || 5} min`,
    });
  }

  if (emergencyData?.targetHospital) {
    mapMarkers.push({
      id: 'target-hospital',
      lat: emergencyData.targetHospital.latitude,
      lng: emergencyData.targetHospital.longitude,
      type: 'HOSPITAL',
      label: emergencyData.targetHospital.name,
      details: `Trauma Center Ready | ICU Beds: ${emergencyData.targetHospital.icuBeds || 4}`,
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-widest mb-1">
            <Zap className="w-4 h-4 text-red-500 animate-pulse" />
            Citizen Emergency Interface
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">1-Tap SOS Emergency Dispatch</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Instantly alerts nearest ICU ambulances, activates traffic green corridors, and prepares trauma hospital bays.
          </p>
        </div>

        <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-2 shrink-0">
          <MapPin className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span className="text-slate-300 font-bold">{locationStatus}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-950/90 border border-red-500/50 p-4 rounded-xl text-red-200 text-xs font-mono flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={handleTriggerSOS}
            className="bg-red-900 hover:bg-red-800 text-white px-3 py-1 rounded font-bold transition-colors"
          >
            Retry SOS
          </button>
        </div>
      )}

      {/* Main SOS Flow Split */}
      {!sosActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: SOS Trigger Button & Type Selector */}
          <div className="lg:col-span-5 space-y-6">
            {/* SOS Giant Interactive Card */}
            <div className="bg-radar-grid bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl border border-red-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-700" />
              
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-red-400 bg-red-950/80 px-2.5 py-1 rounded-full border border-red-500/30">
                  PRESS FOR IMMEDIATE MEDICAL ASSISTANCE
                </span>
                <h3 className="text-xl font-extrabold text-white pt-2">Emergency SOS Trigger</h3>
              </div>

              {/* Giant SOS Button */}
              <div className="py-4 flex justify-center">
                <button
                  onClick={handleTriggerSOS}
                  disabled={loading || !userLocation}
                  className="w-48 h-48 rounded-full sos-button-pulse flex flex-col items-center justify-center text-white cursor-pointer active:scale-95 disabled:opacity-50 select-none shadow-2xl"
                >
                  {loading ? (
                    <Loader2 className="w-16 h-16 animate-spin text-white" />
                  ) : (
                    <>
                      <ShieldAlert className="w-16 h-16 mb-1 text-white animate-bounce" />
                      <span className="text-3xl font-black font-mono tracking-wider text-white">SOS</span>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-red-200 mt-1">
                        DISPATCH HELP NOW
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Emergency Type Selector Grid */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">
                  Select Incident Type:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setEmergencyType(type.id)}
                      className={`p-3 rounded-xl border text-xs font-bold font-mono flex items-center gap-2.5 transition-all ${
                        emergencyType === type.id
                          ? `${type.color} ring-2 ring-red-500/50 shadow-md`
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pre-SOS Map & Information */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Current Location & Coverage Network
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  GPS: {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Detecting...'}
                </span>
              </div>

              <EmergencyMap height="460px" markers={mapMarkers} />
            </div>
          </div>
        </div>
      ) : (
        /* Active SOS Response Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active Emergency Status Card */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-card-emergency p-6 rounded-3xl space-y-5 shadow-2xl relative">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                    CRITICAL INCIDENT ACTIVE • ID: {emergencyData?.id?.slice(0, 8)}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {emergencyData?.patientName || 'Sarah Connor'}
                  </h3>
                  <p className="text-xs text-red-300 font-mono mt-0.5">
                    {emergencyData?.emergencyType} Emergency • Priority: {emergencyData?.priority}
                  </p>
                </div>
                <StatusBadge status={emergencyData?.status || 'SOS_TRIGGERED'} size="md" />
              </div>

              {/* ETA Highlight */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-red-500/40 text-center space-y-1 shadow-inner">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">
                  ESTIMATED AMBULANCE ARRIVAL
                </span>
                <div className="text-4xl font-black text-emerald-400 font-mono flex items-center justify-center gap-2">
                  <Clock className="w-8 h-8 text-emerald-400 animate-pulse" />
                  <span>{emergencyData?.etaMinutes || 5} MIN</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Live Dispatch Tracking & Traffic Green Corridor Enabled
                </span>
              </div>

              {/* Dispatched Unit & Hospital Details */}
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-950/90 border border-blue-500/40 flex items-center justify-center text-blue-400 text-lg">
                      🚑
                    </div>
                    <div>
                      <div className="text-white font-bold">
                        {emergencyData?.assignedAmbulance?.vehicleNumber || 'AMB-101'}
                      </div>
                      <div className="text-slate-400 text-[11px]">Advanced ICU Unit</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-950 text-blue-400 font-bold px-2 py-1 rounded border border-blue-500/30">
                    DISPATCHED
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-950/90 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg">
                      🏥
                    </div>
                    <div>
                      <div className="text-white font-bold">
                        {emergencyData?.targetHospital?.name || 'City Trauma Hospital'}
                      </div>
                      <div className="text-slate-400 text-[11px]">Level 1 Trauma Center</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-1 rounded border border-emerald-500/30">
                    BAY READY
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleResetEmergency}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold font-mono py-2.5 rounded-xl text-xs border border-slate-800 flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Emergency State
                </button>
              </div>
            </div>

            {/* Response Timeline Visualizer */}
            <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Automated Response Protocol Timeline
              </div>
              <EmergencyTimeline currentStatus={emergencyData?.status} />
            </div>
          </div>

          {/* Right Column: Live Map Tracking */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Live Ambulance Tracking & Green Corridor Path
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  ● REAL-TIME GPS RELAY
                </span>
              </div>

              <EmergencyMap height="500px" markers={mapMarkers} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
