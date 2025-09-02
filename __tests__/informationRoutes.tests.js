const request = require('supertest');

const BASE_URL = 'http://localhost:3004';
let testInfoId = null;

describe('Informations CRUD Routes (Integration)', () => {

  describe('POST /information - Create new information', () => {
    it('should create information successfully', async () => {
      const newInfo = {
        title: 'Test Info',
        message: 'Integration test message',
        // change the id_creator to an existing one
        id_creator: 34,
      };

      const response = await request(BASE_URL).post('/information').send(newInfo);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(newInfo.message);

      testInfoId = response.body.data.id;
    });

    it('should return 409 for duplicate message', async () => {
      const duplicateInfo = {
        title: 'Duplicate Info',
        message: 'Integration test message',
        // change the id_creator to an existing one
        id_creator: 34,
      };

      const response = await request(BASE_URL).post('/information').send(duplicateInfo);
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Duplicate message/);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(BASE_URL).post('/information').send({
        message: 'Missing title',
      });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /informations - Get all informations', () => {
    it('should return all informations successfully', async () => {
      const response = await request(BASE_URL).get('/informations');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /information/:id - Get information by ID', () => {
    // const validID = 1;

    it('should return information by valid ID', async () => {
      const response = await request(BASE_URL).get(`/information/${testInfoId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testInfoId);
    });

    it('should return 404 for non-existent information', async () => {
      const response = await request(BASE_URL).get('/information/60000000000');
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(BASE_URL).get('/information/invalid-id');
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /information/:id - Update information', () => {
    it('should update information successfully', async () => {
      expect(testInfoId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/information/${testInfoId}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(BASE_URL)
        .patch('/information/invalid-id')
        .send({ title: 'Title' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent information', async () => {
      const response = await request(BASE_URL)
        .patch('/information/60000000000')
        .send({ title: 'Title' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /information/:id - Delete information', () => {
    it('should delete information successfully', async () => {
      expect(testInfoId).toBeTruthy();
      const response = await request(BASE_URL).delete(`/information/${testInfoId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for already deleted information', async () => {
      const response = await request(BASE_URL).delete(`/information/${testInfoId}`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(BASE_URL).delete('/information/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
