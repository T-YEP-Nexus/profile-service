const express = require('express');
const router = express.Router();
const supabase = require('../../../../config/supabaseClient');

// crud routes for the 'advisor' table
/**
 * @swagger
 * tags:
 *   name: Advisors/Misc
 *   description: API for managing advisors misc
 */


// get an advisor by user profile id $
/**
 * @swagger
 * /advisor/profile/{id_user_profile}:
 *   get:
 *     summary: Get an advisor by user profile ID
 *     tags: [Advisors/Misc]
 *     parameters:
 *       - in: path
 *         name: id_user_profile
 *         schema:
 *           type: integer
 *         required: true
 *         description: User profile ID
 *     responses:
 *       200:
 *         description: Advisor retrieved successfully
 *       400:
 *         description: Invalid user profile ID provided
 *       404:
 *         description: Advisor not found for this user profile
 *       500:
 *         description: Server error
 */
router.get('/advisor/profile/:id_user_profile', async (req, res) => {
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
      .from('advisor')
      .select('*')
      .eq('id_user_profile', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Advisor not found for this user profile'
        });
      }

      console.error('Error fetching advisor:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch advisor',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advisor retrieved successfully',
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

// get advisors by specialty $ 
/**
 * @swagger
 * /advisors/specialty/{specialty}:
 *   get:
 *     summary: Get advisors by specialty
 *     tags: [Advisors/Misc]
 *     parameters:
 *       - in: path
 *         name: specialty
 *         schema:
 *           type: string
 *         required: true
 *         description: Advisor specialty
 *     responses:
 *       200:
 *         description: Advisors retrieved successfully
 *       400:
 *         description: Specialty parameter is required
 *       500:
 *         description: Server error
 */
router.get('/advisors/specialty/:specialty', async (req, res) => {
  try {
    const { specialty } = req.params;

    if (!specialty) {
      return res.status(400).json({
        success: false,
        message: 'Specialty parameter is required'
      });
    }

    const { data, error } = await supabase
      .from('advisor')
      .select('*')
      .eq('specialty', specialty);

    if (error) {
      console.error('Error fetching advisors by specialty:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch advisors by specialty',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: `Advisors for specialty '${specialty}' retrieved successfully`,
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

module.exports = router;