import React from 'react';

export const LoadingSkeleton: React.FC<{ count?: number; height?: string }> = ({
  count = 3,
  height = 'h-16',
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full bg-slate-900/60 border border-slate-800 rounded-xl ${height} animate-pulse flex items-center p-4`}
        >
          <div className="w-full space-y-2">
            <div className="h-3 bg-slate-800 rounded w-1/3"></div>
            <div className="h-2.5 bg-slate-850 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
