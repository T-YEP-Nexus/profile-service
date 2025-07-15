const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import des routes
const profileRoutes = require('../routes/profileRoutes');
const studentRoutes = require('../routes/studentRoutes');
const advisorRoutes = require('../routes/advisorRoutes');
const adminRoutes = require('../routes/adminRoutes');
const promRoutes = require('../routes/promotionRoutes');


const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Route de test pour vérifier la connexion Supabase
app.get('/health', async (req, res) => {
  try {
    // Test de connexion à Supabase
    const { data, error } = await supabase.from('user_profile').select('count').limit(1);
    if (error) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Erreur de connexion à Supabase',
        error: error.message 
      });
    }
    res.json({ 
      status: 'success', 
      message: 'Service de profil opérationnel',
      supabase: 'connecté'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Erreur interne du serveur',
      error: err.message 
    });
  }
});

// Utilisation des routes
app.use('', profileRoutes);
app.use('', advisorRoutes);
app.use('', studentRoutes);
app.use('', adminRoutes);
app.use('', promRoutes);


const PORT = process.env.PORT || 3004;

// Ne démarrer le serveur que si on n'est pas en mode test
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
}

module.exports = app;