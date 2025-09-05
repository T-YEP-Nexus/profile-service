const request = require("supertest");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const supabase = require("../config/supabaseClient.js");
const bcrypt = require("bcrypt");

// Import the app setup
const auth = require("../src/middleware/auth");
const profileRoutes = require("../src/routes/profile/profileRoutes.js");

// Create test app
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(auth);

app.use("", profileRoutes);

// Use the app for testing instead of external URL
const BASE_URL = app;

let testProfileId = null;
let testProfileUserId = null;
let authToken = null;
let mainTestUserId = null;
let mainTestUserProfileId = null;
let testUserCredentials = null;

// Helper function to create a test user with profile
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
        roles_user: "admin", // Use admin role for testing
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

  if (loginResponse.status === 200 && loginResponse.body.success) {
    return loginResponse.body.data.token;
  }

  throw new Error("Failed to get authentication token");
}

describe("Profile CRUD Routes (Integration)", () => {
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

      // The user-profile is already created in createTestUser()
      // We just need to get the profile ID for testing
      const getProfileResponse = await request(BASE_URL)
        .get(`/profile/user/${mainTestUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      if (getProfileResponse.status === 200) {
        testProfileId = getProfileResponse.body.data.id;
        testProfileUserId = getProfileResponse.body.data.id_user;
      }
    } catch (error) {
      console.error("Failed to setup test user:", error);
    }
  });

  // Cleanup: Delete test user after all tests are done
  afterAll(async () => {
    try {
      // Delete the main test user
      await deleteTestUser(mainTestUserId, mainTestUserProfileId);
    } catch (error) {
      console.error("Failed to cleanup test user:", error);
    }
  });

  describe("Authentication Tests", () => {
    it("should accept requests with valid token", async () => {
      const response = await request(BASE_URL)
        .get("/profiles")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /profile - Create new profile", () => {
    it("should create profile successfully", async () => {
      // Create a new user WITHOUT profile for this test
      const testUser = {
        email: `testuser${Date.now()}@test.com`,
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

      const newProfile = {
        id_user: user.id,
        roles_user: "student",
      };

      const response = await request(BASE_URL)
        .post("/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newProfile);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user).toBe(newProfile.id_user);

      // Clean up the test user and profile
      try {
        await supabase
          .from("user-profile")
          .delete()
          .eq("id", response.body.data.id);
        await supabase.from("user").delete().eq("id", user.id);
        console.log(
          `✅ Test user ${user.id} and profile ${response.body.data.id} cleaned up successfully`
        );
      } catch (cleanupError) {
        console.error(
          `❌ Failed to cleanup test user ${user.id}:`,
          cleanupError
        );
      }
    });

    it("should return 409 for existing profile", async () => {
      // Try to create a profile for the main test user (who already has a profile)
      const response = await request(BASE_URL)
        .post("/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          id_user: mainTestUserId,
          roles_user: "student",
        });
      expect(response.status).toBe(409);
    });

    it("should return 400 for missing fields", async () => {
      const response = await request(BASE_URL)
        .post("/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          roles_user: "student",
        });
      expect(response.status).toBe(400);
    });
  });

  describe("GET /profiles - Get all profiles", () => {
    it("should return all profiles successfully", async () => {
      const response = await request(BASE_URL)
        .get("/profiles")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /profile/:id - Get profile by ID", () => {
    it("should return profile by valid ID", async () => {
      const response = await request(BASE_URL)
        .get(`/profile/${testProfileId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testProfileId);
    });

    it("should return 404 for non-existent profile", async () => {
      const response = await request(BASE_URL)
        .get("/profile/60000000000")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });

  describe("GET /profile/user/:user_id - Get profile by user id", () => {
    it("should return profile by valid user id", async () => {
      const response = await request(BASE_URL)
        .get(`/profile/user/${testProfileUserId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user).toBe(testProfileUserId);
    });

    it("should return 400 for invalid user id", async () => {
      const response = await request(BASE_URL)
        .get("/profile/user/invalidtype")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /profile/:id - Update profile", () => {
    it("should update the profile successfully", async () => {
      expect(testProfileId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/profile/${testProfileId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          first_name: "unit jest",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 for no update fields", async () => {
      const response = await request(BASE_URL)
        .patch(`/profile/${testProfileId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /profile/:id - Delete profile", () => {
    it("should delete profile successfully", async () => {
      expect(testProfileId).toBeTruthy();
      const response = await request(BASE_URL)
        .delete(`/profile/${testProfileId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 for already deleted profile", async () => {
      const response = await request(BASE_URL)
        .delete(`/profile/${testProfileId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });
});
