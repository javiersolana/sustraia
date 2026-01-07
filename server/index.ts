import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateEnv } from './config/env';
import { initializeSocket } from './services/socketService';
import { errorHandler, notFound } from './middleware/errorHandler';
import {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  stravaLimiter,
} from './middleware/rateLimit';

// Routes
import authRoutes from './routes/authRoutes';
import workoutRoutes from './routes/workoutRoutes';
import messageRoutes from './routes/messageRoutes';
import stravaRoutes from './routes/stravaRoutes';
import statsRoutes from './routes/statsRoutes';
import adminRoutes from './routes/adminRoutes';
import trainingPlanRoutes from './routes/trainingPlanRoutes';
import setupRoutes from './routes/setupRoutes';
import userRoutes from './routes/userRoutes';
import notesRoutes from './routes/notesRoutes';
import contactRoutes from './routes/contactRoutes';
import achievementRoutes from './routes/achievementRoutes';
import groupRoutes from './routes/groupRoutes';

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  process.exit(1);
}

const app = express();

// Middleware

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for frontend
}));

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://sustraia.vercel.app',
      'https://sustrain.es',
      'https://www.sustrain.es',
      config.frontend.url,
    ].filter(Boolean),
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General rate limiting for all API routes
app.use('/api', generalLimiter);

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/setup', setupRoutes); // Temporary setup routes
app.use('/api/user', userRoutes);
// Auth routes with stricter rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/messages', messageRoutes);
// Strava routes with specific rate limiting
app.use('/api/strava', stravaLimiter, stravaRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/training-plans', trainingPlanRoutes);
app.use('/api', notesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/groups', groupRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Create HTTP server and initialize Socket.io
const httpServer = createServer(app);
initializeSocket(httpServer);

// Start server
const server = httpServer.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   SUSTRAIA Backend API Server         ║
╠═══════════════════════════════════════╣
║   Environment: ${config.nodeEnv.padEnd(23)} ║
║   Port: ${config.port.toString().padEnd(30)} ║
║   Frontend: ${config.frontend.url.padEnd(24)} ║
╚═══════════════════════════════════════╝

API Endpoints:
  - POST   /api/auth/register
  - POST   /api/auth/login
  - GET    /api/auth/profile

  - GET    /api/workouts
  - POST   /api/workouts
  - GET    /api/workouts/:id
  - PUT    /api/workouts/:id
  - DELETE /api/workouts/:id
  - POST   /api/workouts/:id/complete

  - GET    /api/messages/conversations
  - GET    /api/messages/with/:userId
  - POST   /api/messages
  - PATCH  /api/messages/:id/read
  - GET    /api/messages/unread/count

  - GET    /api/strava/auth-url
  - GET    /api/strava/callback
  - GET    /api/strava/status
  - GET    /api/strava/activities
  - POST   /api/strava/sync
  - DELETE /api/strava/disconnect

  - GET    /api/stats
  - GET    /api/stats/history/:metricName
  - GET    /api/stats/dashboard
  - GET    /api/stats/coach-dashboard

  - GET    /api/admin/stats
  - GET    /api/admin/users
  - GET    /api/admin/coaches
  - POST   /api/admin/athletes
  - PUT    /api/admin/users/:id
  - DELETE /api/admin/users/:id

Server ready! 🚀
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
