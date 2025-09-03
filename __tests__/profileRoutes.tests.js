const request = require('supertest');

const BASE_URL = 'http://localhost:3004';

let testProfileId = null;
let testProfileUserId = null;

describe('Profile CRUD Routes (Integration)', () => {
  describe('POST /profile - Create new profile', () => {
    it('should create profile successfully', async () => {
      const newProfile = {
        // make sure user_id is correct
        id_user: 'd73f23af-712a-46cb-8724-7ad47639fb6a',
        first_name: 'unit',
        last_name: 'test',
        phone: '0606060606',
        address: '1234567890',
        campus: 'Lyon',
        roles_user: 'student'
      };

      const response = await request(BASE_URL).post('/profile').send(newProfile);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user).toBe(newProfile.id_user);

      testProfileId = response.body.data.id;
      testProfileUserId = response.body.data.id_user;
    });

    it('should return 409 for existing profile', async () => {
        const response = await request(BASE_URL).post('/profile').send({ 
          id_user: 'd73f23af-712a-46cb-8724-7ad47639fb6a',
          first_name: 'unit',
          last_name: 'test',
          phone: '0606060606',
          address: '1234567890',
          campus: 'Lyon',
          roles_user: 'student'
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

  describe('GET /profiles - Get all profiles', () => {
    it('should return all profiles successfully', async () => {
      const response = await request(BASE_URL).get('/profiles');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /profile/:id - Get profile by ID', () => {
    it('should return profile by valid ID', async () => {
      const response = await request(BASE_URL).get(`/profile/${testProfileId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testProfileId);
    });

    it('should return 404 for non-existent profile', async () => {
      const response = await request(BASE_URL).get('/profile/60000000000');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /profile/user/:user_id - Get profile by user id', () => {
    it('should return profile by valid user id', async () => {
      const response = await request(BASE_URL).get(`/profile/user/${testProfileUserId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user).toBe(testProfileUserId);
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(BASE_URL).get('/profile/user/invalidtype');
      expect(response.status).toBe(400);
    });

  });

  describe('PATCH /profile/:id - Update profile', () => {

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
