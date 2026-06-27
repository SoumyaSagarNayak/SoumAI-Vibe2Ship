import express from 'express';
import { dbService, authMiddleware } from '../services/firebase.js';
import { ReflectionAgent } from '../agents/reflectionAgent.js';
import { MotivationAgent } from '../agents/motivationAgent.js';

const router = express.Router();

// Apply authentication middleware to all analytics routes
router.use(authMiddleware);

// GET /api/analytics - Generate stats, call Reflection and Motivation agents
router.get('/', async (req, res) => {
  const userId = req.user.uid;

  try {
    // 1. Fetch user data and tasks
    const user = await dbService.getUser(userId);
    const tasks = await dbService.getTasks(userId);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status !== 'completed');

    // 2. Identify overdue/missed tasks
    const today = new Date();
    const missedTasks = pendingTasks.filter(t => {
      if (!t.deadline) return false;
      const deadlineDate = new Date(t.deadline);
      return deadlineDate < today;
    });

    const pendingCount = pendingTasks.length;
    const completedCount = completedTasks.length;
    const missedCount = missedTasks.length;
    const totalCount = tasks.length;
    const successPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

    // 3. Fetch analytics history from DB
    const analyticsRecord = await dbService.getAnalytics(userId);
    const historyLogs = analyticsRecord.history || [];

    // 4. Trigger Reflection Agent
    console.log('[Agent: Reflection] Analyzing task success metrics');
    const reflectionResult = await ReflectionAgent.analyzeProductivity(
      completedTasks,
      missedTasks,
      historyLogs
    );

    // 5. Build taskState context for Motivation Agent
    const completedToday = completedTasks.filter(t => {
      if (!t.updatedAt) return false;
      return t.updatedAt.split('T')[0] === today.toISOString().split('T')[0];
    }).length;

    const taskState = {
      completedToday,
      pendingToday: pendingTasks.filter(t => {
        if (!t.deadline) return false;
        return t.deadline.split('T')[0] === today.toISOString().split('T')[0];
      }).length,
      overdueCount: missedCount
    };

    // 6. Trigger Motivation Agent
    console.log('[Agent: Motivation] Preparing personalized productivity nudge');
    const motivationResult = await MotivationAgent.getMotivationalNudge(
      user.streak || 0,
      taskState
    );

    // 7. Save generated insights back to database for persistence
    await dbService.updateAnalytics(userId, {
      insights: reflectionResult.insights.join('\n')
    });

    // 8. Respond with combined payload
    res.json({
      streak: user.streak || 0,
      weeklyCompleted: user.weeklyCompleted || 0,
      completedCount,
      pendingCount,
      missedCount,
      successPercentage,
      reflection: {
        productivityScore: reflectionResult.productivityScore,
        weeklyTrend: reflectionResult.weeklyTrend,
        insights: reflectionResult.insights,
        suggestions: reflectionResult.suggestions
      },
      motivation: {
        quote: motivationResult.motivationalQuote,
        advice: motivationResult.contextAdvice
      }
    });

  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics insights' });
  }
});

export default router;
