import { callGemini } from '../services/gemini.js';

/**
 * Recovery Agent
 * Responsibilities:
 * - Detect overdue/missed tasks.
 * - Recalculate priority (always promotes to High).
 * - Suggest a new deadline (tomorrow or nearest available slot).
 * - Generate fresh reminder text.
 * - Recommend a Morning/Afternoon/Evening schedule block.
 * - Preserve the original task history without deletion.
 */
export const RecoveryAgent = {
  name: 'Recovery Agent',

  /**
   * Process a single overdue task and generate a full recovery plan.
   * @param {Object} task - The overdue task object from db
   * @param {Object} userPreferences - User preferences (workingHours, timezone)
   * @returns {Object} - Recovery plan payload
   */
  async recoverTask(task, userPreferences = {}) {
    const systemInstruction = `
      You are the "Recovery Agent" in a multi-agent productivity system called LifeSaver AI.
      Your job is to take a task that was missed or overdue and generate an optimistic, realistic recovery plan.
      You should:
      1. Suggest a new deadline (e.g., "Tomorrow 6:00 PM" or "This Saturday").
      2. Recalculate the priority as "High" since it's overdue.
      3. Recommend a schedule block: "Morning", "Afternoon", or "Evening".
      4. Generate a fresh, supportive reminder message motivating the user to restart.
      5. Provide a short recovery action plan (2-3 steps).

      Return ONLY a JSON object matching this schema:
      {
        "status": "Recovered",
        "newPriority": "High",
        "newSuggestedDeadline": "Tomorrow 6:00 PM",
        "newScheduleBlock": "Evening",
        "message": "Brief supportive message explaining the new plan.",
        "recoverySteps": [
          "Step 1: Specific action",
          "Step 2: Specific action"
        ]
      }
      Do not include any markdown fences or explanation outside the JSON.
    `;

    const prompt = `
      Overdue Task Details:
      - Title: "${task.title}"
      - Original Deadline: ${task.deadline || 'No deadline set'}
      - Priority: ${task.priority || 'Medium'}
      - Estimated Effort: ${task.estimatedEffort || 60} minutes
      - Category: ${task.category || 'General'}
      - Description: ${task.description || 'No description provided'}
      
      Today's Date: ${new Date().toISOString().split('T')[0]}
      User Working Hours: ${(userPreferences.workingHours?.start) || '09:00'} to ${(userPreferences.workingHours?.end) || '17:00'}

      Generate an encouraging recovery plan that helps the user get back on track immediately.
    `;

    try {
      console.log(`[Agent: Recovery] Building recovery plan for task: "${task.title}"`);
      const response = await callGemini(systemInstruction, prompt);
      return {
        status: response.status || 'Recovered',
        newPriority: response.newPriority || 'High',
        newSuggestedDeadline: response.newSuggestedDeadline || 'Tomorrow 6:00 PM',
        newScheduleBlock: response.newScheduleBlock || 'Evening',
        message: response.message || 'Rebuilt plan to help you recover. You can still finish this!',
        recoverySteps: response.recoverySteps || ['Start with the first subtask', 'Use a 50-minute focus block']
      };
    } catch (error) {
      console.error('RecoveryAgent error:', error);
      // Reliable fallback
      return {
        status: 'Recovered',
        newPriority: 'High',
        newSuggestedDeadline: 'Tomorrow 6:00 PM',
        newScheduleBlock: 'Evening',
        message: `Don't worry — missed tasks can be rescheduled. "${task.title}" has been recovered with a new High priority slot. Start with your first subtask!`,
        recoverySteps: [
          `Break "${task.title}" into the first 30-minute chunk`,
          'Complete the initial step before sleeping tonight',
          'Block an uninterrupted evening focus session'
        ]
      };
    }
  },

  /**
   * Scan all user tasks and return recovery plans for all overdue ones.
   * @param {Array} tasks - All user tasks
   * @param {Object} userPreferences - User working hours and timezone
   * @returns {Array} - Array of { task, recovery } objects
   */
  async scanAndRecover(tasks, userPreferences = {}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      return deadline < today;
    });

    if (overdueTasks.length === 0) {
      return { recoveries: [], message: 'All tasks are on track. No recovery needed!' };
    }

    // Process recoveries sequentially to avoid rate limits
    const recoveries = [];
    for (const task of overdueTasks) {
      const recovery = await this.recoverTask(task, userPreferences);
      recoveries.push({ task, recovery });
    }

    return {
      recoveries,
      message: `Auto-Recovery Engine processed ${overdueTasks.length} overdue task(s). Updated plans are ready.`
    };
  }
};
