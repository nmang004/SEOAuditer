import request from 'supertest';
import { app } from '../src/index';
import { redisClient } from '../src/index';

// Helper to register and login a user, returns JWT token
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

describe('Analysis & Issues Security', () => {
  let server: any;
  let userAToken: string;
  let userBToken: string;
  let projectId: string;
  let analysisId: string;
  let issueId: string;

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
    // Create a project as userA
    const projectRes = await request(server)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'SecTest Project', url: 'https://sectest.com' });
    projectId = projectRes.body.data.id;
    // Start an analysis as userA
    const analysisRes = await request(server)
      .post(`/api/projects/${projectId}/analyses`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send();
    analysisId = analysisRes.body.data.analysisId;
    // Wait for analysis to complete (simulate or poll if needed)
    // For now, just try to get issues (should exist as mock data)
    const issuesRes = await request(server)
      .get(`/api/projects/${projectId}/analyses/${analysisId}/issues`)
      .set('Authorization', `Bearer ${userAToken}`);
    if (issuesRes.body.data && issuesRes.body.data.length > 0) {
      issueId = issuesRes.body.data[0].id;
    }
  });

  it('should reject unauthenticated access to analyses', async () => {
    const res = await request(server)
      .get(`/api/projects/${projectId}/analyses`);
    expect(res.status).toBe(401);
  });

  it('should reject userB accessing userA analysis', async () => {
    const res = await request(server)
      .get(`/api/projects/${projectId}/analyses`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect([403, 404]).toContain(res.status);
  });

  it('should reject userB updating userA issue', async () => {
    if (!issueId) return;
    const res = await request(server)
      .patch(`/api/projects/${projectId}/analyses/issues/${issueId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ status: 'fixed' });
    expect([403, 404]).toContain(res.status);
  });

  it('should reject invalid input for analysis creation', async () => {
    const res = await request(server)
      .post(`/api/projects/${projectId}/analyses`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ invalidField: 'bad' });
    expect([400, 422]).toContain(res.status);
  });

  it('should reject invalid input for issue update', async () => {
    if (!issueId) return;
    const res = await request(server)
      .patch(`/api/projects/${projectId}/analyses/issues/${issueId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'not_a_valid_status' });
    expect([400, 422]).toContain(res.status);
  });
}); 