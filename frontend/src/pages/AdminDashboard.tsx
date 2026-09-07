import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Navigation, Hospital as HospIcon, Zap, Users, CheckCircle2, RefreshCw, Radio, Server } from 'lucide-react';
import { ambulanceApi, hospitalApi, trafficApi, emergencyApi } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MetricCard } from '../components/ui/MetricCard';

export const AdminDashboard: React.FC = () => {
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ambRes, hospRes, sigRes, emRes] = await Promise.all([
        ambulanceApi.getAll(),
        hospitalApi.getAll(),
        trafficApi.getSignals(),
        emergencyApi.getActive(),
      ]);

      if (ambRes.data?.success) setAmbulances(ambRes.data.ambulances || []);
      if (hospRes.data?.success) setHospitals(hospRes.data.hospitals || []);
      if (sigRes.data?.success) setSignals(sigRes.data.signals || []);
      if (emRes.data?.success) setEmergencies(emRes.data.emergencies || []);
    } catch (error) {
      console.error('Fetch admin data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeCorridorsCount = signals.filter((s) => s.status === 'GREEN_CORRIDOR').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6">
      {/* Header Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
            <Server className="w-4 h-4 text-blue-400" />
            System Fleet & Infrastructure Telemetry
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">System Administration & Control Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of registered ambulance units, hospital triage nodes, and traffic signal preemption hardware.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh System Audit</span>
        </button>
      </div>

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Operations"
          value={emergencies.length}
          subtitle="Real-time Active SOS Cases"
          icon={ShieldAlert}
          variant="danger"
          badge="LIVE"
        />
        <MetricCard
          title="Green Corridors"
          value={activeCorridorsCount}
          subtitle={`Signal Preemptions Active`}
          icon={Zap}
          variant="success"
          badge="TRAFFIC"
        />
        <MetricCard
          title="Ambulance Fleet"
          value={ambulances.length}
          subtitle={`Available: ${ambulances.filter((a) => a.status === 'AVAILABLE').length} Units`}
          icon={Navigation}
          variant="info"
          badge="FLEET"
        />
        <MetricCard
          title="Trauma Hospitals"
          value={hospitals.length}
          subtitle="Connected Triage Network"
          icon={HospIcon}
          variant="neutral"
          badge="NETWORK"
        />
      </div>

      {/* Fleet & Hospital Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ambulance Fleet Registry Table */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-400" /> Emergency Ambulance Fleet Registry
            </h3>
            <span className="text-[10px] font-mono text-slate-400">{ambulances.length} Registered Units</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300 font-mono">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Vehicle No</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Equipment</th>
                  <th className="px-3 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ambulances.map((amb) => (
                  <tr key={amb.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-3 font-bold text-white">{amb.vehicleNumber}</td>
                    <td className="px-3 py-3 text-slate-400">{amb.vehicleType}</td>
                    <td className="px-3 py-3 text-slate-400">{amb.equipmentLevel}</td>
                    <td className="px-3 py-3 text-right">
                      <StatusBadge status={amb.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hospital Network Matrix */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <HospIcon className="w-4 h-4 text-sky-400" /> Trauma Hospital Capacity Matrix
            </h3>
            <span className="text-[10px] font-mono text-slate-400">{hospitals.length} Network Nodes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300 font-mono">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Hospital Name</th>
                  <th className="px-3 py-2.5 text-center">Available Beds</th>
                  <th className="px-3 py-2.5 text-center">ICU Capacity</th>
                  <th className="px-3 py-2.5 text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {hospitals.map((hosp) => (
                  <tr key={hosp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-3 font-bold text-white">{hosp.name}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-emerald-400 font-bold">
                        {hosp.availableBeds} / {hosp.totalBeds}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-blue-400 font-bold">{hosp.icuBeds} Beds</td>
                    <td className="px-3 py-3 text-right text-slate-400 text-[11px]">{hosp.contactPhone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
