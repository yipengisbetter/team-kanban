import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: '123456',
      name: 'Test',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should not register duplicate email', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: '123456',
      name: 'Test2',
    });
    expect(res.status).toBe(400);
  });
});