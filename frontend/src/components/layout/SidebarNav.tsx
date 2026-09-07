import React from 'react';
import { ShieldAlert, Navigation, Radio, Hospital, ShieldCheck, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type TabKey = 'overview' | 'citizen' | 'driver' | 'police' | 'hospital' | 'admin';

interface SidebarNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const navItems: { id: TabKey; label: string; icon: any; category: string; desc: string }[] = [
  { id: 'overview', label: 'Mission Control', icon: LayoutDashboard, category: 'COMMAND', desc: 'System Live Operational Map' },
  { id: 'citizen', label: 'Citizen SOS', icon: ShieldAlert, category: 'EMERGENCY', desc: '1-Tap Emergency Trigger' },
  { id: 'driver', label: 'Ambulance Unit', icon: Navigation, category: 'DISPATCH', desc: 'Driver Dispatch & Navigation' },
  { id: 'police', label: 'Traffic Control', icon: Radio, category: 'CORRIDOR', desc: 'Green Corridor Overrides' },
  { id: 'hospital', label: 'Hospital Triage', icon: Hospital, category: 'TRIAGE', desc: 'Trauma Bay Readiness' },
  { id: 'admin', label: 'Fleet Analytics', icon: ShieldCheck, category: 'FLEET', desc: 'Network Metrics & Registry' },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* DESKTOP LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/80 backdrop-blur-md border-r border-slate-800/80 p-4 space-y-6 shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 px-3">
            COMMAND MODULES
          </span>
          <div className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-950/60 border border-red-400/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <div className="leading-tight">{item.label}</div>
                      <div className={`text-[10px] font-normal leading-tight mt-0.5 ${isActive ? 'text-red-100' : 'text-slate-500'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-black/30 text-white' : 'bg-slate-950 text-slate-500 border border-slate-800'
                  }`}>
                    {item.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Session & Logout Panel in Desktop Sidebar */}
        <div className="mt-auto space-y-3 font-mono">
          {user && (
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[130px]">{user.name}</span>
                <span className="text-[9px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-500/30">
                  {user.role}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              <button
                onClick={logout}
                className="w-full mt-1 bg-slate-900 hover:bg-red-950/80 hover:text-red-400 text-slate-400 border border-slate-800 hover:border-red-500/40 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
            <span>ResQRoute Engine</span>
            <span className="text-emerald-400 font-bold">LIVE</span>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-1.5 shadow-2xl">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
                  isActive ? 'text-red-400 bg-red-950/70 border border-red-500/40 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate max-w-[55px] font-mono text-[9px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
