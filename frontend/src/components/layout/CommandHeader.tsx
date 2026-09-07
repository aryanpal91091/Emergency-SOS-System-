import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Wifi, WifiOff, Radio, RefreshCw, LogOut, User as UserIcon } from 'lucide-react';
import { socket } from '../../services/socket';
import { emergencyApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CommandHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActiveCount();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('emergency:created', () => fetchActiveCount());
    socket.on('emergency:status_changed', () => fetchActiveCount());

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('emergency:created');
      socket.off('emergency:status_changed');
    };
  }, []);

  const fetchActiveCount = async () => {
    try {
      setRefreshing(true);
      const res = await emergencyApi.getActive();
      if (res.data?.success) {
        setActiveCount(res.data.count || (res.data.emergencies ? res.data.emergencies.length : 0));
      }
    } catch (err) {
      console.warn('Header active count fetch notice:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-red-600 via-rose-600 to-red-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-950/60 border border-red-400/40 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-100">ResQRoute</h1>
              <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-500/40 tracking-wider">
                MISSION CONTROL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              Smart Emergency Response & Green Corridor Platform
            </p>
          </div>
        </div>

        {/* Real-time Status Telemetry & User Session */}
        <div className="flex items-center gap-3">
          {/* Active Emergencies Meter */}
          <div className="bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 text-[10px] uppercase font-bold hidden sm:inline">ACTIVE OPERATIONS:</span>
            <span className="text-red-400 font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              {activeCount} {activeCount === 1 ? 'Emergency' : 'Emergencies'}
            </span>
          </div>

          {/* System Connection State */}
          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-mono font-bold transition-all ${
              isConnected
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-950/50'
                : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">SYSTEM ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">RECONNECTING</span>
              </>
            )}
          </div>

          {/* User Profile & Sign Out Action */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight font-mono">{user.name}</span>
                <span className="text-[10px] text-red-400 font-mono font-bold uppercase">{user.role}</span>
              </div>

              <button
                onClick={logout}
                title="Sign Out of Session"
                className="bg-slate-950 hover:bg-red-950/80 hover:text-red-400 text-slate-400 border border-slate-800 hover:border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
