import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server/index';
import { prisma } from '../../server/config/prisma';

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'athlete@test.com',
        password: 'password123',
        name: 'Test Athlete',
        role: 'ATLETA',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('athlete@test.com');
      expect(response.body.user.role).toBe('ATLETA');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'duplicate@test.com',
        password: 'password123',
        name: 'Test User',
        role: 'ATLETA',
      });

      const response = await request(app).post('/api/auth/register').send({
        email: 'duplicate@test.com',
        password: 'password456',
        name: 'Another User',
        role: 'COACH',
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('User already exists');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
        role: 'ATLETA',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: '123',
        name: 'Test User',
        role: 'ATLETA',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
        role: 'INVALID',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app).post('/api/auth/register').send({
        email: 'login@test.com',
        password: 'password123',
        name: 'Login Test',
        role: 'ATLETA',
      });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('login@test.com');
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@test.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'profile@test.com',
        password: 'password123',
        name: 'Profile Test',
        role: 'COACH',
      });
      token = response.body.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('profile@test.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
