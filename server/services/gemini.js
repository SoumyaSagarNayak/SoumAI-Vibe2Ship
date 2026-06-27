import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let genAI = null;
let hasApiKey = false;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    hasApiKey = true;
    console.log('Gemini API Service initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini SDK:', error);
  }
} else {
  console.log('GEMINI_API_KEY not found in environment. Running in MOCK AGENT MODE.');
}

// Global interface to call Gemini with structured JSON output
export async function callGemini(systemInstruction, prompt, expectedSchemaType = 'object') {
  if (hasApiKey && genAI) {
    try {
      // Use the standard free-tier flash model (gemini-1.5-flash or gemini-2.5-flash)
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini API calling failed. Falling back to mock generator.', error);
      return generateMockAgentResponse(systemInstruction, prompt);
    }
  } else {
    // Return high-fidelity mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockAgentResponse(systemInstruction, prompt));
      }, 500); // Small delay to simulate API latency
    });
  }
}

// Rich Mock responses based on prompt keywords to simulate independent logical agents
function generateMockAgentResponse(systemInstruction, prompt) {
  const lowercasePrompt = prompt.toLowerCase();
  const lowercaseSystem = systemInstruction.toLowerCase();

  // 1. PLANNER AGENT MOCK
  if (lowercaseSystem.includes('planner') || lowercasePrompt.includes('subtask') || lowercasePrompt.includes('break down')) {
    let taskTitle = 'your task';
    const match = prompt.match(/"([^"]+)"/);
    if (match) taskTitle = match[1];
    else if (prompt.includes('Complete')) taskTitle = prompt.substring(prompt.indexOf('Complete'));
    
    return {
      subtasks: [
        { title: `Research and gather resources for: ${taskTitle}`, durationMinutes: 45, order: 1, completed: false },
        { title: `Outline core components and plan layout`, durationMinutes: 30, order: 2, completed: false },
        { title: `Execute main implementation of: ${taskTitle}`, durationMinutes: 120, order: 3, completed: false },
        { title: `Final review, testing, and adjustments`, durationMinutes: 30, order: 4, completed: false }
      ],
      estimatedTotalHours: 3.75,
      suggestedExecutionFlow: 'Start with gathering resources first, outline sections to avoid writers block, dedicate a solid 2-hour chunk for high-focus building, and finish with a quick verification check.'
    };
  }

  // 2. PRIORITY AGENT MOCK
  if (lowercaseSystem.includes('priority') || lowercaseSystem.includes('prioritize')) {
    // Simple heuristic
    let priority = 'Medium';
    let urgencyScore = 50;
    let explanation = 'Task has standard parameters and can be managed alongside regular schedule.';

    if (lowercasePrompt.includes('tomorrow') || lowercasePrompt.includes('urgent') || lowercasePrompt.includes('1 day') || lowercasePrompt.includes('today')) {
      priority = 'High';
      urgencyScore = 90;
      explanation = 'Due very soon. Delaying this will likely result in a missed deadline.';
    } else if (lowercasePrompt.includes('importance: 5') || lowercasePrompt.includes('importance: 4') || lowercasePrompt.includes('high importance')) {
      priority = 'High';
      urgencyScore = 85;
      explanation = 'High importance rating, crucial to finish even though deadline might be flexible.';
    } else if (lowercasePrompt.includes('next week') || lowercasePrompt.includes('importance: 1') || lowercasePrompt.includes('importance: 2')) {
      priority = 'Low';
      urgencyScore = 20;
      explanation = 'Ample time remains to finish this, and task holds minor significance. Focus on urgent assignments first.';
    }

    return {
      priority: priority,
      urgencyScore: urgencyScore,
      explanation: explanation
    };
  }

  // 3. SCHEDULER AGENT MOCK
  if (lowercaseSystem.includes('schedule') || lowercaseSystem.includes('scheduler') || lowercasePrompt.includes('time block')) {
    return {
      morningPlan: [
        { activity: 'Resource Gathering & Research', timeSlot: '09:00 AM - 10:00 AM', durationMinutes: 60 }
      ],
      afternoonPlan: [
        { activity: 'Core Development & Implementation Work', timeSlot: '02:00 PM - 04:00 PM', durationMinutes: 120 }
      ],
      eveningPlan: [
        { activity: 'Subtask Checks, Polish, & Wrap-up', timeSlot: '07:30 PM - 08:30 PM', durationMinutes: 60 }
      ],
      recommendedStudySessions: [
        { sessionName: 'High Focus Focus Block', startTime: '02:00 PM', durationMinutes: 120 }
      ],
      rearrangementSuggestion: 'You have a light afternoon schedule. Slot your main work sessions between 2 PM and 4 PM to capture peak mental energy.'
    };
  }

  // 4. REMINDER AGENT MOCK
  if (lowercaseSystem.includes('reminder') || lowercasePrompt.includes('remind')) {
    let reminderText = 'Based on your upcoming load, it is best to slot in some work time soon.';
    if (lowercasePrompt.includes('tomorrow')) {
      reminderText = 'Based on your schedule, you should start by 6:00 PM today to comfortably finish before tomorrow\'s deadline.';
    } else if (lowercasePrompt.includes('tonight')) {
      reminderText = 'Urgent reminder: To complete this by tonight, you need to initiate your focus block in the next 15 minutes.';
    }
    return {
      reminderText: reminderText,
      urgencyLevel: lowercasePrompt.includes('tomorrow') || lowercasePrompt.includes('tonight') ? 'critical' : 'normal',
      actionPrompt: 'Open LifeSaver AI workspace and start the Research subtask.'
    };
  }

  // 5. REFLECTION AGENT MOCK
  if (lowercaseSystem.includes('reflection') || lowercasePrompt.includes('reflection') || lowercaseSystem.includes('analyze')) {
    return {
      productivityScore: 78,
      completedCount: 5,
      missedCount: 1,
      weeklyTrend: [
        { day: 'Mon', completed: 1 },
        { day: 'Tue', completed: 2 },
        { day: 'Wed', completed: 0 },
        { day: 'Thu', completed: 1 },
        { day: 'Fri', completed: 1 },
        { day: 'Sat', completed: 0 },
        { day: 'Sun', completed: 0 }
      ],
      insights: [
        'You tend to complete 80% of your tasks on Tuesdays and Thursdays.',
        'One task ("DBMS Homework") was missed this week due to an underestimated duration. Consider adding 30 mins padding next time.',
        'Your daily streak is currently at 4 days. Keep it up to boost consistency!'
      ],
      suggestions: [
        'Plan large tasks at least 48 hours in advance to allow the Planner Agent to suggest sub-sessions.',
        'Utilize your morning block (9:00 AM - 10:00 AM) for shorter admin tasks to clear up your afternoons.'
      ]
    };
  }

  // 6. MOTIVATION AGENT MOCK
  if (lowercaseSystem.includes('motivation') || lowercasePrompt.includes('motivation') || lowercasePrompt.includes('advice')) {
    const messages = [
      "Every small subtask you check off brings you closer to crossing the finish line. Keep stacking those wins!",
      "Procrastination is just a delayed start. Let's make today count by tackling your high-priority items first. You've got this!",
      "Don't look at the whole mountain; just focus on the next step. What's one 15-minute subtask you can do right now?",
      "Consistency beats intensity. Even 20 minutes of focused effort today is better than zero. Let's get to work!",
      "Imagine the feeling of relief when this is complete and you can relax. Let's earn that peace of mind together!"
    ];
    const randomIndex = Math.floor(Math.random() * messages.length);
    return {
      motivationalQuote: messages[randomIndex],
      contextAdvice: 'Start with the lowest effort task to build momentum, then tackle the main project.'
    };
  }

  // 7. GENERAL AI CHAT ASSISTANT
  return {
    response: 'Hello! I am your LifeSaver AI Assistant. I see you want to organize your tasks. I have analyzed your input and structured it. Let me help you break them down, prioritize them, and fit them into your calendar.',
    detectedTasks: [
      { title: 'Task item from chat', deadline: 'tomorrow', effort: 'Medium' }
    ],
    priorityAnalysis: 'I recommend focusing on your urgent tasks first, then shifting to project assignments.',
    suggestedPlan: '1. Research (30m) -> 2. Build outline (20m) -> 3. Complete draft (60m)'
  };
}
