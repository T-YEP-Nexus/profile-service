const express = require('express');

const router = express.Router();

const supabase = require('../../config/supabaseClient');

// crud routes for the 'advisor' table

// get all advisors
router.get('/advisors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('advisor')
      .select('*');

    if (error) {
      console.error('Error fetching advisors:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch advisors',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advisors retrieved successfully',
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

// get an advisor by id
router.get('/advisor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DEBUG /advisor/:id - id reçu:', id, 'type:', typeof id);

    // validate that id is a number
    const advisorId = parseInt(id);
    if (!id || isNaN(advisorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid advisor ID provided'
      });
    }

    const { data, error } = await supabase
      .from('advisor')
      .select('*')
      .eq('id', advisorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Advisor not found'
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

// get an advisor by user profile id
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

// get advisors by specialty
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

// create an advisor
router.post('/advisor', async (req, res) => {
  try {
    const { specialty, room, availability, id_user_profile } = req.body;

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

    // Check if advisor already exists for this user profile
    const { data: existingAdvisor, error: advisorCheckError } = await supabase
      .from('advisor')
      .select('id')
      .eq('id_user_profile', profileId)
      .single();

    if (advisorCheckError && advisorCheckError.code !== 'PGRST116') {
      console.error('Error checking existing advisor:', advisorCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing advisor',
        error: advisorCheckError.message
      });
    }

    if (existingAdvisor) {
      return res.status(409).json({
        success: false,
        message: 'Advisor record already exists for this user profile'
      });
    }

    const advisorData = {
      id_user_profile: profileId,
      ...(specialty && { specialty }),
      ...(room && { room }),
      ...(availability && { availability })
    };

    const { data, error } = await supabase
      .from('advisor')
      .insert([advisorData])
      .select()
      .single();

    if (error) {
      console.error('Error creating advisor:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create advisor',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Advisor created successfully',
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

// update an advisor
router.patch('/advisor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { specialty, room, availability } = req.body;

    // validate that id is a number
    const advisorId = parseInt(id);
    if (!id || isNaN(advisorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid advisor ID provided'
      });
    }

    if (!specialty && !room && !availability) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    const updateData = {};
    if (specialty !== undefined) updateData.specialty = specialty;
    if (room !== undefined) updateData.room = room;
    if (availability !== undefined) updateData.availability = availability;

    const { data, error } = await supabase
      .from('advisor')
      .update(updateData)
      .eq('id', advisorId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Advisor not found'
        });
      }

      console.error('Error updating advisor:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update advisor',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advisor updated successfully',
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

// delete an advisor
router.delete('/advisor/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // validate that id is a number
    const advisorId = parseInt(id);
    if (!id || isNaN(advisorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid advisor ID provided'
      });
    }

    const { data: existingAdvisor, error: checkError } = await supabase
      .from('advisor')
      .select('*')
      .eq('id', advisorId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Advisor not found'
        });
      }

      console.error('Error checking advisor existence:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check advisor existence',
        error: checkError.message
      });
    }

    const { error } = await supabase
      .from('advisor')
      .delete()
      .eq('id', advisorId);

    if (error) {
      console.error('Error deleting advisor:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete advisor',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advisor deleted successfully',
      data: {
        deletedAdvisor: existingAdvisor
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
