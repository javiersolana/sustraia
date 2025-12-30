import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAthleteNotes,
  addAthleteNote,
  deleteAthleteNote,
  getAthleteGoals,
  addAthleteGoal,
  deleteAthleteGoal,
} from '../controllers/notesController';

const router = Router();

// Notes routes (coach only)
router.get('/athletes/:athleteId/notes', authenticate, getAthleteNotes);
router.post('/athletes/:athleteId/notes', authenticate, addAthleteNote);
router.delete('/notes/:noteId', authenticate, deleteAthleteNote);

// Goals routes (athlete or coach)
router.get('/athletes/:athleteId/goals', authenticate, getAthleteGoals);
router.post('/athletes/:athleteId/goals', authenticate, addAthleteGoal);
router.delete('/goals/:goalId', authenticate, deleteAthleteGoal);

export default router;
