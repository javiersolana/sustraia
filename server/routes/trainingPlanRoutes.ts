import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
} from '../controllers/trainingPlanController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// CRUD for training plans
router.post('/', createPlan);
router.get('/', getPlans);
router.get('/:id', getPlanById);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

export default router;
