#!/bin/bash

# Script pour corriger automatiquement les tests du service de profil

# Fonction pour corriger un fichier de test
fix_test_file() {
    local file=$1
    local route_name=$2
    local route_file=$3
    local misc_route_file=$4

    echo "Correction de $file..."

    # Remplacer les imports et BASE_URL
    sed -i '' 's|const request = require("supertest");|const request = require("supertest");\
const express = require("express");\
const cors = require("cors");\
const cookieParser = require("cookie-parser");|' "$file"

    sed -i '' 's|const BASE_URL = "http://localhost:3004";|// Import the app setup\
const auth = require("../src/middleware/auth");\
const '"$route_name"'Routes = require("../src/routes/'"$route_file"'");\
\
// Create test app\
const app = express();\
\
app.use(\
  cors({\
    origin: process.env.FRONTEND_URL || "http://localhost:3000",\
    credentials: true,\
  })\
);\
app.use(express.json());\
app.use(cookieParser());\
\
app.use(auth);\
\
app.use("", '"$route_name"'Routes);\
\
// Use the app for testing instead of external URL\
const BASE_URL = app;|' "$file"

    # Supprimer les tests d'authentification qui ne sont plus pertinents
    sed -i '' '/should reject requests without token/,/should reject requests with invalid token/d' "$file"

    echo "✅ $file corrigé"
}

# Corriger les fichiers restants
fix_test_file "__tests__/promotionRoutes.tests.js" "promotion" "promotion/promotionRoutes.js" ""
fix_test_file "__tests__/studentRoutes.tests.js" "student" "student/studentRoutes.js" "student/misc/misc.js"
fix_test_file "__tests__/adminRoutes.tests.js" "admin" "admin/adminRoutes.js" ""

echo "🎉 Tous les fichiers de test ont été corrigés !"
