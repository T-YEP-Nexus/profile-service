const request = require('supertest');

const BASE_URL = 'http://localhost:3004';

let testProfileId = null;

describe('Profile CRUD Routes (Integration)', () => {
  describe('GET /profiles - Get all profiles', () => {
    it('should return all profiles successfully', async () => {
      const response = await request(BASE_URL).get('/profiles');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /profile/:id - Get profile by ID', () => {
    const validID = 4;

    it('should return profile by valid ID', async () => {
      const response = await request(BASE_URL).get(`/profile/${validID}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validID);
    });

    it('should return 404 for non-existent profile', async () => {
      const response = await request(BASE_URL).get('/profile/60000000000');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /profile/user/:user_id - Get profile by user id', () => {
    it('should return profile by valid user id', async () => {
      const userID = 'b3f547a9-f089-4d9f-b7d7-62e901c4010c';
      const response = await request(BASE_URL).get(`/profile/user/${userID}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user).toBe(userID);
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(BASE_URL).get('/profile/user/invalidtype');
      expect(response.status).toBe(400);
    });

  });

  describe('POST /admin - Create new profile', () => {
    it('should create profile successfully', async () => {
      const newProfile = {
        first_name: 'unit',
        last_name: 'test',
        phone: '0606060606',
        address: '1234567890',
        id_user: 'b9080501-9e79-4558-99de-9b2283d4e586',
        roles_user: 'student',
        campus: 'Lyon'
      };

      const response = await request(BASE_URL).post('/profile').send(newProfile);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user).toBe(newProfile.id_user);

      testProfileId = response.body.data.id;
    });

    it('should return 409 for existing profile', async () => {
        const response = await request(BASE_URL).post('/profile').send({ 
          first_name: 'unit',
          last_name: 'test',
          phone: '0606060606',
          address: '1234567890',
          id_user: 'b9080501-9e79-4558-99de-9b2283d4e586',
          roles_user: 'student',
          campus: 'Lyon'
        });
        expect(response.status).toBe(409);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(BASE_URL).post('/admin').send({
        first_name: 'unit',
        last_name: 'test',
        phone: '0606060606',
        address: '1234567890'
      });
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /admin/:id - Update profile', () => {

    it('should update the profile successfully', async () => {
      expect(testProfileId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/profile/${testProfileId}`)
        .send({ 
          first_name: 'unit jest'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for no update fields', async () => {
      const response = await request(BASE_URL)
        .patch(`/profile/${testProfileId}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /profile/:id - Delete profile', () => {

    it('should delete profile successfully', async () => {
      expect(testProfileId).toBeTruthy();
      const response = await request(BASE_URL).delete(`/profile/${testProfileId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for already deleted profile', async () => {
      const response = await request(BASE_URL).delete(`/profile/${testProfileId}`);
      expect(response.status).toBe(404);
    });
  });
});
