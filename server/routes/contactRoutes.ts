import { Router } from 'express';
import { submitContactForm } from '../controllers/contactController';

const router = Router();

// POST /api/contact - Submit contact form (no auth required)
router.post('/', submitContactForm);

export default router;
