# PawConnect — API Documentation

All API endpoints are prefixed with `/api`.  
Authentication uses `Bearer <JWT_TOKEN>` in the `Authorization` header.

---

## Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
**Purpose:** Register a new user account  
**Auth required:** No  
**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123!",
  "phone": "9876543210"
}
```
**Response:** `201 Created` — JWT token + user object

---

### `POST /api/auth/login`
**Purpose:** Log in and receive a JWT token  
**Auth required:** No  
**Request body:**
```json
{
  "email": "john@example.com",
  "password": "StrongPass123!"
}
```
**Response:** `200 OK` — JWT token + user object

---

### `GET /api/auth/me`
**Purpose:** Get the currently authenticated user's profile  
**Auth required:** Yes  
**Response:** `200 OK` — user object

---

### `POST /api/auth/forgot-password`
**Purpose:** Request a password reset  
**Auth required:** No  
**Request body:** `{ "email": "john@example.com" }`  
**Response:** `200 OK` — success message

---

### `POST /api/auth/reset-password`
**Purpose:** Reset password using a reset token  
**Auth required:** No  
**Request body:** `{ "token": "...", "newPassword": "NewPass123!" }`  
**Response:** `200 OK` — success message

---

## Pet Endpoints (`/api/pets`)

### `GET /api/pets`
**Purpose:** List approved pets with search, filtering, sorting, and pagination  
**Auth required:** No  
**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search (name, breed, location) |
| `type` | string | Pet category: `Dog`, `Cat`, `Other` (comma-separated) |
| `breed` | string | Breed name (partial match) |
| `location` | string | City or state |
| `gender` | string | `Male` or `Female` (comma-separated) |
| `ageRange` | string | `Puppy`, `Young`, `Adult`, `Senior` |
| `vaccinationStatus` | string | `Fully`, `Partially`, `None` (comma-separated) |
| `sort` | string | `newest` \| `oldest` \| `nameAsc` \| `nameDesc` |
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 9) |

**Response:** `200 OK` — `{ status, pets[], totalCount, totalPages, page }`

---

### `GET /api/pets/:id`
**Purpose:** Get details for a single pet  
**Auth required:** No  
**Response:** `200 OK` — full pet object

---

### `POST /api/pets`
**Purpose:** Create a new pet listing  
**Auth required:** Yes  
**Content-Type:** `multipart/form-data`  
**Form fields:** `name`, `type`, `breed`, `age[number]`, `age[unit]`, `gender`, `size`, `vaccinationStatus`, `neutered`, `description`, `location[city]`, `location[state]`, `images[]` (max 5 files)  
**Response:** `201 Created` — created pet object (status: `Pending`)

---

### `PUT /api/pets/:id`
**Purpose:** Update an existing pet listing (owner only)  
**Auth required:** Yes  
**Content-Type:** `multipart/form-data`  
**Response:** `200 OK` — updated pet object

---

### `DELETE /api/pets/:id`
**Purpose:** Delete a pet listing (owner or ADMIN)  
**Auth required:** Yes  
**Response:** `200 OK` — success message

---

### `GET /api/pets/user/listings`
**Purpose:** Get all pets listed by the current user  
**Auth required:** Yes  
**Response:** `200 OK` — array of pet objects

---

## Adoption Endpoints (`/api/adoptions`)

### `POST /api/adoptions`
**Purpose:** Submit an adoption request for a pet  
**Auth required:** Yes  
**Request body:**
```json
{
  "petId": "<pet_id>",
  "message": "I'd love to adopt this pet because...",
  "housingType": "Apartment",
  "hasYard": false,
  "otherPets": false,
  "experience": "Some experience with dogs"
}
```
**Response:** `201 Created` — adoption request object

---

### `GET /api/adoptions/sent`
**Purpose:** Get adoption requests submitted by the current user  
**Auth required:** Yes  
**Response:** `200 OK` — array of adoption requests

---

### `GET /api/adoptions/received`
**Purpose:** Get adoption requests received by the current user (for their pets)  
**Auth required:** Yes  
**Response:** `200 OK` — array of adoption requests

---

### `PATCH /api/adoptions/:id/cancel`
**Purpose:** Cancel a pending adoption request (requester only)  
**Auth required:** Yes  
**Response:** `200 OK` — updated adoption object

---

### `PATCH /api/adoptions/:id/respond`
**Purpose:** Approve or reject an adoption request (pet owner only)  
**Auth required:** Yes  
**Request body:** `{ "status": "Approved" | "Rejected", "adminNote": "optional note" }`  
**Response:** `200 OK` — updated adoption object (auto-rejects competing requests on Approve)

---

## Chat Endpoints (`/api/chats`)

> All chat endpoints require authentication.

### `GET /api/chats/rooms`
**Purpose:** List all chat rooms for the current user  
**Auth required:** Yes  
**Response:** `200 OK` — array of room objects with last message

---

### `GET /api/chats/unread-count`
**Purpose:** Get total unread message count across all rooms  
**Auth required:** Yes  
**Response:** `200 OK` — `{ unreadCount: number }`

---

### `POST /api/chats/rooms`
**Purpose:** Get or create a private chat room with another user  
**Auth required:** Yes  
**Request body:** `{ "otherUserId": "<user_id>" }`  
**Response:** `200 OK` — room object

---

### `GET /api/chats/rooms/:roomId/messages`
**Purpose:** Get paginated message history for a room  
**Auth required:** Yes  
**Query parameters:** `page`, `limit`  
**Response:** `200 OK` — `{ messages[], totalCount, totalPages, page }`

---

### `POST /api/chats/rooms/:roomId/messages`
**Purpose:** Send and persist a message in a room  
**Auth required:** Yes  
**Request body:** `{ "content": "Hello!" }`  
**Response:** `201 Created` — message object

---

### `PATCH /api/chats/rooms/:roomId/read`
**Purpose:** Mark all messages in a room as read  
**Auth required:** Yes  
**Response:** `200 OK` — success message

---

## User Profile Endpoints (`/api/users`)

### `GET /api/users/profile`
**Purpose:** Get current user's full profile  
**Auth required:** Yes  
**Response:** `200 OK` — user profile object

---

### `PUT /api/users/profile`
**Purpose:** Update profile (name, bio, phone, location)  
**Auth required:** Yes  
**Request body:** `{ "name": "...", "bio": "...", "phone": "...", "location": "..." }`  
**Response:** `200 OK` — updated user object

---

### `POST /api/users/profile/picture`
**Purpose:** Upload/update profile picture  
**Auth required:** Yes  
**Content-Type:** `multipart/form-data`  
**Form field:** `profilePicture` (image file)  
**Response:** `200 OK` — updated user with Cloudinary picture URL

---

### `PUT /api/users/profile/password`
**Purpose:** Change password  
**Auth required:** Yes  
**Request body:** `{ "currentPassword": "...", "newPassword": "..." }`  
**Response:** `200 OK` — success message

---

### `GET /api/users/profile/listings`
**Purpose:** Get all pets listed by the current user  
**Auth required:** Yes  
**Response:** `200 OK` — array of pet objects

---

### `GET /api/users/profile/adoption-requests`
**Purpose:** Get all adoption requests sent by the current user  
**Auth required:** Yes  
**Response:** `200 OK` — array of adoption requests

---

### `GET /api/users/profile/adoption-history`
**Purpose:** Get adoption history (approved/rejected)  
**Auth required:** Yes  
**Response:** `200 OK` — array of historical adoption records

---

### `GET /api/users/profile/stats`
**Purpose:** Get activity statistics for the current user  
**Auth required:** Yes  
**Response:** `200 OK` — `{ totalListings, totalRequestsSent, totalRequestsReceived, adoptedCount }`

---

## Admin Endpoints (`/api/admin`)

> All admin endpoints require ADMIN role.

### Pet Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/pets/pending` | List all pending pets awaiting moderation |
| `GET` | `/api/admin/pets` | List all pets (all statuses) |
| `GET` | `/api/admin/pets/stats` | Pet statistics (counts by status/type) |
| `PUT` | `/api/admin/pets/:id/approve` | Approve a pending pet listing |
| `PUT` | `/api/admin/pets/:id/reject` | Reject a pending pet listing |
| `PUT` | `/api/admin/pets/:id/adopted` | Manually mark a pet as adopted |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users/stats` | User statistics |
| `GET` | `/api/admin/users` | List all registered users |
| `PATCH` | `/api/admin/users/:id/ban` | Ban or unban a user |
| `DELETE` | `/api/admin/users/:id` | Permanently delete a user |

### Report Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/reports/stats` | ADMIN | Report statistics |
| `GET` | `/api/admin/reports` | ADMIN | List all reports |
| `POST` | `/api/admin/reports` | Any authenticated user | Submit a report |
| `PATCH` | `/api/admin/reports/:id/resolve` | ADMIN | Mark report as resolved |
| `DELETE` | `/api/admin/reports/:id` | ADMIN | Delete a report |

---

## Common Response Formats

### Success
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error
```json
{
  "status": "error",
  "message": "Human-readable error description"
}
```

### HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request / Validation Error |
| `401` | Unauthorized (missing/invalid JWT) |
| `403` | Forbidden (insufficient role) |
| `404` | Resource not found |
| `409` | Conflict (e.g., duplicate adoption request) |
| `429` | Too Many Requests (rate limited) |
| `500` | Internal Server Error |
