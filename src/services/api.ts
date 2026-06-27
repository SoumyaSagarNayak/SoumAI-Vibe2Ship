import { authService } from './firebase';

const API_BASE_URL = '/api';

// Helper for fetch operations with authorization
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = authService.getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred during the API call';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch (e) {
      // JSON parse failed
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

// Define task interface
export interface Subtask {
  title: string;
  durationMinutes: number;
  order: number;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  importance: number;
  estimatedEffort: number;
  subtasks: Subtask[];
  suggestedExecutionFlow?: string;
  reminderNudge?: string;
  reminderUrgency?: 'normal' | 'urgent' | 'critical';
  reminderAction?: string;
  urgency?: 'critical' | 'important' | 'medium' | 'normal';
  notes?: string;
  urgencyScore?: number;
  priorityExplanation?: string;
  recoveryStatus?: string;
  recoveryMessage?: string;
  recoverySteps?: string[];
  suggestedDeadline?: string;
  suggestedScheduleBlock?: string;
  isRecurring?: boolean;
  recurrenceDays?: string[];
  parentTaskId?: string;
  recurrenceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  streak: number;
  weeklyCompleted: number;
  completedCount: number;
  pendingCount: number;
  missedCount: number;
  successPercentage: number;
  reflection: {
    productivityScore: number;
    weeklyTrend: { day: string; completed: number }[];
    insights: string[];
    suggestions: string[];
  };
  motivation: {
    quote: string;
    advice: string;
  };
}

export interface ChatResponse {
  response: string;
  detectedTasks: {
    title: string;
    deadline?: string;
    importance?: number;
    estimatedEffort?: number;
    category?: string;
  }[];
  priorityAnalysis: string;
  suggestedPlan: string;
}

export interface TimeBlock {
  activity: string;
  timeSlot: string;
  durationMinutes: number;
}

export interface SchedulerResponse {
  morningPlan: TimeBlock[];
  afternoonPlan: TimeBlock[];
  eveningPlan: TimeBlock[];
  recommendedStudySessions: { sessionName: string; startTime: string; durationMinutes: number }[];
  rearrangementSuggestion: string;
}

// ---- New Extended Interfaces ----

export interface RescueData {
  stressLevel: 'Low' | 'Medium' | 'High';
  recoveryProbability: number;
  crisisMode: boolean;
  recommendations: string[];
  imminentTasks: { id: string; title: string; deadline: string }[];
  missedCount: number;
  pendingCount: number;
  streak: number;
}

export interface RecoveryResult {
  message: string;
  recoveredCount: number;
  recoveries: {
    original: Task;
    recovery: {
      status: string;
      newPriority: string;
      newSuggestedDeadline: string;
      newScheduleBlock: string;
      message: string;
      recoverySteps: string[];
    };
  }[];
}

export interface RecoveryStatus {
  overdueCount: number;
  overdueTasks: { id: string; title: string; deadline: string }[];
  needsRecovery: boolean;
}

export interface FocusStats {
  totalFocusMinutes: number;
  deepWorkHours: number;
  dailyFocusStreak: number;
  weeklyFocusStreak: number;
  sessionsCompleted: number;
  lastFocusDate: string | null;
}

export interface PomodoroSession {
  activity: string;
  timeSlot: string;
  workMinutes: number;
  breakMinutes: number;
  sessionNumber: number;
}

export interface FocusScheduleResponse {
  task: Task | null;
  pomodoroSessions: PomodoroSession[];
  rearrangementSuggestion: string;
}

export interface UserMemory {
  preferredStudyTime: string;
  averageCompletionRate: number;
  productiveHours: string[];
  procrastinationPattern: string;
  strongestCategory: string;
  weakestCategory: string;
  averageTaskDuration: number;
  streakHistory: number[];
}

// ---- Local Storage Database Helper for Offline Fallback ----
const localDb = {
  getTasks(): Task[] {
    const data = localStorage.getItem('vibe2ship_tasks');
    return data ? JSON.parse(data) : [];
  },
  setTasks(tasks: Task[]) {
    localStorage.setItem('vibe2ship_tasks', JSON.stringify(tasks));
  },
  getSchedule(): SchedulerResponse | null {
    const data = localStorage.getItem('vibe2ship_schedule');
    return data ? JSON.parse(data) : null;
  },
  setSchedule(schedule: SchedulerResponse) {
    localStorage.setItem('vibe2ship_schedule', JSON.stringify(schedule));
  },
  getAnalytics(): AnalyticsData | null {
    const data = localStorage.getItem('vibe2ship_analytics');
    return data ? JSON.parse(data) : null;
  },
  setAnalytics(analytics: AnalyticsData) {
    localStorage.setItem('vibe2ship_analytics', JSON.stringify(analytics));
  },
  getFocusStats(): FocusStats | null {
    const data = localStorage.getItem('vibe2ship_focusStats');
    return data ? JSON.parse(data) : null;
  },
  setFocusStats(stats: FocusStats) {
    localStorage.setItem('vibe2ship_focusStats', JSON.stringify(stats));
  },
  getRescueData(): RescueData | null {
    const data = localStorage.getItem('vibe2ship_rescueData');
    return data ? JSON.parse(data) : null;
  },
  setRescueData(rescue: RescueData) {
    localStorage.setItem('vibe2ship_rescueData', JSON.stringify(rescue));
  },
  getUserMemory(): UserMemory | null {
    const data = localStorage.getItem('vibe2ship_userMemory');
    return data ? JSON.parse(data) : null;
  },
  setUserMemory(memory: UserMemory) {
    localStorage.setItem('vibe2ship_userMemory', JSON.stringify(memory));
  }
};

function recomputeLocalStats() {
  const allTasks = localDb.getTasks();
  const tasks = allTasks.filter(t => !t.isRecurring);
  
  // Update Analytics
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const totalCount = tasks.length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const missedCount = tasks.filter(t => {
    if (t.status === 'completed' || !t.deadline) return false;
    return new Date(t.deadline) < today;
  }).length;
  
  const successPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const currentAnalytics = localDb.getAnalytics() || {
    streak: 0,
    weeklyCompleted: 0,
    completedCount: 0,
    pendingCount: 0,
    missedCount: 0,
    successPercentage: 0,
    reflection: {
      productivityScore: 70,
      weeklyTrend: [
        { day: 'Mon', completed: 0 },
        { day: 'Tue', completed: 0 },
        { day: 'Wed', completed: 0 },
        { day: 'Thu', completed: 0 },
        { day: 'Fri', completed: 0 },
        { day: 'Sat', completed: 0 },
        { day: 'Sun', completed: 0 }
      ],
      insights: ['Get started by adding tasks.'],
      suggestions: ['Focus on high-priority items first.']
    },
    motivation: {
      quote: "Believe you can and you're halfway there.",
      advice: "Try time-blocking your study slots."
    }
  };
  
  // Dynamic Streak Calculation
  const getLocalDateString = (d: Date) => {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const todayStr = getLocalDateString(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  const completedDates = new Set<string>();
  tasks.forEach(t => {
    if (t.status === 'completed') {
      const datePart = t.updatedAt ? t.updatedAt.split('T')[0] : todayStr;
      completedDates.add(datePart);
    }
  });

  let computedStreak = 0;
  const hasCompletedToday = completedDates.has(todayStr);
  const hasCompletedYesterday = completedDates.has(yesterdayStr);

  if (hasCompletedToday) {
    computedStreak = 1;
    const nextCheck = new Date();
    nextCheck.setDate(nextCheck.getDate() - 1);
    while (completedDates.has(getLocalDateString(nextCheck))) {
      computedStreak++;
      nextCheck.setDate(nextCheck.getDate() - 1);
    }
  } else if (hasCompletedYesterday) {
    computedStreak = 1;
    const nextCheck = new Date();
    nextCheck.setDate(nextCheck.getDate() - 2);
    while (completedDates.has(getLocalDateString(nextCheck))) {
      computedStreak++;
      nextCheck.setDate(nextCheck.getDate() - 1);
    }
  } else {
    computedStreak = 0;
  }

  currentAnalytics.streak = computedStreak;
  currentAnalytics.completedCount = completedCount;
  currentAnalytics.pendingCount = pendingCount;
  currentAnalytics.missedCount = missedCount;
  currentAnalytics.successPercentage = successPercentage;
  currentAnalytics.reflection.productivityScore = Math.max(30, Math.min(100, 50 + successPercentage / 2));
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDayName = daysOfWeek[new Date().getDay()];
  currentAnalytics.reflection.weeklyTrend = currentAnalytics.reflection.weeklyTrend.map(item => {
    if (item.day === currentDayName) {
      return { ...item, completed: completedCount };
    }
    return item;
  });
  
  localDb.setAnalytics(currentAnalytics);
  
  // Update RescueData
  const highPriorityPending = tasks.filter(t => t.priority === 'High' && t.status !== 'completed');
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || !t.deadline) return false;
    return new Date(t.deadline) < today;
  });
  
  let stressLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (overdueTasks.length > 2 || highPriorityPending.length > 3) {
    stressLevel = 'High';
  } else if (overdueTasks.length > 0 || highPriorityPending.length > 0) {
    stressLevel = 'Medium';
  }
  
  const recoveryProbability = Math.max(10, Math.min(99, 90 - overdueTasks.length * 15 - highPriorityPending.length * 5));
  const crisisMode = stressLevel === 'High';
  
  const recommendations = [];
  if (crisisMode) {
    recommendations.push("Activate Crisis Mode to reschedule non-essential tasks.");
    recommendations.push("Take a 5-minute deep breathing break before starting.");
  } else if (stressLevel === 'Medium') {
    recommendations.push("Prioritize high-value task lists to clear immediate backlogs.");
  } else {
    recommendations.push("Workspace is operating at optimal levels. Maintain this current tempo.");
  }
  
  const rescueData: RescueData = {
    stressLevel,
    recoveryProbability,
    crisisMode,
    recommendations,
    imminentTasks: tasks.filter(t => t.status !== 'completed' && t.deadline).map(t => ({ id: t.id, title: t.title, deadline: t.deadline! })),
    missedCount,
    pendingCount,
    streak: currentAnalytics.streak
  };
  localDb.setRescueData(rescueData);
}

// ---- Exported API actions ----
export const api = {
  // Tasks endpoints
  async getTasks(): Promise<Task[]> {
    try {
      const serverTasks = await apiFetch('/tasks');
      localDb.setTasks(serverTasks);
      return serverTasks;
    } catch (e) {
      console.warn('API getTasks failed, falling back to localStorage', e);
      return localDb.getTasks();
    }
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const serverTask = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      const tasks = localDb.getTasks();
      const updated = [serverTask, ...tasks.filter(t => t.id !== serverTask.id)];
      localDb.setTasks(updated);
      return serverTask;
    } catch (e) {
      console.warn('API createTask failed, falling back to localStorage', e);
      const now = new Date().toISOString();
      const newTask: Task = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        deadline: taskData.deadline || null,
        status: 'pending',
        priority: taskData.priority || 'Medium',
        category: taskData.category || 'General',
        importance: Number(taskData.importance) || 3,
        estimatedEffort: Number(taskData.estimatedEffort) || 60,
        subtasks: taskData.subtasks || [
          { title: 'Understand requirements', durationMinutes: 15, order: 1, completed: false },
          { title: 'Draft execution steps', durationMinutes: 30, order: 2, completed: false },
          { title: 'Review and verify results', durationMinutes: 15, order: 3, completed: false }
        ],
        urgency: taskData.urgency || 'normal',
        isRecurring: taskData.isRecurring || false,
        recurrenceDays: taskData.recurrenceDays || [],
        parentTaskId: taskData.parentTaskId || undefined,
        recurrenceDate: taskData.recurrenceDate || undefined,
        notes: '',
        createdAt: now,
        updatedAt: now,
        suggestedExecutionFlow: 'Sequential breakdown',
        reminderNudge: `Start working on "${taskData.title}" to stay on track.`,
        reminderUrgency: 'normal',
        reminderAction: 'Open Timer'
      };
      
      const tasks = localDb.getTasks();
      localDb.setTasks([newTask, ...tasks]);
      recomputeLocalStats();
      return newTask;
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const serverTask = await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      const tasks = localDb.getTasks();
      const updated = tasks.map(t => t.id === taskId ? serverTask : t);
      localDb.setTasks(updated);
      return serverTask;
    } catch (e) {
      console.warn(`API updateTask for ${taskId} failed, falling back to localStorage`, e);
      const tasks = localDb.getTasks();
      const index = tasks.findIndex(t => t.id === taskId);
      if (index === -1) {
        throw new Error('Task not found in local cache');
      }
      
      const updatedTask = {
        ...tasks[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      if (updates.status === 'completed') {
        updatedTask.subtasks = updatedTask.subtasks.map(s => ({ ...s, completed: true }));
      }
      
      tasks[index] = updatedTask;
      localDb.setTasks(tasks);
      recomputeLocalStats();
      return updatedTask;
    }
  },

  async deleteTask(taskId: string): Promise<{ message: string; id: string }> {
    try {
      const res = await apiFetch(`/tasks/${taskId}`, {
        method: 'DELETE'
      });
      const tasks = localDb.getTasks();
      const updated = tasks.filter(t => t.id !== taskId);
      localDb.setTasks(updated);
      return res;
    } catch (e) {
      console.warn(`API deleteTask for ${taskId} failed, falling back to localStorage`, e);
      const tasks = localDb.getTasks();
      const updated = tasks.filter(t => t.id !== taskId);
      localDb.setTasks(updated);
      recomputeLocalStats();
      return { message: 'Deleted locally', id: taskId };
    }
  },

  // AI assistant endpoints
  async sendChatMessage(message: string): Promise<ChatResponse> {
    try {
      return await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    } catch (e) {
      console.warn('API sendChatMessage failed, falling back to local simulation', e);
      const lowercaseMsg = message.toLowerCase();
      let reply = "I am operating in Offline Recovery Mode. ";
      const detectedTasks: any[] = [];
      
      if (lowercaseMsg.includes('add') || lowercaseMsg.includes('todo') || lowercaseMsg.includes('task') || lowercaseMsg.includes('remind')) {
        const match = message.match(/(?:add|create|task|todo)\s+([^,.]+)/i);
        const taskTitle = match ? match[1].trim() : 'New Task';
        
        reply += `I detected a task: "${taskTitle}". You can add this in the Tasks tab or I can suggest planning details for it once the server is back online.`;
        detectedTasks.push({
          title: taskTitle,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          importance: 3,
          estimatedEffort: 60,
          category: 'General'
        });
      } else if (lowercaseMsg.includes('hello') || lowercaseMsg.includes('hi')) {
        reply += "Hello! How can I assist you with your tasks today?";
      } else if (lowercaseMsg.includes('calendar') || lowercaseMsg.includes('schedule') || lowercaseMsg.includes('plan')) {
        reply += "You can view your offline study blocks in the Calendar tab. I will be able to run cognitive schedule rearrangement once the server reconnects.";
      } else {
        reply += "I'm keeping track of your workspace locally. Feel free to manage tasks, use the Focus Timer, and review Analytics. To interact with my AI capabilities, please start the Node server.";
      }
      
      return {
        response: reply,
        detectedTasks,
        priorityAnalysis: 'Offline prioritizer - pending sync.',
        suggestedPlan: 'Plan: Work on current tasks locally.'
      };
    }
  },

  async generateDailyPlan(): Promise<SchedulerResponse> {
    try {
      const plan = await apiFetch('/ai/plan', {
        method: 'POST'
      });
      localDb.setSchedule(plan);
      return plan;
    } catch (e) {
      console.warn('API generateDailyPlan failed, falling back to local generation', e);
      const cached = localDb.getSchedule();
      if (cached) return cached;
      
      const tasks = localDb.getTasks().filter(t => t.status !== 'completed');
      const morningPlan: TimeBlock[] = [];
      const afternoonPlan: TimeBlock[] = [];
      const eveningPlan: TimeBlock[] = [];
      
      tasks.forEach((task, idx) => {
        const block = {
          activity: `Focus on: ${task.title}`,
          timeSlot: idx % 3 === 0 ? '09:00 - 10:30' : idx % 3 === 1 ? '14:00 - 15:30' : '19:00 - 20:30',
          durationMinutes: task.estimatedEffort || 60
        };
        if (idx % 3 === 0) morningPlan.push(block);
        else if (idx % 3 === 1) afternoonPlan.push(block);
        else eveningPlan.push(block);
      });
      
      if (morningPlan.length === 0) morningPlan.push({ activity: 'Review daily targets', timeSlot: '09:00 - 09:30', durationMinutes: 30 });
      if (afternoonPlan.length === 0) afternoonPlan.push({ activity: 'Open block for tasks', timeSlot: '14:00 - 15:00', durationMinutes: 60 });
      if (eveningPlan.length === 0) eveningPlan.push({ activity: 'Evening reflection', timeSlot: '19:30 - 20:00', durationMinutes: 30 });
      
      const newPlan: SchedulerResponse = {
        morningPlan,
        afternoonPlan,
        eveningPlan,
        recommendedStudySessions: [
          { sessionName: 'Core Study Session', startTime: '10:00', durationMinutes: 90 },
          { sessionName: 'Secondary Review', startTime: '15:00', durationMinutes: 60 }
        ],
        rearrangementSuggestion: 'Offline daily block structure suggested by local scheduler.'
      };
      
      localDb.setSchedule(newPlan);
      return newPlan;
    }
  },

  async prioritizeTasks(): Promise<{ message: string; tasks: Task[] }> {
    try {
      const res = await apiFetch('/ai/prioritize', {
        method: 'POST'
      });
      if (res.tasks) {
        localDb.setTasks(res.tasks);
      }
      return res;
    } catch (e) {
      console.warn('API prioritizeTasks failed, sorting local cache', e);
      const tasks = localDb.getTasks();
      const sorted = [...tasks].sort((a, b) => {
        const priorityScore = { High: 3, Medium: 2, Low: 1 };
        const pA = priorityScore[a.priority] || 2;
        const pB = priorityScore[b.priority] || 2;
        return pB - pA;
      });
      localDb.setTasks(sorted);
      return { message: 'Sorted locally', tasks: sorted };
    }
  },

  // Analytics endpoints
  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const analyticsData = await apiFetch('/analytics');
      localDb.setAnalytics(analyticsData);
      return analyticsData;
    } catch (e) {
      console.warn('API getAnalytics failed, falling back to localStorage', e);
      let cached = localDb.getAnalytics();
      if (!cached) {
        recomputeLocalStats();
        cached = localDb.getAnalytics()!;
      }
      return cached;
    }
  },

  // Rescue Agent endpoint
  async getRescueAnalysis(): Promise<RescueData> {
    try {
      const rescueData = await apiFetch('/analytics/rescue');
      localDb.setRescueData(rescueData);
      return rescueData;
    } catch (e) {
      console.warn('API getRescueAnalysis failed, falling back to localStorage', e);
      let cached = localDb.getRescueData();
      if (!cached) {
        recomputeLocalStats();
        cached = localDb.getRescueData()!;
      }
      return cached;
    }
  },

  // Recovery endpoints
  async getRecoveryStatus(): Promise<RecoveryStatus> {
    try {
      return await apiFetch('/recovery/status');
    } catch (e) {
      console.warn('API getRecoveryStatus failed, calculating from local cache', e);
      const tasks = localDb.getTasks();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueTasks = tasks
        .filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < today)
        .map(t => ({ id: t.id, title: t.title, deadline: t.deadline! }));
      
      return {
        overdueCount: overdueTasks.length,
        overdueTasks,
        needsRecovery: overdueTasks.length > 0
      };
    }
  },

  async runRecoveryCheck(): Promise<RecoveryResult> {
    try {
      return await apiFetch('/recovery/check', { method: 'POST' });
    } catch (e) {
      console.warn('API runRecoveryCheck failed, processing locally', e);
      const tasks = localDb.getTasks();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const recovered: any[] = [];
      const updatedTasks = tasks.map(task => {
        if (task.status !== 'completed' && task.deadline && new Date(task.deadline) < today) {
          const recoveryDetail = {
            status: 'pending',
            newPriority: 'Medium',
            newSuggestedDeadline: tomorrowStr,
            newScheduleBlock: '14:00 - 15:00',
            message: `Overdue task rescheduled to tomorrow.`,
            recoverySteps: ['Break task into smaller parts', 'Block 30 minutes in the afternoon']
          };
          recovered.push({
            original: { ...task },
            recovery: recoveryDetail
          });
          return {
            ...task,
            deadline: tomorrowStr,
            priority: 'Medium' as any,
            recoveryStatus: 'Rescheduled',
            recoveryMessage: recoveryDetail.message,
            recoverySteps: recoveryDetail.recoverySteps
          };
        }
        return task;
      });
      
      localDb.setTasks(updatedTasks);
      recomputeLocalStats();
      
      return {
        message: `Successfully recovered ${recovered.length} tasks locally.`,
        recoveredCount: recovered.length,
        recoveries: recovered
      };
    }
  },

  // Focus Timer endpoints
  async getFocusStats(): Promise<FocusStats> {
    try {
      const stats = await apiFetch('/focus/stats');
      localDb.setFocusStats(stats);
      return stats;
    } catch (e) {
      console.warn('API getFocusStats failed, falling back to localStorage', e);
      let cached = localDb.getFocusStats();
      if (!cached) {
        cached = {
          totalFocusMinutes: 0,
          deepWorkHours: 0,
          dailyFocusStreak: 0,
          weeklyFocusStreak: 0,
          sessionsCompleted: 0,
          lastFocusDate: null
        };
        localDb.setFocusStats(cached);
      }
      return cached;
    }
  },

  async completeFocusSession(durationMinutes: number): Promise<{ message: string; stats: FocusStats }> {
    try {
      const res = await apiFetch('/focus/session/complete', {
        method: 'POST',
        body: JSON.stringify({ durationMinutes })
      });
      localDb.setFocusStats(res.stats);
      return res;
    } catch (e) {
      console.warn('API completeFocusSession failed, updating localStorage', e);
      const stats = localDb.getFocusStats() || {
        totalFocusMinutes: 0,
        deepWorkHours: 0,
        dailyFocusStreak: 0,
        weeklyFocusStreak: 0,
        sessionsCompleted: 0,
        lastFocusDate: null
      };
      
      stats.sessionsCompleted += 1;
      stats.totalFocusMinutes += durationMinutes;
      stats.deepWorkHours = Math.round((stats.totalFocusMinutes / 60) * 10) / 10;
      
      const todayStr = new Date().toISOString().split('T')[0];
      if (stats.lastFocusDate !== todayStr) {
        stats.dailyFocusStreak += 1;
        stats.lastFocusDate = todayStr;
      }
      
      localDb.setFocusStats(stats);
      return { message: 'Completed locally', stats };
    }
  },

  async getFocusSchedule(taskId?: string): Promise<FocusScheduleResponse> {
    try {
      return await apiFetch('/focus/schedule', {
        method: 'POST',
        body: JSON.stringify({ taskId })
      });
    } catch (e) {
      console.warn('API getFocusSchedule failed, returning offline Pomodoro plan', e);
      const tasks = localDb.getTasks();
      const task = taskId ? (tasks.find(t => t.id === taskId) || null) : null;
      const activityName = task ? task.title : 'General Study & Review';
      
      const pomodoroSessions: PomodoroSession[] = [
        { activity: activityName, timeSlot: '10:00 - 10:50', workMinutes: 50, breakMinutes: 10, sessionNumber: 1 },
        { activity: activityName, timeSlot: '11:00 - 11:50', workMinutes: 50, breakMinutes: 10, sessionNumber: 2 }
      ];
      
      return {
        task,
        pomodoroSessions,
        rearrangementSuggestion: 'Offline Pomodoro schedule active.'
      };
    }
  },

  // User memory profile
  async getMemoryProfile(): Promise<UserMemory> {
    try {
      const memory = await apiFetch('/analytics/memory');
      localDb.setUserMemory(memory);
      return memory;
    } catch (e) {
      console.warn('API getMemoryProfile failed, returning cache', e);
      let cached = localDb.getUserMemory();
      if (!cached) {
        cached = {
          preferredStudyTime: 'Morning (09:00 - 12:00)',
          averageCompletionRate: 85,
          productiveHours: ['09:00', '10:00', '14:00'],
          procrastinationPattern: 'Late evening delay',
          strongestCategory: 'School',
          weakestCategory: 'General',
          averageTaskDuration: 60,
          streakHistory: [3, 5, 2]
        };
        localDb.setUserMemory(cached);
      }
      return cached;
    }
  },

  async regenerateTaskPlan(taskId: string): Promise<Task> {
    try {
      const serverTask = await apiFetch(`/tasks/${taskId}/regenerate-plan`, {
        method: 'POST'
      });
      const tasks = localDb.getTasks();
      const updated = tasks.map(t => t.id === taskId ? serverTask : t);
      localDb.setTasks(updated);
      return serverTask;
    } catch (e) {
      console.warn(`API regenerateTaskPlan failed for ${taskId}, returning local updates`, e);
      const tasks = localDb.getTasks();
      const index = tasks.findIndex(t => t.id === taskId);
      if (index === -1) throw new Error('Task not found');
      
      const task = tasks[index];
      task.subtasks = [
        { title: `Breakdown phase 1: Initialize ${task.title}`, durationMinutes: 15, order: 1, completed: false },
        { title: `Breakdown phase 2: Develop core modules`, durationMinutes: 45, order: 2, completed: false },
        { title: `Breakdown phase 3: Test and finalize`, durationMinutes: 20, order: 3, completed: false }
      ];
      task.suggestedExecutionFlow = 'Step-by-step sequential path';
      
      tasks[index] = task;
      localDb.setTasks(tasks);
      return task;
    }
  }
};

