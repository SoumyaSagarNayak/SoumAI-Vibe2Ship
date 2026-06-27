import { callGemini } from '../services/gemini.js';

/**
 * Motivation Agent
 * Responsibilities:
 * - Generate encouraging and personalized productivity messages.
 * - Adapt style based on current streak count, missed deadlines, or general workspace states.
 */
export const MotivationAgent = {
  name: 'Motivation Agent',

  async getMotivationalNudge(userStreak, taskState = {}) {
    const systemInstruction = `
      You are the "Motivation Agent" in a multi-agent productivity system called LifeSaver AI.
      Your responsibility is to generate warm, highly encouraging, and empathetic motivational nudges and personalized advice.
      Keep it real, avoiding generic cliché corporate quotes. Tailor it to the user's current streak and workspace status.
      
      You must return your output strictly in JSON format matching the schema below:
      {
        "motivationalQuote": "A highly personalized, encouraging sentence or message.",
        "contextAdvice": "Action-oriented productivity tip aligned with the user's state."
      }
      Do not include any markdown fences or additional explanation outside the JSON.
    `;

    const prompt = `
      User Workspace Context:
      - Current Daily Completion Streak: ${userStreak || 0} days
      - Tasks Completed Today: ${taskState.completedToday || 0}
      - Tasks Pending Today: ${taskState.pendingToday || 0}
      - Overdue Tasks: ${taskState.overdueCount || 0}
      
      Provide a personalized boost statement and actionable productivity tip.
    `;

    try {
      const response = await callGemini(systemInstruction, prompt);
      return {
        motivationalQuote: response.motivationalQuote || 'Every step forward is progress. Keep building momentum!',
        contextAdvice: response.contextAdvice || 'Start with a simple 5-minute task to ease into your focus session.'
      };
    } catch (error) {
      console.error('MotivationAgent error:', error);
      return {
        motivationalQuote: 'Consistency is built one decision at a time. You have the power to make today successful.',
        contextAdvice: 'Pick the smallest subtask on your plate and complete it first to spark a flow state.'
      };
    }
  }
};
