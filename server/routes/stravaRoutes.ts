import { Router } from 'express';
import {
  getAuthUrl,
  handleCallback,
  getConnectionStatus,
  getUserActivities,
  syncActivity,
  disconnect,
  verifyWebhook,
  handleWebhook,
  importActivities,
  getActivityLapsController,
  reclassifyWorkouts,
} from '../controllers/stravaController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Webhook endpoints (public)
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

// Protected routes (require authentication)
router.get('/auth-url', authenticate, getAuthUrl);
router.get('/callback', authenticate, handleCallback);
router.get('/status', authenticate, getConnectionStatus);
router.get('/activities', authenticate, getUserActivities);
router.get('/activities/:activityId/laps', authenticate, getActivityLapsController);
router.post('/sync', authenticate, syncActivity);
router.post('/import', authenticate, importActivities);
router.post('/reclassify', authenticate, reclassifyWorkouts);
router.delete('/disconnect', authenticate, disconnect);

export default router;
