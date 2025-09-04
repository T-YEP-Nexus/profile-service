const request = require("supertest");
const supabase = require("../config/supabaseClient");
const bcrypt = require("bcrypt");

const BASE_URL = "http://localhost:3004";
let testPromotionId = null;
let authToken = null;
let mainTestUserId = null;
let mainTestUserProfileId = null;
let testUserCredentials = null;

// Helper function to create test user and profile
async function createTestUser() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const testUser = {
    email: `testuser${timestamp}_${randomId}@test.com`,
    password: "testpassword123",
  };

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(testUser.password, saltRounds);

  // Create user in database
  const { data: user, error: userError } = await supabase
    .from("user")
    .insert([
      {
        email: testUser.email,
        password: hashedPassword,
      },
    ])
    .select()
    .single();

  if (userError) {
    throw new Error(`Failed to create test user: ${userError.message}`);
  }

  // Create user profile
  const { data: profile, error: profileError } = await supabase
    .from("user-profile")
    .insert([
      {
        id_user: user.id,
        roles_user: "admin",
      },
    ])
    .select()
    .single();

  if (profileError) {
    // Clean up user if profile creation fails
    await supabase.from("user").delete().eq("id", user.id);
    throw new Error(
      `Failed to create test user profile: ${profileError.message}`
    );
  }

  return {
    user,
    profile,
    credentials: testUser,
  };
}

// Helper function to delete test user and profile
async function deleteTestUser(userId, profileId) {
  try {
    if (profileId) {
      const { error: profileError } = await supabase
        .from("user-profile")
        .delete()
        .eq("id", profileId);

      if (profileError) {
        console.error(
          `❌ Failed to delete profile ${profileId}:`,
          profileError
        );
      } else {
        console.log(`✅ Profile ${profileId} deleted successfully`);
      }
    }

    if (userId) {
      const { error: userError } = await supabase
        .from("user")
        .delete()
        .eq("id", userId);

      if (userError) {
        console.error(`❌ Failed to delete user ${userId}:`, userError);
      } else {
        console.log(`✅ User ${userId} deleted successfully`);
      }
    }
  } catch (error) {
    console.error(
      `❌ Error during cleanup for user ${userId}, profile ${profileId}:`,
      error
    );
  }
}

// Helper function to get authentication token from auth service
async function getAuthToken(credentials) {
  const loginResponse = await request("http://localhost:3001")
    .post("/login")
    .send(credentials);

  if (loginResponse.status !== 200) {
    throw new Error(`Failed to get auth token: ${loginResponse.body.message}`);
  }

  return loginResponse.body.data.token;
}

describe("Promotions CRUD Routes (Integration)", () => {
  // Setup: Create test user and get authentication token before running tests
  beforeAll(async () => {
    try {
      // Create test user with profile
      const testUserData = await createTestUser();
      mainTestUserId = testUserData.user.id;
      mainTestUserProfileId = testUserData.profile.id;
      testUserCredentials = testUserData.credentials;

      // Get authentication token
      authToken = await getAuthToken(testUserCredentials);

      // Create a persistent promotion for testing
      const promotionResponse = await request(BASE_URL)
        .post("/promotion")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Persistent Test Promotion",
        });

      if (promotionResponse.status === 201) {
        testPromotionId = promotionResponse.body.data.id;
      }
    } catch (error) {
      console.error("Failed to setup test user:", error);
    }
  });

  // Cleanup: Delete test user after all tests are done
  afterAll(async () => {
    try {
      // Delete the persistent test promotion first
      if (testPromotionId) {
        await supabase.from("promotion").delete().eq("id", testPromotionId);
      }

      // Delete the main test user
      await deleteTestUser(mainTestUserId, mainTestUserProfileId);
    } catch (error) {
      console.error("Failed to cleanup test user:", error);
    }
  });

  describe("Authentication Tests", () => {
    it("should reject requests without token", async () => {
      const response = await request(BASE_URL).get("/promotions");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should reject requests with invalid token", async () => {
      const response = await request(BASE_URL)
        .get("/promotions")
        .set("Authorization", "Bearer invalid-token");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should accept requests with valid token", async () => {
      const response = await request(BASE_URL)
        .get("/promotions")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /promotions - Get all promotions", () => {
    it("should return all promotions successfully", async () => {
      const response = await request(BASE_URL)
        .get("/promotions")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("POST /promotion - Create promotion", () => {
    it("should create a promotion successfully", async () => {
      const response = await request(BASE_URL)
        .post("/promotion")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Promotiontest" });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Promotiontest");

      // Clean up the created promotion
      try {
        await supabase
          .from("promotion")
          .delete()
          .eq("id", response.body.data.id);
      } catch (cleanupError) {
        console.error(`❌ Failed to cleanup test promotion:`, cleanupError);
      }
    });

    it("should return 400 for missing name", async () => {
      const response = await request(BASE_URL)
        .post("/promotion")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 409 for duplicate name", async () => {
      const response = await request(BASE_URL)
        .post("/promotion")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Persistent Test Promotion" });
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /promotion/:id - Get promotion by ID", () => {
    it("should return promotion by valid ID", async () => {
      const response = await request(BASE_URL)
        .get(`/promotion/${testPromotionId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPromotionId);
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await request(BASE_URL)
        .get("/promotion/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent promotion", async () => {
      //   const fakeUUID = '11111111-1111-1111-1111-111111111111';
      const fakeUUID = "aaaaaaa1-1aaa-1aaa-aaa1-1aaaaaaaaaa1";
      const response = await request(BASE_URL)
        .get(`/promotion/${fakeUUID}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /promotion/:id - Update promotion", () => {
    it("should update promotion successfully", async () => {
      const response = await request(BASE_URL)
        .patch(`/promotion/${testPromotionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Promotionupdt" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Promotionupdt");
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await request(BASE_URL)
        .patch("/promotion/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Fail Update" });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing name", async () => {
      const response = await request(BASE_URL)
        .patch(`/promotion/${testPromotionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});
      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /promotion/:id - Delete promotion", () => {
    it("should delete promotion successfully", async () => {
      // Create a temporary promotion for this test with unique name
      const uniqueName = `Delete Test Promotion ${Date.now()}`;
      const createResponse = await request(BASE_URL)
        .post("/promotion")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: uniqueName });

      expect(createResponse.status).toBe(201);
      const tempPromotionId = createResponse.body.data.id;

      // Now delete it
      const response = await request(BASE_URL)
        .delete(`/promotion/${tempPromotionId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 when deleting already deleted promotion", async () => {
      // Create a temporary promotion for this test with unique name
      const uniqueName = `404 Test Promotion ${Date.now()}`;
      const createResponse = await request(BASE_URL)
        .post("/promotion")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: uniqueName });

      expect(createResponse.status).toBe(201);
      const tempPromotionId = createResponse.body.data.id;

      // Delete it first
      await request(BASE_URL)
        .delete(`/promotion/${tempPromotionId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Try to delete it again (should return 404)
      const response = await request(BASE_URL)
        .delete(`/promotion/${tempPromotionId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await request(BASE_URL)
        .delete("/promotion/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
