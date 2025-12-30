import { Router } from 'express';
import {
  getStats,
  getStatsHistory,
  getDashboard,
  getCoachDashboard,
  getAthleteWorkouts,
  getActivity,
  getActivities,
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

// Get specific athlete's completed workouts (for coach)
router.get('/athlete/:athleteId/workouts', requireRole('COACH'), getAthleteWorkouts);

// Get all activities for authenticated user
router.get('/activities', getActivities);

// Get single activity by ID
router.get('/activities/:id', getActivity);

export default router;
