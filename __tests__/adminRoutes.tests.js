const request = require('supertest');

const BASE_URL = 'http://localhost:3004';

let testAdminId = null;

describe('Admin CRUD Routes (Integration)', () => {
  describe('POST /admin - Create new admin', () => {
    it('should create admin successfully', async () => {
      // change the id user profile to an existing user
      const newAdmin = {
        id_user_profile: 33
      };

      const response = await request(BASE_URL).post('/admin').send(newAdmin);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(newAdmin.id_user_profile);

      testAdminId = response.body.data.id;
    });

    it('should return 409 for existing admin', async () => {
        const response = await request(BASE_URL).post('/admin').send({ 
            id_user_profile: 8 });
        expect(response.status).toBe(409);
      });

    it('should return 400 for missing fields', async () => {
      const response = await request(BASE_URL).post('/admin').send({ });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /admins - Get all admins', () => {
    it('should return all admins successfully', async () => {
      const response = await request(BASE_URL).get('/admins');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /admin/:id - Get admin by ID', () => {
    it('should return admin by valid ID', async () => {
      const response = await request(BASE_URL).get(`/admin/${testAdminId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAdminId);
    });

    it('should return 404 for non-existent admin', async () => {
      const response = await request(BASE_URL).get('/admin/60000000000');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /admin/profile/:user_profile_id - Get event by event type', () => {
    it('should return admin by valid profile id', async () => {
      const profileID = 4;
      const response = await request(BASE_URL).get(`/admin/profile/${profileID}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(profileID);
    });

    it('should return 400 for invalid profile id', async () => {
      const response = await request(BASE_URL).get('/admin/profile/invalidtype');
      expect(response.status).toBe(400);
    });

  });

  describe('PATCH /admin/:id - Update admin', () => {

    it('should update the admin successfully', async () => {
      expect(testAdminId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/admin/${testAdminId}`)
        .send({ id_user_profile: 34 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for no update fields', async () => {
      const response = await request(BASE_URL)
        .patch(`/admin/${testAdminId}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /admin/:id - Delete admin', () => {

    it('should delete admin successfully', async () => {
      expect(testAdminId).toBeTruthy();
      const response = await request(BASE_URL).delete(`/admin/${testAdminId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for already deleted admin', async () => {
      const response = await request(BASE_URL).delete(`/admin/${testAdminId}`);
      expect(response.status).toBe(404);
    });
  });
});
