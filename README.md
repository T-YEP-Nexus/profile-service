# 👥 Profile Microservice

## 🎯 **Vue d'Ensemble**

Ce microservice gère l'écosystème des profils utilisateurs de Nexus avec **5 entités principales** :
- **👨‍💼 Administrateurs** - Gestion complète du système
- **👨‍🏫 Conseillers** - Accompagnement et suivi des étudiants  
- **👤 Profils Utilisateurs** - Informations de base des utilisateurs
- **🎓 Promotions** - Groupements et cohortes d'étudiants
- **🎓 Étudiants** - Profils spécialisés pour les apprenants

Le service assure **l'intégrité référentielle** avec les autres services et fournit des opérations CRUD complètes.

---

## ⚙️ **Configuration & Variables d'Environnement**

### 🔧 Fichier de Configuration

Copiez le fichier de configuration exemple et adaptez-le :

```bash
cp .env.example .env
```

### 📝 Variables Disponibles

| Variable | Description | Valeur Exemple | Obligatoire |
|----------|-------------|----------------|-------------|
| `PORT` | Port d'écoute du service | `3004` | ❌ |
| `NODE_ENV` | Environnement d'exécution | `development` | ✅ |
| `SUPABASE_URL` | URL de votre instance Supabase | `https://xxx.supabase.co` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service Supabase (admin) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `FRONTEND_URL` | URL du frontend pour CORS | `http://localhost:3000` | ✅ |

### 🔐 **Configuration Supabase**

```bash
# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
```

> ⚠️ **Important** : Utilisez la **Service Role Key** pour les opérations backend, pas la clé publique !

### 🌐 **Configuration CORS**

```bash
# Frontend URL pour CORS
FRONTEND_URL=http://localhost:3000
```

---

## 🚀 **Démarrage Rapide**

### 📦 Installation

```bash
# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# ✏️ Éditez le fichier .env avec vos valeurs

# Démarrage du service
npm start
```

### 🌐 Accès au Service

- **Service** : http://localhost:3004
- **Documentation API** : http://localhost:3004/api-docs 📖

---

## 📋 **API Endpoints**

### 👨‍💼 **Routes Admin**

<details>
<summary><strong>🔽 Gestion des Administrateurs (6 endpoints)</strong></summary>

| Méthode | Endpoint | Description | Codes Retour |
|---------|----------|-------------|--------------|
| 🔍 `GET` | `/admins` | Récupérer tous les administrateurs | `200` |
| 🔍 `GET` | `/admin/:id` | Récupérer un admin par ID | `200`, `404` |
| 🔍 `GET` | `/admin/profile/:user_profile_id` | Admin par profil utilisateur | `200`, `400`, `404` |
| ➕ `POST` | `/admin` | Créer un nouvel administrateur | `201`, `400`, `409` |
| ✏️ `PATCH` | `/admin/:id` | Modifier un administrateur | `200`, `400`, `404` |
| ❌ `DELETE` | `/admin/:id` | Supprimer un administrateur | `200`, `404` |

</details>

### 👨‍🏫 **Routes Advisor**

<details>
<summary><strong>🔽 Gestion des Conseillers (7 endpoints)</strong></summary>

| Méthode | Endpoint | Description | Codes Retour |
|---------|----------|-------------|--------------|
| 🔍 `GET` | `/advisors` | Récupérer tous les conseillers | `200` |
| 🔍 `GET` | `/advisor/:id` | Récupérer un conseiller par ID | `200`, `404` |
| 🔍 `GET` | `/advisor/profile/:id_user_profile` | Conseiller par profil utilisateur | `200`, `400`, `404` |
| 🔍 `GET` | `/advisors/specialty/:specialty` | Conseillers par spécialité | `200` |
| ➕ `POST` | `/advisor` | Créer un nouveau conseiller | `201`, `400`, `409` |
| ✏️ `PATCH` | `/advisor/:id` | Modifier un conseiller | `200`, `400`, `404` |
| ❌ `DELETE` | `/advisor/:id` | Supprimer un conseiller | `200`, `404` |

</details>

### 👤 **Routes User Profile**

<details>
<summary><strong>🔽 Gestion des Profils Utilisateurs (6 endpoints)</strong></summary>

| Méthode | Endpoint | Description | Codes Retour |
|---------|----------|-------------|--------------|
| 🔍 `GET` | `/profiles` | Récupérer tous les profils | `200` |
| 🔍 `GET` | `/profile/:id` | Récupérer un profil par ID interne | `200`, `404` |
| 🔍 `GET` | `/profile/user/:user_id` | Profil par UUID utilisateur | `200`, `400`, `404` |
| ➕ `POST` | `/profile` | Créer un profil utilisateur | `201`, `400`, `409` |
| ✏️ `PATCH` | `/profile/:id` | Modifier un profil existant | `200`, `400`, `404` |
| ❌ `DELETE` | `/profile/:id` | Supprimer un profil (avec vérification dépendances) | `200`, `400`, `404` |

</details>

### 🎓 **Routes Promotion**

<details>
<summary><strong>🔽 Gestion des Promotions (6 endpoints)</strong></summary>

| Méthode | Endpoint | Description | Codes Retour |
|---------|----------|-------------|--------------|
| 🔍 `GET` | `/promotions` | Récupérer toutes les promotions | `200` |
| 🔍 `GET` | `/promotion/:id` | Récupérer une promotion par ID | `200`, `400`, `404` |
| 🔍 `GET` | `/promotion/name/:name` | Promotions par nom | `200` |
| ➕ `POST` | `/promotion` | Créer une nouvelle promotion | `201`, `400`, `409` |
| ✏️ `PATCH` | `/promotion/:id` | Modifier une promotion | `200`, `400`, `404` |
| ❌ `DELETE` | `/promotion/:id` | Supprimer une promotion (si non utilisée) | `200`, `400`, `404` |

</details>

### 🎓 **Routes Student**

<details>
<summary><strong>🔽 Gestion des Étudiants (6 endpoints)</strong></summary>

| Méthode | Endpoint | Description | Codes Retour |
|---------|----------|-------------|--------------|
| 🔍 `GET` | `/students` | Récupérer tous les étudiants | `200` |
| 🔍 `GET` | `/student/:id` | Récupérer un étudiant par ID | `200`, `404` |
| 🔍 `GET` | `/student/profile/:id_user_profile` | Étudiant par profil utilisateur | `200`, `400`, `404` |
| ➕ `POST` | `/student` | Créer un nouvel étudiant | `201`, `400`, `409` |
| ✏️ `PATCH` | `/student/:id` | Modifier un étudiant | `200`, `400`, `404` |
| ❌ `DELETE` | `/student/:id` | Supprimer un étudiant | `200`, `404` |

</details>

---

## 🏗️ **Modèles de Données**

### 👨‍💼 **Admin**
```json
{
  "id": "uuid",
  "id_user_profile": "uuid (requis)",
  "permissions": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 👨‍🏫 **Advisor**
```json
{
  "id": "uuid",
  "id_user_profile": "uuid (requis)",
  "specialty": "string",
  "experience_years": "number",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 👤 **User Profile**
```json
{
  "id": "number (auto-increment)",
  "id_user": "uuid (requis)",
  "first_name": "string (requis)",
  "last_name": "string (requis)",
  "phone": "string",
  "address": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 🎓 **Promotion**
```json
{
  "id": "uuid",
  "name": "string (requis, unique)",
  "year": "number",
  "description": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 🎓 **Student**
```json
{
  "id": "uuid",
  "id_user_profile": "uuid (requis)",
  "id_promotion": "uuid",
  "student_number": "string (unique)",
  "enrollment_date": "date",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## ✨ **Fonctionnalités Avancées**

### 🔒 **Validations & Intégrité**

| Fonctionnalité | Description |
|---------------|-------------|
| **🔗 Intégrité Référentielle** | Vérification des relations entre entités |
| **🚫 Anti-Doublon** | Prévention des profils en double |
| **🔍 Validation UUID** | Format UUID strict pour les relations |
| **📋 Champs Obligatoires** | Validation des données requises |
| **🗑️ Suppression Sécurisée** | Vérification des dépendances avant suppression |

### 🔍 **Fonctionnalités de Recherche**

- **Par Profil Utilisateur** : Liaison avec les comptes utilisateurs
- **Par Spécialité** : Filtrage des conseillers par domaine
- **Par Nom** : Recherche de promotions
- **Relations Bidirectionnelles** : Navigation entre entités liées

### 🛡️ **Gestion des Conflits**

| Type | Prévention | Action |
|------|------------|--------|
| **Profils en Double** | Vérification `id_user` unique | HTTP 409 |
| **Suppressions Dangereuses** | Check dépendances | HTTP 400 |
| **Données Manquantes** | Validation champs requis | HTTP 400 |

---

## 📖 **Documentation Interactive**

### 🌐 **Swagger UI**

Explorez l'API de manière interactive :

**[📋 Documentation Swagger Complète](http://localhost:3004/api-docs)**

**Fonctionnalités disponibles :**
- 🧪 **Tests directs** des 31 endpoints
- 📋 **Schémas de données** pour 5 entités
- 🔍 **Codes de réponse** détaillés
- 💡 **Exemples** de requêtes et réponses
- 🔗 **Relations** entre entités expliquées

---

## 🧪 **Tests**

### ▶️ Exécution des Tests

```bash
# Tests complets
npm test

# Tests par entité
npm test __tests__/adminRoutes.tests.js
npm test __tests__/advisorRoutes.tests.js
npm test __tests__/profileRoutes.tests.js
npm test __tests__/promotionRoutes.tests.js
npm test __tests__/studentRoutes.tests.js

# Tests avec coverage
npm run test:coverage
```

### 📊 **Couverture de Tests**

- ✅ **74 tests** au total (estimation)
- ✅ **Admin Routes** : 12 tests
- ✅ **Advisor Routes** : 14 tests (spécialité incluse)
- ✅ **Profile Routes** : 12 tests
- ✅ **Promotion Routes** : 13 tests
- ✅ **Student Routes** : 12 tests
- ✅ **Cas d'erreur** et validations inclus

---

## 🚀 **Production & Déploiement**

### 🔧 **Variables Production**

```bash
NODE_ENV=production
PORT=3004
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=prod_service_key
FRONTEND_URL=https://votre-domaine.com
```

### 🐳 **Docker**

Le service est inclus dans le `docker-compose.yml` principal du projet Nexus.

### 🔄 **Dépendances Externes**

- **Auth Service** : Validation des utilisateurs
- **Calendar Service** : Relations événements-étudiants
- **Project Service** : Affectations projets-étudiants

---

**👥 Profile Service** - *Part of Nexus Ecosystem*  

🔗 **[Retour au projet principal](https://github.com/T-YEP-Nexus/frontend)**
