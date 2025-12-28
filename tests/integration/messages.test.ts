import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server/index';
import { prisma } from '../../server/config/prisma';

describe('Messages API', () => {
  let coachToken: string;
  let coachId: string;
  let athleteToken: string;
  let athleteId: string;

  beforeEach(async () => {
    // Create coach
    const coachRes = await request(app).post('/api/auth/register').send({
      email: 'coach@test.com',
      password: 'password123',
      name: 'Test Coach',
      role: 'COACH',
    });
    coachToken = coachRes.body.token;
    coachId = coachRes.body.user.id;

    // Create athlete
    const athleteRes = await request(app).post('/api/auth/register').send({
      email: 'athlete@test.com',
      password: 'password123',
      name: 'Test Athlete',
      role: 'ATLETA',
    });
    athleteToken = athleteRes.body.token;
    athleteId = athleteRes.body.user.id;

    // Link athlete to coach
    await prisma.user.update({
      where: { id: athleteId },
      data: { coachId },
    });
  });

  describe('POST /api/messages', () => {
    it('should allow coach to message athlete', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          toId: athleteId,
          content: 'Great workout today!',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toHaveProperty('id');
      expect(response.body.message.content).toBe('Great workout today!');
      expect(response.body.message.fromId).toBe(coachId);
      expect(response.body.message.toId).toBe(athleteId);
    });

    it('should allow athlete to message coach', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          toId: coachId,
          content: 'Thanks coach!',
        });

      expect(response.status).toBe(201);
      expect(response.body.message.content).toBe('Thanks coach!');
    });

    it('should prevent messaging unrelated users', async () => {
      // Create another user
      const otherRes = await request(app).post('/api/auth/register').send({
        email: 'other@test.com',
        password: 'password123',
        name: 'Other User',
        role: 'ATLETA',
      });

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          toId: otherRes.body.user.id,
          content: 'Hello',
        });

      expect(response.status).toBe(403);
    });

    it('should validate message content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          toId: athleteId,
          content: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/messages/conversations', () => {
    beforeEach(async () => {
      // Send a message
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          toId: athleteId,
          content: 'Hello',
        });
    });

    it('should return conversations for user', async () => {
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.conversations).toBeInstanceOf(Array);
      expect(response.body.conversations.length).toBeGreaterThan(0);
    });

    it('should include unread count', async () => {
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.conversations[0]).toHaveProperty('unreadCount');
      expect(response.body.conversations[0].unreadCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/messages/with/:userId', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          toId: athleteId,
          content: 'Message 1',
        });

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          toId: coachId,
          content: 'Message 2',
        });
    });

    it('should return messages between users', async () => {
      const response = await request(app)
        .get(`/api/messages/with/${athleteId}`)
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.messages).toBeInstanceOf(Array);
      expect(response.body.messages.length).toBe(2);
    });

    it('should mark messages as read', async () => {
      // Check unread count before
      const beforeCount = await prisma.message.count({
        where: { toId: athleteId, read: false },
      });
      expect(beforeCount).toBeGreaterThan(0);

      // Get messages (should mark as read)
      await request(app)
        .get(`/api/messages/with/${coachId}`)
        .set('Authorization', `Bearer ${athleteToken}`);

      // Check unread count after
      const afterCount = await prisma.message.count({
        where: { toId: athleteId, read: false },
      });
      expect(afterCount).toBe(0);
    });
  });

  describe('GET /api/messages/unread/count', () => {
    it('should return unread message count', async () => {
      // Send multiple messages
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ toId: athleteId, content: 'Message 1' });

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ toId: athleteId, content: 'Message 2' });

      const response = await request(app)
        .get('/api/messages/unread/count')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
    });
  });
});
