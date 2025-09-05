const request = require("supertest");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const supabase = require("../config/supabaseClient");
const bcrypt = require("bcrypt");

// Import the app setup
const auth = require("../src/middleware/auth");
const studentRoutes = require("../src/routes/student/studentRoutes.js");
const studentMiscRoutes = require("../src/routes/student/misc/misc.js");

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

app.use("", studentRoutes);
app.use("", studentMiscRoutes);

// Use the app for testing instead of external URL
const BASE_URL = app;

let testStudentId = null;
let testStudentUserProfile = null;
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
        roles_user: "student",
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
    // First delete any student records that reference this profile
    if (profileId) {
      await supabase.from("student").delete().eq("id_user_profile", profileId);
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

describe("Student CRUD Routes (Integration)", () => {
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

      // Create a persistent student for testing (using a hardcoded promotion ID for now)
      const studentResponse = await request(BASE_URL)
        .post("/student")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          student_number: "999999",
          major: "Cloud",
          id_user_profile: mainTestUserProfileId,
          id_promotion: "388bf596-6be5-4fee-b227-38bab0d5ed4a",
        });

      if (studentResponse.status === 201) {
        testStudentId = studentResponse.body.data.id;
        testStudentUserProfile = studentResponse.body.data.id_user_profile;
      }
    } catch (error) {
      console.error("Failed to setup test user:", error);
    }
  });

  // Cleanup: Delete test user after all tests are done
  afterAll(async () => {
    try {
      // Delete the persistent test student first
      if (testStudentId) {
        await supabase.from("student").delete().eq("id", testStudentId);
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
        .get("/students")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /student - Create new student", () => {
    it("should create student successfully", async () => {
      // Create a new user for this test
      const testUserData = await createTestUser();
      const newUserId = testUserData.user.id;
      const newUserProfileId = testUserData.profile.id;

      const newStudent = {
        student_number: "123456",
        major: "Cloud",
        id_user_profile: newUserProfileId,
        id_promotion: "388bf596-6be5-4fee-b227-38bab0d5ed4a",
      };

      const response = await request(BASE_URL)
        .post("/student")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newStudent);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.student_number).toBe(newStudent.student_number);

      // Clean up the test user and student
      try {
        await supabase.from("student").delete().eq("id", response.body.data.id);
        await deleteTestUser(newUserId, newUserProfileId);
      } catch (cleanupError) {
        console.error(`❌ Failed to cleanup test student:`, cleanupError);
      }
    });

    it("should return 409 for existing student", async () => {
      const response = await request(BASE_URL)
        .post("/student")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          student_number: "9276308067",
          major: "Cloud",
          id_promotion: "388bf596-6be5-4fee-b227-38bab0d5ed4a",
          id_user_profile: testStudentUserProfile,
        });
      expect(response.status).toBe(409);
    });

    it("should return 400 for missing fields", async () => {
      const response = await request(BASE_URL)
        .post("/student")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          promotion: "388bf596-6be5-4fee-b227-38bab0d5ed4a",
        });
      expect(response.status).toBe(400);
    });
  });

  describe("GET /students - Get all students", () => {
    it("should return all students successfully", async () => {
      const response = await request(BASE_URL)
        .get("/students")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /student/:id - Get student by ID", () => {
    it("should return advisor by valid ID", async () => {
      const response = await request(BASE_URL)
        .get(`/student/${testStudentId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testStudentId);
    });

    it("should return 404 for non-existent advisor", async () => {
      const response = await request(BASE_URL)
        .get("/student/60000000000")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });

  describe("GET /student/profile/:id_user_profile - Get student by user profile id", () => {
    it("should return student by valid user profile id", async () => {
      const response = await request(BASE_URL)
        .get(`/student/profile/${testStudentUserProfile}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id_user_profile).toBe(testStudentUserProfile);
    });

    it("should return 400 for invalid user id", async () => {
      const response = await request(BASE_URL)
        .get("/student/profile/invalidtype")
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /student/:id - Update student", () => {
    it("should update the student successfully", async () => {
      expect(testStudentId).toBeTruthy();
      const response = await request(BASE_URL)
        .patch(`/student/${testStudentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          id_promotion: "388bf596-6be5-4fee-b227-38bab0d5ed4a",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 for no update fields", async () => {
      const response = await request(BASE_URL)
        .patch(`/student/${testStudentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /student/:id - Delete student", () => {
    it("should delete student successfully", async () => {
      expect(testStudentId).toBeTruthy();
      const response = await request(BASE_URL)
        .delete(`/student/${testStudentId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 for already deleted student", async () => {
      const response = await request(BASE_URL)
        .delete(`/student/${testStudentId}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(response.status).toBe(404);
    });
  });
});
