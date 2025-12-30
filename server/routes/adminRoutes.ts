import { Router } from 'express';
import {
  requireAdmin,
  getAllUsers,
  getAllCoaches,
  createAthlete,
  createAthleteValidation,
  createCoach,
  createCoachValidation,
  updateUser,
  updateUserValidation,
  deleteUser,
  getAdminStats,
  reclassifyAthleteWorkouts,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// Admin stats
router.get('/stats', getAdminStats);

// User management
router.get('/users', getAllUsers);
router.get('/coaches', getAllCoaches);
router.post('/athletes', createAthleteValidation, createAthlete);
router.post('/coaches', createCoachValidation, createCoach);
router.put('/users/:id', updateUserValidation, updateUser);
router.delete('/users/:id', deleteUser);

// Athlete workout management
router.post('/athletes/:athleteId/reclassify', reclassifyAthleteWorkouts);

export default router;
