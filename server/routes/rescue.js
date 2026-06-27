import express from 'express';
import { dbService, authMiddleware } from '../services/firebase.js';
import { RescueAgent } from '../agents/rescueAgent.js';

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

/**
 * GET /api/analytics/rescue
 * Calls the Rescue Agent with the user's current workload data.
 * Returns stress level, recovery probability, and recommendations.
 */
router.get('/rescue', async (req, res) => {
  const userId = req.user.uid;

  try {
    const tasks = await dbService.getTasks(userId);
    const user = await dbService.getUser(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const missedTasks = pendingTasks.filter(t => {
      if (!t.deadline) return false;
      return new Date(t.deadline) < today;
    });

    console.log('[Agent: Rescue] Running stress pattern analysis...');
    const rescueResult = await RescueAgent.analyzeStress({
      missedTasks,
      pendingTasks,
      streak: user.streak || 0,
      userMemory: user.memory || {}
    });

    res.json({
      ...rescueResult,
      missedCount: missedTasks.length,
      pendingCount: pendingTasks.length,
      streak: user.streak || 0
    });
  } catch (error) {
    console.error('Error running rescue analysis:', error);
    res.status(500).json({ error: 'Rescue analysis failed' });
  }
});

/**
 * GET /api/analytics/memory
 * Returns the user's cognitive memory profile (updated on task completion).
 */
router.get('/memory', async (req, res) => {
  const userId = req.user.uid;
  try {
    const user = await dbService.getUser(userId);
    const memory = user.memory || {
      preferredStudyTime: 'Not enough data yet',
      averageCompletionRate: 0,
      productiveHours: [],
      procrastinationPattern: 'Complete tasks to reveal your patterns.',
      strongestCategory: '—',
      weakestCategory: '—',
      averageTaskDuration: 0,
      streakHistory: []
    };
    res.json(memory);
  } catch (error) {
    console.error('Error fetching user memory:', error);
    res.status(500).json({ error: 'Failed to fetch user memory profile' });
  }
});

export default router;

