const request = require("supertest");
const supabase = require("../config/supabaseClient");
const bcrypt = require("bcrypt");

const BASE_URL = "http://localhost:3004";

let testAdminId = null;
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
    // First delete any admin records that reference this profile
    if (profileId) {
      await supabase.from("admin").delete().eq("id_user_profile", profileId);
    }

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

  console.log("Login response status:", loginResponse.status);
  console.log("Login response body:", loginResponse.body);

  if (loginResponse.status !== 200) {
    throw new Error(`Failed to get auth token: ${loginResponse.body.message}`);
  }

  return loginResponse.body.data.token;
}

describe("Admin CRUD Routes (Integration)", () => {
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
      console.log(
        "Auth token obtained:",
        authToken ? "✅ Token received" : "❌ No token"
      );

      // Create a persistent admin for testing
      const adminResponse = await request(BASE_URL)
        .post("/admin")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          id_user_profile: mainTestUserProfileId,
        });

      if (adminResponse.status === 201) {
        testAdminId = adminResponse.body.data.id;
        console.log("Persistent test admin created with ID:", testAdminId);
      }
    } catch (error) {
      console.error("Failed to setup test user:", error);
    }
  });

  // Cleanup: Delete test user after all tests are done
  afterAll(async () => {
    try {
      // Delete the persistent test admin first
      if (testAdminId) {
        await supabase.from("admin").delete().eq("id", testAdminId);
        console.log(
          `✅ Persistent test admin ${testAdminId} deleted successfully`
        );
      }

      // Delete the main test user
      await deleteTestUser(mainTestUserId, mainTestUserProfileId);
    } catch (error) {
      console.error("Failed to cleanup test user:", error);
    }
  });

  describe("Authentication Tests", () => {
    it("should reject requests without token", async () => {
      const response = await request(BASE_URL).get("/admins");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should reject requests with invalid token", async () => {
      const response = await request(BASE_URL)
        .get("/admins")
        .set("Authorization", "Bearer invalid-token");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should accept requests with valid token", async () => {
      const response = await request(BASE_URL)
        .get("/admins")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /admin - Create new admin", () => {
    it("should create admin successfully", async () => {
      // Create a new user for this test
      const testUserData = await createTestUser();
      const newUserId = testUserData.user.id;
      const newUserProfileId = testUserData.profile.id;

      const newAdmin = {
        id_user_profile: newUserProfileId,
      };

      const response = await request(BASE_URL)
        .post("/admin")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newAdmin);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(newAdmin.id_user_profile);

      // Don't overwrite testAdminId - keep the persistent one
      // Clean up the test user and admin
      try {
        await supabase.from("admin").delete().eq("id", response.body.data.id);
        await deleteTestUser(newUserId, newUserProfileId);
        console.log(
          `✅ Test admin ${response.body.data.id} and user ${newUserId} cleaned up successfully`
        );
      } catch (cleanupError) {
        console.error(
          `❌ Failed to cleanup test admin ${response.body.data.id}:`,
          cleanupError
        );
      }
    });

    it("should return 409 for existing admin", async () => {
      // Try to create another admin with the same user profile (already exists from beforeAll)
      const response = await request(BASE_URL)
        .post("/admin")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          id_user_profile: mainTestUserProfileId,
        });
      expect(response.status).toBe(409);
    });

    it("should return 400 for missing fields", async () => {
      const response = await request(BASE_URL)
        .post("/admin")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});
      expect(response.status).toBe(400);
    });
  });

  describe("GET /admins - Get all admins", () => {
    it("should return all admins successfully", async () => {
      const response = await request(BASE_URL)
        .get("/admins")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /admin/:id - Get admin by ID", () => {
    it("should return admin by valid ID", async () => {
      const response = await request(BASE_URL)
        .get(`/admin/${testAdminId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAdminId);
    });

    it("should return 404 for non-existent admin", async () => {
      const response = await request(BASE_URL)
        .get("/admin/60000000000")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });

  // adapt id here based on test DB
  describe("GET /admin/profile/:user_profile_id - Get event by event type", () => {
    it("should return admin by valid profile id", async () => {
      const profileID = mainTestUserProfileId;
      const response = await request(BASE_URL)
        .get(`/admin/profile/${profileID}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(profileID);
    });

    it("should return 400 for invalid profile id", async () => {
      const response = await request(BASE_URL)
        .get("/admin/profile/invalidtype")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /admin/:id - Update admin", () => {
    it("should update the admin successfully", async () => {
      expect(testAdminId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/admin/${testAdminId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ id_user_profile: 34 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 for no update fields", async () => {
      const response = await request(BASE_URL)
        .patch(`/admin/${testAdminId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /admin/:id - Delete admin", () => {
    it("should delete admin successfully", async () => {
      expect(testAdminId).toBeTruthy();
      const response = await request(BASE_URL)
        .delete(`/admin/${testAdminId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 for already deleted admin", async () => {
      const response = await request(BASE_URL)
        .delete(`/admin/${testAdminId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });
});
