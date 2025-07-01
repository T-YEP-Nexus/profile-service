const express = require('express');

const router = express.Router();

const supabase = require('../config/supabaseClient');

// crud routes for the 'student' table

// get all students
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
router.get('/student/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DEBUG /student/:id - id reçu:', id, 'type:', typeof id);

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

// get a student by user profile id
router.get('/student/profile/:id_user_profile', async (req, res) => {
  try {
    const { id_user_profile } = req.params;

    // validate that id_user_profile is a number
    const profileId = parseInt(id_user_profile);
    if (!id_user_profile || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user profile ID provided'
      });
    }

    const { data, error } = await supabase
      .from('student')
      .select('*')
      .eq('id_user_profile', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Student not found for this user profile'
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

// get students by promotion
router.get('/students/promotion/:promotion', async (req, res) => {
  try {
    const { promotion } = req.params;

    if (!promotion) {
      return res.status(400).json({
        success: false,
        message: 'Promotion parameter is required'
      });
    }

    const { data, error } = await supabase
      .from('student')
      .select('*')
      .eq('promotion', promotion);

    if (error) {
      console.error('Error fetching students by promotion:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch students by promotion',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: `Students for promotion '${promotion}' retrieved successfully`,
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

// create a student
router.post('/student', async (req, res) => {
  try {
    const { student_number, promotion, major, id_user_profile } = req.body;

    if (!id_user_profile) {
      return res.status(400).json({
        success: false,
        message: 'User profile ID is required'
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

    // Check if user profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user-profile')
      .select('id')
      .eq('id', profileId)
      .single();

    if (profileCheckError || !existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'User profile not found'
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
      ...(student_number && { student_number }),
      ...(promotion && { promotion }),
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
router.patch('/student/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_number, promotion, major } = req.body;

    // validate that id is a number
    const studentId = parseInt(id);
    if (!id || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID provided'
      });
    }

    if (!student_number && !promotion && !major) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
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
    if (promotion !== undefined) updateData.promotion = promotion;
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