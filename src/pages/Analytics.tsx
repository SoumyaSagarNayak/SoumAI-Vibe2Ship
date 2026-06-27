import React from 'react';
import { 
  BrainCircuit, 
  Lightbulb, 
  TrendingUp, 
  CheckCircle2, 
  RefreshCw,
  Award,
  Timer,
  Zap
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import RescueCard from '../components/RescueCard';
import ProductivityMemoryCard from '../components/ProductivityMemoryCard';

export default function Analytics() {
  const { 
    analytics, 
    rescueData, 
    focusStats, 
    userMemory, 
    loading, 
    error, 
    refreshWorkspace 
  } = useWorkspace();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[85vh] gap-4 bg-canvas">
        <RefreshCw className="w-6 h-6 text-ink animate-spin" />
        <p className="text-muted text-[10px] font-bold tracking-[1.5px] uppercase animate-pulse">Consulting Reflection Logs...</p>
      </div>
    );
  }

  const weeklyData = analytics?.reflection.weeklyTrend || [];
  const maxCompletions = Math.max(...weeklyData.map(d => d.completed), 1);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto bg-canvas h-screen font-light">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline pb-5 relative">
        <div className="absolute bottom-[-1.5px] left-0 w-24 h-[3px] m-stripe" />
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-wider uppercase">Analytics & Reflections</h1>
          <p className="text-muted text-xs mt-1">Review task metrics and receive behavioral recommendations from cognitive agents.</p>
        </div>
        <button 
          onClick={() => refreshWorkspace()}
          className="bmw-btn-secondary py-2 px-4 self-start text-[10px]"
        >
          <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
          Update Reflection
        </button>
      </div>

      {error && (
        <div className="p-3.5 border border-m-red/30 bg-m-red/5 text-m-red text-xs font-bold uppercase tracking-wider">
          {error}
        </div>
      )}

      {/* Grid: Productivity score and stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Productivity score cell */}
        <div className="glass-panel p-6 border-hairline flex flex-col items-center text-center justify-between relative">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
          <h3 className="text-muted text-[9px] font-bold uppercase tracking-widest self-start pt-1">Productivity Rating</h3>
          
          <div className="my-8">
            <span className="text-6xl font-extrabold text-ink leading-none">{analytics?.reflection.productivityScore || 70}</span>
            <span className="text-muted text-xs font-bold tracking-widest block mt-2">SPEC / 100</span>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] text-ink font-bold uppercase tracking-wider">
            <Award className="w-4 h-4 text-ink" />
            <span>Reflection Node: Active State</span>
          </div>
        </div>

        {/* Stats totals */}
        <div className="glass-panel p-6 border-hairline md:col-span-2 space-y-5 relative">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
          <h3 className="text-muted text-[9px] font-bold uppercase tracking-widest pt-1">Workspace Compliance Stats</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-soft border border-hairline">
              <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Completed</span>
              <span className="text-xl font-bold text-ink block mt-1">{analytics?.completedCount || 0}</span>
            </div>
            
            <div className="p-4 bg-surface-soft border border-hairline">
              <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Active Tasks</span>
              <span className="text-xl font-bold text-ink block mt-1">{analytics?.pendingCount || 0}</span>
            </div>

            <div className="p-4 bg-surface-soft border border-hairline">
              <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Missed</span>
              <span className={`text-xl font-bold block mt-1 ${analytics?.missedCount ? 'text-m-red' : 'text-ink'}`}>
                {analytics?.missedCount || 0}
              </span>
            </div>

            <div className="p-4 bg-surface-soft border border-hairline">
              <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Streak</span>
              <span className="text-xl font-bold text-ink block mt-1">{analytics?.streak || 0} Days</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted">
              <span>Overall Success Rate</span>
              <span>{analytics?.successPercentage || 0}%</span>
            </div>
            <div className="w-full h-1 bg-canvas border border-hairline overflow-hidden">
              <div 
                className="h-full bg-ink transition-all duration-300"
                style={{ width: `${analytics?.successPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Weekly completions bar graph */}
      <div className="glass-panel p-6 border-hairline space-y-4 relative">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
        <h3 className="text-muted text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 pt-1">
          <TrendingUp className="w-4 h-4 text-ink" />
          Weekly Completion Velocity
        </h3>

        <div className="h-44 flex items-end justify-between px-4 pt-6 border-b border-hairline">
          {weeklyData.map((d, idx) => {
            const pct = Math.round((d.completed / maxCompletions) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="opacity-0 group-hover:opacity-100 bg-surface-card text-ink border border-hairline text-[9px] font-bold px-2 py-0.5 transition-opacity duration-200 uppercase tracking-wider">
                  {d.completed} Tasks
                </span>
                
                <div 
                  className="w-8 md:w-10 bg-m-blue-dark transition-all duration-200 shadow-none rounded-none"
                  style={{ height: `${pct > 0 ? pct : 4}%` }}
                />
                
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest mt-2">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Insights from Reflection Agent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Insights list */}
        <div className="glass-panel p-6 border-hairline space-y-4">
          <h3 className="text-muted text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-hairline">
            <BrainCircuit className="w-4.5 h-4.5 text-ink" />
            Reflection Agent: Performance Diagnostics
          </h3>

          <ul className="space-y-3.5 text-xs text-body leading-relaxed font-medium uppercase tracking-wide">
            {analytics?.reflection.insights && analytics.reflection.insights.length > 0 ? (
              analytics.reflection.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="p-1 bg-canvas border border-hairline text-ink mt-0.5 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ink" />
                  </div>
                  <span>{insight}</span>
                </li>
              ))
            ) : (
              <p className="italic text-muted text-xs uppercase">Complete tasks to run diagnostics.</p>
            )}
          </ul>
        </div>

        {/* Actionable Suggestions */}
        <div className="glass-panel p-6 border-hairline space-y-4">
          <h3 className="text-muted text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-hairline">
            <Lightbulb className="w-4.5 h-4.5 text-ink" />
            Reflection Agent: Habit Adjustments
          </h3>

          <ul className="space-y-3.5 text-xs text-body leading-relaxed">
            {analytics?.reflection.suggestions && analytics.reflection.suggestions.length > 0 ? (
              analytics.reflection.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="p-1 bg-canvas border border-hairline text-ink mt-0.5 shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 text-ink" />
                  </div>
                  <span>{suggestion}</span>
                </li>
              ))
            ) : (
              <p className="italic text-muted text-xs uppercase">Adjustments will populate alongside diagnostics.</p>
            )}
          </ul>
        </div>

      </div>

      {/* ---- NEW EXTENDED ANALYTICS SECTIONS ---- */}

      {/* Focus Stats Row */}
      {focusStats && (
        <div className="glass-panel p-6 border-hairline space-y-4 relative">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
          <h3 className="text-muted text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 pt-1">
            <Timer className="w-4 h-4 text-ink" />
            Focus Engine: Session Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Focus', value: `${Math.round((focusStats.totalFocusMinutes || 0) / 60 * 10) / 10}h` },
              { label: 'Deep Work', value: `${focusStats.deepWorkHours || 0}h` },
              { label: 'Sessions', value: String(focusStats.sessionsCompleted || 0) },
              { label: 'Daily Streak', value: `${focusStats.dailyFocusStreak || 0} days` },
              { label: 'Weekly Streak', value: `${focusStats.weeklyFocusStreak || 0} weeks` },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 bg-surface-soft border border-hairline">
                <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">{label}</span>
                <span className="text-xl font-bold text-ink block mt-1">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rescue Agent Card + Productivity Memory Card — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RescueCard data={rescueData} loading={loading} />
        <ProductivityMemoryCard memory={userMemory} loading={loading} />
      </div>

    </div>
  );
}
