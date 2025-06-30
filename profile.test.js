const request = require('supertest');
const app = require('./src/index');

describe('Profile API', () => {
  let existingProfileId = null;
  let existingUserId = null; // Sera défini après le premier test

  // ========================================
  // TEST 1: GET /profiles - Récupérer tous les profils
  // ========================================
  describe('GET /profiles', () => {
    it('should get all profiles', async () => {
      const response = await request(app)
        .get('/profiles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User profiles retrieved successfully');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(typeof response.body.count).toBe('number');

      // Sauvegarder l'ID du premier profil pour les tests suivants
      if (response.body.data && response.body.data.length > 0) {
        existingProfileId = response.body.data[0].id;
        existingUserId = response.body.data[0].id_user;
        console.log(`ID du profil existant sauvegardé: ${existingProfileId}`);
        console.log(`ID de l'utilisateur existant sauvegardé: ${existingUserId}`);
      }
    });
  });

  // ========================================
  // TEST 2: GET /profile/:id - Récupérer un profil par ID
  // ========================================
  describe('GET /profile/:id', () => {
    it('should get a profile by ID', async () => {
      if (!existingProfileId) {
        console.log('Aucun profil existant pour tester GET /profile/:id');
        return;
      }

      const response = await request(app)
        .get(`/profile/${existingProfileId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User profile retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(existingProfileId);
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/profile/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user profile ID provided');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/profile/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User profile not found');
    });
  });

  // ========================================
  // TEST 3: GET /profile/user/:user_id - Récupérer un profil par user_id
  // ========================================
  describe('GET /profile/user/:user_id', () => {
    it('should get a profile by user_id', async () => {
      if (!existingUserId) {
        console.log('Aucun utilisateur existant pour tester GET /profile/user/:user_id');
        return;
      }

      const response = await request(app)
        .get(`/profile/user/${existingUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User profile retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id_user).toBe(existingUserId);
    });

    it('should return 400 for invalid user_id', async () => {
      const response = await request(app)
        .get('/profile/user/invalid-user-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID provided');
    });

    it('should return 400 for non-existent user_id (UUID valide mais inexistant)', async () => {
      const response = await request(app)
        .get('/profile/user/00000000-0000-0000-0000-000000000000')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID provided');
    });
  });

  // ========================================
  // TEST 4: POST /profile - Créer un nouveau profil
  // ========================================
  describe('POST /profile', () => {
    it('should return 400 when id_user is missing', async () => {
      const response = await request(app)
        .post('/profile')
        .send({ first_name: "Test" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID is required');
    });

    it('should return 400 for invalid id_user format', async () => {
      const response = await request(app)
        .post('/profile')
        .send({ 
          id_user: "invalid-uuid",
          first_name: "Test" 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID format');
    });

    it('should return 400 when user does not exist (UUID valide mais inexistant)', async () => {
      const response = await request(app)
        .post('/profile')
        .send({
          id_user: "12345678-1234-1234-1234-123456789abc",
          first_name: "Jean",
          last_name: "Dupont"
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID format');
    });

    it('should return 409 when profile already exists for user', async () => {
      if (!existingUserId) {
        console.log('Aucun utilisateur existant pour tester POST /profile');
        return;
      }

      const response = await request(app)
        .post('/profile')
        .send({
          id_user: existingUserId,
          first_name: "Jean",
          last_name: "Dupont"
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User profile already exists for this user');
    });
  });

  // ========================================
  // TEST 5: PATCH /profile/:id - Mettre à jour un profil
  // ========================================
  describe('PATCH /profile/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .patch('/profile/invalid-id')
        .send({ first_name: "Test" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user profile ID provided');
    });

    it('should return 400 when no fields are provided', async () => {
      const response = await request(app)
        .patch('/profile/1')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('At least one field must be provided for update');
    });

    it('should return 404 for non-existent profile', async () => {
      const response = await request(app)
        .patch('/profile/999999')
        .send({ first_name: "Test" })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User profile not found');
    });

    it('should update profile successfully', async () => {
      if (!existingProfileId) {
        console.log('Aucun profil existant pour tester PATCH /profile/:id');
        return;
      }

      const updateData = {
        first_name: "Jane Updated",
        bio: "Bio mise à jour pour les tests"
      };

      const response = await request(app)
        .patch(`/profile/${existingProfileId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User profile updated successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.first_name).toBe(updateData.first_name);
      expect(response.body.data.bio).toBe(updateData.bio);
    });
  });

  // ========================================
  // TEST 6: DELETE /profile/:id - Supprimer un profil
  // ========================================
  describe('DELETE /profile/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/profile/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user profile ID provided');
    });

    it('should return 404 for non-existent profile', async () => {
      const response = await request(app)
        .delete('/profile/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User profile not found');
    });

    it('should delete profile successfully', async () => {
      if (!existingProfileId) {
        console.log('Aucun profil existant pour tester DELETE /profile/:id');
        return;
      }

      const response = await request(app)
        .delete(`/profile/${existingProfileId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User profile deleted successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deletedProfile).toBeDefined();
      expect(response.body.data.deletedProfile.id).toBe(existingProfileId);
    });
  });

  // ========================================
  // TEST 7: Tests de validation des champs
  // ========================================
  describe('Field validation', () => {
    it('should validate required fields in POST', async () => {
      const response = await request(app)
        .post('/profile')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID is required');
    });

    it('should validate UUID format in POST', async () => {
      const response = await request(app)
        .post('/profile')
        .send({
          id_user: "not-a-uuid",
          first_name: "Test"
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID format');
    });

    it('should validate UUID format in GET /profile/user/:user_id', async () => {
      const response = await request(app)
        .get('/profile/user/not-a-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID provided');
    });
  });

  // ========================================
  // TEST 8: Tests de performance et robustesse
  // ========================================
  describe('Performance and robustness', () => {
    it('should handle large request bodies gracefully', async () => {
      if (!existingUserId) {
        console.log('Aucun utilisateur existant pour tester les grandes requêtes');
        return;
      }

      const largeData = {
        id_user: existingUserId,
        first_name: "A".repeat(1000), // Nom très long
        last_name: "B".repeat(1000),  // Nom très long
        bio: "C".repeat(5000)         // Bio très longue
      };

      const response = await request(app)
        .post('/profile')
        .send(largeData)
        .expect(409); // Devrait retourner 409 car le profil existe déjà

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User profile already exists for this user');
    });

    it('should handle special characters in fields', async () => {
      if (!existingProfileId) {
        console.log('Aucun profil existant pour tester les caractères spéciaux');
        return;
      }

      const specialData = {
        first_name: "Jean-François",
        last_name: "O'Connor",
        bio: "Bio avec des caractères spéciaux: éàçù€£¥"
      };

      const response = await request(app)
        .patch(`/profile/${existingProfileId}`)
        .send(specialData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe(specialData.first_name);
      expect(response.body.data.last_name).toBe(specialData.last_name);
      expect(response.body.data.bio).toBe(specialData.bio);
    });
  });
}); 