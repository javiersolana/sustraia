import { Router } from 'express';
import {
  login,
  getProfile,
  loginValidation,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (registration disabled - only via admin)
router.post('/login', loginValidation, login);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;
