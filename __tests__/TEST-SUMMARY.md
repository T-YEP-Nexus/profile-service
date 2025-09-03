# 📊 Résumé des Tests Backend – API Functional Tests

## 🎯 Objectif

Valider le fonctionnement complet des endpoints CRUD pour les entités Admin, Advisor, Information, Profile, Promotion et Student dans le service backend profile-service. La suite teste les routes CRUD pour chaque entité en incluant les cas de succès et d'erreur.

## 🏗️ Architecture des Tests

### Admin Routes

| Suite | Nombre de tests | Description |
|-------|----------------|-------------|
| `POST /admin` | 3 | Création réussie, doublon, champs manquants |
| `GET /admins` | 1 | Récupération de tous les admins |
| `GET /admin/:id` | 2 | Récupération par ID valide et ID inexistant |
| `GET /admin/profile/:id_user_profile` | 2 | Récupération par user_profile ID valide et format invalide |
| `PATCH /admin/:id` | 2 | Mise à jour réussie et sans champs fournis |
| `DELETE /admin/:id` | 2 | Suppression réussie et tentative sur admin déjà supprimé |

**Total : 12 tests Admin**

### Advisor Routes

| Suite | Nombre de tests | Description |
|-------|----------------|-------------|
| `POST /advisor` | 3 | Création réussie, doublon, champs manquants |
| `GET /advisors` | 1 | Récupération de tous les advisors |
| `GET /advisor/:id` | 2 | Récupération par ID valide et ID inexistant |
| `GET /advisor/profile/:id_user_profile` | 2 | Récupération par user_profile ID valide et format invalide |
| `PATCH /advisor/:id` | 2 | Mise à jour réussie et sans champs fournis |
| `DELETE /advisor/:id` | 2 | Suppression réussie et tentative sur advisor déjà supprimé |

**Total : 12 tests Advisor**

### Information Routes

| Suite | Nombre de tests | Description |
|-------|----------------|-------------|
| `POST /information` | 3 | Création réussie, doublon, champs manquants |
| `GET /informations` | 1 | Récupération de toutes les informations |
| `GET /information/:id` | 3 | Récupération par ID valide, non trouvé, format invalide |
| `PATCH /information/:id` | 3 | Mise à jour réussie, non trouvé, format invalide |
| `DELETE /information/:id` | 3 | Suppression réussie, déjà supprimé, format invalide |

**Total : 13 tests Information**

### Profile Routes

| Suite | Nombre de tests | Description |
|-------|----------------|-------------|
| `POST /profile` | 3 | Création réussie, profil existant, champs manquants |
| `GET /profiles` | 1 | Récupération de tous les profils |
| `GET /profile/:id` | 2 | Récupération par ID valide et ID inexistant |
| `GET /profile/user/:user_id` | 2 | Récupération par user_id valide et format invalide |
| `PATCH /profile/:id` | 2 | Mise à jour réussie et sans champs fournis |
| `DELETE /profile/:id` | 2 | Suppression réussie et tentative sur profil déjà supprimé |

**Total : 12 tests Profile**

### Promotion Routes

| Suite | Nombre de tests | Description |
|-------|----------------|-------------|
| `GET /promotions` | 1 | Récupération de toutes les promotions |
| `POST /promotion` | 3 | Création réussie, champs manquants, doublon |
| `GET /promotion/:id` | 3 | Récupération par ID valide, UUID invalide, non trouvé |
| `PATCH /promotion/:id` | 3 | Mise à jour réussie, UUID invalide, champs manquants |
| `DELETE /promotion/:id` | 3 | Suppression réussie, déjà supprimé, UUID invalide |

**Total : 13 tests Promotion**

### Student Routes

| Suite | Nombre de tests | Description |
|-------|----------------|-------------|
| `POST /student` | 3 | Création réussie, étudiant existant, champs manquants |
| `GET /students` | 1 | Récupération de tous les étudiants |
| `GET /student/:id` | 2 | Récupération par ID valide et ID inexistant |
| `GET /student/profile/:id_user_profile` | 2 | Récupération par user_profile ID valide et format invalide |
| `PATCH /student/:id` | 2 | Mise à jour réussie et sans champs fournis |
| `DELETE /student/:id` | 2 | Suppression réussie et tentative sur étudiant déjà supprimé |

**Total : 12 tests Student**

**Grand total : 74 tests CRUD backend**

## 🔐 Couverture Fonctionnelle

### Admin Routes
- **POST /admin** – Création, doublon (409), champs manquants (400)
- **GET /admins** – Récupération de tous les admins
- **GET /admin/:id** – Récupération par ID valide / gestion du 404
- **GET /admin/profile/:id_user_profile** – Récupération par user_profile ID / format invalide (400)
- **PATCH /admin/:id** – Mise à jour réussie / gestion 400 sans champs
- **DELETE /admin/:id** – Suppression et gestion du 404

### Advisor Routes
- **POST /advisor** – Création, doublon (409), champs manquants (400)
- **GET /advisors** – Récupération de tous les advisors
- **GET /advisor/:id** – Récupération par ID valide / gestion du 404
- **GET /advisor/profile/:id_user_profile** – Récupération par user_profile ID / format invalide (400)
- **PATCH /advisor/:id** – Mise à jour réussie / gestion 400 sans champs
- **DELETE /advisor/:id** – Suppression et gestion du 404

### Information Routes
- **POST /information** – Création, doublon (409), champs manquants (400)
- **GET /informations** – Récupération de toutes les informations
- **GET /information/:id** – Récupération par ID valide / 404 si inexistant / 400 format invalide
- **PATCH /information/:id** – Mise à jour réussie / 404 si inexistant / 400 format invalide
- **DELETE /information/:id** – Suppression / 404 déjà supprimé / 400 format invalide

### Profile Routes
- **POST /profile** – Création, profil existant (409), champs manquants (400)
- **GET /profiles** – Récupération de tous les profils
- **GET /profile/:id** – Récupération par ID valide / 404 si inexistant
- **GET /profile/user/:user_id** – Récupération par user_id / format invalide (400)
- **PATCH /profile/:id** – Mise à jour réussie / gestion 400 sans champs
- **DELETE /profile/:id** – Suppression et gestion du 404

### Promotion Routes
- **GET /promotions** – Récupération de toutes les promotions
- **POST /promotion** – Création, champs manquants (400), doublon (409)
- **GET /promotion/:id** – Récupération par ID valide / UUID invalide (400) / 404 si inexistant
- **PATCH /promotion/:id** – Mise à jour réussie / UUID invalide (400) / champs manquants (400)
- **DELETE /promotion/:id** – Suppression / 404 déjà supprimé / UUID invalide (400)

### Student Routes
- **POST /student** – Création, étudiant existant (409), champs manquants (400)
- **GET /students** – Récupération de tous les étudiants
- **GET /student/:id** – Récupération par ID valide / 404 si inexistant
- **GET /student/profile/:id_user_profile** – Récupération par user_profile ID / format invalide (400)
- **PATCH /student/:id** – Mise à jour réussie / gestion 400 sans champs
- **DELETE /student/:id** – Suppression et gestion du 404

## 📁 Structure des Fichiers de Test

```
__tests__/
├── adminRoutes.tests.js          # Tests CRUD Admin
├── advisorRoutes.tests.js        # Tests CRUD Advisor
├── informationRoutes.tests.js    # Tests CRUD Information
├── profileRoutes.tests.js        # Tests CRUD Profile
├── promotionRoutes.tests.js      # Tests CRUD Promotion
├── studentRoutes.tests.js        # Tests CRUD Student
└── TEST-SUMMARY.md                     # Documentation des tests
```

## 🚀 Scripts de Test Disponibles

```bash
npm test __tests__/adminRoutes.tests.js          # Tests Admin
npm test __tests__/advisorRoutes.tests.js        # Tests Advisor
npm test __tests__/informationRoutes.tests.js    # Tests Information
npm test __tests__/profileRoutes.tests.js        # Tests Profile
npm test __tests__/promotionRoutes.tests.js      # Tests Promotion
npm test __tests__/studentRoutes.tests.js        # Tests Student
npm test                                         # Tous les tests
```

## ✅ Statut Actuel

⚠️ **Les tests dépendent d'une instance live du serveur profile-service sur [http://localhost:3004](http://localhost:3004)**

💻 **Avec le serveur et la DB opérationnelle, tous les 74 tests passent (100%)**

🔄 **Les tests incluent les scénarios succès et erreurs pour chaque route**

## 🔍 Ce qui est Testé

### Toutes les Entités (Admin, Advisor, Information, Profile, Promotion, Student)
- Intégrité des créations, mises à jour et suppressions
- Validation des champs requis et format UUID
- Gestion des doublons et erreurs (400, 404, 409)
- Récupération : liste complète, par ID, par relations

### Spécificités par Entité
- **Admin/Advisor/Student** : Récupération par user_profile ID
- **Profile** : Récupération par user_id
- **Information/Promotion** : Validation format UUID renforcée

## 🎯 Avantages de cette Approche

- **Tests complets backend** – Vérifie tous les endpoints CRUD pour 6 entités
- **Validation robuste** – Cas de succès et erreurs couvert de manière consistante
- **Fiabilité** – Chaque test valide la réponse HTTP et le contenu
- **Maintenance facile** – Tests clairs et isolés par entité et route
- **Couverture uniforme** – Même niveau de test pour toutes les entités

## 🚀 Utilisation Recommandée

### Pour le développement quotidien :
```bash
npm test __tests__/adminRoutes.tests.js
npm test __tests__/studentRoutes.tests.js
# ... selon l'entité développée
```

### Pour la validation complète :
```bash
npm test
```

### Tests par groupe d'entités :
```bash
# Entités utilisateur
npm test __tests__/adminRoutes.tests.js __tests__/advisorRoutes.tests.js __tests__/studentRoutes.tests.js

# Entités données
npm test __tests__/informationRoutes.tests.js __tests__/promotionRoutes.tests.js __tests__/profileRoutes.tests.js
```

## 📝 Notes de Développement

- Couverture **complète et consistante** pour toutes les entités
- Tests de validation UUID renforcés pour Information et Promotion
- Gestion des relations (user_profile, user_id) testée
- **Dépendances** : serveur live et base de données opérationnelle
