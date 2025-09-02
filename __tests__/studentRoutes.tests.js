const request = require('supertest');

const BASE_URL = 'http://localhost:3004';

let testStudentId = null;
let testStudentUserProfile = null;

describe('Student CRUD Routes (Integration)', () => {
  describe('POST /student - Create new student', () => {
    it('should create student successfully', async () => {
      const newStudent = {
        student_number: '123456',
        major: 'Cloud',
        // adapt the id_user_profile & promotion to an existing one in your test DB
        id_user_profile: 55,
        id_promotion: '388bf596-6be5-4fee-b227-38bab0d5ed4a'
      };
      const response = await request(BASE_URL).post('/student').send(newStudent);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.student_number).toBe(newStudent.student_number);

      testStudentId = response.body.data.id;
      testStudentUserProfile = response.body.data.id_user_profile;
    });

    it('should return 409 for existing student', async () => {
      const response = await request(BASE_URL).post('/student').send({ 
        student_number: '9276308067',
        major: 'Cloud',
        id_promotion: '388bf596-6be5-4fee-b227-38bab0d5ed4a',
        id_user_profile: testStudentUserProfile
      });
      expect(response.status).toBe(409);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(BASE_URL).post('/student').send({
          promotion: '388bf596-6be5-4fee-b227-38bab0d5ed4a'
      });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /students - Get all students', () => {
    it('should return all students successfully', async () => {
      const response = await request(BASE_URL).get('/students');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /student/:id - Get student by ID', () => {
    it('should return advisor by valid ID', async () => {
      const response = await request(BASE_URL).get(`/student/${testStudentId}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testStudentId);
    });

    it('should return 404 for non-existent advisor', async () => {
      const response = await request(BASE_URL).get('/student/60000000000');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /student/profile/:id_user_profile - Get student by user profile id', () => {
    it('should return student by valid user profile id', async () => {
      const response = await request(BASE_URL).get(`/student/profile/${testStudentUserProfile}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(testStudentUserProfile);
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(BASE_URL).get('/student/profile/invalidtype');
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /student/:id - Update student', () => {
    it('should update the student successfully', async () => {
      expect(testStudentId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/student/${testStudentId}`)
        .send({ 
          id_promotion: "388bf596-6be5-4fee-b227-38bab0d5ed4a"
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
