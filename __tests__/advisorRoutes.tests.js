const request = require("supertest");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const supabase = require("../config/supabaseClient");
const bcrypt = require("bcrypt");

// Import the app setup
const auth = require("../src/middleware/auth");
const advisorRoutes = require("../src/routes/advisor/advisorRoutes.js");
const advisorMiscRoutes = require("../src/routes/advisor/misc/misc.js");

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

app.use("", advisorRoutes);
app.use("", advisorMiscRoutes);

// Use the app for testing instead of external URL
const BASE_URL = app;

let testAdvisorId = null;
let testAdvisorUserId = null;
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
        roles_user: "advisor",
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
    // First delete any advisor records that reference this profile
    if (profileId) {
      await supabase.from("advisor").delete().eq("id_user_profile", profileId);
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

  if (loginResponse.status !== 200) {
    throw new Error(`Failed to get auth token: ${loginResponse.body.message}`);
  }

  return loginResponse.body.data.token;
}

describe("Advisor CRUD Routes (Integration)", () => {
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

      // Create a persistent advisor for testing
      const advisorResponse = await request(BASE_URL)
        .post("/advisor")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          specialty: "projectmanagement",
          room: "1-9",
          availability: "5j/7",
          id_user_profile: mainTestUserProfileId,
        });

      if (advisorResponse.status === 201) {
        testAdvisorId = advisorResponse.body.data.id;
        testAdvisorUserId = advisorResponse.body.data.id_user_profile;
      }
    } catch (error) {
      console.error("Failed to setup test user:", error);
    }
  });

  // Cleanup: Delete test user after all tests are done
  afterAll(async () => {
    try {
      // Delete the persistent test advisor first
      if (testAdvisorId) {
        await supabase.from("advisor").delete().eq("id", testAdvisorId);
      }

      // Delete the main test user
      await deleteTestUser(mainTestUserId, mainTestUserProfileId);
    } catch (error) {
      console.error("Failed to cleanup test user:", error);
    }
  });

  describe("Authentication Tests", () => {
    it("should accept requests with valid token", async () => {
      const response = await request(BASE_URL)
        .get("/advisors")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /advisor - Create new advisor", () => {
    it("should create advisor successfully", async () => {
      // Create a new user for this test
      const testUserData = await createTestUser();
      const newUserId = testUserData.user.id;
      const newUserProfileId = testUserData.profile.id;

      const newAdvisor = {
        specialty: "projectmanagement",
        room: "1-9",
        availability: "5j/7",
        id_user_profile: newUserProfileId,
      };

      const response = await request(BASE_URL)
        .post("/advisor")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newAdvisor);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(
        newAdvisor.id_user_profile
      );

      // Clean up the test user and advisor
      try {
        await supabase.from("advisor").delete().eq("id", response.body.data.id);
        await deleteTestUser(newUserId, newUserProfileId);
      } catch (cleanupError) {
        console.error(`❌ Failed to cleanup test advisor:`, cleanupError);
      }
    });

    it("should return 409 for existing advisor", async () => {
      const response = await request(BASE_URL)
        .post("/advisor")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          specialty: "projectmanagement",
          room: "1-9",
          availability: "5j/7",
          id_user_profile: testAdvisorUserId,
        });
      expect(response.status).toBe(409);
    });

    it("should return 400 for missing fields", async () => {
      const response = await request(BASE_URL)
        .post("/advisor")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          specialty: "projectmanagement",
          room: "1-9",
          availability: "5j/7",
        });
      expect(response.status).toBe(400);
    });
  });

  describe("GET /advisors - Get all advisors", () => {
    it("should return all advisors successfully", async () => {
      const response = await request(BASE_URL)
        .get("/advisors")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /advisor/:id - Get advisor by ID", () => {
    it("should return advisor by valid ID", async () => {
      const response = await request(BASE_URL)
        .get(`/advisor/${testAdvisorId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAdvisorId);
    });

    it("should return 404 for non-existent advisor", async () => {
      const response = await request(BASE_URL)
        .get("/advisor/60000000000")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });

  describe("GET /advisor/profile/:id_user_profile - Get advisor by user profile id", () => {
    it("should return advisor by valid user profile id", async () => {
      const response = await request(BASE_URL)
        .get(`/advisor/profile/${testAdvisorUserId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(testAdvisorUserId);
    });

    it("should return 400 for invalid user id", async () => {
      const response = await request(BASE_URL)
        .get("/advisor/profile/invalidtype")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /advisor/:id - Update advisor", () => {
    it("should update the advisor successfully", async () => {
      expect(testAdvisorId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/advisor/${testAdvisorId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          specialty: "cybersecurity",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 for no update fields", async () => {
      const response = await request(BASE_URL)
        .patch(`/advisor/${testAdvisorId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /advisor/:id - Delete advisor", () => {
    it("should delete advisor successfully", async () => {
      expect(testAdvisorId).toBeTruthy();
      const response = await request(BASE_URL)
        .delete(`/advisor/${testAdvisorId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 for already deleted advisor", async () => {
      const response = await request(BASE_URL)
        .delete(`/advisor/${testAdvisorId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });
});
