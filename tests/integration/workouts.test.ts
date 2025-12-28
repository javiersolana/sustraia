import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server/index';

describe('Workouts API', () => {
  let coachToken: string;
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

    // Create athlete
    const athleteRes = await request(app).post('/api/auth/register').send({
      email: 'athlete@test.com',
      password: 'password123',
      name: 'Test Athlete',
      role: 'ATLETA',
    });
    athleteToken = athleteRes.body.token;
    athleteId = athleteRes.body.user.id;
  });

  describe('POST /api/workouts', () => {
    it('should allow coach to create workout', async () => {
      const response = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          date: '2025-12-30',
          type: 'RUN',
          title: 'Morning Run',
          description: '5k easy run',
          distance: 5000,
          duration: 1800,
          intensity: 'easy',
          assignedTo: athleteId,
        });

      expect(response.status).toBe(201);
      expect(response.body.workout).toHaveProperty('id');
      expect(response.body.workout.title).toBe('Morning Run');
      expect(response.body.workout.type).toBe('RUN');
    });

    it('should prevent athlete from creating workout', async () => {
      const response = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          date: '2025-12-30',
          type: 'RUN',
          title: 'My Run',
        });

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/workouts').send({
        date: '2025-12-30',
        type: 'RUN',
        title: 'Run',
      });

      expect(response.status).toBe(401);
    });

    it('should validate workout data', async () => {
      const response = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          date: 'invalid-date',
          type: 'INVALID_TYPE',
          title: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/workouts', () => {
    beforeEach(async () => {
      // Create workout for athlete
      await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          date: '2025-12-30',
          type: 'RUN',
          title: 'Test Workout',
          assignedTo: athleteId,
        });
    });

    it('should return workouts for coach', async () => {
      const response = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body.workouts).toBeInstanceOf(Array);
      expect(response.body.workouts.length).toBeGreaterThan(0);
    });

    it('should return assigned workouts for athlete', async () => {
      const response = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.workouts).toBeInstanceOf(Array);
      expect(response.body.workouts.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/workouts?page=1&limit=10')
        .set('Authorization', `Bearer ${coachToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('POST /api/workouts/:id/complete', () => {
    let workoutId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          date: '2025-12-30',
          type: 'RUN',
          title: 'Test Workout',
          assignedTo: athleteId,
        });
      workoutId = res.body.workout.id;
    });

    it('should allow athlete to complete workout', async () => {
      const response = await request(app)
        .post(`/api/workouts/${workoutId}/complete`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          actualDuration: 1950,
          actualDistance: 5200,
          avgHeartRate: 145,
          feeling: '4/5',
          notes: 'Felt good!',
        });

      expect(response.status).toBe(201);
      expect(response.body.completedWorkout).toHaveProperty('id');
      expect(response.body.completedWorkout.actualDuration).toBe(1950);
    });

    it('should prevent coach from completing workout', async () => {
      const response = await request(app)
        .post(`/api/workouts/${workoutId}/complete`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          actualDuration: 1950,
        });

      expect(response.status).toBe(403);
    });
  });
});
