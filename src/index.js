const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// crud routes for the 'user-profile' table

// get all user profiles
app.get('/profiles', async (req, res) => {
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
app.get('/profile/:id', async (req, res) => {
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
app.get('/profile/user/:user_id', async (req, res) => {
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
app.post('/profile', async (req, res) => {
  try {
    const { id_user, first_name, last_name, bio, avatar_url, date_of_birth, location } = req.body;

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
      ...(bio && { bio }),
      ...(avatar_url && { avatar_url }),
      ...(date_of_birth && { date_of_birth }),
      ...(location && { location })
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
app.patch('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, bio, avatar_url, date_of_birth, location } = req.body;

    // validate that id is a number
    const profileId = parseInt(id);
    if (!id || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user profile ID provided'
      });
    }

    if (!first_name && !last_name && !bio && !avatar_url && !date_of_birth && !location) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (location !== undefined) updateData.location = location;

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
app.delete('/profile/:id', async (req, res) => {
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

const PORT = process.env.PORT || 3004;

// Ne démarrer le serveur que si on n'est pas en mode test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
}

module.exports = app;