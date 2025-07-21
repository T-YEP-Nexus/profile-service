# Profile Microservice

This microservice manages user-related profile information and roles, including **admins**, **advisors**, and **user profiles**. It interacts with a Supabase backend and ensures referential integrity with related services like students and users.

---

## API Routes

### Admin Routes

| Method | Endpoint                                  | Description                           |
|--------|-------------------------------------------|---------------------------------------|
| GET    | `/admins`                                 | Retrieve all admins                   |
| GET    | `/admin/:id`                              | Get admin by ID                       |
| GET    | `/admin/profile/:user_profile_id`         | Get admin by user profile ID          |
| POST   | `/admin`                                  | Create a new admin                    |
| PATCH  | `/admin/:id`                              | Update an existing admin              |
| DELETE | `/admin/:id`                              | Delete an admin                       |

---

### Advisor Routes

| Method | Endpoint                                     | Description                                 |
|--------|----------------------------------------------|---------------------------------------------|
| GET    | `/advisors`                                  | Retrieve all advisors                       |
| GET    | `/advisor/:id`                               | Get advisor by ID                           |
| GET    | `/advisor/profile/:id_user_profile`          | Get advisor by user profile ID              |
| GET    | `/advisors/specialty/:specialty`             | Get advisors by specialty                   |
| POST   | `/advisor`                                   | Create a new advisor                        |
| PATCH  | `/advisor/:id`                               | Update an existing advisor                  |
| DELETE | `/advisor/:id`                               | Delete an advisor                           |

---

### User Profile Routes

| Method | Endpoint                              | Description                                      |
|--------|---------------------------------------|--------------------------------------------------|
| GET    | `/profiles`                           | Get all user profiles                            |
| GET    | `/profile/:id`                        | Get a user profile by internal ID               |
| GET    | `/profile/user/:user_id`              | Get a user profile by user UUID                 |
| POST   | `/profile`                            | Create a user profile                            |
| PATCH  | `/profile/:id`                        | Update an existing user profile by ID           |
| DELETE | `/profile/:id`                        | Delete a user profile (with dependency check)   |

---

### Promotion Routes

| Method | Endpoint                              | Description                                      |
|--------|---------------------------------------|--------------------------------------------------|
| GET    | `/promotions`                           | Get all promotions                            |
| GET    | `/promotion/:id`                        | Get a promotion by ID                |
| GET    | `/promotion/name/:name`              | Get promotions by name                 |
| POST   | `/promotion`                            | Create a new promotion                            |
| PATCH  | `/promotion/:id`                        | Update a promotion           |
| DELETE | `/promotion/:id`                        | Delete a promotion (only if not in use)   |

---

### Student Routes

| Method | Endpoint                              | Description                                      |
|--------|---------------------------------------|--------------------------------------------------|
| GET    | `/students`                           | Get all students                            |
| GET    | `/student/:id`                        | Get a student by ID                |
| GET    | `/student/profile/:id_user_profile`        | Get a student by user profile ID                 |
| POST   | `/student`                            | Create a new student                            |
| PATCH  | `/student/:id`                        | Update an existing student           |
| DELETE | `/student/:id`                        | Delete a student   |

---

## API Behavior Highlights

- **Data Validation**: All input is checked for type, format, and presence of required fields.
- **Conflict & Existence Checks**:
  - Prevents duplicate profile creation.
  - Prevents deletion if profile is referenced (e.g., by a student).
- **UUID Support**: Ensures UUID format is respected for `id_user` fields.
- **Error Handling**: Returns detailed messages on validation, database, and server errors.

---

## Swagger Documentation

📄 **[Swagger UI for Profile Microservice](http://localhost:3004/api-docs)**
