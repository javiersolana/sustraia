import express from 'express';
import { updateWeeklyGoal, updateWeeklyGoalValidation } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Update weekly goal
router.put('/profile/goal', authenticate, updateWeeklyGoalValidation, updateWeeklyGoal);

export default router;
