import { callGemini } from '../services/gemini.js';

/**
 * Priority Agent
 * Responsibilities:
 * - Prioritize tasks according to deadline, importance (1-5), estimated effort, and workload.
 * - Output High, Medium, Low priority along with an urgency score and justification.
 */
export const PriorityAgent = {
  name: 'Priority Agent',

  async prioritizeTask(taskDetails, userWorkload = []) {
    const systemInstruction = `
      You are the "Priority Agent" in a multi-agent productivity system called LifeSaver AI.
      Your responsibility is to analyze a new task's properties and evaluate its priority level (High, Medium, or Low).
      You should base this assessment on:
      1. Deadline/Due Date (closer deadlines require higher priority).
      2. Importance Rating (scale of 1-5, where 5 is critical).
      3. Estimated Effort (in minutes).
      4. Current Workload (list of other active tasks the user has).
      
      You must return your output strictly in JSON format matching the schema below:
      {
        "priority": "High" | "Medium" | "Low",
        "urgencyScore": 85, // 0 to 100 score
        "explanation": "Briefly explain the rationale (e.g. 'Task is due in 12 hours and has high importance')."
      }
      Do not include any markdown fences or additional explanation outside the JSON.
    `;

    const activeTasksSummary = userWorkload
      .map(t => `- "${t.title}" (Due: ${t.deadline}, Priority: ${t.priority || 'N/A'}, Status: ${t.status})`)
      .join('\n');

    const prompt = `
      Task details to analyze:
      - Title: "${taskDetails.title}"
      - Description: "${taskDetails.description || 'N/A'}"
      - Deadline: ${taskDetails.deadline || 'No deadline'}
      - User-rated Importance: ${taskDetails.importance || 3} (out of 5)
      - Estimated Effort: ${taskDetails.estimatedEffort || 60} minutes
      
      User's Current Active Workload:
      ${activeTasksSummary || 'No other active tasks.'}
      
      Determine the priority, urgency score (0-100), and short explanation.
    `;

    try {
      const response = await callGemini(systemInstruction, prompt);
      return {
        priority: response.priority || 'Medium',
        urgencyScore: response.urgencyScore || 50,
        explanation: response.explanation || 'Analyzed based on parameters.'
      };
    } catch (error) {
      console.error('PriorityAgent error:', error);
      return {
        priority: 'Medium',
        urgencyScore: 50,
        explanation: 'Assigned medium priority by default.'
      };
    }
  }
};
