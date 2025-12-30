import { Router } from 'express';
import { createInitialAdmin } from '../controllers/setupController';

const router = Router();

/**
 * TEMPORARY SETUP ROUTE
 * POST /setup/init-admin - Creates the first admin user
 * This route is automatically disabled after the first admin is created
 */
router.post('/init-admin', createInitialAdmin);

export default router;
