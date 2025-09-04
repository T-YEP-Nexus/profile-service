const express = require("express");

const router = express.Router();

const supabase = require("../../../../config/supabaseClient");

// Helper function to validate UUID
const isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// crud routes for the 'promotion' table
/**
 * @swagger
 * tags:
 *   name: Promotions/Misc
 *   description: API for managing promotions
 */

// get students by promotion $
/**
 * @swagger
 * /students/promotion/{id}:
 *   get:
 *     summary: Get students by promotion id
 *     tags: [Promotions/Misc]
 *     parameters:
 *       - in: path
 *         id: id_promotion
 *         required: true
 *         schema:
 *           type: string
 *         description: id of the promotion
 *     responses:
 *       200:
 *         description: Promotions matching id retrieved successfully
 *       400:
 *         description: Promotion id is required
 *       500:
 *         description: Server error
 */
router.get("/students/promotion/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // validate that id is a valid UUID
    if (!id || !isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid promotion ID provided",
      });
    }

    // D'abord, essayons de voir la structure de la table
    const { data: structureData, error: structureError } = await supabase
      .from("student")
      .select("*")
      .limit(1);

    const { data, error } = await supabase
      .from("student")
      .select(
        `
        id,
        student_number,
        id_user_profile
      `
      )
      .eq("id_promotion", id);

    if (error) {
      console.error("Error fetching students by promotion:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch students by promotion",
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: data,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// get a promotion by name $
/**
 * @swagger
 * /promotion/name/{name}:
 *   get:
 *     summary: Get a promotion by name (case-insensitive)
 *     tags: [Promotions/Misc]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name (or partial name) of the promotion
 *     responses:
 *       200:
 *         description: Promotions matching name retrieved successfully
 *       400:
 *         description: Promotion name is required
 *       500:
 *         description: Server error
 */
router.get("/promotion/name/:name", async (req, res) => {
  try {
    const { name } = req.params;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Promotion name is required",
      });
    }

    const { data, error } = await supabase
      .from("promotion")
      .select("*")
      .ilike("name", `%${name}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching promotion by name:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch promotion by name",
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: `Promotions matching '${name}' retrieved successfully`,
      data: data,
      count: data.length,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

module.exports = router;
