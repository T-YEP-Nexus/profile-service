const request = require("supertest");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const supabase = require("../config/supabaseClient");
const bcrypt = require("bcrypt");

// Import the app setup
const auth = require("../src/middleware/auth");
const informationRoutes = require("../src/routes/information/informationRoutes.js");

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

app.use("", informationRoutes);

// Use the app for testing instead of external URL
const BASE_URL = app;
let testInfoId = null;
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
    // First delete any information records that reference this user
    if (userId) {
      await supabase.from("information").delete().eq("id_creator", userId);
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

describe("Informations CRUD Routes (Integration)", () => {
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

      // Create a persistent information for testing
      // Note: id_creator must be a number, not a UUID
      // Using a hardcoded valid numeric ID (33 exists in the database)
      const infoResponse = await request(BASE_URL)
        .post("/information")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Persistent Test Info",
          message: "Persistent integration test message",
          id_creator: 33, // Use a valid numeric ID from database
        });

      console.log(
        "Info creation response:",
        infoResponse.status,
        infoResponse.body
      );

      if (infoResponse.status === 201) {
        testInfoId = infoResponse.body.data.id;
        console.log("Persistent test info created with ID:", testInfoId);
      }
    } catch (error) {
      console.error("Failed to setup test user:", error);
    }
  });

  // Cleanup: Delete test user after all tests are done
  afterAll(async () => {
    try {
      // Delete the persistent test information first
      if (testInfoId) {
        await supabase.from("information").delete().eq("id", testInfoId);
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
        .get("/informations")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /information - Create new information", () => {
    it("should create information successfully", async () => {
      // Create a new user for this test
      const testUserData = await createTestUser();
      const newUserId = testUserData.user.id;
      const newUserProfileId = testUserData.profile.id;

      const newInfo = {
        title: "Test Info",
        message: `Integration test message ${Date.now()}`, // Make message unique
        id_creator: 33, // Use a valid numeric ID from database
      };

      const response = await request(BASE_URL)
        .post("/information")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newInfo);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(newInfo.message);

      // Clean up the test user and information
      try {
        await supabase
          .from("information")
          .delete()
          .eq("id", response.body.data.id);
        await deleteTestUser(newUserId, newUserProfileId);
      } catch (cleanupError) {
        console.error(`❌ Failed to cleanup test information:`, cleanupError);
      }
    });

    it("should return 409 for duplicate message", async () => {
      const duplicateInfo = {
        title: "Duplicate Info",
        message: "Integration test message",
        id_creator: 33, // Use a valid numeric ID from database
      };

      const response = await request(BASE_URL)
        .post("/information")
        .set("Authorization", `Bearer ${authToken}`)
        .send(duplicateInfo);
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Duplicate message/);
    });

    it("should return 400 for missing fields", async () => {
      const response = await request(BASE_URL)
        .post("/information")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          message: "Missing title",
        });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /informations - Get all informations", () => {
    it("should return all informations successfully", async () => {
      const response = await request(BASE_URL)
        .get("/informations")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /information/:id - Get information by ID", () => {
    // const validID = 1;

    it("should return information by valid ID", async () => {
      const response = await request(BASE_URL)
        .get(`/information/${testInfoId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testInfoId);
    });

    it("should return 404 for non-existent information", async () => {
      const response = await request(BASE_URL)
        .get("/information/60000000000")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid ID format", async () => {
      const response = await request(BASE_URL)
        .get("/information/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /information/:id - Update information", () => {
    it("should update information successfully", async () => {
      expect(testInfoId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/information/${testInfoId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated Title");
    });

    it("should return 400 for invalid ID format", async () => {
      const response = await request(BASE_URL)
        .patch("/information/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Title" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent information", async () => {
      const response = await request(BASE_URL)
        .patch("/information/60000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Title" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /information/:id - Delete information", () => {
    it("should delete information successfully", async () => {
      expect(testInfoId).toBeTruthy();
      const response = await request(BASE_URL)
        .delete(`/information/${testInfoId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 for already deleted information", async () => {
      const response = await request(BASE_URL)
        .delete(`/information/${testInfoId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid ID format", async () => {
      const response = await request(BASE_URL)
        .delete("/information/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
