import express from 'express';
import { dbService, authMiddleware } from '../services/firebase.js';
import { SchedulerAgent } from '../agents/schedulerAgent.js';
import { callGemini } from '../services/gemini.js';

const router = express.Router();

// Apply authentication middleware to all AI routes
router.use(authMiddleware);

// POST /api/ai/chat - Process chat assistant input
router.post('/chat', async (req, res) => {
  const userId = req.user.uid;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. Fetch current tasks for context
    const currentTasks = await dbService.getTasks(userId);
    const pendingTasks = currentTasks.filter(t => t.status !== 'completed');

    // 2. Prepare System instruction for chat parser
    const systemInstruction = `
      You are the "Core AI Chat Assistant" of LifeSaver AI.
      Your goal is to parse the user's natural language input about their workload, tasks, deadlines, or frustrations, and help them organize their life.
      
      Review the user's message. If they mention tasks they need to do, extract them!
      Provide a highly empathetic, structured, and motivational response.
      Suggest how they should prioritize and execute their plans.
      
      Return your output strictly as a JSON object matching this schema:
      {
        "response": "Your written reply to the user. Acknowledge their tasks, offer encouragement, and describe the plan.",
        "detectedTasks": [
          {
            "title": "Extracted task name",
            "deadline": "YYYY-MM-DD (or approximate ISO date based on today being ${new Date().toISOString().split('T')[0]})",
            "importance": 4, // 1 to 5 rating
            "estimatedEffort": 90, // in minutes
            "category": "School" | "Work" | "Personal" | "Finance"
          }
        ],
        "priorityAnalysis": "Brief explanation of how these new items compare to their existing load.",
        "suggestedPlan": "Step-by-step summary flow of how to execute these tasks today/this week."
      }
      Do not include any markdown fences or additional explanation outside the JSON.
    `;

    const activeTasksSummary = pendingTasks
      .map(t => `- "${t.title}" (Priority: ${t.priority}, Due: ${t.deadline})`)
      .join('\n');

    const prompt = `
      User's message: "${message}"
      
      User's Existing Pending Tasks:
      ${activeTasksSummary || 'No pending tasks in list.'}
      
      Analyze the message, extract any new tasks mentioned, compare them with existing ones, and formulate a structured response.
    `;

    console.log(`[Agent: Chat Assistant] Processing user request: "${message}"`);
    const aiResponse = await callGemini(systemInstruction, prompt);
    res.json(aiResponse);
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// POST /api/ai/plan - Generate structured daily plan using Scheduler Agent
router.post('/plan', async (req, res) => {
  const userId = req.user.uid;

  try {
    const tasks = await dbService.getTasks(userId);
    const activeTasks = tasks.filter(t => t.status !== 'completed');

    const user = await dbService.getUser(userId);

    console.log('[Agent: Scheduler] Regenerating daily time blocks');
    const dailyPlan = await SchedulerAgent.generateDailyPlan(activeTasks, user);
    res.json(dailyPlan);
  } catch (error) {
    console.error('AI plan error:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

// POST /api/ai/prioritize - Trigger Priority checks or give advice
router.post('/prioritize', async (req, res) => {
  const userId = req.user.uid;

  try {
    const tasks = await dbService.getTasks(userId);
    const activeTasks = tasks.filter(t => t.status !== 'completed');

    if (activeTasks.length === 0) {
      return res.json({ message: 'No tasks to prioritize. You are all caught up!' });
    }

    res.json({
      message: 'Priority analysis complete. Tasks have been organized based on deadline proximity and importance ratings.',
      tasks: activeTasks.sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0))
    });
  } catch (error) {
    console.error('AI prioritize error:', error);
    res.status(500).json({ error: 'Failed to analyze task priorities' });
  }
});

export default router;
