import { useState } from 'react';
import type { MouseEvent } from 'react';
import { 
  Trash2, 
  CheckSquare, 
  Square, 
  Calendar, 
  Filter, 
  Sparkles,
  RefreshCw,
  ChevronRight,
  Bookmark,
  Repeat,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import TaskDetailModal from '../components/TaskDetailModal';
import { getUrgencyColor } from '../utils/urgency';
import type { Task } from '../services/api';

export default function TaskManagement() {
  const { 
    tasks, 
    loading, 
    error, 
    refreshWorkspace 
  } = useWorkspace();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [importance, setImportance] = useState(3);
  const [estimatedEffort, setEstimatedEffort] = useState(60);
  const [category, setCategory] = useState('School');
  const [urgency, setUrgency] = useState<'critical' | 'important' | 'medium' | 'normal'>('normal');
  
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [activeListTab, setActiveListTab] = useState<'active' | 'routines'>('active');
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const toggleCustomDay = (day: string) => {
    setCustomDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitLoading(true);
    setLocalError('');
    try {
      const newTask = await api.createTask({
        title,
        description,
        deadline: deadline || null,
        importance,
        estimatedEffort,
        category,
        urgency,
        isRecurring,
        recurrenceDays: isRecurring ? (recurrenceType === 'daily' ? ['Daily'] : customDays) : []
      });

      setTitle('');
      setDescription('');
      setDeadline('');
      setImportance(3);
      setEstimatedEffort(60);
      setCategory('School');
      setUrgency('normal');
      setIsRecurring(false);
      setRecurrenceType('daily');
      setCustomDays([]);
      
      await refreshWorkspace(true);
      setSelectedTaskId(newTask.id);
      setIsDetailOpen(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to add task');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await api.updateTask(task.id, { status: newStatus });
      await refreshWorkspace(true);
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      await refreshWorkspace(true);
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
        setIsDetailOpen(false);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const isOverdue = (task: Task) => {
    if (task.status === 'completed' || !task.deadline) return false;
    const deadlineDate = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  const filteredTasks = tasks.filter(t => {
    if (t.isRecurring) return false;
    const matchCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchCategory && matchPriority;
  });

  const routineTemplates = tasks.filter(t => {
    if (!t.isRecurring) return false;
    const matchCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchCategory && matchPriority;
  });

  const categories = ['School', 'Work', 'Personal', 'Finance', 'General'];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto bg-canvas h-screen font-light">
      
      {/* Page Header */}
      <div className="border-b border-hairline pb-5 relative">
        <div className="absolute bottom-[-1.5px] left-0 w-24 h-[3px] m-stripe" />
        <h1 className="text-2xl font-bold text-ink tracking-wider uppercase">AI-Assisted Task Manager</h1>
        <p className="text-muted text-xs mt-1">Create and manage your workspace tasks. All items are analyzed by active agents.</p>
      </div>

      {(error || localError) && (
        <div className="p-3.5 border border-m-red/30 bg-m-red/5 text-m-red text-xs font-bold uppercase tracking-wider">
          {error || localError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Create Form & Task List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Create Task Accordion */}
          <div className="glass-panel p-5 border-hairline space-y-4">
            <h3 className="font-bold text-xs text-ink uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-hairline">
              <Sparkles className="w-4 h-4 text-ink" />
              Delegate Task to Agents
            </h3>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Task Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Complete DBMS Assignment 2"
                    className="w-full bmw-input text-xs"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide context details for the Planner Agent..."
                    rows={2}
                    className="w-full bmw-input text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Urgency Level</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full bmw-input text-xs"
                  >
                    <option value="critical">🔴 Critical (Highest)</option>
                    <option value="important">🔵 Important (Second)</option>
                    <option value="medium">🟢 Medium (Standard)</option>
                    <option value="normal">🟡 Normal (Routine)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Deadline Date</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bmw-input text-xs text-ink"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bmw-input text-xs text-ink"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Effort Estimate (mins)</label>
                  <input
                    type="number"
                    value={estimatedEffort}
                    onChange={(e) => setEstimatedEffort(Number(e.target.value))}
                    min="10"
                    step="10"
                    className="w-full bmw-input text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Importance (1 to 5)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={importance}
                    onChange={(e) => setImportance(Number(e.target.value))}
                    className="w-full h-1 bg-surface-card rounded-none appearance-none cursor-pointer accent-ink"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-muted mt-1 uppercase">
                    <span>1 (Low)</span>
                    <span className="text-ink">Selected: {importance}</span>
                    <span>5 (Critical)</span>
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-hairline pt-3 mt-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded border-hairline text-ink focus:ring-ink"
                    />
                    <label htmlFor="isRecurring" className="text-xs font-bold text-ink uppercase tracking-widest cursor-pointer flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5" />
                      Repeat Task (Routine)
                    </label>
                  </div>

                  {isRecurring && (
                    <div className="p-3 bg-surface-soft border border-hairline space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">
                          Repeat Frequency
                        </label>
                        <select
                          value={recurrenceType}
                          onChange={(e) => setRecurrenceType(e.target.value as any)}
                          className="w-full bmw-input text-xs"
                        >
                          <option value="daily">Every single day</option>
                          <option value="custom">Specific days of the week</option>
                        </select>
                      </div>

                      {recurrenceType === 'custom' && (
                        <div>
                          <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-2">
                            Select Days
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                              const isSelected = customDays.includes(day);
                              const shortName = day.substring(0, 3);
                              return (
                                <button
                                  type="button"
                                  key={day}
                                  onClick={() => toggleCustomDay(day)}
                                  className={`px-2.5 py-1 text-[10px] font-bold uppercase border transition-all ${
                                    isSelected 
                                      ? 'bg-ink text-canvas border-ink' 
                                      : 'bg-canvas text-muted border-hairline hover:text-ink hover:border-ink'
                                  }`}
                                >
                                  {shortName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading || !title.trim()}
                className="w-full bmw-btn-primary cursor-pointer"
              >
                {submitLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin inline mr-1" />
                    Consulting Agents...
                  </>
                ) : (
                  <>
                    Activate Agents & Deploy
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Task Filter & List */}
          <div className="space-y-4">
            
            {/* List Tabs */}
            <div className="flex border-b border-hairline text-xs font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setActiveListTab('active')}
                className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
                  activeListTab === 'active'
                    ? 'border-ink text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Active Tasks
              </button>
              <button
                type="button"
                onClick={() => setActiveListTab('routines')}
                className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
                  activeListTab === 'routines'
                    ? 'border-ink text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Routine Templates
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 bg-surface-card p-3 border border-hairline justify-between text-xs rounded-none">
              <div className="flex items-center gap-2 text-muted font-bold uppercase tracking-wider text-[10px]">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2 py-1 bg-canvas border border-hairline text-body text-xs outline-none"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-2 py-1 bg-canvas border border-hairline text-body text-xs outline-none"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Task Item Cards */}
            {loading ? (
              <div className="text-center py-10">
                <RefreshCw className="w-6 h-6 text-ink animate-spin mx-auto mb-2" />
                <p className="text-xs text-muted uppercase font-bold tracking-wider">Syncing active workspace tasks...</p>
              </div>
            ) : (activeListTab === 'active' ? filteredTasks : routineTemplates).length === 0 ? (
              <div className="text-center py-10 bg-surface-soft border border-hairline">
                <p className="text-xs text-muted italic">
                  {activeListTab === 'active' 
                    ? 'No active tasks match selected filter parameters.' 
                    : 'No routine templates registered yet. Create a recurring task on the left!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(activeListTab === 'active' ? filteredTasks : routineTemplates).map((t) => {
                  const subtasksDone = t.subtasks?.filter(st => st.completed).length || 0;
                  const totalSubtasks = t.subtasks?.length || 0;
                  const isSelected = selectedTaskId === t.id;
                  const taskOverdue = isOverdue(t);
                  
                  const u = getUrgencyColor(t.urgency || 'normal');
                  
                  return (
                    <div 
                      key={t.id}
                      onClick={() => { setSelectedTaskId(t.id); setIsDetailOpen(true); }}
                      className={`
                        glass-panel p-4 border-hairline flex items-start justify-between gap-4 cursor-pointer transition-all duration-205 hover:bg-surface-soft
                        border-l-4 border-l-[rgba(0,0,0,0)]
                        ${isSelected ? 'border-ink bg-surface-soft' : ''}
                      `}
                      style={{ borderLeftColor: u.hex }}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {activeListTab === 'active' ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTaskStatus(t);
                            }}
                            className="mt-0.5 text-muted hover:text-ink transition-colors cursor-pointer"
                          >
                            {t.status === 'completed' ? (
                              <CheckSquare className="w-4.5 h-4.5 text-ink" />
                            ) : (
                              <Square className="w-4.5 h-4.5" />
                            )}
                          </button>
                        ) : (
                          <div className="mt-0.5 text-muted shrink-0">
                            <Clock className="w-4.5 h-4.5 text-muted" />
                          </div>
                        )}
                        
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold uppercase tracking-wider text-ink ${t.status === 'completed' ? 'line-through text-muted' : ''}`}>
                            {t.title}
                          </h4>
                          
                          <div className="flex flex-wrap gap-2 items-center mt-2.5 text-[9px] font-bold uppercase tracking-wider">
                            <span className="px-2 py-0.5 bg-canvas border border-hairline text-muted">
                              {t.category}
                            </span>
                            <span className={`px-2 py-0.5 border shrink-0 ${u.badge}`}>
                              {u.label}
                            </span>
                            {t.priority === 'High' && (
                              <span className="px-2 py-0.5 border border-m-red/20 bg-m-red/5 text-m-red font-bold">
                                HIGH PRIORITY
                              </span>
                            )}
                            {activeListTab === 'active' ? (
                              t.deadline && (
                                <span className="flex items-center gap-1 text-muted">
                                  <Calendar className="w-3 h-3 text-muted" />
                                  {new Date(t.deadline).toLocaleDateString()}
                                </span>
                              )
                            ) : (
                              <span className="flex items-center gap-1 text-ink bg-surface-soft px-2 py-0.5 border border-hairline font-bold">
                                <Repeat className="w-3 h-3 text-ink" />
                                {t.recurrenceDays?.includes('Daily') ? 'Daily' : t.recurrenceDays?.join(', ')}
                              </span>
                            )}
                            {activeListTab === 'active' && taskOverdue && (
                              <span className="px-2 py-0.5 border border-m-red/30 bg-m-red/5 text-m-red animate-pulse">
                                OVERDUE
                              </span>
                            )}
                            {totalSubtasks > 0 && (
                              <span className="text-ink">
                                {subtasksDone}/{totalSubtasks} Subtasks
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-center shrink-0">
                        <button 
                          onClick={(e) => handleDeleteTask(t.id, e)}
                          className="p-1.5 border border-m-red/10 bg-m-red/5 hover:bg-m-red/10 text-m-red hover:border-m-red/30 cursor-pointer rounded-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-muted" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Informative Workspace Panels */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 border-hairline space-y-4 bg-surface-soft relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] m-stripe" />
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider pb-2 border-b border-hairline flex items-center gap-1.5">
              <Bookmark className="w-4 h-4" />
              Developer Guidance Node
            </h3>
            <p className="text-xs text-body leading-relaxed">
              Task properties have been extended with **Custom Urgency Levels** (🔴 Critical, 🔵 Important, 🟢 Medium, 🟡 Normal).
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Clicking on any task launches the **Task Workspace Inspector**. There, you can regenerate plans, edit deadline parameters, add workspace notes, and complete subtask breakdowns.
            </p>
          </div>
        </div>

      </div>

      {/* Task detail workspace modal */}
      <TaskDetailModal 
        taskId={selectedTaskId}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedTaskId(null); }}
      />

    </div>
  );
}
