import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, Radio, CheckCircle2, ShieldCheck, Activity, Zap } from 'lucide-react';
import { simulationApi } from '../services/api';

interface SimulationBarProps {
  onSimulationStarted?: (data: any) => void;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({ onSimulationStarted }) => {
  const [loading, setLoading] = useState(false);
  const [simStatus, setSimStatus] = useState<string | null>(null);

  const handleTriggerAccident = async () => {
    try {
      setLoading(true);
      setSimStatus('Initiating Simulated Accident at Connaught Circle...');
      const response = await simulationApi.triggerAccident({
        patientName: 'Alex Mercer (Simulated Patient)',
        emergencyType: 'ACCIDENT',
        priority: 'CRITICAL',
        address: 'Connaught Central Circus Intersection',
        latitude: 28.6175,
        longitude: 77.213,
      });

      if (response.data?.success) {
        setSimStatus('🚨 SOS Triggered! Ambulance AMB-101 Dispatched & Green Corridor Active');
        if (onSimulationStarted) onSimulationStarted(response.data);
      }
    } catch (error: any) {
      console.error('Simulation error:', error);
      setSimStatus(error.message || 'Failed to trigger simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      setSimStatus('Resetting system simulation states...');
      await simulationApi.reset();
      setSimStatus('Simulation Reset Complete');
      setTimeout(() => setSimStatus(null), 3000);
    } catch (error: any) {
      console.error('Reset error:', error);
      setSimStatus('Reset failed: Backend offline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-b border-red-500/30 px-4 py-2.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-200">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="font-bold tracking-wider uppercase text-red-400 flex items-center gap-1.5 font-mono text-[11px]">
            <Activity className="w-3.5 h-3.5" /> Interactive Demo Simulator:
          </span>
          <span className="text-slate-400 hidden lg:inline text-[11px]">
            One-Click End-to-End Emergency & Green Corridor Dispatch Controller
          </span>
        </div>

        {simStatus && (
          <div className="bg-red-950/90 border border-red-500/50 text-red-300 px-3 py-1 rounded-full font-mono text-[11px] animate-pulse shadow-md">
            {simStatus}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTriggerAccident}
            disabled={loading}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-lg shadow-red-950/50 transition-all active:scale-95 disabled:opacity-50 font-mono text-xs border border-red-400/30"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Accident & SOS</span>
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 font-mono text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
