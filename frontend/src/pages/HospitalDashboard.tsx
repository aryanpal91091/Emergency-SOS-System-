import React, { useState, useEffect } from 'react';
import { Hospital as HospIcon, Clock, Activity, CheckCircle2, UserCheck, ShieldAlert, HeartPulse, RefreshCw, AlertCircle, PhoneCall } from 'lucide-react';
import { hospitalApi } from '../services/api';
import { socket } from '../services/socket';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';

export const HospitalDashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHosp, setSelectedHosp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHospitals();

    socket.emit('join', { role: 'HOSPITAL' });

    socket.on('alert:hospital_incoming', () => {
      fetchHospitals();
    });

    socket.on('hospital:alert_updated', () => {
      fetchHospitals();
    });

    return () => {
      socket.off('alert:hospital_incoming');
      socket.off('hospital:alert_updated');
    };
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await hospitalApi.getAll();
      if (res.data?.success && res.data.hospitals.length > 0) {
        setHospitals(res.data.hospitals);
        setSelectedHosp(res.data.hospitals[0]);
      }
    } catch (error) {
      console.error('Fetch hospital error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertStatusChange = async (alertId: string, status: string) => {
    try {
      const res = await hospitalApi.updateAlertStatus(alertId, status);
      if (res.data?.success) {
        fetchHospitals();
      }
    } catch (error) {
      console.error('Update alert error:', error);
    }
  };

  const incomingAlerts = selectedHosp?.alerts || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6">
      {/* Top Hospital Command Header */}
      <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-950/90 border border-sky-500/40 rounded-2xl flex items-center justify-center text-sky-400 font-bold text-2xl shadow-lg shadow-sky-950/50">
            🏥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">
                {selectedHosp?.name || 'City General Medical & Trauma Center'}
              </h2>
              <span className="bg-sky-950 text-sky-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-sky-500/40">
                LEVEL 1 TRAUMA CENTER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedHosp?.address || '77 Medical Drive, Sector 4'} • Emergency Hotline: {selectedHosp?.contactPhone || '+1-555-900-Trauma'}
            </p>
          </div>
        </div>

        {/* Hospital Capacity Badges */}
        <div className="flex items-center gap-3 text-xs font-mono shrink-0">
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">AVAILABLE BEDS</span>
            <span className="text-emerald-400 font-extrabold text-sm">
              {selectedHosp?.availableBeds || 18} / {selectedHosp?.totalBeds || 120}
            </span>
          </div>

          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">ICU BEDS</span>
            <span className="text-blue-400 font-extrabold text-sm">{selectedHosp?.icuBeds || 6} READY</span>
          </div>

          <button
            onClick={fetchHospitals}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Incoming Emergency Alerts & Hospital Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Incoming Patients Triage Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-400 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Incoming Critical Trauma Triage Alerts
                </h3>
              </div>
              <span className="text-[10px] font-mono text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-500/30 font-bold">
                {incomingAlerts.length} Active Alerts
              </span>
            </div>

            {incomingAlerts.length > 0 ? (
              <div className="space-y-4">
                {incomingAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="glass-card-emergency p-5 rounded-2xl space-y-4 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                          ALERT ID: {alert.id.slice(0, 8)}
                        </span>
                        <h4 className="text-xl font-extrabold text-white mt-0.5">
                          Patient: {alert.emergency?.patientName || 'Critical Trauma Patient'}
                        </h4>
                        <p className="text-xs text-slate-300 font-mono mt-0.5">
                          Emergency Type: {alert.emergency?.emergencyType || 'ACCIDENT'} • Priority: {alert.emergency?.priority || 'CRITICAL'}
                        </p>
                      </div>

                      <StatusBadge status={alert.status} size="md" />
                    </div>

                    <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Patient Condition / Triage Notes:</span>
                        <span className="text-emerald-400 font-bold">ETA: {alert.emergency?.etaMinutes || 5} MIN</span>
                      </div>
                      <div className="text-red-300 font-bold text-sm">
                        "{alert.patientCondition || 'Multiple Injuries & Respiratory Distress'}"
                      </div>
                    </div>

                    {/* Readiness Action Protocol Controls */}
                    <div className="pt-1 font-mono">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                        Trauma Bay Readiness Status Controls:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleAlertStatusChange(alert.id, 'PREPARING')}
                          disabled={alert.status === 'PREPARING'}
                          className="bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                        >
                          1. Prepare Trauma Bay
                        </button>
                        <button
                          onClick={() => handleAlertStatusChange(alert.id, 'READY')}
                          disabled={alert.status === 'READY'}
                          className="bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                        >
                          2. Mark Bay Ready & Staff Standby
                        </button>
                        <button
                          onClick={() => handleAlertStatusChange(alert.id, 'PATIENT_ARRIVED')}
                          disabled={alert.status === 'PATIENT_ARRIVED'}
                          className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                        >
                          3. Confirm Patient Admitted
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Incoming Critical Alerts"
                description="Trauma bays are currently clear and on standby. Incoming alerts will sound automatically via real-time socket relay."
                icon={CheckCircle2}
              />
            )}
          </div>
        </div>

        {/* Hospital Network Switcher / Directory */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <HospIcon className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                Network Trauma Center Directory
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {hospitals.map((hosp) => (
                <button
                  key={hosp.id}
                  onClick={() => setSelectedHosp(hosp)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    selectedHosp?.id === hosp.id
                      ? 'bg-slate-800 border-sky-500/50 shadow-lg text-white'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-100">{hosp.name}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      {hosp.availableBeds} Beds
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{hosp.address}</div>
                  <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                    <span>ICU Capacity: {hosp.icuBeds} Beds</span>
                    <span>{hosp.contactPhone}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
