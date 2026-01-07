/**
 * ACCOUNTABILITY GROUP ROUTES
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    createGroup,
    createGroupValidation,
    getMyGroups,
    getGroup,
    joinGroup,
    leaveGroup,
    getGroupMessages,
    sendGroupMessage,
    sendGroupMessageValidation,
} from '../controllers/groupController';

const router = Router();

// All group routes require authentication
router.use(authenticate);

// POST /groups - Create a new group
router.post('/', createGroupValidation, createGroup);

// GET /groups - List my groups
router.get('/', getMyGroups);

// POST /groups/join - Join a group via invite code
router.post('/join', joinGroup);

// GET /groups/:id - Get group details with leaderboard
router.get('/:id', getGroup);

// DELETE /groups/:id/leave - Leave a group
router.delete('/:id/leave', leaveGroup);

// GET /groups/:id/messages - Get group messages
router.get('/:id/messages', getGroupMessages);

// POST /groups/:id/messages - Send message to group
router.post('/:id/messages', sendGroupMessageValidation, sendGroupMessage);

export default router;
