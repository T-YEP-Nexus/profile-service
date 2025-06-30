const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import des routes
const profileRoutes = require('../routes/profileRoutes');
const studentRoutes = require('../routes/studentRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Utilisation des routes
app.use('/', profileRoutes);
app.use('/', studentRoutes);

const PORT = process.env.PORT || 3004;

// Ne démarrer le serveur que si on n'est pas en mode test
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
}

module.exports = app;