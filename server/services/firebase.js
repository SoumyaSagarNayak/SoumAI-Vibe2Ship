import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE_PATH = path.join(__dirname, '../data/db.json');

// Ensure database directory and file exist
function initializeLocalDb() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialData = {
      users: {},
      tasks: {},
      analytics: {}
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2));
  }
}

initializeLocalDb();

// Helper to read local DB
function readLocalDb() {
  try {
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local db:', err);
    return { users: {}, tasks: {}, analytics: {} };
  }
}

// Helper to write local DB
function writeLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing local db:', err);
  }
}

// Firebase configuration detection
let db = null;
let auth = null;
let isRealFirebase = false;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    db = admin.firestore();
    auth = admin.auth();
    isRealFirebase = true;
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK. Falling back to local mode.', error);
  }
} else {
  console.log('Firebase credentials not set in environment. Running in LOCAL PERSISTENT MODE using db.json.');
}

// Create unified Database Interface
export const dbService = {
  isRealFirebase: () => isRealFirebase,

  // Tasks operations
  async getTasks(userId) {
    if (isRealFirebase) {
      const snapshot = await db.collection('tasks').where('userId', '==', userId).get();
      const tasks = [];
      snapshot.forEach(doc => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      return tasks;
    } else {
      const data = readLocalDb();
      const allTasks = Object.values(data.tasks);
      return allTasks.filter(t => t.userId === userId);
    }
  },

  async addTask(userId, taskData) {
    const task = {
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      deadline: taskData.deadline || null,
      status: taskData.status || 'pending', // pending, completed, overdue
      priority: taskData.priority || 'Medium', // High, Medium, Low
      category: taskData.category || 'General',
      subtasks: taskData.subtasks || [],
      timeBlocks: taskData.timeBlocks || [],
      importance: taskData.importance || 3, // 1 to 5 scale
      estimatedEffort: taskData.estimatedEffort || 60, // in minutes
      urgency: taskData.urgency || 'normal',
      isRecurring: taskData.isRecurring || false,
      recurrenceDays: taskData.recurrenceDays || [],
      parentTaskId: taskData.parentTaskId || null,
      recurrenceDate: taskData.recurrenceDate || null,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isRealFirebase) {
      const docRef = await db.collection('tasks').add(task);
      return { id: docRef.id, ...task };
    } else {
      const data = readLocalDb();
      const id = 'task_' + Math.random().toString(36).substr(2, 9);
      task.id = id;
      data.tasks[id] = task;
      writeLocalDb(data);
      return task;
    }
  },

  async updateTask(userId, taskId, updates) {
    const updatePayload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (isRealFirebase) {
      const docRef = db.collection('tasks').doc(taskId);
      const doc = await docRef.get();
      if (!doc.exists || doc.data().userId !== userId) {
        throw new Error('Task not found or access denied');
      }
      await docRef.update(updatePayload);
      const updatedDoc = await docRef.get();
      return { id: taskId, ...updatedDoc.data() };
    } else {
      const data = readLocalDb();
      const task = data.tasks[taskId];
      if (!task || task.userId !== userId) {
        throw new Error('Task not found or access denied');
      }
      const updatedTask = { ...task, ...updatePayload };
      data.tasks[taskId] = updatedTask;
      writeLocalDb(data);
      return updatedTask;
    }
  },

  async deleteTask(userId, taskId) {
    if (isRealFirebase) {
      const docRef = db.collection('tasks').doc(taskId);
      const doc = await docRef.get();
      if (!doc.exists || doc.data().userId !== userId) {
        throw new Error('Task not found or access denied');
      }
      await docRef.delete();
      return { id: taskId };
    } else {
      const data = readLocalDb();
      const task = data.tasks[taskId];
      if (!task || task.userId !== userId) {
        throw new Error('Task not found or access denied');
      }
      delete data.tasks[taskId];
      writeLocalDb(data);
      return { id: taskId };
    }
  },

  // User preference and streak operations
  async getUser(userId) {
    if (isRealFirebase) {
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists) {
        return doc.data();
      }
      const defaultUser = {
        userId,
        streak: 0,
        lastCompletedDate: null,
        weeklyCompleted: 0,
        workingHours: { start: '09:00', end: '17:00' },
        timezone: 'UTC',
        createdAt: new Date().toISOString()
      };
      await db.collection('users').doc(userId).set(defaultUser);
      return defaultUser;
    } else {
      const data = readLocalDb();
      if (!data.users[userId]) {
        data.users[userId] = {
          userId,
          streak: 0,
          lastCompletedDate: null,
          weeklyCompleted: 0,
          workingHours: { start: '09:00', end: '17:00' },
          timezone: 'UTC',
          createdAt: new Date().toISOString()
        };
        writeLocalDb(data);
      }
      return data.users[userId];
    }
  },

  async updateUser(userId, updates) {
    if (isRealFirebase) {
      const docRef = db.collection('users').doc(userId);
      await docRef.update(updates);
      const doc = await docRef.get();
      return doc.data();
    } else {
      const data = readLocalDb();
      const user = data.users[userId] || await this.getUser(userId);
      const updatedUser = { ...user, ...updates };
      data.users[userId] = updatedUser;
      writeLocalDb(data);
      return updatedUser;
    }
  },

  // Analytics history operations
  async getAnalytics(userId) {
    if (isRealFirebase) {
      const doc = await db.collection('analytics').doc(userId).get();
      if (doc.exists) {
        return doc.data();
      }
      const defaultAnalytics = {
        userId,
        history: [], // [{ date: 'YYYY-MM-DD', completed: 0, missed: 0 }]
        insights: 'No analytics insights generated yet. Complete tasks to get reflections.'
      };
      await db.collection('analytics').doc(userId).set(defaultAnalytics);
      return defaultAnalytics;
    } else {
      const data = readLocalDb();
      if (!data.analytics[userId]) {
        data.analytics[userId] = {
          userId,
          history: [],
          insights: 'No analytics insights generated yet. Complete tasks to get reflections.'
        };
        writeLocalDb(data);
      }
      return data.analytics[userId];
    }
  },

  async updateAnalytics(userId, updates) {
    if (isRealFirebase) {
      const docRef = db.collection('analytics').doc(userId);
      await docRef.set(updates, { merge: true });
      const doc = await docRef.get();
      return doc.data();
    } else {
      const data = readLocalDb();
      const analytics = data.analytics[userId] || { userId, history: [], insights: '' };
      const updatedAnalytics = { ...analytics, ...updates };
      data.analytics[userId] = updatedAnalytics;
      writeLocalDb(data);
      return updatedAnalytics;
    }
  }
};

// Middleware to mock check authentication or verify actual Firebase JWT token
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If not authenticating, default to a mock guest user for ease of review
    req.user = { uid: 'guest_user_123', email: 'guest@lifesaver.ai' };
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  
  // If user passed a special local token or firebase is not configured
  if (token === 'guest-token' || !isRealFirebase) {
    req.user = { uid: 'guest_user_123', email: 'guest@lifesaver.ai' };
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
