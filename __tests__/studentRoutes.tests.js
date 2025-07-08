const request = require('supertest');

const BASE_URL = 'http://localhost:3004';

let testStudentId = null;

describe('Student CRUD Routes (Integration)', () => {
  describe('GET /students - Get all students', () => {
    it('should return all students successfully', async () => {
      const response = await request(BASE_URL).get('/students');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /student/:id - Get student by ID', () => {
    const validID = 14;

    it('should return advisor by valid ID', async () => {
      const response = await request(BASE_URL).get(`/student/${validID}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validID);
    });

    it('should return 404 for non-existent advisor', async () => {
      const response = await request(BASE_URL).get('/student/60000000000');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /student/profile/:id_user_profile - Get student by user profile id', () => {
    it('should return student by valid user profile id', async () => {
      const userID = 14;
      const response = await request(BASE_URL).get(`/student/profile/${userID}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(userID);
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(BASE_URL).get('/student/profile/invalidtype');
      expect(response.status).toBe(400);
    });
  });

  describe('POST /student - Create new student', () => {
    it('should create student successfully', async () => {
      const newStudent = {
        student_number: '9276308067',
        promotion: 'MSC_2026',
        major: 'Cloud',
        id_user_profile: 16
      };
      const response = await request(BASE_URL).post('/student').send(newStudent);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.student_number).toBe(newStudent.student_number);

      testStudentId = response.body.data.id;
    });

    it('should return 409 for existing student', async () => {
      const response = await request(BASE_URL).post('/student').send({ 
        student_number: '9276308067',
        promotion: 'MSC_2026',
        major: 'Cloud',
        id_user_profile: 16
      });
      expect(response.status).toBe(409);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(BASE_URL).post('/student').send({
          promotion: 'MSC_2028'
      });
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /student/:id - Update student', () => {
    it('should update the student successfully', async () => {
      expect(testStudentId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/student/${testStudentId}`)
        .send({ 
          promotion: 'MSC_2028'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for no update fields', async () => {
      const response = await request(BASE_URL)
        .patch(`/student/${testStudentId}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /student/:id - Delete student', () => {

    it('should delete student successfully', async () => {
      expect(testStudentId).toBeTruthy();
      const response = await request(BASE_URL).delete(`/student/${testStudentId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for already deleted student', async () => {
      const response = await request(BASE_URL).delete(`/student/${testStudentId}`);
      expect(response.status).toBe(404);
    });
  });
});
