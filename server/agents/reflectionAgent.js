import { callGemini } from '../services/gemini.js';

/**
 * Reflection Agent
 * Responsibilities:
 * - Analyze task compliance (completed vs missed deadlines).
 * - Generate weekly trends.
 * - Calculate a dynamic productivity score (0-100).
 * - Provide cognitive behavioral reflections and suggestions.
 */
export const ReflectionAgent = {
  name: 'Reflection Agent',

  async analyzeProductivity(completedTasks, missedTasks, historyLogs = []) {
    const systemInstruction = `
      You are the "Reflection Agent" in a multi-agent productivity system called LifeSaver AI.
      Your responsibility is to analyze a user's task history and provide deep productivity insights.
      Calculate a fair productivityScore (integer 0 to 100) based on completed vs missed tasks.
      Formulate 2-3 specific, actionable insights reflecting on the user's habits (e.g., 'You tend to finish tasks faster when you tackle them in the morning').
      Provide 2 constructive suggestions for improvement.
      
      You must return your output strictly in JSON format matching the schema below:
      {
        "productivityScore": 85,
        "completedCount": 8,
        "missedCount": 2,
        "weeklyTrend": [
          { "day": "Mon", "completed": 2 },
          { "day": "Tue", "completed": 3 },
          { "day": "Wed", "completed": 1 },
          { "day": "Thu", "completed": 0 },
          { "day": "Fri", "completed": 2 },
          { "day": "Sat", "completed": 0 },
          { "day": "Sun", "completed": 0 }
        ],
        "insights": [
          "Insight statement 1",
          "Insight statement 2"
        ],
        "suggestions": [
          "Actionable suggestion 1",
          "Actionable suggestion 2"
        ]
      }
      Do not include any markdown fences or additional explanation outside the JSON.
    `;

    const completedSummary = completedTasks
      .map(t => `- Completed: "${t.title}" (Effort: ${t.estimatedEffort || 60}m, Category: ${t.category})`)
      .join('\n');

    const missedSummary = missedTasks
      .map(t => `- Missed: "${t.title}" (Deadline was: ${t.deadline}, Category: ${t.category})`)
      .join('\n');

    const prompt = `
      Productivity Data for Analysis:
      
      COMPLETED TASKS IN PERIOD:
      ${completedSummary || 'No completed tasks recorded.'}
      
      MISSED/OVERDUE TASKS IN PERIOD:
      ${missedSummary || 'No missed or overdue tasks recorded. Excellent work!'}
      
      Historical Logs (Daily Counts):
      ${JSON.stringify(historyLogs)}
      
      Generate the reflection review, scores, and recommendations.
    `;

    try {
      const response = await callGemini(systemInstruction, prompt);
      return {
        productivityScore: response.productivityScore || 70,
        completedCount: completedTasks.length,
        missedCount: missedTasks.length,
        weeklyTrend: response.weeklyTrend || [
          { day: 'Mon', completed: 0 },
          { day: 'Tue', completed: 0 },
          { day: 'Wed', completed: 0 },
          { day: 'Thu', completed: 0 },
          { day: 'Fri', completed: 0 },
          { day: 'Sat', completed: 0 },
          { day: 'Sun', completed: 0 }
        ],
        insights: response.insights || ['Keep tracking your tasks to generate insights.'],
        suggestions: response.suggestions || ['Set smaller subtasks for better estimates.']
      };
    } catch (error) {
      console.error('ReflectionAgent error:', error);
      return {
        productivityScore: 75,
        completedCount: completedTasks.length,
        missedCount: missedTasks.length,
        weeklyTrend: [
          { day: 'Mon', completed: completedTasks.length }
        ],
        insights: ['Analyzing task completion logs indicates standard progress.'],
        suggestions: ['Decompose complex items into subtasks to avoid deferring work.']
      };
    }
  }
};
