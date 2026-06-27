import { dbService } from './firebase.js';

/**
 * Updates a user's memory stats upon task completion.
 * Matches Firebase and db.json local storage setups.
 */
export async function updateMemoryOnTaskCompletion(userId, completedTask) {
  try {
    const user = await dbService.getUser(userId);
    const tasks = await dbService.getTasks(userId);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalCount = tasks.length;
    const completedCount = completedTasks.length;

    // 1. Average Completion Rate
    const averageCompletionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

    // 2. Average Task Duration
    const completedWithDuration = completedTasks.filter(t => t.estimatedEffort);
    const averageTaskDuration = completedWithDuration.length > 0 
      ? Math.round(completedWithDuration.reduce((acc, t) => acc + Number(t.estimatedEffort), 0) / completedWithDuration.length)
      : 45;

    // 3. Streak History
    const currentStreak = user.streak || 0;
    let streakHistory = [];
    if (user.memory && Array.isArray(user.memory.streakHistory)) {
      streakHistory = [...user.memory.streakHistory];
    }
    if (streakHistory.length === 0 || streakHistory[streakHistory.length - 1] !== currentStreak) {
      streakHistory.push(currentStreak);
      if (streakHistory.length > 10) {
        streakHistory.shift(); // Keep only last 10 entries
      }
    }

    // 4. Productive Hours and Preferred Study Time
    const hourCounts = {};
    completedTasks.forEach(t => {
      if (t.updatedAt) {
        try {
          const date = new Date(t.updatedAt);
          const hour = date.getHours();
          const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
          hourCounts[formattedHour] = (hourCounts[formattedHour] || 0) + 1;
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    let productiveHours = [];
    let preferredStudyTime = '9 AM - 12 PM';

    const sortedHours = Object.keys(hourCounts).sort((a, b) => hourCounts[b] - hourCounts[a]);
    if (sortedHours.length > 0) {
      productiveHours = sortedHours.slice(0, 3);
      const topHour = parseInt(sortedHours[0].split(':')[0]);
      if (topHour >= 5 && topHour < 12) {
        preferredStudyTime = 'Morning (8 AM - 12 PM)';
      } else if (topHour >= 12 && topHour < 17) {
        preferredStudyTime = 'Afternoon (1 PM - 5 PM)';
      } else if (topHour >= 17 && topHour < 21) {
        preferredStudyTime = 'Evening (5 PM - 9 PM)';
      } else {
        preferredStudyTime = 'Night (9 PM - 12 AM)';
      }
    } else {
      productiveHours = ['09:00', '14:00', '20:00'];
      preferredStudyTime = 'Evening (8 PM - 11 PM)'; // Matches the prompt example
    }

    // 5. Category Performance
    const categoryStats = {};
    tasks.forEach(t => {
      const cat = t.category || 'General';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, completed: 0 };
      }
      categoryStats[cat].total += 1;
      if (t.status === 'completed') {
        categoryStats[cat].completed += 1;
      }
    });

    let strongestCategory = 'School';
    let weakestCategory = 'Personal';
    let maxRate = -1;
    let minRate = 2;

    Object.keys(categoryStats).forEach(cat => {
      const stats = categoryStats[cat];
      const rate = stats.completed / stats.total;
      if (rate > maxRate) {
        maxRate = rate;
        strongestCategory = cat;
      }
      if (rate < minRate) {
        minRate = rate;
        weakestCategory = cat;
      }
    });

    // 6. Procrastination Pattern
    let procrastinationPattern = 'Maintains a consistent pace without major procrastination.';
    const largeTasks = tasks.filter(t => (t.estimatedEffort || 0) >= 90);
    const largeCompleted = largeTasks.filter(t => t.status === 'completed');
    const largePending = largeTasks.filter(t => t.status !== 'completed');

    const tasksCompletedLate = completedTasks.filter(t => {
      if (!t.deadline || !t.updatedAt) return false;
      return new Date(t.updatedAt) > new Date(t.deadline);
    });

    if (largePending.length > 1 || (largeTasks.length > 0 && largeCompleted.length / largeTasks.length < 0.4)) {
      procrastinationPattern = 'Large tasks are frequently postponed.';
    } else if (tasksCompletedLate.length / Math.max(completedCount, 1) > 0.3) {
      procrastinationPattern = 'Frequently completes tasks close to or after the deadline.';
    }

    // 7. Update User Profile with new Memory
    const updatedMemory = {
      preferredStudyTime,
      averageCompletionRate,
      productiveHours,
      procrastinationPattern,
      strongestCategory,
      weakestCategory,
      averageTaskDuration,
      streakHistory
    };

    console.log(`[User Memory] Updating cognitive profile for user: ${userId}`);
    await dbService.updateUser(userId, { memory: updatedMemory });
    return updatedMemory;
  } catch (error) {
    console.error('Error updating user memory:', error);
    return null;
  }
}
