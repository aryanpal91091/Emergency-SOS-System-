import React, { useState } from 'react';
import { CommandHeader } from './components/layout/CommandHeader';
import { SidebarNav, TabKey } from './components/layout/SidebarNav';
import { SimulationBar } from './components/SimulationBar';
import { OverviewPage } from './pages/OverviewPage';
import { CitizenApp } from './pages/CitizenApp';
import { DriverApp } from './pages/DriverApp';
import { PoliceDashboard } from './pages/PoliceDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ShieldAlert, Navigation, Radio, Hospital, ShieldCheck, LayoutDashboard, Activity, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Banner - Product Value */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-extrabold text-[10px] uppercase font-mono px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
              <Zap className="w-3 h-3" /> EMERGENCY PROTOCOL ACTIVE
            </span>
            <span className="text-slate-300 font-medium text-[11px]">
              Automated Ambulance Dispatch & Traffic Green Corridor Coordination Platform
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Socket Relay Engine
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Controls */}
      <SimulationBar />

      {/* Global Command Header */}
      <CommandHeader />

      {/* Main App Layout with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 lg:pb-0">
        <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-full">
          {activeTab === 'overview' && <OverviewPage onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'citizen' && <CitizenApp />}
          {activeTab === 'driver' && <DriverApp />}
          {activeTab === 'police' && <PoliceDashboard />}
          {activeTab === 'hospital' && <HospitalDashboard />}
          {activeTab === 'admin' && <AdminDashboard />}
        </main>
      </div>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 text-center text-xs text-slate-500 hidden lg:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 font-mono text-[11px]">
          <span>ResQRoute • Emergency Command & Tactical Response Platform</span>
          <span className="text-slate-400">Backend Connected: http://localhost:5000</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
