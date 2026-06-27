import React from 'react';
import { Brain, Clock, TrendingUp, Star, AlertCircle, Loader2 } from 'lucide-react';
import type { UserMemory } from '../services/api';

interface ProductivityMemoryCardProps {
  memory: UserMemory | null;
  loading?: boolean;
}

export default function ProductivityMemoryCard({ memory, loading }: ProductivityMemoryCardProps) {
  if (loading) {
    return (
      <div className="glass-panel p-6 border-hairline flex items-center justify-center gap-3 min-h-[180px]">
        <Loader2 className="w-5 h-5 text-ink animate-spin" />
        <span className="text-[10px] text-muted font-bold uppercase tracking-widest animate-pulse">
          Loading Cognitive Profile...
        </span>
      </div>
    );
  }

  // Show a placeholder if no memory data yet
  const mem: UserMemory = memory ?? {
    preferredStudyTime: 'Not enough data',
    averageCompletionRate: 0,
    productiveHours: [],
    procrastinationPattern: 'Complete tasks to reveal your patterns.',
    strongestCategory: '—',
    weakestCategory: '—',
    averageTaskDuration: 0,
    streakHistory: []
  };

  const rows = [
    { label: 'Best Work Time', value: mem.preferredStudyTime, icon: Clock },
    { label: 'Avg Completion Rate', value: `${mem.averageCompletionRate}%`, icon: TrendingUp },
    { label: 'Avg Task Duration', value: mem.averageTaskDuration > 0 ? `${mem.averageTaskDuration} min` : '—', icon: Clock },
    { label: 'Strongest Category', value: mem.strongestCategory, icon: Star },
    { label: 'Weakest Category', value: mem.weakestCategory, icon: AlertCircle },
  ];

  return (
    <div className="glass-panel p-6 border-hairline space-y-5 relative">
      <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-hairline pb-3">
        <Brain className="w-4.5 h-4.5 text-ink" />
        <h3 className="text-muted text-[9px] font-bold uppercase tracking-widest">
          Memory Intelligence: Cognitive Profile
        </h3>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-3 bg-surface-soft border border-hairline space-y-1">
            <div className="flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-muted" />
              <span className="text-[8px] font-bold text-muted uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-sm font-bold text-ink block">{value}</span>
          </div>
        ))}
      </div>

      {/* Procrastination Pattern */}
      <div className="p-3 bg-surface-soft border border-hairline space-y-1">
        <span className="text-[8px] font-bold text-muted uppercase tracking-wider block">Procrastination Pattern</span>
        <p className="text-xs text-body leading-relaxed">{mem.procrastinationPattern}</p>
      </div>

      {/* Productive hours */}
      {mem.productiveHours.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Peak Productive Hours</span>
          <div className="flex flex-wrap gap-2">
            {mem.productiveHours.map((h, i) => (
              <span
                key={i}
                className="text-[10px] font-bold text-ink border border-hairline px-3 py-1 bg-surface-soft uppercase tracking-wider"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Streak history sparkline */}
      {mem.streakHistory.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Streak History</span>
          <div className="flex items-end gap-1 h-10">
            {mem.streakHistory.map((val, i) => {
              const max = Math.max(...mem.streakHistory, 1);
              const pct = (val / max) * 100;
              return (
                <div
                  key={i}
                  title={`${val} day streak`}
                  className="flex-1 bg-ink rounded-none transition-all duration-200"
                  style={{ height: `${Math.max(pct, 8)}%` }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
