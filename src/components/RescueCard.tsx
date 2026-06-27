import React from 'react';
import { ShieldAlert, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { RescueData } from '../services/api';

interface RescueCardProps {
  data: RescueData | null;
  loading?: boolean;
}

/** Maps stress level string to a color class. */
function stressColor(level: string): string {
  switch (level) {
    case 'High': return 'text-m-red';
    case 'Medium': return 'text-warning';
    default: return 'text-success';
  }
}

/** Maps stress level to a bar width percentage. */
function stressBarWidth(level: string): number {
  switch (level) {
    case 'High': return 85;
    case 'Medium': return 50;
    default: return 20;
  }
}

export default function RescueCard({ data, loading }: RescueCardProps) {
  if (loading) {
    return (
      <div className="glass-panel p-6 border-hairline flex items-center justify-center gap-3 min-h-[160px]">
        <Loader2 className="w-5 h-5 text-ink animate-spin" />
        <span className="text-[10px] text-muted font-bold uppercase tracking-widest animate-pulse">
          Running Rescue Analysis...
        </span>
      </div>
    );
  }

  if (!data) return null;

  const sColor = stressColor(data.stressLevel);
  const sWidth = stressBarWidth(data.stressLevel);

  return (
    <div className="glass-panel p-6 border-hairline space-y-5 relative">
      {/* Top stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-hairline">
        <h3 className="text-muted text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 pt-1">
          <ShieldAlert className="w-4 h-4 text-ink" />
          Rescue Agent: Stress Assessment
        </h3>
        {data.crisisMode && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-m-red border border-m-red/40 px-2 py-0.5 animate-pulse">
            CRISIS MODE ACTIVE
          </span>
        )}
      </div>

      {/* Stress Level + Recovery Probability */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-surface-soft border border-hairline space-y-2">
          <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Stress Level</span>
          <span className={`text-2xl font-bold block ${sColor}`}>{data.stressLevel}</span>
          <div className="w-full h-1 bg-canvas border border-hairline overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                data.stressLevel === 'High' ? 'bg-m-red' : data.stressLevel === 'Medium' ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${sWidth}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-surface-soft border border-hairline space-y-2">
          <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Recovery Probability</span>
          <span className="text-2xl font-bold text-ink block">{data.recoveryProbability}%</span>
          <div className="w-full h-1 bg-canvas border border-hairline overflow-hidden">
            <div
              className="h-full bg-ink transition-all duration-500"
              style={{ width: `${data.recoveryProbability}%` }}
            />
          </div>
        </div>
      </div>

      {/* Imminent tasks warning */}
      {data.imminentTasks && data.imminentTasks.length > 0 && (
        <div className="flex items-start gap-2 p-3 border border-m-red/30 bg-m-red/5">
          <AlertTriangle className="w-4 h-4 text-m-red shrink-0 mt-0.5" />
          <div>
            <span className="text-[9px] font-bold text-m-red uppercase tracking-wider block">Imminent Deadlines</span>
            {data.imminentTasks.map((t, i) => (
              <span key={i} className="text-xs text-ink block">• {t.title}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-ink" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Agent Rescue Plan</span>
        </div>
        <ul className="space-y-2">
          {data.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <div className="p-0.5 bg-canvas border border-hairline mt-0.5 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-ink" />
              </div>
              <span className="text-xs text-body">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
