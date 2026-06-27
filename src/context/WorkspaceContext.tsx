import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { 
  Task, 
  SchedulerResponse, 
  AnalyticsData, 
  FocusStats, 
  RescueData, 
  UserMemory 
} from '../services/api';

interface WorkspaceContextType {
  tasks: Task[];
  schedule: SchedulerResponse | null;
  analytics: AnalyticsData | null;
  focusStats: FocusStats | null;
  rescueData: RescueData | null;
  userMemory: UserMemory | null;
  loading: boolean;
  error: string;
  refreshWorkspace: (silent?: boolean) => Promise<void>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSchedule: React.Dispatch<React.SetStateAction<SchedulerResponse | null>>;
  setAnalytics: React.Dispatch<React.SetStateAction<AnalyticsData | null>>;
  setFocusStats: React.Dispatch<React.SetStateAction<FocusStats | null>>;
  setRescueData: React.Dispatch<React.SetStateAction<RescueData | null>>;
  setUserMemory: React.Dispatch<React.SetStateAction<UserMemory | null>>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('vibe2ship_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [schedule, setSchedule] = useState<SchedulerResponse | null>(() => {
    const saved = localStorage.getItem('vibe2ship_schedule');
    return saved ? JSON.parse(saved) : null;
  });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(() => {
    const saved = localStorage.getItem('vibe2ship_analytics');
    return saved ? JSON.parse(saved) : null;
  });
  const [focusStats, setFocusStats] = useState<FocusStats | null>(() => {
    const saved = localStorage.getItem('vibe2ship_focusStats');
    return saved ? JSON.parse(saved) : null;
  });
  const [rescueData, setRescueData] = useState<RescueData | null>(() => {
    const saved = localStorage.getItem('vibe2ship_rescueData');
    return saved ? JSON.parse(saved) : null;
  });
  const [userMemory, setUserMemory] = useState<UserMemory | null>(() => {
    const saved = localStorage.getItem('vibe2ship_userMemory');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(() => {
    const hasCachedData = localStorage.getItem('vibe2ship_tasks') !== null;
    return !hasCachedData;
  });
  const [error, setError] = useState('');

// Helper to automatically generate routine tasks
const checkAndGenerateRoutineTasks = async (
  currentTasks: Task[],
  setTasksState: React.Dispatch<React.SetStateAction<Task[]>>
) => {
  const templates = currentTasks.filter(t => t.isRecurring);
  
  const defaultRoutines = [
    { title: 'doing gym', description: 'Daily fitness routine and strength training', category: 'Personal', priority: 'Medium' as const, importance: 3, estimatedEffort: 60, recurrenceDays: ['Daily'] },
    { title: 'doing dsa', description: 'Practice algorithmic problems and data structures', category: 'General', priority: 'High' as const, importance: 4, estimatedEffort: 45, recurrenceDays: ['Daily'] },
    { title: 'doing development', description: 'Work on coding projects, building features and fixing bugs', category: 'Work', priority: 'High' as const, importance: 4, estimatedEffort: 90, recurrenceDays: ['Daily'] }
  ];

  let tasksUpdated = [...currentTasks];
  let stateChanged = false;

  // 1. Create missing default templates
  for (const def of defaultRoutines) {
    const exists = templates.some(t => t.title.toLowerCase() === def.title.toLowerCase());
    if (!exists) {
      try {
        console.log(`Creating default routine template: ${def.title}`);
        const newTemplate = await api.createTask({
          title: def.title,
          description: def.description,
          category: def.category,
          priority: def.priority,
          importance: def.importance,
          estimatedEffort: def.estimatedEffort,
          isRecurring: true,
          recurrenceDays: def.recurrenceDays,
          urgency: 'normal'
        });
        tasksUpdated.push(newTemplate);
        stateChanged = true;
      } catch (err) {
        console.error(`Failed to create default routine template for ${def.title}:`, err);
      }
    }
  }

  const finalTemplates = tasksUpdated.filter(t => t.isRecurring);
  
  // 2. Generate checkable task instances for today
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = daysOfWeek[today.getDay()];

  for (const template of finalTemplates) {
    const alreadyGenerated = tasksUpdated.some(
      t => t.parentTaskId === template.id && t.recurrenceDate === todayStr
    );

    if (!alreadyGenerated) {
      const matchesDaily = template.recurrenceDays?.some(d => d.toLowerCase() === 'daily');
      const matchesSpecificDay = template.recurrenceDays?.some(d => d.toLowerCase() === todayDayName.toLowerCase());

      if (matchesDaily || matchesSpecificDay) {
        try {
          console.log(`Generating routine task instance for today: ${template.title}`);
          const newInstance = await api.createTask({
            title: template.title,
            description: template.description,
            category: template.category,
            priority: template.priority,
            importance: template.importance,
            estimatedEffort: template.estimatedEffort,
            parentTaskId: template.id,
            recurrenceDate: todayStr,
            deadline: todayStr,
            urgency: 'normal',
            isRecurring: false
          });
          tasksUpdated.push(newInstance);
          stateChanged = true;
        } catch (err) {
          console.error(`Failed to generate routine instance for ${template.title}:`, err);
        }
      }
    }
  }

  if (stateChanged) {
    setTasksState(tasksUpdated);
    localStorage.setItem('vibe2ship_tasks', JSON.stringify(tasksUpdated));
  }
};

  const refreshWorkspace = async (silent = false) => {
    const hasCachedData = localStorage.getItem('vibe2ship_tasks') !== null;
    const runSilently = silent || hasCachedData;

    if (!runSilently) setLoading(true);
    setError('');
    try {
      const [
        tasksRes, 
        scheduleRes, 
        analyticsRes, 
        focusStatsRes, 
        rescueDataRes, 
        userMemoryRes
      ] = await Promise.all([
        api.getTasks(),
        api.generateDailyPlan(),
        api.getAnalytics(),
        api.getFocusStats(),
        api.getRescueAnalysis(),
        api.getMemoryProfile()
      ]);

      setTasks(tasksRes);
      setSchedule(scheduleRes);
      setAnalytics(analyticsRes);
      setFocusStats(focusStatsRes);
      setRescueData(rescueDataRes);
      setUserMemory(userMemoryRes);

      // Trigger automatic routine generation
      await checkAndGenerateRoutineTasks(tasksRes, setTasks);
    } catch (e: any) {
      console.error('Error refreshing workspace:', e);
      setError('Could not connect to backend server. Operating in local-first fallback mode.');
    } finally {
      if (!runSilently) setLoading(false);
    }
  };

  useEffect(() => {
    const hasCachedData = localStorage.getItem('vibe2ship_tasks') !== null;
    refreshWorkspace(hasCachedData);
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      tasks,
      schedule,
      analytics,
      focusStats,
      rescueData,
      userMemory,
      loading,
      error,
      refreshWorkspace,
      setTasks,
      setSchedule,
      setAnalytics,
      setFocusStats,
      setRescueData,
      setUserMemory
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
