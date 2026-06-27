import express from 'express';
import { dbService, authMiddleware } from '../services/firebase.js';
import { SchedulerAgent } from '../agents/schedulerAgent.js';

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

/**
 * GET /api/focus/stats
 * Returns the user's accumulated focus statistics stored in their profile.
 */
router.get('/stats', async (req, res) => {
  const userId = req.user.uid;
  try {
    const user = await dbService.getUser(userId);
    const focusStats = user.focusStats || {
      totalFocusMinutes: 0,
      deepWorkHours: 0,
      dailyFocusStreak: 0,
      weeklyFocusStreak: 0,
      sessionsCompleted: 0,
      lastFocusDate: null
    };
    res.json(focusStats);
  } catch (error) {
    console.error('Error fetching focus stats:', error);
    res.status(500).json({ error: 'Failed to fetch focus statistics' });
  }
});

/**
 * POST /api/focus/session/complete
 * Called when the user completes a Pomodoro session.
 * Updates totalFocusMinutes, sessionsCompleted, deepWorkHours, and streaks.
 */
router.post('/session/complete', async (req, res) => {
  const userId = req.user.uid;
  const { durationMinutes = 50 } = req.body;

  try {
    const user = await dbService.getUser(userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const currentStats = user.focusStats || {
      totalFocusMinutes: 0,
      deepWorkHours: 0,
      dailyFocusStreak: 0,
      weeklyFocusStreak: 0,
      sessionsCompleted: 0,
      lastFocusDate: null
    };

    // Update total focus time
    const newTotalMinutes = (currentStats.totalFocusMinutes || 0) + durationMinutes;

    // Update sessions count
    const newSessionsCompleted = (currentStats.sessionsCompleted || 0) + 1;

    // Count sessions >= 45 min as deep work
    const newDeepWorkHours = durationMinutes >= 45
      ? parseFloat(((currentStats.deepWorkHours || 0) + durationMinutes / 60).toFixed(1))
      : currentStats.deepWorkHours || 0;

    // Daily streak tracking
    let newDailyStreak = currentStats.dailyFocusStreak || 0;
    if (currentStats.lastFocusDate === yesterday) {
      newDailyStreak += 1;
    } else if (currentStats.lastFocusDate !== today) {
      newDailyStreak = 1; // Reset or start
    }

    // Weekly streak: simplified — increment if we have consistent daily streaks >= 5 days
    const newWeeklyStreak = newDailyStreak >= 5
      ? Math.floor(newDailyStreak / 7) + 1
      : currentStats.weeklyFocusStreak || 0;

    const updatedStats = {
      totalFocusMinutes: newTotalMinutes,
      deepWorkHours: newDeepWorkHours,
      dailyFocusStreak: newDailyStreak,
      weeklyFocusStreak: newWeeklyStreak,
      sessionsCompleted: newSessionsCompleted,
      lastFocusDate: today
    };

    console.log(`[Focus Engine] Session complete for user ${userId}: ${durationMinutes} mins`);
    await dbService.updateUser(userId, { focusStats: updatedStats });

    res.json({
      message: `Focus session of ${durationMinutes} minutes recorded!`,
      stats: updatedStats
    });
  } catch (error) {
    console.error('Error completing focus session:', error);
    res.status(500).json({ error: 'Failed to record focus session' });
  }
});

/**
 * POST /api/focus/schedule
 * Uses the Scheduler Agent to generate Pomodoro-style focus blocks for a specific task.
 * Returns an array of { workMinutes, breakMinutes, activity } objects.
 */
router.post('/schedule', async (req, res) => {
  const userId = req.user.uid;
  const { taskId } = req.body;

  try {
    const tasks = await dbService.getTasks(userId);
    const user = await dbService.getUser(userId);

    let targetTask = null;
    if (taskId) {
      targetTask = tasks.find(t => t.id === taskId);
    }

    // Generate schedule: if no specific task, use all pending tasks
    const taskList = targetTask ? [targetTask] : tasks.filter(t => t.status !== 'completed');

    console.log('[Focus Engine] Generating Pomodoro schedule for task focus');
    const schedule = await SchedulerAgent.generateDailyPlan(taskList, user);

    // Build Pomodoro sessions from the schedule
    const pomodoroSessions = [];
    const allBlocks = [
      ...(schedule.morningPlan || []),
      ...(schedule.afternoonPlan || []),
      ...(schedule.eveningPlan || [])
    ];

    for (const block of allBlocks) {
      const totalMins = block.durationMinutes || 60;
      const workBlocks = Math.floor(totalMins / 60);
      for (let i = 0; i < Math.max(workBlocks, 1); i++) {
        pomodoroSessions.push({
          activity: block.activity,
          timeSlot: block.timeSlot,
          workMinutes: 50,
          breakMinutes: 10,
          sessionNumber: pomodoroSessions.length + 1
        });
      }
    }

    res.json({
      task: targetTask || null,
      pomodoroSessions,
      rearrangementSuggestion: schedule.rearrangementSuggestion
    });
  } catch (error) {
    console.error('Focus schedule error:', error);
    res.status(500).json({ error: 'Failed to generate focus schedule' });
  }
});

export default router;
