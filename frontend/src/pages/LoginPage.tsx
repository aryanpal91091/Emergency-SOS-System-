import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Zap,
  Activity,
  CheckCircle2,
  Navigation,
  Radio,
  Hospital,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface LoginPageProps {
  onSuccessRedirect?: (role: Role) => void;
}

const DEMO_ACCOUNTS: { label: string; email: string; role: Role; icon: any; color: string; desc: string }[] = [
  {
    label: 'Citizen SOS',
    email: 'citizen@resqroute.org',
    role: 'CITIZEN',
    icon: ShieldAlert,
    color: 'border-red-500/40 text-red-400 bg-red-950/40 hover:border-red-500',
    desc: '1-Tap SOS Emergency Dispatch',
  },
  {
    label: 'Ambulance Driver',
    email: 'driver1@resqroute.org',
    role: 'DRIVER',
    icon: Navigation,
    color: 'border-blue-500/40 text-blue-400 bg-blue-950/40 hover:border-blue-500',
    desc: 'AMB-101 ICU Navigation & Status',
  },
  {
    label: 'Traffic Police',
    email: 'police@resqroute.org',
    role: 'POLICE',
    icon: Radio,
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40 hover:border-emerald-500',
    desc: 'Green Corridor Signal Overrides',
  },
  {
    label: 'Hospital Triage',
    email: 'hospital@resqroute.org',
    role: 'HOSPITAL',
    icon: Hospital,
    color: 'border-sky-500/40 text-sky-400 bg-sky-950/40 hover:border-sky-500',
    desc: 'Trauma Bay Readiness & Bed Matrix',
  },
  {
    label: 'Fleet Admin',
    email: 'admin@resqroute.org',
    role: 'ADMIN',
    icon: ShieldCheck,
    color: 'border-purple-500/40 text-purple-400 bg-purple-950/40 hover:border-purple-500',
    desc: 'Network Telemetry & Operations',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessRedirect }) => {
  const { login, register, error, clearError } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('citizen@resqroute.org');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('CITIZEN');

  const handleDemoSelect = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword('password123');
    setRole(account.role);
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const user = await login(email.trim(), password);
        if (onSuccessRedirect) {
          onSuccessRedirect(user.role);
        }
      } else {
        if (!name || !phone) {
          setLocalError('Full name and phone number are required for registration.');
          setLoading(false);
          return;
        }
        const user = await register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role,
        });
        if (onSuccessRedirect) {
          onSuccessRedirect(user.role);
        }
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-red-500 selection:text-white bg-radar-grid">
      {/* Top Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-600 via-rose-600 to-red-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-950/60 border border-red-400/40 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">ResQRoute</span>
                <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-500/40">
                  COMMAND PLATFORM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Automated Ambulance Dispatch & Traffic Green Corridor Coordination
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-emerald-400 font-bold hidden sm:inline">BACKEND ONLINE:</span>
            <span className="text-slate-300 truncate max-w-[170px] sm:max-w-none">Render Production API</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Product Value & Fast Demo Role Login */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-red-950/80 text-red-400 border border-red-500/40 px-3 py-1 rounded-full text-xs font-mono font-bold">
                <Zap className="w-3.5 h-3.5" /> SECURE EMERGENCY DISPATCH PORTAL
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Emergency Response <br />
                <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                  Access Authorization
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Log in with your credential to access the tactical emergency dashboard, live GPS fleet tracking, automated green corridor controls, and trauma bay triage telemetry.
              </p>
            </div>

            {/* Quick Demo Credentials Panel */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Demo Quick-Select Accounts:
                </span>
                <span className="text-[10px] font-mono text-slate-500">1-Click Autofill</span>
              </div>

              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon;
                  const isSelected = email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleDemoSelect(acc)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? `${acc.color} ring-2 ring-red-500/50 shadow-md`
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white leading-tight flex items-center gap-2">
                            <span>{acc.label}</span>
                            <span className="text-[9px] font-mono opacity-80 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700">
                              {acc.role}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            {acc.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {isSelected ? '✓ SELECTED' : 'USE'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[10px] font-mono text-slate-500 text-center pt-1">
                Default Password for all seeded demo accounts: <span className="text-slate-300 font-bold">password123</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In / Register Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Card Accent Top Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

              {/* Mode Toggle Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setLocalError(null);
                    clearError();
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setLocalError(null);
                    clearError();
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  REGISTER
                </button>
              </div>

              {/* Error Notice */}
              {displayError && (
                <div className="bg-red-950/90 border border-red-500/50 p-3.5 rounded-xl text-red-200 text-xs font-mono flex items-start gap-2.5 shadow-lg animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{displayError}</span>
                </div>
              )}

              {/* Sign In / Sign Up Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold uppercase text-slate-300">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Officer Sarah Connor"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60 font-mono transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold uppercase text-slate-300">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 019-2834"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60 font-mono transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold uppercase text-slate-300">
                        Access Role
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500/60 font-mono"
                      >
                        <option value="CITIZEN">Citizen (Emergency SOS)</option>
                        <option value="DRIVER">Ambulance Driver</option>
                        <option value="POLICE">Traffic Police Officer</option>
                        <option value="HOSPITAL">Hospital Trauma Triage</option>
                        <option value="ADMIN">System Administrator</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-slate-300">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@resqroute.org"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60 font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase text-slate-300">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <span className="text-[10px] font-mono text-slate-500">
                        Demo: <span className="text-slate-300 font-bold">password123</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60 font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold font-mono py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 border border-red-400/40 active:scale-95 transition-all disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>AUTHENTICATING SECURE TOKEN...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'ENTER MISSION CONTROL' : 'CREATE PROTOCOL ACCOUNT'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-[11px] font-mono text-slate-500 text-center border-t border-slate-800 pt-4">
                Encrypted JWT Session Authorization • 256-bit AES Protocol
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 text-center text-xs text-slate-500 font-mono text-[11px]">
        ResQRoute • Production Emergency Response Network • Authenticated Access Required
      </footer>
    </div>
  );
};
