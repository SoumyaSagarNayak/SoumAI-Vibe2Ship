import { useState } from 'react';
import { 
  Flame, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Sparkles,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  Compass,
  ArrowRight,
  ShieldCheck,
  Layers,
  Inbox,
  CalendarDays
} from 'lucide-react';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import CrisisBanner from '../components/CrisisBanner';
import TaskDetailModal from '../components/TaskDetailModal';
import { getUrgencyColor } from '../utils/urgency';

export default function Dashboard() {
  const { 
    tasks, 
    schedule, 
    analytics, 
    loading, 
    error, 
    refreshWorkspace 
  } = useWorkspace();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'high' | 'today' | 'recent'>('pending');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [quickTitle, setQuickTitle] = useState('');
  const [quickDeadline, setQuickDeadline] = useState('');
  const [quickUrgency, setQuickUrgency] = useState<'critical' | 'important' | 'medium' | 'normal'>('normal');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState('');
  const [localError, setLocalError] = useState('');

  const isToday = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setActionLoading(true);
    setLocalError('');
    try {
      let deadline = quickDeadline;
      if (!deadline) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        deadline = tomorrow.toISOString().split('T')[0];
      }

      await api.createTask({
        title: quickTitle,
        deadline,
        importance: 3,
        estimatedEffort: 60,
        category: 'General',
        urgency: quickUrgency
      });

      setQuickTitle('');
      setQuickDeadline('');
      setQuickUrgency('normal');
      await refreshWorkspace(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to quickly add task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecoveryCheck = async () => {
    setRecoveryLoading(true);
    setRecoveryMsg('');
    try {
      const result = await api.runRecoveryCheck();
      setRecoveryMsg(result.recoveredCount > 0
        ? `✅ Recovery Engine rebuilt ${result.recoveredCount} overdue task(s)! Workspace updated.`
        : '✅ All tasks are on track. No recovery needed.');
      await refreshWorkspace(true);
    } catch (err: any) {
      setRecoveryMsg('Recovery check failed. Please try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Filter Tasks
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && !t.isRecurring);
  const highPriorityTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'completed' && !t.isRecurring);
  const todayTasks = tasks.filter(t => isToday(t.deadline) && t.status !== 'completed' && !t.isRecurring);
  const recentlyAddedTasks = [...tasks]
    .filter(t => !t.isRecurring)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const getFilteredTasksList = () => {
    switch (activeTab) {
      case 'high': return highPriorityTasks;
      case 'today': return todayTasks;
      case 'recent': return recentlyAddedTasks;
      case 'pending':
      default: return pendingTasks;
    }
  };

  // Metrics Calculations
  const completedCount = tasks.filter(t => t.status === 'completed' && !t.isRecurring).length;
  const totalCount = tasks.filter(t => !t.isRecurring).length;
  const overallCompletion = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const dueTodayTasks = tasks.filter(t => isToday(t.deadline) && !t.isRecurring);
  const completedTodayTasks = dueTodayTasks.filter(t => t.status === 'completed');
  const todayProgress = dueTodayTasks.length > 0 ? Math.round((completedTodayTasks.length / dueTodayTasks.length) * 100) : 0;

  const overdueTasks = tasks.filter(t => {
    if (t.isRecurring || t.status === 'completed' || !t.deadline) return false;
    const deadlineDate = new Date(t.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  });

  const upcomingDeadlines = tasks
    .filter(t => {
      if (t.isRecurring || t.status === 'completed' || !t.deadline) return false;
      const d = new Date(t.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = d.getTime() - today.getTime();
      return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const urgentTask = tasks
    .filter(t => !t.isRecurring && t.status !== 'completed' && t.reminderNudge)
    .sort((a, b) => {
      if (a.reminderUrgency === 'critical') return -1;
      if (b.reminderUrgency === 'critical') return 1;
      if (a.reminderUrgency === 'urgent') return -1;
      if (b.reminderUrgency === 'urgent') return 1;
      return 0;
    })[0];

  const getUrgencyBorder = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-m-red';
      case 'urgent': return 'border-warning';
      default: return 'border-bmw-blue';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[85vh] gap-4 bg-canvas">
        <RefreshCw className="w-6 h-6 text-ink animate-spin" />
        <p className="text-muted text-[10px] font-bold tracking-[1.5px] uppercase animate-pulse">Running Agent Diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto bg-canvas h-screen">
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline pb-5 relative">
        <div className="absolute bottom-[-1.5px] left-0 w-24 h-[3px] m-stripe" />
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-wider uppercase">Active Command Dashboard</h1>
          <p className="text-muted text-xs mt-1">Real-time status of your productivity workspace and logical agents.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => refreshWorkspace()} 
            className="bmw-btn-secondary py-2 px-4 self-start text-[10px]"
          >
            <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
            Sync Agents
          </button>
          <button
            onClick={handleRecoveryCheck}
            disabled={recoveryLoading}
            className="bmw-btn-secondary py-2 px-4 self-start text-[10px] flex items-center gap-1.5 cursor-pointer"
          >
            {recoveryLoading
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <ShieldCheck className="w-3.5 h-3.5" />}
            {recoveryLoading ? 'Recovering...' : 'Auto-Recover'}
          </button>
        </div>
      </div>

      {(error || localError) && (
        <div className="p-3.5 border border-m-red/30 bg-m-red/5 text-m-red text-xs font-bold uppercase tracking-wider">
          {error || localError}
        </div>
      )}

      {/* Recovery feedback message */}
      {recoveryMsg && (
        <div className="p-3 border border-hairline bg-surface-soft text-xs text-body tracking-wide">
          {recoveryMsg}
        </div>
      )}

      {/* Crisis Mode Banner — auto-triggers when tasks have <2h deadlines */}
      <CrisisBanner tasks={tasks} />

      {/* Agents Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {['Planner', 'Priority', 'Scheduler', 'Reminder', 'Reflection', 'Motivation'].map((agentName) => (
          <div key={agentName} className="glass-panel p-3 border-hairline flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-body uppercase tracking-wider">{agentName} Node</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-none bg-success glow-pulse" />
              <span className="text-[9px] font-bold text-success tracking-wide uppercase">ONLINE</span>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics Row (FEATURE 8) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Metric 1: Overall Completion */}
        <div className="glass-panel p-4 border-hairline space-y-1">
          <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Overall Completion</span>
          <div className="text-2xl font-extrabold text-ink">{overallCompletion}%</div>
          <div className="w-full h-1 bg-canvas border border-hairline mt-2">
            <div className="h-full bg-ink transition-all duration-300" style={{ width: `${overallCompletion}%` }} />
          </div>
        </div>

        {/* Metric 2: Today's Progress */}
        <div className="glass-panel p-4 border-hairline space-y-1">
          <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Today's Progress</span>
          <div className="text-2xl font-extrabold text-ink">{todayProgress}%</div>
          <div className="w-full h-1 bg-canvas border border-hairline mt-2">
            <div className="h-full bg-m-blue-light transition-all duration-300" style={{ width: `${todayProgress}%` }} />
          </div>
        </div>

        {/* Metric 3: High Priority Pending */}
        <div className="glass-panel p-4 border-hairline space-y-1">
          <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">High Priority</span>
          <div className="text-2xl font-extrabold text-ink">{highPriorityTasks.length} <span className="text-[10px] text-muted font-bold">Tasks</span></div>
          <div className="text-[8px] text-muted font-semibold mt-1 uppercase tracking-wider">Awaiting Execution</div>
        </div>

        {/* Metric 4: Overdue Warning */}
        <div className={`glass-panel p-4 border-hairline space-y-1 ${overdueTasks.length > 0 ? 'border-m-red/40 bg-m-red/5' : ''}`}>
          <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Overdue Items</span>
          <div className={`text-2xl font-extrabold ${overdueTasks.length > 0 ? 'text-m-red animate-pulse' : 'text-ink'}`}>
            {overdueTasks.length} <span className="text-[10px] text-muted font-bold">Tasks</span>
          </div>
          <div className="text-[8px] text-muted font-semibold mt-1 uppercase tracking-wider">
            {overdueTasks.length > 0 ? 'Requires Recovery Plan' : 'System Clear'}
          </div>
        </div>

        {/* Metric 5: Upcoming Deadlines */}
        <div className="glass-panel p-4 border-hairline space-y-1 col-span-2 md:col-span-1">
          <span className="text-[8px] text-muted font-bold uppercase tracking-widest block">Upcoming (3d)</span>
          <div className="text-sm font-bold text-ink">
            {upcomingDeadlines.length > 0 ? (
              <span className="text-warning font-semibold truncate block">
                {upcomingDeadlines[0].title}
              </span>
            ) : (
              <span className="text-muted">None pending</span>
            )}
          </div>
          <div className="text-[8px] text-muted font-semibold mt-1 uppercase tracking-wider">
            {upcomingDeadlines.length > 0 ? `+${upcomingDeadlines.length} soon` : 'Schedule relaxed'}
          </div>
        </div>

      </div>

      {/* Context-Aware Reminder Banner */}
      {urgentTask && (
        <div className={`p-4 border-l-4 rounded-none bg-surface-card border-hairline flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-200 ${getUrgencyBorder(urgentTask.reminderUrgency || 'normal')}`}>
          <div className="p-2.5 bg-canvas border border-hairline text-ink shrink-0">
            <AlertTriangle className="w-4 h-4 text-ink" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[10px] uppercase tracking-[1.5px] text-ink flex items-center gap-2">
              Agent Alert: {urgentTask.reminderUrgency} Urgency Nudge
            </h4>
            <p className="text-xs mt-1 text-body leading-relaxed font-light">
              "{urgentTask.reminderNudge}"
            </p>
          </div>
          {urgentTask.reminderAction && (
            <div className="self-end md:self-center">
              <span className="bmw-link">
                {urgentTask.reminderAction}
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mid Level Content: Main Workspace Plan & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Workspace Block (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Tasks Command Center (FEATURE 1) */}
          <div className="glass-panel p-6 border-hairline space-y-5 relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] m-stripe" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-hairline pb-3 gap-3">
              <h2 className="text-sm font-bold text-ink uppercase tracking-[1.5px] flex items-center gap-2">
                <Layers className="w-4 h-4 text-ink" />
                Active Tasks Command Center
              </h2>
              
              {/* Tab Filters */}
              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                <button 
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1 border transition-colors cursor-pointer ${activeTab === 'pending' ? 'bg-ink text-canvas border-ink' : 'border-hairline hover:border-muted text-muted'}`}
                >
                  Pending ({pendingTasks.length})
                </button>
                <button 
                  onClick={() => setActiveTab('high')}
                  className={`px-3 py-1 border transition-colors cursor-pointer ${activeTab === 'high' ? 'bg-ink text-canvas border-ink' : 'border-hairline hover:border-muted text-muted'}`}
                >
                  High Priority ({highPriorityTasks.length})
                </button>
                <button 
                  onClick={() => setActiveTab('today')}
                  className={`px-3 py-1 border transition-colors cursor-pointer ${activeTab === 'today' ? 'bg-ink text-canvas border-ink' : 'border-hairline hover:border-muted text-muted'}`}
                >
                  Due Today ({todayTasks.length})
                </button>
                <button 
                  onClick={() => setActiveTab('recent')}
                  className={`px-3 py-1 border transition-colors cursor-pointer ${activeTab === 'recent' ? 'bg-ink text-canvas border-ink' : 'border-hairline hover:border-muted text-muted'}`}
                >
                  Recently Added
                </button>
              </div>
            </div>

            {/* Task list cards render */}
            {getFilteredTasksList().length === 0 ? (
              <div className="text-center py-10 bg-surface-soft border border-hairline flex flex-col items-center justify-center gap-2">
                <Inbox className="w-6 h-6 text-muted" />
                <p className="text-xs text-muted italic">No tasks currently queued under this workspace node.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredTasksList().map((task) => {
                  const subtasks = task.subtasks || [];
                  const subDone = subtasks.filter(s => s.completed).length;
                  const pct = subtasks.length > 0 ? Math.round((subDone / subtasks.length) * 100) : (task.status === 'completed' ? 100 : 0);
                  const u = getUrgencyColor(task.urgency || 'normal');
                  
                  return (
                    <div 
                      key={task.id}
                      onClick={() => { setSelectedTaskId(task.id); setIsDetailOpen(true); }}
                      className={`glass-panel p-4 flex flex-col justify-between hover:bg-surface-soft transition-all duration-200 cursor-pointer border-l-4 border-l-[rgba(0,0,0,0)]`}
                      style={{ borderLeftColor: u.hex }}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-xs font-bold uppercase tracking-wider text-ink truncate flex-1 ${task.status === 'completed' ? 'line-through text-muted' : ''}`}>
                            {task.title}
                          </h4>
                          <span className={`text-[8px] px-1.5 py-0.2 border shrink-0 font-semibold tracking-wider ${u.badge}`}>
                            {u.label}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-[10px] text-muted truncate max-w-full font-light">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-muted mt-3 uppercase tracking-wide">
                        <span className="px-1.5 py-0.5 bg-canvas border border-hairline">
                          {task.category}
                        </span>
                        {task.deadline && (
                          <span className="flex items-center gap-1 text-[8px] font-bold">
                            <CalendarDays className="w-3 h-3 text-muted" />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-muted uppercase">
                          <span>Subtask Progress</span>
                          <span className="text-ink">{pct}% ({subDone}/{subtasks.length})</span>
                        </div>
                        <div className="w-full h-1 bg-canvas border border-hairline">
                          <div 
                            className="h-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: u.hex }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Daily Schedule Plans (Original) */}
          <div className="glass-panel p-6 border-hairline space-y-5 relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] m-stripe" />
            
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h2 className="text-sm font-bold text-ink uppercase tracking-[1.5px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ink" />
                Scheduler Agent: Today's Time Blocks
              </h2>
              <span className="text-[9px] text-muted font-bold uppercase tracking-wider">
                Focus Boundary: 9 AM - 5 PM
              </span>
            </div>

            {/* Daily schedule blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Morning Block */}
              <div className="p-4 bg-surface-soft border border-hairline space-y-3">
                <div className="flex items-center gap-2 text-ink font-bold text-[10px] uppercase tracking-widest pb-1 border-b border-hairline">
                  <Sun className="w-4 h-4 text-m-blue-light" />
                  Morning Plan
                </div>
                {schedule?.morningPlan && schedule.morningPlan.length > 0 ? (
                  schedule.morningPlan.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs font-bold text-ink leading-tight">{p.activity}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted font-semibold uppercase">
                        <Clock className="w-3 h-3 text-muted" />
                        <span>{p.timeSlot} • {p.durationMinutes} mins</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted italic">No morning slots.</p>
                )}
              </div>

              {/* Afternoon Block */}
              <div className="p-4 bg-surface-soft border border-hairline space-y-3">
                <div className="flex items-center gap-2 text-ink font-bold text-[10px] uppercase tracking-widest pb-1 border-b border-hairline">
                  <Sunset className="w-4 h-4 text-bmw-blue" />
                  Afternoon Plan
                </div>
                {schedule?.afternoonPlan && schedule.afternoonPlan.length > 0 ? (
                  schedule.afternoonPlan.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs font-bold text-ink leading-tight">{p.activity}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted font-semibold uppercase">
                        <Clock className="w-3 h-3 text-muted" />
                        <span>{p.timeSlot} • {p.durationMinutes} mins</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted italic">No afternoon slots.</p>
                )}
              </div>

              {/* Evening Block */}
              <div className="p-4 bg-surface-soft border border-hairline space-y-3">
                <div className="flex items-center gap-2 text-ink font-bold text-[10px] uppercase tracking-widest pb-1 border-b border-hairline">
                  <Moon className="w-4 h-4 text-m-red" />
                  Evening Plan
                </div>
                {schedule?.eveningPlan && schedule.eveningPlan.length > 0 ? (
                  schedule.eveningPlan.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs font-bold text-ink leading-tight">{p.activity}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted font-semibold uppercase">
                        <Clock className="w-3 h-3 text-muted" />
                        <span>{p.timeSlot} • {p.durationMinutes} mins</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted italic">No evening slots.</p>
                )}
              </div>

            </div>

            {/* Scheduler suggestion text */}
            {schedule?.rearrangementSuggestion && (
              <div className="p-3.5 border border-hairline bg-surface-soft text-xs text-body leading-relaxed">
                <span className="font-bold block text-ink uppercase tracking-widest text-[9px] mb-1">Agent Suggestion:</span>
                "{schedule.rearrangementSuggestion}"
              </div>
            )}
          </div>

          {/* Recommended Study Session */}
          {schedule?.recommendedStudySessions && schedule.recommendedStudySessions.length > 0 && (
            <div className="glass-panel p-5 border-hairline flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-canvas border border-hairline text-ink">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-ink uppercase tracking-wider">Recommended Focus Block</h3>
                  <p className="text-[11px] text-muted mt-1 leading-normal">
                    Dedicate this session to high-energy execution.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-ink uppercase tracking-wider">{schedule.recommendedStudySessions[0].sessionName}</p>
                <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">
                  Starts {schedule.recommendedStudySessions[0].startTime} ({schedule.recommendedStudySessions[0].durationMinutes} mins)
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Widgets (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Streak Widget */}
          <div className="glass-panel p-6 border-hairline flex flex-col justify-between items-center text-center relative overflow-hidden">
            <Flame className="w-10 h-10 text-m-red mb-2" />
            <h3 className="text-muted text-[10px] font-bold uppercase tracking-widest">Active Streak</h3>
            
            <div className="text-4xl font-extrabold mt-1 text-ink tracking-tight">
              {analytics?.streak || 0} <span className="text-sm font-bold text-ink uppercase tracking-widest">Days</span>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-t-hairline">
              <div>
                <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Completed</p>
                <p className="text-base font-bold text-ink mt-1">{analytics?.completedCount || 0}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Pending</p>
                <p className="text-base font-bold text-ink mt-1">{analytics?.pendingCount || 0}</p>
              </div>
            </div>

            {/* Success percent bar */}
            <div className="w-full mt-4 space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted">
                <span>Success Rate</span>
                <span>{analytics?.successPercentage || 0}%</span>
              </div>
              <div className="w-full h-1 bg-canvas border border-hairline rounded-none overflow-hidden">
                <div 
                  className="h-full bg-ink transition-all duration-300"
                  style={{ width: `${analytics?.successPercentage || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Add Task */}
          <div className="glass-panel p-6 border-hairline space-y-4">
            <h3 className="font-bold text-xs text-ink uppercase tracking-widest pb-2 border-b border-hairline">
              Quick Tasks Box
            </h3>

            <form onSubmit={handleQuickAdd} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Task Title</label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="e.g. Complete DSA Quiz"
                  className="w-full bmw-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Urgency Level</label>
                <select
                  value={quickUrgency}
                  onChange={(e) => setQuickUrgency(e.target.value as any)}
                  className="w-full bmw-input text-xs"
                >
                  <option value="critical">🔴 Critical</option>
                  <option value="important">🔵 Important</option>
                  <option value="medium">🟢 Medium</option>
                  <option value="normal">🟡 Normal</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Deadline (Optional)</label>
                <input
                  type="date"
                  value={quickDeadline}
                  onChange={(e) => setQuickDeadline(e.target.value)}
                  className="w-full bmw-input text-xs text-muted"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || !quickTitle.trim()}
                className="w-full bmw-btn-primary py-2 px-3 text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Deploy & Delegate
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Motivation Advice Card */}
      {analytics?.motivation && (
        <div className="glass-panel border-hairline p-5 flex items-start gap-4 bg-surface-soft relative">
          <div className="absolute left-0 top-0 bottom-0 w-[4px] m-stripe" />
          <div className="p-2.5 bg-canvas border border-hairline text-ink shrink-0 ml-1">
            <Sparkles className="w-5 h-5 text-ink" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Motivation Agent: Mindset Nudge
            </h4>
            <p className="text-xs font-semibold text-ink leading-relaxed italic">
              "{analytics.motivation.quote}"
            </p>
            <p className="text-[10px] text-body leading-relaxed pt-1.5">
              <span className="font-bold uppercase tracking-widest text-[9px] text-muted mr-1.5">Action Tip:</span>
              {analytics.motivation.advice}
            </p>
          </div>
        </div>
      )}

      {/* Reusable Detail Modal */}
      <TaskDetailModal 
        taskId={selectedTaskId}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedTaskId(null); }}
      />

    </div>
  );
}
