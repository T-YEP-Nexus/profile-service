const express = require('express');

const router = express.Router();

const supabase = require('../../../config/supabaseClient');

// crud routes for the 'student' table
/**
 * @swagger
 * tags:
 *   name: Students
 *   description: API for managing students
 */

// get all students
/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/students', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student')
      .select('*');

    if (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch students',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: data,
      count: data.length
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});
// get a student by id

/**
 * @swagger
 * /student/{id}:
 *   get:
 *     summary: Get a student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student retrieved successfully
 *       400:
 *         description: Invalid student ID provided
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.get('/student/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // validate that id is a number
    const studentId = parseInt(id);
    if (!id || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID provided'
      });
    }

    const { data, error } = await supabase
      .from('student')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      console.error('Error fetching student:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student retrieved successfully',
      data: data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

// create a student
/**
 * @swagger
 * /student:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_user_profile
 *               - id_promotion
 *             properties:
 *               student_number:
 *                 type: string
 *                 description: Student number (optional, must be unique if provided)
 *               major:
 *                 type: string
 *                 description: Major of the student (optional)
 *               id_promotion:
 *                 type: string
 *                 description: UUID of the promotion
 *               id_user_profile:
 *                 type: integer
 *                 description: User profile ID
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Invalid input or related entity not found
 *       409:
 *         description: Student or student number already exists
 *       500:
 *         description: Server error
 */
router.post('/student', async (req, res) => {
  try {
    const { student_number, major, id_promotion, id_user_profile } = req.body;

    if (!id_user_profile) {
      return res.status(400).json({
        success: false,
        message: 'User  profile ID is required'
      });
    }

    // validate that id_user_profile is a number
    const profileId = parseInt(id_user_profile);
    if (isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user profile ID format'
      });
    }

    // Check if id_prom is a valid UUID
    if (!id_promotion || typeof id_promotion !== 'string' || id_promotion.length !== 36) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID format'
      });
    }

    // Check if user profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user-profile')
      .select('id')
      .eq('id', profileId)
      .single();

    if (profileCheckError || !existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'User  profile not found'
      });
    }

    // Check if promotion exists
    const { data: existingProm, error: promCheckError } = await supabase
      .from('promotion')
      .select('id')
      .eq('id', id_promotion)
      .single();

    if (promCheckError || !existingProm) {
      return res.status(400).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Check if student already exists for this user profile
    const { data: existingStudent, error: studentCheckError } = await supabase
      .from('student')
      .select('id')
      .eq('id_user_profile', profileId)
      .single();

    if (studentCheckError && studentCheckError.code !== 'PGRST116') {
      console.error('Error checking existing student:', studentCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing student',
        error: studentCheckError.message
      });
    }

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student record already exists for this user profile'
      });
    }

    // Check if student_number is unique (if provided)
    if (student_number) {
      const { data: existingStudentNumber, error: numberCheckError } = await supabase
        .from('student')
        .select('id')
        .eq('student_number', student_number)
        .single();

      if (numberCheckError && numberCheckError.code !== 'PGRST116') {
        console.error('Error checking student number uniqueness:', numberCheckError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check student number uniqueness',
          error: numberCheckError.message
        });
      }

      if (existingStudentNumber) {
        return res.status(409).json({
          success: false,
          message: 'Student number already exists'
        });
      }
    }

    const studentData = {
      id_user_profile: profileId,
      id_promotion: id_promotion,
      ...(student_number && { student_number }),
      ...(major && { major })
    };

    const { data, error } = await supabase
      .from('student')
      .insert([studentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating student:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create student',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

// update a student
/**
 * @swagger
 * /student/{id}:
 *   patch:
 *     summary: Update an existing student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_number:
 *                 type: string
 *               id_promotion:
 *                 type: string
 *                 description: UUID of the promotion
 *               major:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       400:
 *         description: Invalid student ID or input data
 *       404:
 *         description: Student not found
 *       409:
 *         description: Student number already exists
 *       500:
 *         description: Server error
 */
router.patch('/student/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_number, id_promotion, major } = req.body;

    // validate that id is a number
    const studentId = parseInt(id);
    if (!id || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID provided'
      });
    }

    if (!student_number && !id_promotion && !major) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    // Check if promotion exists (if provided)
    if (id_promotion) {
      // Check if id_prom is a valid UUID
      if (typeof id_promotion !== 'string' || id_promotion.length !== 36) {
        return res.status(400).json({
          success: false,
          message: 'Invalid promotion ID format'
        });
      }

      const { data: existingProm, error: promCheckError } = await supabase
        .from('promotion')
        .select('id')
        .eq('id', id_promotion)
        .single();

      if (promCheckError || !existingProm) {
        return res.status(400).json({
          success: false,
          message: 'Promotion not found'
        });
      }
    }

    // Check if student_number is unique (if provided)
    if (student_number) {
      const { data: existingStudentNumber, error: numberCheckError } = await supabase
        .from('student')
        .select('id')
        .eq('student_number', student_number)
        .neq('id', studentId)
        .single();

      if (numberCheckError && numberCheckError.code !== 'PGRST116') {
        console.error('Error checking student number uniqueness:', numberCheckError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check student number uniqueness',
          error: numberCheckError.message
        });
      }

      if (existingStudentNumber) {
        return res.status(409).json({
          success: false,
          message: 'Student number already exists'
        });
      }
    }

    const updateData = {};
    if (student_number !== undefined) updateData.student_number = student_number;
    if (id_promotion !== undefined) updateData.id_promotion = id_promotion; // No need to parseInt
    if (major !== undefined) updateData.major = major;

    const { data, error } = await supabase
      .from('student')
      .update(updateData)
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      console.error('Error updating student:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update student',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

// delete a student
/**
 * @swagger
 * /student/{id}:
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       400:
 *         description: Invalid student ID
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.delete('/student/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // validate that id is a number
    const studentId = parseInt(id);
    if (!id || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID provided'
      });
    }

    const { data: existingStudent, error: checkError } = await supabase
      .from('student')
      .select('*')
      .eq('id', studentId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      console.error('Error checking student existence:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check student existence',
        error: checkError.message
      });
    }

    const { error } = await supabase
      .from('student')
      .delete()
      .eq('id', studentId);

    if (error) {
      console.error('Error deleting student:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete student',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
      data: {
        deletedStudent: existingStudent
      }
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

module.exports = router;
