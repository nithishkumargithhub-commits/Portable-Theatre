import React from 'react';

export function LoadingSkeleton({ className = '', rounded = 'rounded-xl' }) {
  return (
    <div className={`skeleton ${rounded} ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-5 w-14 rounded-full" />
      </div>
      <LoadingSkeleton className="h-5 w-3/4" />
      <LoadingSkeleton className="h-3 w-full" />
      <LoadingSkeleton className="h-3 w-2/3" />
      <div className="pt-2 border-t border-slate-800/60">
        <LoadingSkeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <LoadingSkeleton className="w-12 h-12 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton className="h-3 w-24" />
        <LoadingSkeleton className="h-6 w-16" />
      </div>
    </div>
  );
}
