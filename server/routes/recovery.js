import express from 'express';
import { dbService, authMiddleware } from '../services/firebase.js';
import { RecoveryAgent } from '../agents/recoveryAgent.js';

const router = express.Router();

// Apply authentication middleware to all recovery routes
router.use(authMiddleware);

/**
 * POST /api/recovery/check
 * Scans the user's tasks for overdue items and runs the Recovery Agent
 * on each one. Updates the task's priority and suggested deadline in the DB.
 */
router.post('/check', async (req, res) => {
  const userId = req.user.uid;

  try {
    const tasks = await dbService.getTasks(userId);
    const user = await dbService.getUser(userId);

    console.log('[Route: Recovery] Scanning for overdue tasks...');
    const result = await RecoveryAgent.scanAndRecover(tasks, user);

    // Update each recovered task's priority in the database
    const updatedTasks = [];
    for (const { task, recovery } of result.recoveries) {
      try {
        const updated = await dbService.updateTask(userId, task.id, {
          priority: recovery.newPriority,
          recoveryStatus: recovery.status,
          recoveryMessage: recovery.message,
          recoverySteps: recovery.recoverySteps,
          suggestedDeadline: recovery.newSuggestedDeadline,
          suggestedScheduleBlock: recovery.newScheduleBlock
        });
        updatedTasks.push({ original: task, recovery, updated });
      } catch (updateError) {
        console.error(`Failed to update recovered task ${task.id}:`, updateError);
        updatedTasks.push({ original: task, recovery, error: 'Update failed' });
      }
    }

    res.json({
      message: result.message,
      recoveredCount: result.recoveries.length,
      recoveries: updatedTasks
    });
  } catch (error) {
    console.error('Error running recovery check:', error);
    res.status(500).json({ error: 'Recovery check failed' });
  }
});

/**
 * GET /api/recovery/status
 * Returns a lightweight count of overdue tasks without triggering agent calls.
 * Used by the dashboard to decide whether to show the recovery prompt.
 */
router.get('/status', async (req, res) => {
  const userId = req.user.uid;

  try {
    const tasks = await dbService.getTasks(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.deadline) return false;
      return new Date(t.deadline) < today;
    });

    res.json({
      overdueCount: overdueTasks.length,
      overdueTasks: overdueTasks.map(t => ({ id: t.id, title: t.title, deadline: t.deadline })),
      needsRecovery: overdueTasks.length > 0
    });
  } catch (error) {
    console.error('Error fetching recovery status:', error);
    res.status(500).json({ error: 'Failed to fetch recovery status' });
  }
});

export default router;
