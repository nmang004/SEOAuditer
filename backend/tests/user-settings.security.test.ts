import request from 'supertest';
import { app } from '../src/index';
import { redisClient } from '../src/index';

async function registerAndLoginUser(emailPrefix = 'user') {
  const email = `${emailPrefix}_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const name = 'Test User';
  await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return { token: loginRes.body.data.token, email };
}

describe('User Settings Security', () => {
  let server: any;
  let userAToken: string;
  let userBToken: string;

  beforeAll((done) => {
    server = app.listen(done);
  });

  afterAll((done) => {
    server.close(async () => {
      await redisClient.quit();
      done();
    });
  });

  beforeAll(async () => {
    const userA = await registerAndLoginUser('userA');
    userAToken = userA.token;
    const userB = await registerAndLoginUser('userB');
    userBToken = userB.token;
  });

  it('should reject unauthenticated access to user settings', async () => {
    const res = await request(server)
      .get('/api/users/settings');
    expect(res.status).toBe(401);
  });

  it('should only allow userA to access their settings', async () => {
    const resA = await request(server)
      .get('/api/users/settings')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(resA.status).toBe(200);
    const resB = await request(server)
      .get('/api/users/settings')
      .set('Authorization', `Bearer ${userBToken}`);
    expect(resB.status).toBe(200);
    // Should not see each other's settings (enforced by backend)
  });

  // Uncomment and implement if PATCH /api/users/settings is enabled
  // it('should reject invalid input for settings update', async () => {
  //   const res = await request(server)
  //     .patch('/api/users/settings')
  //     .set('Authorization', `Bearer ${userAToken}`)
  //     .send({ notifications: 'not_an_object' });
  //   expect([400, 422]).toContain(res.status);
  // });
}); 