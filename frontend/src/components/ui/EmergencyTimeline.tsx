import React from 'react';
import { CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';
import { EmergencyStatus } from '../../types';

interface Step {
  key: EmergencyStatus | string;
  label: string;
  desc: string;
}

const TIMELINE_STEPS: Step[] = [
  { key: 'SOS_TRIGGERED', label: 'SOS Alert Triggered', desc: 'Patient GPS location sent to dispatcher' },
  { key: 'AMBULANCE_ASSIGNED', label: 'Ambulance Unit Assigned', desc: 'Nearest ICU unit locked to target' },
  { key: 'EN_ROUTE_TO_PATIENT', label: 'Dispatch Unit En Route', desc: 'Green corridor signals initializing' },
  { key: 'PATIENT_PICKED_UP', label: 'Patient Picked Up', desc: 'Medical stabilization in progress' },
  { key: 'EN_ROUTE_TO_HOSPITAL', label: 'Hospital Transit Active', desc: 'Trauma team notified & ready' },
  { key: 'PATIENT_ARRIVED', label: 'Patient Arrived', desc: 'Transferred to ER / Trauma Bay' },
];

const getStepOrderIndex = (status?: string): number => {
  if (!status) return 0;
  switch (status) {
    case 'SOS_TRIGGERED':
    case 'LOCATION_DETECTED':
      return 0;
    case 'AMBULANCE_SEARCHING':
    case 'AMBULANCE_ASSIGNED':
    case 'AMBULANCE_ACCEPTED':
      return 1;
    case 'EN_ROUTE_TO_PATIENT':
      return 2;
    case 'PATIENT_PICKED_UP':
      return 3;
    case 'EN_ROUTE_TO_HOSPITAL':
    case 'HOSPITAL_READY':
      return 4;
    case 'PATIENT_ARRIVED':
    case 'EMERGENCY_COMPLETED':
      return 5;
    default:
      return 0;
  }
};

interface EmergencyTimelineProps {
  currentStatus?: string;
  compact?: boolean;
}

export const EmergencyTimeline: React.FC<EmergencyTimelineProps> = ({ currentStatus, compact = false }) => {
  const activeIndex = getStepOrderIndex(currentStatus);

  return (
    <div className={`w-full ${compact ? 'py-2' : 'py-4'}`}>
      <div className="flex items-center justify-between relative">
        {/* Track Line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 -z-0" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-red-500 via-rose-500 to-emerald-500 transition-all duration-500 -z-0"
          style={{ width: `${(activeIndex / (TIMELINE_STEPS.length - 1)) * 100}%` }}
        />

        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isPending = idx > activeIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 group">
              {/* Step Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-950/80 shadow-lg shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-red-600 text-white ring-4 ring-red-950/90 shadow-xl shadow-red-600/40 animate-pulse'
                    : 'bg-slate-900 border border-slate-700 text-slate-500'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  idx + 1
                )}
              </div>

              {/* Step Label */}
              <div className="text-center mt-2 max-w-[90px] sm:max-w-[120px]">
                <div
                  className={`text-[11px] font-bold leading-tight ${
                    isDone
                      ? 'text-emerald-400'
                      : isCurrent
                      ? 'text-red-400'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </div>
                {!compact && (
                  <div className="text-[10px] text-slate-500 hidden md:block mt-0.5 truncate font-mono">
                    {step.desc}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
