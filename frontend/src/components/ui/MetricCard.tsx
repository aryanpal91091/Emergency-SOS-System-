import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'danger' | 'success' | 'warning' | 'info' | 'neutral';
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'neutral',
  badge,
}) => {
  let borderClass = 'border-slate-800/80';
  let iconBgClass = 'bg-slate-800/80 text-slate-300 border-slate-700';
  let valueColorClass = 'text-slate-100';
  let glowBg = 'hover:border-slate-700';

  switch (variant) {
    case 'danger':
      borderClass = 'border-red-500/30';
      iconBgClass = 'bg-red-950/90 text-red-400 border-red-500/40 shadow-sm shadow-red-950/50';
      valueColorClass = 'text-red-400';
      glowBg = 'hover:border-red-500/50 hover:shadow-lg hover:shadow-red-950/30';
      break;

    case 'success':
      borderClass = 'border-emerald-500/30';
      iconBgClass = 'bg-emerald-950/90 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-950/50';
      valueColorClass = 'text-emerald-400';
      glowBg = 'hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/30';
      break;

    case 'warning':
      borderClass = 'border-amber-500/30';
      iconBgClass = 'bg-amber-950/90 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-950/50';
      valueColorClass = 'text-amber-400';
      glowBg = 'hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-950/30';
      break;

    case 'info':
      borderClass = 'border-blue-500/30';
      iconBgClass = 'bg-blue-950/90 text-blue-400 border-blue-500/40 shadow-sm shadow-blue-950/50';
      valueColorClass = 'text-blue-400';
      glowBg = 'hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-950/30';
      break;
  }

  return (
    <div
      className={`glass-card p-4 rounded-xl border ${borderClass} ${glowBg} shadow-xl flex flex-col justify-between space-y-3 transition-all duration-200 group`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-105 ${iconBgClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <div className={`text-2xl lg:text-3xl font-black font-mono tracking-tight ${valueColorClass}`}>
            {value}
          </div>
          {badge && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-[11px] text-slate-400 mt-1 font-medium leading-normal">{subtitle}</p>}
      </div>
    </div>
  );
};
