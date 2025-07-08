const express = require('express');

const router = express.Router();

const supabase = require('../config/supabaseClient');

// crud routes for the 'promotion' table

// get all promotions
router.get('/promotions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('promotion')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch promotions',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Promotions retrieved successfully',
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

// get a promotion by id
router.get('/promotion/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // validate that id is a number
    const promotionId = parseInt(id);
    if (!id || isNaN(promotionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID provided'
      });
    }

    const { data, error } = await supabase
      .from('promotion')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Promotion not found'
        });
      }

      console.error('Error fetching promotion:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch promotion',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Promotion retrieved successfully',
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

// get a promotion by name
router.get('/promotion/name/:name', async (req, res) => {
  try {
    const { name } = req.params;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Promotion name is required'
      });
    }

    const { data, error } = await supabase
      .from('promotion')
      .select('*')
      .ilike('name', `%${name}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotion by name:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch promotion by name',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: `Promotions matching '${name}' retrieved successfully`,
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

// create a promotion
router.post('/promotion', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Promotion name is required'
      });
    }

    // Check if promotion name already exists
    const { data: existingPromotion, error: nameCheckError } = await supabase
      .from('promotion')
      .select('id')
      .ilike('name', name.trim())
      .single();

    if (nameCheckError && nameCheckError.code !== 'PGRST116') {
      console.error('Error checking promotion name uniqueness:', nameCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check promotion name uniqueness',
        error: nameCheckError.message
      });
    }

    if (existingPromotion) {
      return res.status(409).json({
        success: false,
        message: 'Promotion name already exists'
      });
    }

    const promotionData = {
      name: name.trim()
    };

    const { data, error } = await supabase
      .from('promotion')
      .insert([promotionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating promotion:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create promotion',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
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

// update a promotion
router.patch('/promotion/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // validate that id is a number
    const promotionId = parseInt(id);
    if (!id || isNaN(promotionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID provided'
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Promotion name is required for update'
      });
    }

    // Check if promotion name already exists (excluding current promotion)
    const { data: existingPromotion, error: nameCheckError } = await supabase
      .from('promotion')
      .select('id')
      .ilike('name', name.trim())
      .neq('id', promotionId)
      .single();

    if (nameCheckError && nameCheckError.code !== 'PGRST116') {
      console.error('Error checking promotion name uniqueness:', nameCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check promotion name uniqueness',
        error: nameCheckError.message
      });
    }

    if (existingPromotion) {
      return res.status(409).json({
        success: false,
        message: 'Promotion name already exists'
      });
    }

    const updateData = {
      name: name.trim()
    };

    const { data, error } = await supabase
      .from('promotion')
      .update(updateData)
      .eq('id', promotionId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Promotion not found'
        });
      }

      console.error('Error updating promotion:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update promotion',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Promotion updated successfully',
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

// delete a promotion
router.delete('/promotion/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // validate that id is a number
    const promotionId = parseInt(id);
    if (!id || isNaN(promotionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion ID provided'
      });
    }

    // Check if promotion exists
    const { data: existingPromotion, error: checkError } = await supabase
      .from('promotion')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Promotion not found'
        });
      }

      console.error('Error checking promotion existence:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check promotion existence',
        error: checkError.message
      });
    }

    // Check if promotion is used by students
    const { data: studentsUsingPromotion, error: studentsCheckError } = await supabase
      .from('student')
      .select('id')
      .eq('id_prom', promotionId)
      .limit(1);

    if (studentsCheckError) {
      console.error('Error checking students using promotion:', studentsCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check promotion usage',
        error: studentsCheckError.message
      });
    }

    if (studentsUsingPromotion && studentsUsingPromotion.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete promotion: it is currently used by students'
      });
    }

    const { error } = await supabase
      .from('promotion')
      .delete()
      .eq('id', promotionId);

    if (error) {
      console.error('Error deleting promotion:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete promotion',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully',
      data: {
        deletedPromotion: existingPromotion
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