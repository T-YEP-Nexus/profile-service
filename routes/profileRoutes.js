const express = require('express');

const router = express.Router();

// Import de la configuration Supabase
const supabase = require('../config/supabaseClient');

// crud routes for the 'user-profile' table

// get all user profiles
router.get('/profiles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user-profile')
      .select('*');

    if (error) {
      console.error('Error fetching user profiles:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profiles',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profiles retrieved successfully',
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

// get a user profile by id
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DEBUG /profile/:id - id reçu:', id, 'type:', typeof id);

    // validate that id is a number
    const profileId = parseInt(id);
    if (!id || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user profile ID provided'
      });
    }

    const { data, error } = await supabase
      .from('user-profile')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }

      console.error('Error fetching user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
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

// get a user profile by user_id
router.get('/profile/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!user_id || !uuidRegex.test(user_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    const { data, error } = await supabase
      .from('user-profile')
      .select('*')
      .eq('id_user', user_id)
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
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

// create a user profile
router.post('/profile', async (req, res) => {
  try {
    const { id_user, first_name, last_name, phone, address, campus, is_active, roles_user } = req.body;

    if (!id_user) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id_user)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Check if user exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('user')
      .select('id')
      .eq('id', id_user)
      .single();

    if (userCheckError || !existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Check if profile already exists for this user
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user-profile')
      .select('id')
      .eq('id_user', id_user)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing profile',
        error: profileCheckError.message
      });
    }

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'User profile already exists for this user'
      });
    }

    const profileData = {
      id_user: id_user,
      ...(first_name && { first_name }),
      ...(last_name && { last_name }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(campus && { campus }),
      ...(is_active !== undefined && { is_active }),
      ...(roles_user && { roles_user })
    };

    const { data, error } = await supabase
      .from('user-profile')
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'User profile created successfully',
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

// update a user profile
router.patch('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, address, is_active, roles_user } = req.body;

    // validate that id is a number
    const profileId = parseInt(id);
    if (!id || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user profile ID provided'
      });
    }

    if (!first_name && !last_name && !phone && !address && is_active === undefined && !roles_user) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (roles_user !== undefined) updateData.roles_user = roles_user;

    const { data, error } = await supabase
      .from('user-profile')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }

      console.error('Error updating user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
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

// delete a user profile
router.delete('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // validate that id is a number
    const profileId = parseInt(id);
    if (!id || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user profile ID provided'
      });
    }

    // Check if profile is referenced by any student
    const { data: referencedStudents, error: checkStudentError } = await supabase
      .from('student')
      .select('id')
      .eq('id_user_profile', profileId);

    if (checkStudentError) {
      console.error('Error checking student references:', checkStudentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check profile references',
        error: checkStudentError.message
      });
    }

    if (referencedStudents && referencedStudents.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete profile: it is referenced by student records',
        error: 'Foreign key constraint violation'
      });
    }

    const { data: existingProfile, error: checkError } = await supabase
      .from('user-profile')
      .select('*')
      .eq('id', profileId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }

      console.error('Error checking profile existence:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check profile existence',
        error: checkError.message
      });
    }

    const { error } = await supabase
      .from('user-profile')
      .delete()
      .eq('id', profileId);

    if (error) {
      console.error('Error deleting user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user profile',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile deleted successfully',
      data: {
        deletedProfile: existingProfile
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
