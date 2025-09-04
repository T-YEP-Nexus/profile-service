const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const studentRoutes = require("./routes/student/studentRoutes.js");
const studentMiscRoutes = require("./routes/student/misc/misc.js");

const profileRoutes = require("./routes/profile/profileRoutes.js");

const advisorRoutes = require("./routes/advisor/advisorRoutes.js");
const advisorMiscRoutes = require("./routes/advisor/misc/misc.js");

const adminRoutes = require("./routes/admin/adminRoutes.js");
const promRoutes = require("./routes/promotion/promotionRoutes.js");
const promMiscRoutes = require("./routes/promotion/misc/misc.js");

const informationRoutes = require("./routes/information/informationRoutes.js");

// Protéger toutes les routes (sauf /api-docs) via middleware d'auth
app.use(auth);

app.use("", profileRoutes);
app.use("", advisorRoutes);
app.use("", advisorMiscRoutes);

app.use("", adminRoutes);
app.use("", promRoutes);
app.use("", promMiscRoutes);
app.use("", informationRoutes);

app.use("", studentRoutes);
app.use("", studentMiscRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Serveur démarré et à l'écoute sur le port ${PORT}`);
});

module.exports = app;
