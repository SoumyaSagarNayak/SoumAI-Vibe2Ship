import { useState, useEffect } from 'react';
import { RefreshCw, Timer, Zap, Clock, Activity, Flame } from 'lucide-react';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import FocusTimer from '../components/FocusTimer';
import type { FocusScheduleResponse } from '../services/api';

export default function FocusSession() {
  const { 
    tasks, 
    focusStats, 
    loading, 
    refreshWorkspace,
    setFocusStats
  } = useWorkspace();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [focusSchedule, setFocusSchedule] = useState<FocusScheduleResponse | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const pendingTasks = tasks.filter(t => t.status !== 'completed' && !t.isRecurring);

  // Load schedule for all pending tasks or select taskId
  const loadSchedule = async (taskId?: string) => {
    setScheduleLoading(true);
    setLocalError('');
    try {
      const sched = await api.getFocusSchedule(taskId);
      setFocusSchedule(sched);
    } catch (e) {
      console.error('Error loading task schedule:', e);
      setLocalError('Failed to load focus sessions.');
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadSchedule();
    }
  }, [loading]);

  // Re-generate schedule when a specific task is selected
  const handleTaskSelect = async (taskId: string) => {
    setSelectedTaskId(taskId);
    loadSchedule(taskId || undefined);
  };

  // Called when a Pomodoro session completes
  const handleSessionComplete = async (_durationMinutes: number) => {
    try {
      const updated = await api.getFocusStats();
      setFocusStats(updated);
      await refreshWorkspace(true); // background sync
    } catch (e) {
      console.error('Error refreshing stats:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[85vh] gap-4 bg-canvas">
        <RefreshCw className="w-6 h-6 text-ink animate-spin" />
        <p className="text-muted text-[10px] font-bold tracking-[1.5px] uppercase animate-pulse">
          Initializing Focus Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto bg-canvas h-screen">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline pb-5 relative">
        <div className="absolute bottom-[-1.5px] left-0 w-24 h-[3px] m-stripe" />
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-wider uppercase">Focus Session Engine</h1>
          <p className="text-muted text-xs mt-1">Pomodoro-powered deep work mode. 50 minutes of focus, 10 minutes of rest.</p>
        </div>
        <button
          onClick={() => refreshWorkspace()}
          className="bmw-btn-secondary py-2 px-4 self-start text-[10px]"
        >
          <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
          Refresh
        </button>
      </div>

      {(localError) && (
        <div className="p-3.5 border border-m-red/30 bg-m-red/5 text-m-red text-xs font-bold uppercase tracking-wider">
          {localError}
        </div>
      )}

      {/* Focus Stats Bar */}
      {focusStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Focus', value: `${Math.round((focusStats.totalFocusMinutes || 0) / 60 * 10) / 10}h`, icon: Clock },
            { label: 'Deep Work', value: `${focusStats.deepWorkHours || 0}h`, icon: Zap },
            { label: 'Sessions', value: String(focusStats.sessionsCompleted || 0), icon: Activity },
            { label: 'Daily Streak', value: `${focusStats.dailyFocusStreak || 0}d`, icon: Flame },
            { label: 'Weekly Streak', value: `${focusStats.weeklyFocusStreak || 0}w`, icon: Timer },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass-panel p-4 border-hairline flex items-center justify-between">
              <div>
                <span className="text-[9px] text-muted font-bold uppercase tracking-widest block">{label}</span>
                <span className="text-xl font-bold text-ink mt-1 block">{value}</span>
              </div>
              <Icon className="w-5 h-5 text-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Task Selector + Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Task Selection + Pomodoro sessions */}
        <div className="lg:col-span-5 space-y-5">

          {/* Task Selector */}
          <div className="glass-panel p-6 border-hairline space-y-4 relative">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
            <h3 className="text-[9px] font-bold text-muted uppercase tracking-widest border-b border-hairline pb-3">
              Select Task to Focus On
            </h3>

            <select
              value={selectedTaskId}
              onChange={e => handleTaskSelect(e.target.value)}
              className="w-full bmw-input text-xs"
            >
              <option value="">All Pending Tasks (Auto-Schedule)</option>
              {pendingTasks.map(t => (
                <option key={t.id} value={t.id}>
                  [{t.priority}] {t.title}
                </option>
              ))}
            </select>

            {pendingTasks.length === 0 && (
              <p className="text-xs text-muted italic">No pending tasks. Add tasks in Task Manager first.</p>
            )}
          </div>

          {/* Pomodoro Sessions List */}
          {scheduleLoading ? (
            <div className="glass-panel p-6 border-hairline flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-ink animate-spin" />
              <span className="text-[10px] text-muted uppercase tracking-wider animate-pulse">Generating schedule...</span>
            </div>
          ) : focusSchedule && focusSchedule.pomodoroSessions.length > 0 ? (
            <div className="glass-panel p-6 border-hairline space-y-3 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
              <h3 className="text-[9px] font-bold text-muted uppercase tracking-widest border-b border-hairline pb-3">
                Planned Pomodoro Blocks
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {focusSchedule.pomodoroSessions.map((session, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-soft border border-hairline flex items-start gap-3"
                  >
                    <div className="p-1.5 bg-canvas border border-hairline shrink-0">
                      <Timer className="w-3.5 h-3.5 text-ink" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">
                        Session {session.sessionNumber} · {session.timeSlot}
                      </span>
                      <span className="text-xs font-bold text-ink">{session.activity}</span>
                      <span className="text-[9px] text-muted block mt-0.5">
                        {session.workMinutes}m work · {session.breakMinutes}m break
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {focusSchedule.rearrangementSuggestion && (
                <p className="text-[10px] text-muted italic border-t border-hairline pt-3">
                  💡 {focusSchedule.rearrangementSuggestion}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Right Column: Timer */}
        <div className="lg:col-span-7">
          <FocusTimer
            sessions={focusSchedule?.pomodoroSessions ?? []}
            onSessionComplete={handleSessionComplete}
          />
        </div>
      </div>

    </div>
  );
}
