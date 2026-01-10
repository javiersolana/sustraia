import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { emitNewMessage, emitMessageRead } from '../services/socketService';

// Validation rules
export const sendMessageValidation = [
  body('toId').isString().withMessage('Recipient ID required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Message content required'),
];

/**
 * Send message
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { toId, content } = req.body;

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: toId },
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Verify relationship (coach-athlete) using new many-to-many structure
    if (req.user.role === 'COACH') {
      // Coach can message their athletes
      const relationship = await prisma.coachAthlete.findUnique({
        where: {
          coachId_athleteId: {
            coachId: req.user.userId,
            athleteId: toId,
          },
        },
      });

      if (!relationship) {
        return res.status(403).json({ error: 'Can only message your athletes' });
      }
    } else {
      // Athlete can message any of their coaches
      const relationship = await prisma.coachAthlete.findUnique({
        where: {
          coachId_athleteId: {
            coachId: toId,
            athleteId: req.user.userId,
          },
        },
      });

      if (!relationship) {
        return res.status(403).json({ error: 'Can only message your coaches' });
      }
    }

    const message = await prisma.message.create({
      data: {
        fromId: req.user.userId,
        toId,
        content,
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        to: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Emit real-time socket event to recipient
    emitNewMessage(toId, {
      id: message.id,
      fromId: req.user.userId,
      fromName: message.from.name,
      content,
      createdAt: message.createdAt,
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

/**
 * Get conversations (list of users you've messaged)
 */
export async function getConversations(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get all messages involving the user
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ fromId: req.user.userId }, { toId: req.user.userId }],
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        to: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by conversation partner
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const partnerId =
        message.fromId === req.user!.userId ? message.toId : message.fromId;
      const partner = message.fromId === req.user!.userId ? message.to : message.from;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages from partner
      if (message.toId === req.user!.userId && !message.read) {
        const conv = conversationsMap.get(partnerId);
        conv.unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

/**
 * Get messages with specific user
 */
export async function getMessages(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromId: req.user.userId, toId: userId },
          { fromId: userId, toId: req.user.userId },
        ],
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        to: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      skip,
      take: limit,
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        fromId: userId,
        toId: req.user.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

/**
 * Mark message as read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Can only mark messages sent to you as read
    if (message.toId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { read: true },
    });

    // Notify sender that message was read
    emitMessageRead(message.fromId, id);

    res.json({ message: updated });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
}

/**
 * Get unread message count
 */
export async function getUnreadCount(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const count = await prisma.message.count({
      where: {
        toId: req.user.userId,
        read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}

/**
 * Get recent messages (for coach dashboard)
 */
export async function getRecentMessages(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromId: req.user.userId },
          { toId: req.user.userId },
        ],
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        to: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    res.json({ messages });
  } catch (error) {
    console.error('Get recent messages error:', error);
    res.status(500).json({ error: 'Failed to fetch recent messages' });
  }
}
