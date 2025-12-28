import { Router } from 'express';
import {
  createWorkout,
  getWorkouts,
  getWorkout,
  updateWorkout,
  deleteWorkout,
  completeWorkout,
  createWorkoutValidation,
} from '../controllers/workoutController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get workouts (filtered by role)
router.get('/', getWorkouts);

// Get single workout
router.get('/:id', getWorkout);

// Create workout (coaches only)
router.post('/', requireRole('COACH'), createWorkoutValidation, createWorkout);

// Update workout (creator only - checked in controller)
router.put('/:id', updateWorkout);

// Delete workout (creator only - checked in controller)
router.delete('/:id', deleteWorkout);

// Complete workout (athletes)
router.post('/:id/complete', requireRole('ATLETA'), completeWorkout);

export default router;
