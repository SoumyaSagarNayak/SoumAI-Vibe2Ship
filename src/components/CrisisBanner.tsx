import React, { useState, useEffect } from 'react';
import { AlertOctagon, Clock, X, ChevronRight } from 'lucide-react';

interface CrisisTask {
  id: string;
  title: string;
  deadline: string;
  timeRemaining: string;
  minutesRemaining: number;
  emergencyPlan: { time: string; activity: string }[];
}

interface CrisisBannerProps {
  tasks: Array<{
    id: string;
    title: string;
    deadline: string | null;
    status: string;
    priority: string;
    subtasks?: Array<{ title: string; durationMinutes: number; completed: boolean }>;
  }>;
}

/** Formats the time remaining until a deadline as a human-readable string. */
function formatTimeRemaining(deadline: string): { text: string; minutes: number } {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  if (diffMs <= 0) return { text: 'Overdue', minutes: 0 };
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return {
    text: hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`,
    minutes: diffMins
  };
}

/** Generates a micro emergency plan from a task's subtasks or estimated effort. */
function buildEmergencyPlan(task: CrisisBannerProps['tasks'][0]): { time: string; activity: string }[] {
  const now = new Date();
  const plan: { time: string; activity: string }[] = [];

  if (task.subtasks && task.subtasks.filter(s => !s.completed).length > 0) {
    // Use remaining subtasks
    let currentTime = new Date(now);
    task.subtasks
      .filter(s => !s.completed)
      .slice(0, 4)
      .forEach(st => {
        const startStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(currentTime.getTime() + st.durationMinutes * 60000);
        const endStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        plan.push({ time: `${startStr}–${endStr}`, activity: st.title });
        currentTime = endTime;
      });
  } else {
    // Generic plan
    const startStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mid = new Date(now.getTime() + 30 * 60000);
    const midStr = mid.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = new Date(now.getTime() + 55 * 60000);
    const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    plan.push(
      { time: `${startStr}–${midStr}`, activity: `Core work on "${task.title}"` },
      { time: `${midStr}–${endStr}`, activity: 'Final review & wrap-up' }
    );
  }
  return plan;
}

export default function CrisisBanner({ tasks }: CrisisBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);

  // Re-calculate every minute to update countdowns
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Identify tasks with deadlines < 2 hours away that are not completed or dismissed
  const crisisTasks: CrisisTask[] = tasks
    .filter(t => {
      if (t.status === 'completed' || !t.deadline) return false;
      if (dismissed.has(t.id)) return false;
      const { minutes } = formatTimeRemaining(t.deadline);
      return minutes > 0 && minutes <= 120;
    })
    .map(t => {
      const { text, minutes } = formatTimeRemaining(t.deadline!);
      return {
        id: t.id,
        title: t.title,
        deadline: t.deadline!,
        timeRemaining: text,
        minutesRemaining: minutes,
        emergencyPlan: buildEmergencyPlan(t)
      };
    });

  if (crisisTasks.length === 0) return null;

  return (
    <div className="space-y-3">
      {crisisTasks.map(crisis => (
        <div
          key={crisis.id}
          className="relative border border-m-red bg-m-red/10 p-4 animate-pulse-border"
          style={{ boxShadow: '0 0 16px rgba(220,38,38,0.25)' }}
        >
          {/* Animated top red stripe */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-m-red" />

          <div className="flex flex-col md:flex-row gap-4">
            {/* Left: Icon + Crisis label */}
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-m-red/20 border border-m-red shrink-0 mt-0.5">
                <AlertOctagon className="w-5 h-5 text-m-red" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[2px] text-m-red">
                    🚨 Deadline Crisis
                  </span>
                </div>
                <p className="text-sm font-bold text-ink">{crisis.title}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-m-red uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  Time Remaining: {crisis.timeRemaining}
                </div>
              </div>
            </div>

            {/* Right: Emergency Plan */}
            <div className="flex-1 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-m-red pb-1 border-b border-m-red/30">
                Emergency Plan
              </p>
              {crisis.emergencyPlan.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-m-red shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-bold text-m-red uppercase tracking-wider block">{step.time}</span>
                    <span className="text-xs text-ink">{step.activity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(prev => new Set([...prev, crisis.id]))}
            className="absolute top-3 right-3 p-1 border border-m-red/40 bg-transparent hover:bg-m-red/20 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-m-red" />
          </button>
        </div>
      ))}
    </div>
  );
}
