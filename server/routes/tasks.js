import express from 'express';
import { dbService, authMiddleware } from '../services/firebase.js';
import { PlannerAgent } from '../agents/plannerAgent.js';
import { PriorityAgent } from '../agents/priorityAgent.js';
import { ReminderAgent } from '../agents/reminderAgent.js';
import { updateMemoryOnTaskCompletion } from '../services/userMemory.js';

const router = express.Router();

// Apply authentication middleware to all task routes
router.use(authMiddleware);

// GET /api/tasks - Retrieve all tasks for the current authenticated user
router.get('/', async (req, res) => {
  const userId = req.user.uid;
  try {
    const tasks = await dbService.getTasks(userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Add a task. Triggers Planner, Priority, and Reminder agents
router.post('/', async (req, res) => {
  const userId = req.user.uid;
  const { title, description, deadline, importance, estimatedEffort, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    // 1. Get existing workload context for the Priority Agent
    const activeWorkload = await dbService.getTasks(userId);
    const pendingWorkload = activeWorkload.filter(t => t.status !== 'completed');

    // 2. Trigger Priority Agent
    console.log(`[Agent: Priority] Analyzing task: "${title}"`);
    const priorityResult = await PriorityAgent.prioritizeTask(
      { title, description, deadline, importance, estimatedEffort },
      pendingWorkload
    );

    // 3. Trigger Planner Agent to break down task
    console.log(`[Agent: Planner] Decomposing task: "${title}"`);
    const planResult = await PlannerAgent.planTask(title, description);

    // 4. Build temporary task to feed to Reminder Agent
    const tempTask = {
      title,
      description,
      deadline,
      priority: priorityResult.priority,
      estimatedEffort
    };

    // 5. Trigger Reminder Agent to get a context-aware alert nudge
    console.log(`[Agent: Reminder] Formulating custom reminder for: "${title}"`);
    const reminderResult = await ReminderAgent.generateReminder(tempTask, { workingHours: { start: '09:00', end: '17:00' } });

    // 6. Assemble complete database record
    const taskRecord = {
      title,
      description,
      deadline,
      category: category || 'General',
      importance: Number(importance) || 3,
      estimatedEffort: Number(estimatedEffort) || 60,
      priority: priorityResult.priority,
      urgencyScore: priorityResult.urgencyScore,
      priorityExplanation: priorityResult.explanation,
      subtasks: planResult.subtasks,
      suggestedExecutionFlow: planResult.suggestedExecutionFlow,
      reminderNudge: reminderResult.reminderText,
      reminderUrgency: reminderResult.urgencyLevel,
      reminderAction: reminderResult.actionPrompt,
      status: 'pending',
      urgency: req.body.urgency || 'normal',
      isRecurring: req.body.isRecurring || false,
      recurrenceDays: req.body.recurrenceDays || [],
      parentTaskId: req.body.parentTaskId || null,
      recurrenceDate: req.body.recurrenceDate || null,
      notes: ''
    };

    // 7. Save task in database
    const newTask = await dbService.addTask(userId, taskRecord);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task with agent assistance' });
  }
});

// PUT /api/tasks/:id - Update task details or complete subtasks. Triggers streak updates if marked completed
router.put('/:id', async (req, res) => {
  const userId = req.user.uid;
  const taskId = req.params.id;
  const updates = req.body;

  try {
    // Retrieve original task first
    const allTasks = await dbService.getTasks(userId);
    const existingTask = allTasks.find(t => t.id === taskId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Automatically toggle task status based on subtasks completion
    if (updates.subtasks && Array.isArray(updates.subtasks)) {
      const allCompleted = updates.subtasks.length > 0 && updates.subtasks.every(st => st.completed);
      if (allCompleted) {
        updates.status = 'completed';
      } else {
        if (updates.status === 'completed' || existingTask.status === 'completed') {
          updates.status = 'pending';
        }
      }
    }

    // Check if task is transitioning to completed status
    const isNowCompleted = updates.status === 'completed' && existingTask.status !== 'completed';

    const updatedTask = await dbService.updateTask(userId, taskId, updates);

    // If task is completed, handle streak tracking logic
    if (isNowCompleted) {
      const user = await dbService.getUser(userId);
      const todayString = new Date().toISOString().split('T')[0];
      const yesterdayString = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newStreak = user.streak || 0;
      let lastCompleted = user.lastCompletedDate;

      if (lastCompleted === todayString) {
        // Already completed tasks today, streak maintains
      } else if (lastCompleted === yesterdayString) {
        newStreak += 1;
        lastCompleted = todayString;
      } else {
        // Streak broke or starting fresh
        newStreak = 1;
        lastCompleted = todayString;
      }

      await dbService.updateUser(userId, {
        streak: newStreak,
        lastCompletedDate: lastCompleted,
        weeklyCompleted: (user.weeklyCompleted || 0) + 1
      });

      // Update analytics snapshot
      const analytics = await dbService.getAnalytics(userId);
      const history = analytics.history || [];
      const dayRecordIndex = history.findIndex(h => h.date === todayString);
      if (dayRecordIndex >= 0) {
        history[dayRecordIndex].completed += 1;
      } else {
        history.push({ date: todayString, completed: 1, missed: 0 });
      }
      await dbService.updateAnalytics(userId, { history });

      // Update user memory profile with new cognitive insights
      console.log('[User Memory] Updating cognitive memory after task completion...');
      await updateMemoryOnTaskCompletion(userId, updatedTask);
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// POST /api/tasks/:id/regenerate-plan - Explicitly regenerate plan using Planner Agent
router.post('/:id/regenerate-plan', async (req, res) => {
  const userId = req.user.uid;
  const taskId = req.params.id;

  try {
    const allTasks = await dbService.getTasks(userId);
    const existingTask = allTasks.find(t => t.id === taskId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log(`[Agent: Planner] Regenerating plan for: "${existingTask.title}"`);
    const planResult = await PlannerAgent.planTask(existingTask.title, existingTask.description);

    const updatedTask = await dbService.updateTask(userId, taskId, {
      subtasks: planResult.subtasks,
      suggestedExecutionFlow: planResult.suggestedExecutionFlow,
      status: 'pending' // reset status to pending as a new plan was generated
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error regenerating plan:', error);
    res.status(500).json({ error: 'Failed to regenerate task plan' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  const userId = req.user.uid;
  const taskId = req.params.id;

  try {
    await dbService.deleteTask(userId, taskId);
    res.json({ message: 'Task deleted successfully', id: taskId });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
