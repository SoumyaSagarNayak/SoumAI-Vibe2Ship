import { callGemini } from '../services/gemini.js';

/**
 * Planner Agent
 * Responsibilities:
 * - Break large tasks into smaller, actionable subtasks.
 * - Estimate completion times for each subtask.
 * - Suggest an execution order and flow.
 */
export const PlannerAgent = {
  name: 'Planner Agent',
  
  async planTask(taskTitle, taskDescription = '') {
    const systemInstruction = `
      You are the "Planner Agent" in a multi-agent productivity system called LifeSaver AI.
      Your responsibility is to take a task title and description, and decompose it into 3 to 8 logical, actionable subtasks.
      For each subtask, estimate the time (in minutes) required to complete it and specify a sequential execution order (starting at 1).
      You must return your output strictly in JSON format matching the schema below:
      {
        "subtasks": [
          {
            "title": "Subtask title",
            "durationMinutes": 30,
            "order": 1,
            "completed": false
          }
        ],
        "estimatedTotalHours": 1.5,
        "suggestedExecutionFlow": "Explain why this flow works and how to execute it efficiently."
      }
      Do not include any markdown fences or additional explanation outside the JSON.
    `;

    const prompt = `
      Task Title: "${taskTitle}"
      Task Description: "${taskDescription}"
      
      Generate the plan, estimated times, and subtasks for this task.
    `;

    try {
      const response = await callGemini(systemInstruction, prompt);
      return {
        subtasks: response.subtasks || [],
        estimatedTotalHours: response.estimatedTotalHours || 1.0,
        suggestedExecutionFlow: response.suggestedExecutionFlow || 'Execute subtasks in numerical order.'
      };
    } catch (error) {
      console.error('PlannerAgent error:', error);
      return {
        subtasks: [
          { title: 'Initial prep work', durationMinutes: 30, order: 1, completed: false },
          { title: 'Core implementation task', durationMinutes: 60, order: 2, completed: false },
          { title: 'Review and wrap up', durationMinutes: 15, order: 3, completed: false }
        ],
        estimatedTotalHours: 1.75,
        suggestedExecutionFlow: 'Proceed sequentially from prep to wrap-up.'
      };
    }
  }
};
