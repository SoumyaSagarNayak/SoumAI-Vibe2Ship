import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Router imports
import tasksRouter from './routes/tasks.js';
import aiRouter from './routes/ai.js';
import analyticsRouter from './routes/analytics.js';
import focusRouter from './routes/focus.js';
import recoveryRouter from './routes/recovery.js';
import rescueRouter from './routes/rescue.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite development server (usually port 5173)
app.use(cors({
  origin: '*', // For standard local review ease, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Set up API routes (existing)
app.use('/api/tasks', tasksRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);

// New extended routes
app.use('/api/focus', focusRouter);
app.use('/api/recovery', recoveryRouter);
app.use('/api/analytics', rescueRouter); // Adds /api/analytics/rescue

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: process.env.GEMINI_API_KEY ? 'gemini-active' : 'emulator-active'
  });
});

// Serve frontend assets if deployed in production (optional fallback)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

app.use(express.static(distPath));

// Fallback all other routes to React index.html for client side routing support
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('LifeSaver AI Server is running. Frontend build not present yet.');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error Handler caught:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` LifeSaver AI Multi-Agent Backend Server running`);
  console.log(` Port: ${PORT}`);
  console.log(`=================================================`);
});
