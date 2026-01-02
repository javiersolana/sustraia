import { Router } from 'express';
import {
  login,
  getProfile,
  loginValidation,
} from '../controllers/authController';
import {
  requestPasswordReset,
  confirmPasswordReset,
  verifyResetToken,
  requestResetValidation,
  confirmResetValidation,
} from '../controllers/passwordResetController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (registration disabled - only via admin)
router.post('/login', loginValidation, login);

// Password reset routes (public)
router.post('/request-reset', requestResetValidation, requestPasswordReset);
router.post('/reset-password', confirmResetValidation, confirmPasswordReset);
router.get('/verify-reset-token/:token', verifyResetToken);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;
