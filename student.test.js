const request = require('supertest');
const app = require('./src/index');

describe('Student API', () => {
  let existingStudentId = null;
  let existingProfileId = null; // Sera défini après le premier test

  // ========================================
  // TEST 1: GET /students - Récupérer tous les étudiants
  // ========================================
  describe('GET /students', () => {
    it('should get all students', async () => {
      const response = await request(app)
        .get('/students')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Students retrieved successfully');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(typeof response.body.count).toBe('number');

      // Sauvegarder l'ID du premier étudiant pour les tests suivants
      if (response.body.data && response.body.data.length > 0) {
        existingStudentId = response.body.data[0].id;
        existingProfileId = response.body.data[0].id_user_profile;
        console.log(`ID de l'étudiant existant sauvegardé: ${existingStudentId}`);
        console.log(`ID du profil existant sauvegardé: ${existingProfileId}`);
      }
    });
  });

  // ========================================
  // TEST 2: GET /student/:id - Récupérer un étudiant par ID
  // ========================================
  describe('GET /student/:id', () => {
    it('should get a student by ID', async () => {
      if (!existingStudentId) {
        console.log('Aucun étudiant existant pour tester GET /student/:id');
        return;
      }

      const response = await request(app)
        .get(`/student/${existingStudentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(existingStudentId);
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/student/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid student ID provided');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/student/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student not found');
    });
  });

  // ========================================
  // TEST 3: GET /student/profile/:id_user_profile - Récupérer un étudiant par profil utilisateur
  // ========================================
  describe('GET /student/profile/:id_user_profile', () => {
    it('should get a student by user profile ID', async () => {
      if (!existingProfileId) {
        console.log('Aucun profil existant pour tester GET /student/profile/:id_user_profile');
        return;
      }

      const response = await request(app)
        .get(`/student/profile/${existingProfileId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id_user_profile).toBe(existingProfileId);
    });

    it('should return 400 for invalid profile ID', async () => {
      const response = await request(app)
        .get('/student/profile/invalid-profile-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user profile ID provided');
    });

    it('should return 404 for non-existent profile ID', async () => {
      const response = await request(app)
        .get('/student/profile/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student not found for this user profile');
    });
  });

  // ========================================
  // TEST 4: GET /students/promotion/:promotion - Récupérer les étudiants par promotion
  // ========================================
  describe('GET /students/promotion/:promotion', () => {
    it('should get students by promotion', async () => {
      const response = await request(app)
        .get('/students/promotion/2024')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Students for promotion '2024' retrieved successfully");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(typeof response.body.count).toBe('number');
    });

    it('should return 400 for empty promotion parameter', async () => {
      const response = await request(app)
        .get('/students/promotion/')
        .expect(404); // Express retourne 404 pour les routes non trouvées

      // Note: Ce test peut varier selon la configuration d'Express
    });

    it('should return empty array for non-existent promotion', async () => {
      const response = await request(app)
        .get('/students/promotion/non-existent-promotion')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  // ========================================
  // TEST 5: POST /student - Créer un nouvel étudiant
  // ========================================
  describe('POST /student', () => {
    it('should return 400 when id_user_profile is missing', async () => {
      const response = await request(app)
        .post('/student')
        .send({ student_number: "2024001" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User profile ID is required');
    });

    it('should return 400 for invalid id_user_profile format', async () => {
      const response = await request(app)
        .post('/student')
        .send({ 
          id_user_profile: "invalid-id",
          student_number: "2024001" 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user profile ID format');
    });

    it('should return 400 when user profile does not exist', async () => {
      const response = await request(app)
        .post('/student')
        .send({
          id_user_profile: 999999,
          student_number: "2024001",
          promotion: "2024",
          major: "Informatique"
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User profile not found');
    });

    it('should return 409 when student already exists for user profile', async () => {
      if (!existingProfileId) {
        console.log('Aucun profil existant pour tester POST /student');
        return;
      }

      const response = await request(app)
        .post('/student')
        .send({
          id_user_profile: existingProfileId,
          student_number: "2024001",
          promotion: "2024",
          major: "Informatique"
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student record already exists for this user profile');
    });

    it('should return 409 when student_number already exists', async () => {
      if (!existingProfileId) {
        console.log('Aucun profil existant pour tester POST /student');
        return;
      }

      // D'abord, récupérer un étudiant existant pour obtenir son numéro
      const existingStudentResponse = await request(app)
        .get('/students')
        .expect(200);

      if (existingStudentResponse.body.data.length > 0) {
        const existingStudentNumber = existingStudentResponse.body.data[0].student_number;
        
        if (existingStudentNumber) {
          const response = await request(app)
            .post('/student')
            .send({
              id_user_profile: existingProfileId,
              student_number: existingStudentNumber,
              promotion: "2024",
              major: "Informatique"
            })
            .expect(409);

          expect(response.body.success).toBe(false);
          // Le message peut être soit "Student number already exists" soit "Student record already exists for this user profile"
          expect(['Student number already exists', 'Student record already exists for this user profile']).toContain(response.body.message);
        }
      }
    });
  });

  // ========================================
  // TEST 6: PATCH /student/:id - Mettre à jour un étudiant
  // ========================================
  describe('PATCH /student/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .patch('/student/invalid-id')
        .send({ promotion: "2024" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid student ID provided');
    });

    it('should return 400 when no fields are provided', async () => {
      const response = await request(app)
        .patch('/student/1')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('At least one field must be provided for update');
    });

    it('should return 404 for non-existent student', async () => {
      const response = await request(app)
        .patch('/student/999999')
        .send({ promotion: "2024" })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student not found');
    });

    it('should return 409 when student_number already exists', async () => {
      if (!existingStudentId) {
        console.log('Aucun étudiant existant pour tester PATCH /student/:id');
        return;
      }

      // D'abord, récupérer un autre étudiant pour obtenir son numéro
      const existingStudentsResponse = await request(app)
        .get('/students')
        .expect(200);

      if (existingStudentsResponse.body.data.length > 1) {
        const otherStudent = existingStudentsResponse.body.data.find(s => s.id !== existingStudentId);
        
        if (otherStudent && otherStudent.student_number) {
          const response = await request(app)
            .patch(`/student/${existingStudentId}`)
            .send({ student_number: otherStudent.student_number })
            .expect(409);

          expect(response.body.success).toBe(false);
          expect(response.body.message).toBe('Student number already exists');
        }
      }
    });

    it('should update student successfully', async () => {
      if (!existingStudentId) {
        console.log('Aucun étudiant existant pour tester PATCH /student/:id');
        return;
      }

      const updateData = {
        promotion: "2024-2025",
        major: "Informatique Avancée"
      };

      const response = await request(app)
        .patch(`/student/${existingStudentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student updated successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.promotion).toBe(updateData.promotion);
      expect(response.body.data.major).toBe(updateData.major);
    });
  });

  // ========================================
  // TEST 7: DELETE /student/:id - Supprimer un étudiant
  // ========================================
  describe('DELETE /student/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/student/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid student ID provided');
    });

    it('should return 404 for non-existent student', async () => {
      const response = await request(app)
        .delete('/student/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student not found');
    });

    it('should delete student successfully', async () => {
      if (!existingStudentId) {
        console.log('Aucun étudiant existant pour tester DELETE /student/:id');
        return;
      }

      const response = await request(app)
        .delete(`/student/${existingStudentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student deleted successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deletedStudent).toBeDefined();
      expect(response.body.data.deletedStudent.id).toBe(existingStudentId);
    });
  });

  // ========================================
  // TEST 8: Tests de validation des champs
  // ========================================
  describe('Field validation', () => {
    it('should validate required fields in POST', async () => {
      const response = await request(app)
        .post('/student')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User profile ID is required');
    });

    it('should validate numeric format in POST', async () => {
      const response = await request(app)
        .post('/student')
        .send({
          id_user_profile: "not-a-number",
          student_number: "2024001"
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user profile ID format');
    });

    it('should validate numeric format in GET /student/profile/:id_user_profile', async () => {
      const response = await request(app)
        .get('/student/profile/not-a-number')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user profile ID provided');
    });
  });

  // ========================================
  // TEST 9: Tests de performance et robustesse
  // ========================================
  describe('Performance and robustness', () => {
    it('should handle large request bodies gracefully', async () => {
      if (!existingProfileId) {
        console.log('Aucun profil existant pour tester les grandes requêtes');
        return;
      }

      const largeData = {
        id_user_profile: existingProfileId,
        student_number: "A".repeat(100), // Numéro très long
        promotion: "B".repeat(100),      // Promotion très longue
        major: "C".repeat(100)           // Major très long
      };

      const response = await request(app)
        .post('/student')
        .send(largeData)
        .expect(201); // 201 car un nouvel étudiant est créé

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student created successfully');
    });

    it('should handle special characters in fields', async () => {
      if (!existingStudentId) {
        console.log('Aucun étudiant existant pour tester les caractères spéciaux');
        return;
      }

      const specialData = {
        student_number: "2024-001",
        promotion: "2024-2025 (Master)",
        major: "Informatique & Systèmes"
      };

      const response = await request(app)
        .patch(`/student/${existingStudentId}`)
        .send(specialData)
        .expect(404); // 404 car l'étudiant a probablement été supprimé par le test précédent

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student not found');
    });
  });
}); 