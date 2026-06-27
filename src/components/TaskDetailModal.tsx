import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  CheckSquare,
  Square,
  Activity
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { getUrgencyColor } from '../utils/urgency';

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, isOpen, onClose }: TaskDetailModalProps) {
  const { tasks, refreshWorkspace } = useWorkspace();
  const [localNotes, setLocalNotes] = useState('');
  const [regeneratingPlan, setRegeneratingPlan] = useState(false);
  const [updating, setUpdating] = useState(false);

  const task = tasks.find(t => t.id === taskId) || null;

  useEffect(() => {
    if (task) {
      setLocalNotes(task.notes || '');
    }
  }, [task, taskId]);

  if (!isOpen || !task) return null;

  const subtasksDone = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const completionPercent = totalSubtasks > 0 
    ? Math.round((subtasksDone / totalSubtasks) * 100) 
    : (task.status === 'completed' ? 100 : 0);

  const taskUrgency = task.urgency || 'normal';
  const uColor = getUrgencyColor(taskUrgency);

  // Check if overdue
  const isOverdue = () => {
    if (task.status === 'completed' || !task.deadline) return false;
    const deadlineDate = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  const handleToggleSubtask = async (subtaskIndex: number) => {
    if (updating) return;
    setUpdating(true);
    try {
      const updatedSubtasks = [...(task.subtasks || [])];
      updatedSubtasks[subtaskIndex].completed = !updatedSubtasks[subtaskIndex].completed;
      await api.updateTask(task.id, { subtasks: updatedSubtasks });
      await refreshWorkspace(true);
    } catch (err) {
      console.error('Error toggling subtask:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await api.updateTask(task.id, { status: newStatus });
      await refreshWorkspace(true);
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleNotesBlur = async () => {
    if (localNotes === (task.notes || '')) return;
    try {
      await api.updateTask(task.id, { notes: localNotes });
      await refreshWorkspace(true);
    } catch (err) {
      console.error('Error updating notes:', err);
    }
  };

  const handleUrgencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (updating) return;
    setUpdating(true);
    try {
      await api.updateTask(task.id, { urgency: e.target.value as any });
      await refreshWorkspace(true);
    } catch (err) {
      console.error('Error updating urgency:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeadlineChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (updating) return;
    setUpdating(true);
    try {
      await api.updateTask(task.id, { deadline: e.target.value || null });
      await refreshWorkspace(true);
    } catch (err) {
      console.error('Error updating deadline:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRegeneratePlan = async () => {
    if (regeneratingPlan) return;
    setRegeneratingPlan(true);
    try {
      await api.regenerateTaskPlan(task.id);
      await refreshWorkspace(true);
    } catch (err) {
      console.error('Error regenerating plan:', err);
    } finally {
      setRegeneratingPlan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto relative p-6 md:p-8 space-y-6">
        {/* Color stripe indicator matching urgency */}
        <div className={`absolute top-0 left-0 right-0 h-[4px] ${uColor.dot}`} />
        
        {/* Header Row */}
        <div className="flex items-start justify-between border-b border-hairline pb-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-surface-soft border border-hairline text-[9px] text-muted font-bold uppercase tracking-wider">
                {task.category}
              </span>
              <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${uColor.badge}`}>
                {uColor.label}
              </span>
              {isOverdue() && (
                <span className="px-2 py-0.5 border border-m-red/30 bg-m-red/5 text-m-red text-[9px] font-bold uppercase tracking-wider glow-pulse">
                  ⚠️ OVERDUE
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-ink mt-2 uppercase tracking-wide">{task.title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 border border-hairline hover:border-ink hover:text-ink text-muted transition-all cursor-pointer rounded-none"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Metadata and Controls */}
          <div className="space-y-4">
            
            {/* Status Checkbox */}
            <div className="flex items-center gap-3 bg-surface-soft p-3 border border-hairline">
              <button 
                onClick={handleToggleStatus}
                className="text-muted hover:text-ink transition-colors cursor-pointer"
                disabled={updating}
              >
                {task.status === 'completed' ? (
                  <CheckSquare className="w-5 h-5 text-ink" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <div>
                <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Status</span>
                <span className={`text-xs font-bold uppercase ${task.status === 'completed' ? 'text-success' : 'text-warning'}`}>
                  {task.status}
                </span>
              </div>
            </div>

            {/* Change Urgency */}
            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Urgency Level</label>
              <select
                value={taskUrgency}
                onChange={handleUrgencyChange}
                className="w-full bmw-input text-xs"
                disabled={updating}
              >
                <option value="critical">🔴 Critical (Red)</option>
                <option value="important">🔵 Important (Blue)</option>
                <option value="medium">🟢 Medium (Green)</option>
                <option value="normal">🟡 Normal (Yellow)</option>
              </select>
            </div>

            {/* Change Deadline */}
            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Deadline Date</label>
              <input
                type="date"
                value={task.deadline || ''}
                onChange={handleDeadlineChange}
                className="w-full bmw-input text-xs text-ink"
                disabled={updating}
              />
            </div>

            {/* Priority Agent Info */}
            <div className="p-3 border border-hairline bg-surface-soft space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-muted uppercase text-[9px] tracking-wide">AI Priority Scorer:</span>
                <span className={`font-bold uppercase tracking-wide text-[10px] ${task.priority === 'High' ? 'text-m-red' : 'text-ink'}`}>
                  {task.priority} (Score: {task.urgencyScore || 0})
                </span>
              </div>
              {task.priorityExplanation && (
                <p className="text-[10px] text-muted leading-relaxed italic">
                  "{task.priorityExplanation}"
                </p>
              )}
            </div>

            {/* Reminder Nudge */}
            {task.reminderNudge && (
              <div className="p-3 border border-hairline bg-surface-soft space-y-1">
                <span className="font-bold text-muted uppercase text-[8px] tracking-widest block">Reminder Agent Alert</span>
                <p className="text-[10px] text-body leading-relaxed">
                  "{task.reminderNudge}"
                </p>
              </div>
            )}

          </div>

          {/* Right Column: Planner, Subtasks, Progress */}
          <div className="space-y-4">
            
            {/* Progress indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted">
                <span>Task Subtask Progress</span>
                <span>{completionPercent}% ({subtasksDone}/{totalSubtasks})</span>
              </div>
              <div className="w-full h-1.5 bg-canvas border border-hairline rounded-none overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${uColor.dot}`}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {/* Planner Subtasks Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-ink font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Planner Subtasks
                </span>
                <button
                  onClick={handleRegeneratePlan}
                  disabled={regeneratingPlan}
                  className="px-2 py-0.5 bg-surface-soft border border-hairline hover:bg-canvas text-[8px] font-bold uppercase tracking-wider text-muted hover:text-ink cursor-pointer flex items-center gap-1"
                >
                  {regeneratingPlan ? (
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-2.5 h-2.5" />
                  )}
                  Regenerate Plan
                </button>
              </div>

              {task.subtasks && task.subtasks.length > 0 ? (
                <div className="space-y-2 max-h-[160px] overflow-y-auto bg-canvas p-3 border border-hairline">
                  {task.subtasks.map((st, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleToggleSubtask(idx)}
                      className="flex items-start gap-3 p-1.5 hover:bg-surface-soft cursor-pointer text-xs"
                    >
                      <button className="text-muted hover:text-ink transition-colors mt-0.5 cursor-pointer" disabled={updating}>
                        {st.completed ? (
                          <CheckSquare className="w-4 h-4 text-ink" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${st.completed ? 'line-through text-muted' : 'text-ink'}`}>
                          {st.title}
                        </p>
                        <span className="text-[8px] text-muted font-bold uppercase tracking-widest block mt-0.5">
                          Order {st.order} • {st.durationMinutes} minutes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted italic p-3 border border-hairline bg-canvas">No subtasks found.</p>
              )}

              {task.suggestedExecutionFlow && (
                <div className="text-[10px] leading-relaxed text-body bg-surface-soft border border-hairline p-3">
                  <span className="font-bold text-[8px] uppercase tracking-wider block text-ink mb-1">Execution Guidance:</span>
                  "{task.suggestedExecutionFlow}"
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Recovery status panel if available */}
        {task.recoveryStatus && (
          <div className="p-4 border border-m-red/20 bg-m-red/5 space-y-2">
            <h4 className="text-[10px] font-bold text-m-red uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-m-red" />
              Recovery Agent Plan: {task.recoveryStatus}
            </h4>
            {task.recoveryMessage && (
              <p className="text-xs text-body leading-relaxed">
                "{task.recoveryMessage}"
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 text-[10px] pt-1">
              <div>
                <span className="font-bold text-muted uppercase block">Suggested Deadline</span>
                <span className="text-ink font-semibold">{task.suggestedDeadline}</span>
              </div>
              <div>
                <span className="font-bold text-muted uppercase block">Suggested Schedule Block</span>
                <span className="text-ink font-semibold">{task.suggestedScheduleBlock}</span>
              </div>
            </div>
            {task.recoverySteps && task.recoverySteps.length > 0 && (
              <div className="pt-2">
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Recovery Actions:</span>
                <ul className="list-decimal pl-4 text-[10px] space-y-1 text-body">
                  {task.recoverySteps.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* User Notes Area */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px]">Workspace Notes (Autosaves on blur)</label>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Document details, ideas, draft texts, or questions here..."
            rows={3}
            className="w-full bmw-input text-xs resize-none"
          />
        </div>

      </div>
    </div>
  );
}
