import request from 'supertest';
import { app } from '../src/index';
import { redisClient } from '../src/index';

// Helper to register and login a user, returns JWT token
async function registerAndLoginUser() {
  const email = `projectuser_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const name = 'Project User';
  await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return { token: loginRes.body.data.token, email };
}

describe('Projects Integration', () => {
  let server: any;
  let token: string;
  let createdProjectId: string;

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
    const user = await registerAndLoginUser();
    token = user.token;
  });

  it('should reject unauthenticated project creation', async () => {
    const res = await request(server)
      .post('/api/projects')
      .send({ name: 'Test Project', url: 'https://example.com' });
    expect(res.status).toBe(401);
  });

  it('should create a project with valid data', async () => {
    const res = await request(server)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', url: 'https://example.com' });
    if (res.status !== 201) {
      // Log the full response for debugging
      console.error('Project creation failed:', res.status, res.body);
    }
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Project');
    createdProjectId = res.body.data.id;
  });

  it('should list projects for the authenticated user', async () => {
    const res = await request(server)
      .get('/api/projects?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    if (res.status !== 200) {
      // Log the full response for debugging
      console.error('List projects failed:', res.status, res.body, res.text, res);
    }
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.some((p: any) => p.id === createdProjectId)).toBe(true);
  });

  it('should get a project by ID', async () => {
    const res = await request(server)
      .get(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdProjectId);
  });

  it('should return 404 for non-existent project', async () => {
    const res = await request(server)
      .get('/api/projects/nonexistentid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should update a project', async () => {
    const res = await request(server)
      .patch(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project Name' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Project Name');
  });

  it('should delete a project', async () => {
    const res = await request(server)
      .delete(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('should return 404 when getting a deleted project', async () => {
    const res = await request(server)
      .get(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // More tests will be added for list, get by ID, update, delete, etc.
}); 