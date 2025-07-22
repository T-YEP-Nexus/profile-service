const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabaseClient');

/**
 * @swagger
 * tags:
 *   name: Informations
 *   description: API for sending and managing informational messages
 */

// GET all informations
/**
 * @swagger
 * /informations:
 *   get:
 *     summary: Get all informations
 *     tags: [Informations]
 *     responses:
 *       200:
 *         description: Informations retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/informations', async (req, res) => {
  try {
    const { data, error } = await supabase.from('informations').select('*');
    if (error) throw error;
    res.status(200).json({ success: true, message: 'Informations retrieved successfully', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

// GET information by ID
/**
 * @swagger
 * /information/{id}:
 *   get:
 *     summary: Get an information message by ID
 *     tags: [Informations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Information ID
 *     responses:
 *       200:
 *         description: Information retrieved successfully
 *       404:
 *         description: Information not found
 *       500:
 *         description: Server error
 */
router.get('/information/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const { data, error } = await supabase.from('informations').select('*').eq('id', id).single();
    if (error) throw error;

    res.status(200).json({ success: true, message: 'Information retrieved successfully', data });
  } catch (err) {
    const status = err.code === 'PGRST116' ? 404 : 500;
    const message = err.code === 'PGRST116' ? 'Information not found' : 'Internal server error';
    res.status(status).json({ success: false, message, error: err.message });
  }
});

// POST create new information
/**
 * @swagger
 * /information:
 *   post:
 *     summary: Create a new information message
 *     tags: [Informations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, id_creator]
 *             properties:
 *               message:
 *                 type: string
 *               id_creator:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Information created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/information', async (req, res) => {
  try {
    const { title, message, id_creator } = req.body;

    if (!title || !message || typeof id_creator !== 'number') {
      return res.status(400).json({ success: false, message: 'Title, message, and valid id_creator are required' });
    }

    // Check if the exact message already exists
    const { data: existingMessage, error: findError } = await supabase
      .from('informations')
      .select('*')
      .eq('message', message)
      .maybeSingle();

    if (findError) throw findError;

    if (existingMessage) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate message: the same message has already been posted.',
      });
    }

    // Insert if no duplicate
    const { data, error } = await supabase
      .from('informations')
      .insert([{ title, message, id_creator }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Information created successfully', data });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});


// PATCH update information
/**
 * @swagger
 * /information/{id}:
 *   patch:
 *     summary: Update an existing information message
 *     tags: [Informations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Information ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               id_creator:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Information updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Information not found
 *       500:
 *         description: Server error
 */
router.patch('/information/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, message, id_creator } = req.body;
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const updateFields = {};
    if (title) updateFields.title = title;
    if (message) updateFields.message = message;
    if (typeof id_creator === 'number') updateFields.id_creator = id_creator;

    const { data, error } = await supabase.from('informations').update(updateFields).eq('id', id).select().single();
    if (error) throw error;

    res.status(200).json({ success: true, message: 'Information updated successfully', data });
  } catch (err) {
    const status = err.code === 'PGRST116' ? 404 : 500;
    const message = err.code === 'PGRST116' ? 'Information not found' : 'Internal server error';
    res.status(status).json({ success: false, message, error: err.message });
  }
});

// DELETE information
/**
 * @swagger
 * /information/{id}:
 *   delete:
 *     summary: Delete an information message
 *     tags: [Informations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Information ID
 *     responses:
 *       200:
 *         description: Information deleted successfully
 *       404:
 *         description: Information not found
 *       500:
 *         description: Server error
 */
router.delete('/information/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const { data: existing, error: findError } = await supabase.from('informations').select('*').eq('id', id).single();
    if (findError) throw findError;

    const { error } = await supabase.from('informations').delete().eq('id', id);
    if (error) throw error;

    res.status(200).json({ success: true, message: 'Information deleted successfully', data: existing });
  } catch (err) {
    const status = err.code === 'PGRST116' ? 404 : 500;
    const message = err.code === 'PGRST116' ? 'Information not found' : 'Internal server error';
    res.status(status).json({ success: false, message, error: err.message });
  }
});

module.exports = router;
