import express from 'express';
import { updateWeeklyGoal, updateWeeklyGoalValidation, getMyCoach } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Update weekly goal
router.put('/profile/goal', authenticate, updateWeeklyGoalValidation, updateWeeklyGoal);

// Get my coach (for athletes)
router.get('/my-coach', authenticate, getMyCoach);

export default router;
