const request = require('supertest');

const BASE_URL = 'http://localhost:3004';

let testAdvisorId = null;

describe('Advisor CRUD Routes (Integration)', () => {
  describe('GET /advisors - Get all advisors', () => {
    it('should return all advisors successfully', async () => {
      const response = await request(BASE_URL).get('/advisors');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /advisor/:id - Get advisor by ID', () => {
    const validID = 12;

    it('should return advisor by valid ID', async () => {
      const response = await request(BASE_URL).get(`/advisor/${validID}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validID);
    });

    it('should return 404 for non-existent advisor', async () => {
      const response = await request(BASE_URL).get('/advisor/60000000000');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /advisor/profile/:id_user_profile - Get advisor by user profile id', () => {
    it('should return advisor by valid user profile id', async () => {
      const userID = 7;
      const response = await request(BASE_URL).get(`/advisor/profile/${userID}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(userID);
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(BASE_URL).get('/advisor/profile/invalidtype');
      expect(response.status).toBe(400);
    });
  });

  describe('POST /advisor - Create new advisor', () => {
    it('should create advisor successfully', async () => {
      const newAdvisor = {
        specialty: 'projectmanagement',
        room: '1-9',
        availability: '5j/7',
        id_user_profile: 14
      };

      const response = await request(BASE_URL).post('/advisor').send(newAdvisor);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(newAdvisor.id_user_profile);

      testAdvisorId = response.body.data.id;
    });

    it('should return 409 for existing advisor', async () => {
        const response = await request(BASE_URL).post('/advisor').send({ 
          specialty: 'projectmanagement',
          room: '1-9',
          availability: '5j/7',
          id_user_profile: 14
        });
        expect(response.status).toBe(409);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(BASE_URL).post('/advisor').send({
        specialty: 'projectmanagement',
        room: '1-9',
        availability: '5j/7'
      });
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /advisor/:id - Update advisor', () => {

    it('should update the advisor successfully', async () => {
      expect(testAdvisorId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/advisor/${testAdvisorId}`)
        .send({ 
          specialty: 'cybersecurity'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for no update fields', async () => {
      const response = await request(BASE_URL)
        .patch(`/advisor/${testAdvisorId}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /advisor/:id - Delete advisor', () => {

    it('should delete advisor successfully', async () => {
      expect(testAdvisorId).toBeTruthy();
      const response = await request(BASE_URL).delete(`/advisor/${testAdvisorId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for already deleted advisor', async () => {
      const response = await request(BASE_URL).delete(`/advisor/${testAdvisorId}`);
      expect(response.status).toBe(404);
    });
  });
});
