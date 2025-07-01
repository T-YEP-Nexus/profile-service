const express = require('express');

const router = express.Router();

// Import de la configuration Supabase
const supabase = require('../config/supabaseClient');

// crud routes for the 'admin' table

// get all admins
router.get('/admins', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin')
      .select('*');

    if (error) {
      console.error('Error fetching admins:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admins',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admins retrieved successfully',
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

// get an admin by id
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DEBUG /admin/:id - id reçu:', id, 'type:', typeof id);

    // validate that id is a number
    const adminId = parseInt(id);
    if (!id || isNaN(adminId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin ID provided'
      });
    }

    const { data, error } = await supabase
      .from('admin')
      .select('*')
      .eq('id', adminId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      console.error('Error fetching admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admin',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin retrieved successfully',
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

// get an admin by user_profile_id
router.get('/admin/profile/:user_profile_id', async (req, res) => {
  try {
    const { user_profile_id } = req.params;

    // validate that user_profile_id is a number
    const profileId = parseInt(user_profile_id);
    if (!user_profile_id || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user profile ID provided'
      });
    }

    const { data, error } = await supabase
      .from('admin')
      .select('*')
      .eq('id_user_profile', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Admin not found for this user profile'
        });
      }

      console.error('Error fetching admin by profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admin',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin retrieved successfully',
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

// create an admin
router.post('/admin', async (req, res) => {
  try {
    const { id_user_profile } = req.body;

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
        message: 'Invalid user profile ID - profile does not exist'
      });
    }

    // Check if admin already exists for this user profile
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from('admin')
      .select('id')
      .eq('id_user_profile', profileId)
      .single();

    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      console.error('Error checking existing admin:', adminCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing admin',
        error: adminCheckError.message
      });
    }

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin already exists for this user profile'
      });
    }

    const adminData = {
      id_user_profile: profileId
    };

    const { data, error } = await supabase
      .from('admin')
      .insert([adminData])
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create admin',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
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

// update an admin
router.patch('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user_profile } = req.body;

    // validate that id is a number
    const adminId = parseInt(id);
    if (!id || isNaN(adminId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin ID provided'
      });
    }

    if (!id_user_profile) {
      return res.status(400).json({
        success: false,
        message: 'User profile ID is required for update'
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
        message: 'Invalid user profile ID - profile does not exist'
      });
    }

    // Check if another admin already exists for this user profile (excluding current admin)
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from('admin')
      .select('id')
      .eq('id_user_profile', profileId)
      .neq('id', adminId)
      .single();

    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      console.error('Error checking existing admin:', adminCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing admin',
        error: adminCheckError.message
      });
    }

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Another admin already exists for this user profile'
      });
    }

    const updateData = {
      id_user_profile: profileId
    };

    const { data, error } = await supabase
      .from('admin')
      .update(updateData)
      .eq('id', adminId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      console.error('Error updating admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update admin',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
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

// delete an admin
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // validate that id is a number
    const adminId = parseInt(id);
    if (!id || isNaN(adminId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin ID provided'
      });
    }

    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin')
      .select('*')
      .eq('id', adminId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      console.error('Error checking admin existence:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check admin existence',
        error: checkError.message
      });
    }

    const { error } = await supabase
      .from('admin')
      .delete()
      .eq('id', adminId);

    if (error) {
      console.error('Error deleting admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete admin',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully',
      data: {
        deletedAdmin: existingAdmin
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