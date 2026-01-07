/**
 * ACHIEVEMENT ROUTES
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    listAchievements,
    getMyAchievements,
    checkAchievements,
    seedAchievementsEndpoint,
} from '../controllers/achievementController';

const router = Router();

// All achievement routes require authentication
router.use(authenticate);

// GET /achievements - List all available achievements
router.get('/', listAchievements);

// GET /achievements/me - Get current user's achievements
router.get('/me', getMyAchievements);

// POST /achievements/check - Manually check for new achievements
router.post('/check', checkAchievements);

// POST /achievements/seed - Seed achievements (ADMIN only)
router.post('/seed', seedAchievementsEndpoint);

export default router;
