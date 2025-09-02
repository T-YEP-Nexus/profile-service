const request = require('supertest');

const BASE_URL = 'http://localhost:3004';
let testPromotionId = null;

describe('Promotions CRUD Routes (Integration)', () => {

  describe('GET /promotions - Get all promotions', () => {
    it('should return all promotions successfully', async () => {
      const response = await request(BASE_URL).get('/promotions');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /promotion - Create promotion', () => {
    it('should create a promotion successfully', async () => {
      const response = await request(BASE_URL)
        .post('/promotion')
        .send({ name: 'Promotiontest' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Promotiontest');

      testPromotionId = response.body.data.id;
    });

    it('should return 400 for missing name', async () => {
      const response = await request(BASE_URL).post('/promotion').send({});
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate name', async () => {
      const response = await request(BASE_URL)
        .post('/promotion')
        .send({ name: 'Promotiontest' });
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /promotion/:id - Get promotion by ID', () => {
    it('should return promotion by valid ID', async () => {
      const response = await request(BASE_URL).get(`/promotion/${testPromotionId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPromotionId);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(BASE_URL).get('/promotion/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent promotion', async () => {
    //   const fakeUUID = '11111111-1111-1111-1111-111111111111';
      const fakeUUID = 'aaaaaaa1-1aaa-1aaa-aaa1-1aaaaaaaaaa1'
      const response = await request(BASE_URL).get(`/promotion/${fakeUUID}`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /promotion/:id - Update promotion', () => {
    it('should update promotion successfully', async () => {
      const response = await request(BASE_URL)
        .patch(`/promotion/${testPromotionId}`)
        .send({ name: 'Promotionupdt' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Promotionupdt');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(BASE_URL)
        .patch('/promotion/invalid-id')
        .send({ name: 'Fail Update' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing name', async () => {
      const response = await request(BASE_URL)
        .patch(`/promotion/${testPromotionId}`)
        .send({});
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /promotion/:id - Delete promotion', () => {
    it('should delete promotion successfully', async () => {
      const response = await request(BASE_URL).delete(`/promotion/${testPromotionId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when deleting already deleted promotion', async () => {
      const response = await request(BASE_URL).delete(`/promotion/${testPromotionId}`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(BASE_URL).delete('/promotion/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
