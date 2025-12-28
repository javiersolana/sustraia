import { Router } from 'express';
import {
  getStats,
  getStatsHistory,
  getDashboard,
  getCoachDashboard,
} from '../controllers/statsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current stats
router.get('/', getStats);

// Get stats history for specific metric
router.get('/history/:metricName', getStatsHistory);

// Get athlete dashboard
router.get('/dashboard', requireRole('ATLETA'), getDashboard);

// Get coach dashboard
router.get('/coach-dashboard', requireRole('COACH'), getCoachDashboard);

export default router;
