import { callGemini } from '../services/gemini.js';

/**
 * Scheduler Agent
 * Responsibilities:
 * - Organize tasks into smart daily time blocks (Morning, Afternoon, Evening).
 * - Recommend focus study/work sessions.
 * - Suggest plan rearrangements to fit within user working hours.
 */
export const SchedulerAgent = {
  name: 'Scheduler Agent',

  async generateDailyPlan(tasks, userPreferences = {}) {
    const systemInstruction = `
      You are the "Scheduler Agent" in a multi-agent productivity system called LifeSaver AI.
      Your responsibility is to take a list of tasks and schedule them into a highly optimized daily plan.
      Structure the day into three blocks: Morning, Afternoon, and Evening.
      Also identify one or two dedicated "recommendedStudySessions" (high-focus blocks) for the most demanding tasks.
      Consider the user's preferred work hours and timezone context.
      
      You must return your output strictly in JSON format matching the schema below:
      {
        "morningPlan": [
          { "activity": "Actionable task/activity name", "timeSlot": "09:00 AM - 10:00 AM", "durationMinutes": 60 }
        ],
        "afternoonPlan": [
          { "activity": "Actionable task/activity name", "timeSlot": "02:00 PM - 04:00 PM", "durationMinutes": 120 }
        ],
        "eveningPlan": [
          { "activity": "Actionable task/activity name", "timeSlot": "07:00 PM - 08:00 PM", "durationMinutes": 60 }
        ],
        "recommendedStudySessions": [
          { "sessionName": "Focus Block name", "startTime": "02:00 PM", "durationMinutes": 120 }
        ],
        "rearrangementSuggestion": "Specific advice on how to shuffle tasks to prevent overwhelm."
      }
      Do not include any markdown fences or additional explanation outside the JSON.
    `;

    const tasksSummary = tasks
      .map(t => `- "${t.title}" (Priority: ${t.priority}, Estimated Effort: ${t.estimatedEffort || 60}m, Status: ${t.status}, Category: ${t.category})`)
      .join('\n');

    const workingHours = userPreferences.workingHours || { start: '09:00', end: '17:00' };

    const prompt = `
      Tasks to Schedule:
      ${tasksSummary || 'No pending tasks. Encourage the user to plan some activities.'}
      
      User Preferences:
      - Work Hours: ${workingHours.start} to ${workingHours.end}
      - Timezone: ${userPreferences.timezone || 'UTC'}
      
      Organize these tasks into a daily plan. Include times, estimated durations, focus session recommendation, and scheduler insights.
    `;

    try {
      const response = await callGemini(systemInstruction, prompt);
      return {
        morningPlan: response.morningPlan || [],
        afternoonPlan: response.afternoonPlan || [],
        eveningPlan: response.eveningPlan || [],
        recommendedStudySessions: response.recommendedStudySessions || [],
        rearrangementSuggestion: response.rearrangementSuggestion || 'No rescheduling recommendations needed.'
      };
    } catch (error) {
      console.error('SchedulerAgent error:', error);
      return {
        morningPlan: [{ activity: 'Planning and Admin', timeSlot: '09:00 AM - 09:30 AM', durationMinutes: 30 }],
        afternoonPlan: [{ activity: 'Core Focus Work', timeSlot: '02:00 PM - 03:30 PM', durationMinutes: 90 }],
        eveningPlan: [{ activity: 'Review & Cleanup', timeSlot: '05:00 PM - 05:30 PM', durationMinutes: 30 }],
        recommendedStudySessions: [{ sessionName: 'Standard Focus Block', startTime: '02:00 PM', durationMinutes: 90 }],
        rearrangementSuggestion: 'Group similar tasks together to minimize context switching.'
      };
    }
  }
};
