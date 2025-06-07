import request from 'supertest';
import { app } from '../src/index';
import { redisClient } from '../src/index';

describe('Auth Integration', () => {
  let server: any;
  let token: string;
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  beforeAll((done) => {
    server = app.listen(done);
  });

  afterAll((done) => {
    server.close(async () => {
      await redisClient.quit();
      done();
    });
  });

  it('should register a new user', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: testName });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('should login and return a JWT token', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('should get current user profile with JWT', async () => {
    const res = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });
}); 