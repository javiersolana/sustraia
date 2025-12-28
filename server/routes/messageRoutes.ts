import { Router } from 'express';
import {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  getUnreadCount,
  sendMessageValidation,
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send message
router.post('/', sendMessageValidation, sendMessage);

// Get conversations
router.get('/conversations', getConversations);

// Get messages with specific user
router.get('/with/:userId', getMessages);

// Mark message as read
router.patch('/:id/read', markAsRead);

// Get unread count
router.get('/unread/count', getUnreadCount);

export default router;
