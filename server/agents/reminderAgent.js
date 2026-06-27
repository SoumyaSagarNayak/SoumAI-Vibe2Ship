import { callGemini } from '../services/gemini.js';

/**
 * Reminder Agent
 * Responsibilities:
 * - Provide context-aware reminders.
 * - Format nudges based on remaining duration, task priority, and study windows.
 */
export const ReminderAgent = {
  name: 'Reminder Agent',

  async generateReminder(task, userPreferences = {}) {
    const systemInstruction = `
      You are the "Reminder Agent" in a multi-agent productivity system called LifeSaver AI.
      Your responsibility is to generate an active, context-aware, helpful reminder for a task instead of a simple alert.
      
      Bad reminder: "Assignment due tomorrow."
      Good reminder: "Based on your current schedule, you should start working on 'DBMS Assignment' by 5:00 PM today to comfortably finish before your 8:00 PM deadline without rushing."
      
      Your output must be strictly in JSON format matching the schema below:
      {
        "reminderText": "A personalized, context-aware reminder string.",
        "urgencyLevel": "normal" | "urgent" | "critical",
        "actionPrompt": "A short, active command prompt (e.g. 'Open DBMS project file now')"
      }
      Do not include any markdown fences or additional explanation outside the JSON.
    `;

    const prompt = `
      Task Context:
      - Title: "${task.title}"
      - Description: "${task.description || 'N/A'}"
      - Deadline: ${task.deadline || 'N/A'}
      - Priority: ${task.priority || 'Medium'}
      - Estimated Effort: ${task.estimatedEffort || 60} minutes
      
      User Working Hours: ${userPreferences.workingHours?.start || '09:00'} to ${userPreferences.workingHours?.end || '17:00'}
      Current Time Context: ${new Date().toLocaleTimeString()}
      
      Create a highly context-aware, active reminder and urgency rating.
    `;

    try {
      const response = await callGemini(systemInstruction, prompt);
      return {
        reminderText: response.reminderText || `Friendly reminder: Work on "${task.title}".`,
        urgencyLevel: response.urgencyLevel || 'normal',
        actionPrompt: response.actionPrompt || 'Start work'
      };
    } catch (error) {
      console.error('ReminderAgent error:', error);
      return {
        reminderText: `You have "${task.title}" upcoming. Consider setting aside ${task.estimatedEffort || 60} minutes to complete it.`,
        urgencyLevel: 'normal',
        actionPrompt: 'Get started'
      };
    }
  }
};
