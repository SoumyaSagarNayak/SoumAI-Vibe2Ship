import { callGemini } from '../services/gemini.js';

/**
 * Rescue Agent
 * Responsibilities:
 * - Detect stress patterns from missed tasks, broken streaks, and overdue items.
 * - Estimate a stress level (Low / Medium / High).
 * - Compute a recovery probability percentage.
 * - Generate specific, actionable rescue recommendations.
 * - Cooperates with Priority Agent, Scheduler Agent, and Reflection Agent.
 */
export const RescueAgent = {
  name: 'Rescue Agent',

  /**
   * Analyze current workload and generate a stress assessment.
   * @param {Object} params - Analysis parameters
   * @param {Array}  params.missedTasks - Tasks that are overdue
   * @param {Array}  params.pendingTasks - Tasks not yet completed
   * @param {number} params.streak - Current completion streak
   * @param {Object} params.userMemory - User's cognitive memory profile
   * @returns {Object} - { stressLevel, recoveryProbability, recommendations, crisisMode }
   */
  async analyzeStress({ missedTasks = [], pendingTasks = [], streak = 0, userMemory = {} }) {
    const systemInstruction = `
      You are the "Rescue Agent" in a multi-agent productivity system called LifeSaver AI.
      Your job is to analyze a user's current workload stress levels and provide an emergency rescue plan.
      
      Determine:
      1. stressLevel: "Low", "Medium", or "High"
      2. recoveryProbability: 0-100 (how likely is the user to recover today?)
      3. recommendations: 3-4 specific, ordered, actionable steps to help the user recover
      4. crisisMode: boolean — true if deadline within 2 hours OR missed > 2 tasks
      
      Be empathetic but direct. Focus on what they can realistically achieve right now.
      
      Return ONLY a JSON object matching this schema:
      {
        "stressLevel": "High",
        "recoveryProbability": 82,
        "crisisMode": false,
        "recommendations": [
          "Finish the DBMS assignment first — it is the most urgent.",
          "Ignore all Low priority tasks until tomorrow.",
          "Take a 10-minute break after each 50-minute focus session.",
          "Sleep before midnight to restore focus for tomorrow."
        ]
      }
      Do not include any markdown fences or explanation outside the JSON.
    `;

    const missedSummary = missedTasks.map(t => `- "${t.title}" (was due ${t.deadline})`).join('\n');
    const pendingSummary = pendingTasks.slice(0, 5).map(t => `- "${t.title}" (Priority: ${t.priority}, Due: ${t.deadline})`).join('\n');
    const highPriorityPending = pendingTasks.filter(t => t.priority === 'High').length;
    
    // Check for imminent deadlines (within 2 hours)
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const imminentTasks = pendingTasks.filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      return deadline <= twoHoursFromNow && deadline > now;
    });

    const prompt = `
      User's Current Status:
      - Missed/Overdue Tasks (${missedTasks.length}):
      ${missedSummary || 'None'}
      
      - High Priority Pending Tasks: ${highPriorityPending}
      - Total Pending Tasks: ${pendingTasks.length}
      - Imminent Deadlines (< 2 hours): ${imminentTasks.length}
      ${imminentTasks.map(t => `  → "${t.title}"`).join('\n')}
      
      - Current Streak: ${streak} days
      
      User Memory Profile:
      - Average Completion Rate: ${userMemory.averageCompletionRate || 'Unknown'}%
      - Strongest Category: ${userMemory.strongestCategory || 'Unknown'}
      - Procrastination Pattern: ${userMemory.procrastinationPattern || 'Unknown'}
      
      Today's Date/Time: ${new Date().toISOString()}
      
      Based on this data, assess the stress level and generate a rescue plan.
    `;

    try {
      console.log('[Agent: Rescue] Analyzing workload stress patterns...');
      const response = await callGemini(systemInstruction, prompt);
      return {
        stressLevel: response.stressLevel || 'Medium',
        recoveryProbability: response.recoveryProbability || 70,
        crisisMode: response.crisisMode || (imminentTasks.length > 0 || missedTasks.length > 2),
        recommendations: response.recommendations || [
          'Focus on your highest priority task first.',
          'Break work into 50-minute focused sessions.',
          'Defer low-priority tasks to tomorrow.'
        ],
        imminentTasks
      };
    } catch (error) {
      console.error('RescueAgent error:', error);
      // Smart fallback using available data
      const stressLevel = missedTasks.length > 2 || highPriorityPending > 3 ? 'High'
        : missedTasks.length > 0 || highPriorityPending > 1 ? 'Medium' : 'Low';
      const recoveryProbability = stressLevel === 'High' ? 65 : stressLevel === 'Medium' ? 80 : 95;

      return {
        stressLevel,
        recoveryProbability,
        crisisMode: imminentTasks.length > 0 || missedTasks.length > 2,
        recommendations: [
          missedTasks.length > 0 ? `Address overdue tasks first: "${missedTasks[0]?.title}"` : 'Great progress! Stay consistent.',
          'Work in 50-minute focus blocks with 10-minute breaks.',
          'Delegate or remove any Low priority tasks from today\'s list.',
          'Aim to complete at least one High priority task before evening.'
        ],
        imminentTasks
      };
    }
  }
};
