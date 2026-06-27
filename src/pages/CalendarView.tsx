import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  CalendarDays,
  Inbox
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import TaskDetailModal from '../components/TaskDetailModal';
import { getUrgencyColor } from '../utils/urgency';
import type { Task } from '../services/api';

export default function CalendarView() {
  const { tasks, loading } = useWorkspace();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...days];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const getTasksForDay = (day: number) => {
    const dayTasks = tasks.filter(t => {
      if (t.isRecurring || !t.deadline) return false;
      const tDate = new Date(t.deadline);
      return tDate.getDate() === day && 
             tDate.getMonth() === month && 
             tDate.getFullYear() === year;
    });

    const templates = tasks.filter(t => t.isRecurring);
    const dateToCheck = new Date(year, month, day);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[dateToCheck.getDay()];
    const dateToCheckStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mockTasks: Task[] = [];
    for (const template of templates) {
      const matchesDaily = template.recurrenceDays?.some(d => d.toLowerCase() === 'daily');
      const matchesSpecificDay = template.recurrenceDays?.some(d => d.toLowerCase() === dayName.toLowerCase());

      if (matchesDaily || matchesSpecificDay) {
        const alreadyHasInstance = dayTasks.some(t => t.parentTaskId === template.id || t.title.toLowerCase() === template.title.toLowerCase());
        if (!alreadyHasInstance) {
          mockTasks.push({
            id: `mock_${template.id}_${year}_${month}_${day}`,
            title: template.title,
            description: template.description || 'Scheduled routine task',
            deadline: dateToCheckStr,
            status: dateToCheck < today ? 'completed' : 'pending',
            priority: template.priority || 'Medium',
            category: template.category || 'General',
            importance: template.importance || 3,
            estimatedEffort: template.estimatedEffort || 60,
            subtasks: [],
            createdAt: dateToCheck.toISOString(),
            updatedAt: dateToCheck.toISOString()
          });
        }
      }
    }

    return [...dayTasks, ...mockTasks];
  };

  const isOverdue = (task: Task) => {
    if (task.status === 'completed' || !task.deadline) return false;
    const deadlineDate = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto bg-canvas h-screen font-light">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline pb-5 relative">
        <div className="absolute bottom-[-1.5px] left-0 w-24 h-[3px] m-stripe" />
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-wider uppercase">Calendar Workspace</h1>
          <p className="text-muted text-xs mt-1">Cross-check task deadlines and review overdue priorities chronologically.</p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrevMonth}
            className="p-2 border border-hairline bg-surface-card hover:bg-canvas text-muted hover:text-ink transition-colors cursor-pointer rounded-none animate-scale"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-extrabold text-xs text-ink uppercase tracking-[1.5px] min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>

          <button 
            onClick={handleNextMonth}
            className="p-2 border border-hairline bg-surface-card hover:bg-canvas text-muted hover:text-ink transition-colors cursor-pointer rounded-none animate-scale"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-canvas">
          <RefreshCw className="w-6 h-6 text-ink animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted font-bold uppercase tracking-wider">Consulting Calendar Indexes...</p>
        </div>
      ) : (
        <div className="glass-panel p-4 border-hairline shadow-none bg-canvas space-y-6">
          
          {/* Day labels header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-muted uppercase tracking-widest pb-3 border-b border-hairline">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar grid cells */}
          <div className="grid grid-cols-7 gap-2 mt-3 min-h-[420px]">
            {calendarCells.map((day, idx) => {
              const dayTasks = day ? getTasksForDay(day) : [];
              const isToday = day && 
                              day === new Date().getDate() && 
                              month === new Date().getMonth() && 
                              year === new Date().getFullYear();

              const hasOverdue = dayTasks.some(t => isOverdue(t));
              const isSelected = selectedDay === day;

              return (
                <div 
                  key={idx}
                  onClick={() => day && setSelectedDay(day)}
                  className={`
                    min-h-[95px] p-2 border flex flex-col justify-between transition-all rounded-none cursor-pointer
                    ${day ? 'bg-surface-soft border-hairline-strong' : 'bg-transparent border-transparent pointer-events-none'}
                    ${isToday ? 'border-ink bg-surface-card' : ''}
                    ${isSelected ? 'bg-surface-elevated border-ink scale-[1.01]' : ''}
                    ${hasOverdue && day ? 'border-m-red/50 shadow-[0_0_8px_rgba(226,39,24,0.15)] bg-m-red/5' : ''}
                    ${day ? 'hover:bg-surface-card hover:scale-[1.01]' : ''}
                  `}
                >
                  {day ? (
                    <>
                      {/* Date label & count */}
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-bold uppercase tracking-wider
                          ${isToday ? 'text-ink font-black' : 'text-muted'}
                        `}>
                          {day} {isToday ? '• TODAY' : ''}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[8px] bg-canvas px-1 border border-hairline font-bold text-ink rounded-none">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      {/* Day Tasks checklist brief */}
                      <div className="flex-1 space-y-1 mt-2 overflow-hidden">
                        {dayTasks.slice(0, 3).map((task) => {
                          const u = getUrgencyColor(task.urgency || 'normal');
                          const taskOverdue = isOverdue(task);
                          return (
                            <div 
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (task.id.startsWith('mock_')) {
                                  alert('This is a scheduled routine task. Active instances are generated on the Dashboard/Tasks manager daily.');
                                  return;
                                }
                                setSelectedTaskId(task.id);
                                setIsDetailOpen(true);
                              }}
                              className={`
                                p-1 rounded-none text-[8px] font-semibold tracking-wide uppercase leading-normal flex items-center justify-between gap-1.5 truncate border hover:bg-surface-elevated
                                ${task.status === 'completed'
                                  ? 'bg-canvas border-hairline text-muted line-through' 
                                  : taskOverdue
                                    ? 'bg-m-red/5 border-m-red/30 text-m-red font-bold shadow-[0_0_4px_rgba(226,39,24,0.1)]'
                                    : `${u.bg} ${u.border} ${u.text}`
                                }
                              `}
                              title={`${task.title} (${u.label})`}
                            >
                              <span className="truncate flex-1 flex items-center gap-1">
                                {task.id.startsWith('mock_') && <span className="opacity-80 shrink-0">🔁</span>}
                                <span className="truncate">{task.title}</span>
                              </span>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'completed' ? 'bg-muted' : u.dot}`} />
                            </div>
                          );
                        })}
                        {dayTasks.length > 3 && (
                          <div className="text-[7px] text-muted font-bold text-center uppercase tracking-wide">
                            + {dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Daily Task List Console (Drawer/Panel below calendar) */}
      {selectedDay !== null && (
        <div className="glass-panel p-6 border-hairline space-y-4 bg-surface-soft relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] m-stripe" />
          
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Schedule Console — {monthNames[month]} {selectedDay}, {year}
            </h3>
            <button 
              onClick={() => setSelectedDay(null)} 
              className="text-[9px] text-muted hover:text-ink font-bold uppercase tracking-widest border border-hairline px-2.5 py-1 hover:border-muted transition-colors cursor-pointer"
            >
              Close Console
            </button>
          </div>

          {getTasksForDay(selectedDay).length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center justify-center gap-2">
              <Inbox className="w-5 h-5 text-muted" />
              <p className="text-xs text-muted italic">No tasks scheduled for this date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTasksForDay(selectedDay).map(task => {
                const u = getUrgencyColor(task.urgency || 'normal');
                const taskOverdue = isOverdue(task);
                const subtasks = task.subtasks || [];
                const subDone = subtasks.filter(s => s.completed).length;
                const pct = subtasks.length > 0 ? Math.round((subDone / subtasks.length) * 100) : (task.status === 'completed' ? 100 : 0);
                
                return (
                  <div 
                    key={task.id}
                    onClick={() => {
                      if (task.id.startsWith('mock_')) {
                        alert('This is a scheduled routine task. Active instances are generated on the Dashboard/Tasks manager daily.');
                        return;
                      }
                      setSelectedTaskId(task.id);
                      setIsDetailOpen(true);
                    }}
                    className={`glass-panel p-4 flex flex-col justify-between hover:bg-surface-soft transition-all duration-205 cursor-pointer border-l-4`}
                    style={{ borderLeftColor: u.hex }}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-xs font-bold uppercase tracking-wider text-ink truncate flex-1 flex items-center gap-1 ${task.status === 'completed' ? 'line-through text-muted' : ''}`}>
                          {task.id.startsWith('mock_') && <span className="opacity-80 shrink-0">🔁</span>}
                          <span className="truncate">{task.title}</span>
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

                    <div className="flex justify-between items-center text-[9px] text-muted mt-4 uppercase tracking-wide">
                      <span className="px-1.5 py-0.5 bg-canvas border border-hairline">
                        {task.category}
                      </span>
                      {taskOverdue && (
                        <span className="text-m-red font-bold animate-pulse text-[8px]">OVERDUE WARNING</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[8px] font-bold text-muted uppercase">
                        <span>Progress</span>
                        <span className="text-ink">{pct}%</span>
                      </div>
                      <div className="w-full h-0.5 bg-canvas border border-hairline">
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
      )}

      {/* Calendar info helper bar */}
      <div className="flex flex-wrap items-center gap-5 justify-center text-[9px] text-muted uppercase tracking-widest font-bold pt-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-m-red glow-pulse" />
          <span>🔴 Critical Urgency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-m-blue-dark glow-pulse" />
          <span>🔵 Important Urgency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success glow-pulse" />
          <span>🟢 Medium Urgency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warning glow-pulse" />
          <span>🟡 Normal Urgency</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-hairline pl-5">
          <div className="w-2.5 h-2.5 bg-surface-card border border-m-red/50 shadow-[0_0_4px_rgba(226,39,24,0.2)]" />
          <span>Overdue Glowing Node</span>
        </div>
      </div>

      {/* Reusable Detail Modal */}
      <TaskDetailModal 
        taskId={selectedTaskId}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedTaskId(null); }}
      />

    </div>
  );
}
