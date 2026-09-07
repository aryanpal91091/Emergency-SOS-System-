import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { CommandHeader } from './components/layout/CommandHeader';
import { SidebarNav, TabKey } from './components/layout/SidebarNav';
import { SimulationBar } from './components/SimulationBar';
import { OverviewPage } from './pages/OverviewPage';
import { CitizenApp } from './pages/CitizenApp';
import { DriverApp } from './pages/DriverApp';
import { PoliceDashboard } from './pages/PoliceDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ShieldAlert, Activity, Zap, Loader2 } from 'lucide-react';
import { Role } from './types';

const getRoleDefaultTab = (role?: Role): TabKey => {
  switch (role) {
    case 'CITIZEN':
      return 'citizen';
    case 'DRIVER':
      return 'driver';
    case 'POLICE':
      return 'police';
    case 'HOSPITAL':
      return 'hospital';
    case 'ADMIN':
    default:
      return 'overview';
  }
};

const getInitialTab = (role?: Role): TabKey => {
  const hash = window.location.hash.replace(/^#/, '');
  const validTabs: TabKey[] = ['overview', 'citizen', 'driver', 'police', 'hospital', 'admin'];
  if (validTabs.includes(hash as TabKey)) {
    return hash as TabKey;
  }
  return getRoleDefaultTab(role);
};

const AppContent: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // When user signs in or restores session, establish appropriate tab
  useEffect(() => {
    if (user) {
      const initialTab = getInitialTab(user.role);
      setActiveTab(initialTab);
      window.location.hash = initialTab;
    }
  }, [user?.id]);

  // Sync tab changes to URL hash for browser back/forward and direct links
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const handleLoginSuccess = (role: Role) => {
    const targetTab = getRoleDefaultTab(role);
    setActiveTab(targetTab);
    window.location.hash = targetTab;
  };

  // 1. Loading State (Fast validation)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 space-y-4 font-mono">
        <div className="w-14 h-14 bg-gradient-to-br from-red-600 via-rose-600 to-red-800 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-red-950 border border-red-400/50">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
          <span>Verifying ResQRoute Authentication...</span>
        </div>
        <span className="text-[11px] text-slate-500">Connecting to secure dispatch engine</span>
      </div>
    );
  }

  // 2. Unauthenticated State -> Render Sign In / Register Page
  if (!token || !user) {
    return <LoginPage onSuccessRedirect={handleLoginSuccess} />;
  }

  // 3. Authenticated State -> Render Full Protected Platform Shell
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

      {/* Global Command Header with User & Sign Out */}
      <CommandHeader />

      {/* Main App Layout with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 lg:pb-0">
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-full">
          {activeTab === 'overview' && <OverviewPage onNavigate={(tab) => handleTabChange(tab)} />}
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
          <span className="text-slate-400">Session Active: {user.email} ({user.role})</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
