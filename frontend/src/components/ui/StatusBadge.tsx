import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', showDot = true }) => {
  let colorClasses = 'bg-slate-900 text-slate-300 border-slate-700/60';
  let dotAnimation = '';

  const uppercaseStatus = (status || '').toUpperCase();

  switch (uppercaseStatus) {
    case 'GREEN_CORRIDOR':
    case 'READY':
    case 'AVAILABLE':
    case 'PATIENT_ARRIVED':
    case 'EMERGENCY_COMPLETED':
      colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-950/50';
      dotAnimation = 'bg-emerald-400 animate-ping';
      break;

    case 'SOS_TRIGGERED':
    case 'CRITICAL':
    case 'ACCIDENT':
    case 'CARDIAC':
    case 'STROKE':
    case 'TRAUMA':
      colorClasses = 'bg-red-950/90 text-red-400 border-red-500/50 shadow-md shadow-red-950/60';
      dotAnimation = 'bg-red-500 animate-ping';
      break;

    case 'PREPARE':
    case 'PENDING':
    case 'PREPARING':
    case 'RESPONDING':
    case 'EN_ROUTE_TO_PATIENT':
    case 'EN_ROUTE_TO_HOSPITAL':
    case 'BUSY':
      colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-950/50';
      dotAnimation = 'bg-amber-400 animate-pulse';
      break;

    case 'AMBULANCE_ASSIGNED':
    case 'AMBULANCE_ACCEPTED':
    case 'PATIENT_PICKED_UP':
    case 'HOSPITAL_READY':
      colorClasses = 'bg-blue-950/80 text-blue-400 border-blue-500/40 shadow-sm shadow-blue-950/50';
      dotAnimation = 'bg-blue-400';
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5'
      : size === 'md'
      ? 'text-xs px-2.5 py-1'
      : 'text-sm px-3 py-1.5 font-bold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-extrabold rounded-md border uppercase tracking-wider ${sizeClasses} ${colorClasses}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {dotAnimation && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotAnimation}`} />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
};

