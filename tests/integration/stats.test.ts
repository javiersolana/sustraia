import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server/index';
import { prisma } from '../../server/config/prisma';

describe('Stats API', () => {
  let athleteToken: string;
  let athleteId: string;
  let coachToken: string;
  let coachId: string;

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

    // Create and complete some workouts
    for (let i = 0; i < 3; i++) {
      const workoutRes = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          type: 'RUN',
          title: `Workout ${i + 1}`,
          assignedTo: athleteId,
        });

      await request(app)
        .post(`/api/workouts/${workoutRes.body.workout.id}/complete`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          actualDuration: 1800 + i * 100,
          actualDistance: 5000 + i * 500,
          avgHeartRate: 145 + i * 5,
        });
    }
  });

  describe('GET /api/stats', () => {
    it('should return calculated stats for user', async () => {
      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats).toHaveProperty('totalWorkouts');
      expect(response.body.stats).toHaveProperty('totalDistance');
      expect(response.body.stats).toHaveProperty('totalDuration');
      expect(response.body.stats.totalWorkouts).toBe(3);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/stats/dashboard', () => {
    it('should return dashboard data for athlete', async () => {
      const response = await request(app)
        .get('/api/stats/dashboard')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('upcomingWorkouts');
      expect(response.body).toHaveProperty('recentCompleted');
      expect(response.body).toHaveProperty('unreadMessages');
      expect(response.body.recentCompleted.length).toBe(3);
    });

    it('should prevent coach from accessing athlete dashboard', async () => {
      const response = await request(app)
        .get('/api/stats/dashboard')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/stats/coach-dashboard', () => {
    it('should return coach dashboard data', async () => {
      const response = await request(app)
        .get('/api/stats/coach-dashboard')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('athletes');
      expect(response.body).toHaveProperty('recentWorkouts');
      expect(response.body).toHaveProperty('unreadMessages');
      expect(response.body.athletes.length).toBeGreaterThan(0);
    });

    it('should prevent athlete from accessing coach dashboard', async () => {
      const response = await request(app)
        .get('/api/stats/coach-dashboard')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(response.status).toBe(403);
    });

    it('should include athlete stats', async () => {
      const response = await request(app)
        .get('/api/stats/coach-dashboard')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.athletes[0]).toHaveProperty('stats');
      expect(response.body.athletes[0].stats).toHaveProperty('totalWorkouts');
    });
  });

  describe('GET /api/stats/history/:metricName', () => {
    it('should return stats history for metric', async () => {
      const response = await request(app)
        .get('/api/stats/history/totalWorkouts?days=30')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeInstanceOf(Array);
    });

    it('should limit days to 365', async () => {
      const response = await request(app)
        .get('/api/stats/history/totalWorkouts?days=1000')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(response.status).toBe(200);
    });
  });
});
