const express = require('express');

const router = express.Router();

const supabase = require('../../../../config/supabaseClient');

// crud routes for the 'student' table
/**
 * @swagger
 * tags:
 *   name: Students/Misc
 *   description: API for managing students misc
 */

// get all active students (for calendar service) $
/**
 * @swagger
 * /students/active:
 *   get:
 *     summary: Get all active students
 *     tags: [Students/Misc]
 *     responses:
 *       200:
 *         description: Active students retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/students/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user-profile')
      .select('id, id_user, is_active, roles_user')
      .eq('roles_user', 'student')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching active students:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch active students',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Active students retrieved successfully',
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


// get students by promotion id $
/**
 * @swagger
 * /students/promotion/{id_promotion}:
 *   get:
 *     summary: Get all students in a specific promotion
 *     tags: [Students/Misc]
 *     parameters:
 *       - in: path
 *         name: id_promotion
 *         schema:
 *           type: string
 *         required: true
 *         description: The UUID of the promotion.
 *     responses:
 *       200:
 *         description: A list of students in the promotion.
 *       400:
 *         description: Invalid promotion ID provided.
 *       404:
 *         description: No students found for this promotion.
 */
router.get('/students/promotion/:id_promotion', async (req, res) => {
  try {
    const { id_promotion } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id_promotion || !uuidRegex.test(id_promotion)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID provided'
      });
    }

    const { data, error } = await supabase
      .from('student')
      .select('*, profile: "user-profile"!inner(*)')
      .eq('id_promotion', id_promotion);

    if (error) {
      console.error('Error fetching students by promotion:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch students for the promotion',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found for this promotion'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully for the promotion',
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

// get a student by user profile id $
/**
 * @swagger
 * /student/profile/{id_user_profile}:
 *   get:
 *     summary: Get a student by user profile ID
 *     tags: [Students/Misc]
 *     parameters:
 *       - in: path
 *         name: id_user_profile
 *         schema:
 *           type: integer
 *         required: true
 *         description: User profile ID
 *     responses:
 *       200:
 *         description: Student retrieved successfully
 *       400:
 *         description: Invalid user profile ID provided
 *       404:
 *         description: Student not found for this user profile
 *       500:
 *         description: Server error
 */
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

module.exports = router;