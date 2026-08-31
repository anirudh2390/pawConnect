# PawConnect — Master Context Document
> Last updated: 2026-08-06 | Status: Active Development

This document is the single source of truth for another AI agent or developer to continue building PawConnect without re-analysing the codebase.

---

## 1. Project Goal

PawConnect is a **pet adoption marketplace** — a full-stack web application that connects pet owners who want to re-home their pets with potential adopters.  

Core value proposition:
- Owners (Listers) create pet listings that go through admin moderation before going live.
- Potential adopters (Adopters) browse approved listings, submit adoption requests with a questionnaire, and communicate with owners via real-time chat.
- Admins moderate listings, manage users, and oversee all adoption activity.

The platform is an **academic project (S3)** targeting Indian users (phone numbers, city/state location model, INR context implied).

---

## 2. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File uploads | Multer (disk staging) → Cloudinary |
| Real-time | Socket.IO |
| Validation | Joi |
| Security | Helmet, express-rate-limit, CORS |
| Env config | dotenv |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 (Vite) |
| Routing | React Router v6 (createBrowserRouter) |
| UI library | React-Bootstrap (Bootstrap 5) |
| HTTP client | Axios (custom `api.js` instance) |
| Real-time | socket.io-client |
| State | React Context API (no Redux) |
| Build tool | Vite |
| Linting | oxlint |

---

## 3. Architecture

### Overview
```
[Browser] ←──HTTP/WS──→ [Express + Socket.IO Server :5000]
                                   │
                         ┌─────────┴─────────┐
                   [REST API]          [Socket.IO]
                         │                   │
                  [Controllers]       [socket/index.js]
                         │
                    [Mongoose]
                         │
                  [MongoDB Atlas]
                         │
                  [Cloudinary CDN]  ← image uploads
```

### Request Flow (REST)
```
Browser → Axios (api.js) → Express Route → authMiddleware → Validator → Controller → Model → MongoDB
```

### Socket.IO Flow (Chat)
```
Client (SocketContext) → io.connect() → join_room(roomId) → send_message({ roomId, senderId, text })
                                                            ↓ (broadcast only — NOT persisted yet)
                                          io.to(roomId).emit('message_received', messageData)
```

> ⚠️ Socket messages are currently **broadcast-only**. They are NOT saved to the database.

### Auth Flow
```
Register/Login → JWT issued → stored in localStorage
Every API request → Axios interceptor reads localStorage['token'] → sets Authorization: Bearer <token>
Protected route → authMiddleware.protect() verifies JWT → sets req.user = { id, role }
Admin route → authMiddleware.authorize('ADMIN') checks req.user.role
React router → <ProtectedRoute allowedRoles={['ADMIN']}> guards admin pages
On app boot → AuthContext calls GET /api/auth/me to rehydrate user state
```

---

## 4. Folder Structure

```
PawConnect/
│
├── MASTER_CONTEXT.md               ← (this file)
├── SOFTWARE_DESIGN_DOCUMENT.md     ← Full SRS/SDD
├── DESIGN_SYSTEM.md                ← UI design tokens
├── UI_UX_DESIGN_BLUEPRINT.md       ← Page-by-page UI specs
│
├── pawconnect-backend/
│   ├── .env                        ← Environment variables (see §10)
│   ├── package.json
│   └── src/
│       ├── app.js                  ← Express instance, middleware, route hookups
│       ├── server.js               ← Boot: DB connect → HTTP server → Socket.IO init
│       ├── config/
│       │   ├── db.js               ← Mongoose connect
│       │   └── cloudinary.js       ← Cloudinary SDK config
│       ├── controllers/
│       │   ├── authController.js   ← register, login, getMe, forgotPassword(stub), resetPassword(stub)
│       │   ├── userController.js   ← getProfile, updateProfile, uploadProfilePicture, changePassword, getMyListings, getMyAdoptionRequests, getAdoptionHistory, getUserStats
│       │   ├── petController.js    ← createPet, getPets, getPetById, getUserPets, updatePet, deletePet
│       │   ├── adminPetController.js ← getPendingPets, getAllPetsAdmin, approvePet, rejectPet, markAsAdopted, getPetStats
│       │   └── [adoptionController.js] ← ❌ FILE DOES NOT EXIST — adoptionRoutes.js imports it → CRASH
│       ├── middlewares/
│       │   ├── authMiddleware.js   ← protect(JWT verify), authorize(...roles)
│       │   ├── errorMiddleware.js  ← global Express error handler
│       │   └── uploadMiddleware.js ← multer diskStorage → /uploads, 5MB limit, images only
│       ├── models/
│       │   ├── User.js
│       │   ├── Pet.js
│       │   ├── Adoption.js
│       │   ├── ChatRoom.js
│       │   └── Message.js
│       ├── routes/
│       │   ├── authRoutes.js       → /api/auth
│       │   ├── userRoutes.js       → /api/users
│       │   ├── petRoutes.js        → /api/pets
│       │   ├── adoptionRoutes.js   → /api/adoptions  (❌ controller missing)
│       │   ├── chatRoutes.js       → /api/chats      (❌ 501 stubs only)
│       │   └── adminRoutes.js      → /api/admin
│       ├── services/
│       │   └── cloudinaryService.js ← uploadToCloudinary(localPath, folder), deleteFromCloudinary(publicId)
│       ├── socket/
│       │   └── index.js            ← Socket.IO setup: join_user_notifications, join_room, send_message, typing
│       ├── utils/
│       │   └── createAdmin.js      ← One-time script to seed admin user
│       └── validators/
│           ├── authValidator.js    ← validateRegister, validateLogin (Joi)
│           └── petValidator.js     ← validatePetCreate, validatePetUpdate (Joi)
│
└── pawconnect-frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx                ← React entry, mounts <App />
        ├── App.jsx                 ← AuthProvider > SocketProvider > RouterProvider
        ├── App.css / index.css     ← Global styles
        ├── styles/
        │   └── theme.css           ← CSS custom properties (design tokens)
        ├── assets/
        │   └── hero.png            ← Static asset
        ├── services/
        │   └── api.js              ← Axios instance, baseURL, Bearer token interceptor, 401 handler
        ├── contexts/
        │   ├── AuthContext.jsx     ← user, token, loading, login(), register(), logout(), updateUser(), isAuthenticated
        │   └── SocketContext.jsx   ← socket instance (null when not authenticated)
        ├── hooks/
        │   ├── useAuth.js          ← useContext(AuthContext)
        │   └── useSocket.js        ← useContext(SocketContext)
        ├── layouts/
        │   └── RootLayout.jsx      ← Navbar + Sidebar + <Outlet /> + Footer
        ├── components/layout/
        │   ├── Navbar.jsx          ← CustomNavbar (avatar dropdown, auth state)
        │   ├── Sidebar.jsx         ← CustomSidebar (drawer)
        │   └── Footer.jsx          ← CustomFooter
        ├── routes/
        │   └── index.jsx           ← createBrowserRouter config + <ProtectedRoute>
        └── pages/
            ├── Landing.jsx         ← Hero page (partially placeholder)
            ├── Browse.jsx          ← Pet grid + filters + pagination ✅
            ├── PetDetails.jsx      ← Full pet view (adopt/chat buttons non-functional)
            ├── Login.jsx           ← Login + Forgot Password modal ✅
            ├── Register.jsx        ← Registration form ✅
            ├── Dashboard.jsx       ← User listing management ⚠️ has orphaned JSX
            ├── CreatePet.jsx       ← Create listing form ⚠️ has orphaned JSX
            ├── EditPet.jsx         ← Edit listing form ✅
            ├── Profile.jsx         ← Multi-tab profile management ✅
            ├── Admin.jsx           ← Pet moderation panel ✅
            ├── Chat.jsx            ← ❌ STATIC PLACEHOLDER — no real implementation
            └── NotFound.jsx        ← 404 page ✅
```

---

## 5. Database Schema

### User
```js
{
  name:           String (required, trim)
  email:          String (required, unique, lowercase)
  passwordHash:   String (required) // bcrypt hashed via pre-save hook
  role:           'USER' | 'ADMIN'  // default: 'USER'
  location: {
    city:         String
    state:        String
  }
  phoneNumber:    String
  bio:            String
  profilePicture: {
    url:          String | null
    publicId:     String | null     // ⚠️ Cloudinary public_id for deletion
  }
  socialAccounts: {
    instagram:    String            // handle only, no @
  }
  isBanned:       Boolean           // default: false
  createdAt:      Date (auto)
  updatedAt:      Date (auto)
}
```

### Pet
```js
{
  listerId:       ObjectId → User (required, indexed)
  name:           String (required, trim)
  type:           'Dog' | 'Cat' | 'Other' (required, indexed)
  breed:          String (required, indexed)
  aiPredictedBreed: {               // Reserved — AI feature not implemented
    detectedBreed: String
    confidenceScore: Number
  }
  age: {
    number:       Number
    unit:         'Months' | 'Years'  // default: 'Years'
  }
  gender:         'Male' | 'Female' (required)
  size:           'Small' | 'Medium' | 'Large' (required)
  vaccinationStatus: 'Fully' | 'Partially' | 'None'  // default: 'None'
  medicalHistory: String
  description:    String
  imageUrls:      [String]          // ⚠️ URLs only — publicIds NOT stored (Cloudinary deletion broken)
  location: {
    city:         String (required, indexed)
    state:        String
  }
  status:         'Draft' | 'Pending' | 'Live' | 'Adopted' | 'Rejected'
                  // ⚠️ Controllers use 'Approved' not 'Live' — schema mismatch
  fraudVerificationScore: Number   // default: 0.0 — AI feature not implemented
  createdAt, updatedAt: Date (auto)
}
// Compound index: { type, breed, 'location.city' }
```

### Adoption
```js
{
  petId:          ObjectId → Pet (required, indexed)
  adopterId:      ObjectId → User (required, indexed)
  listerId:       ObjectId → User (required, indexed)
  questionnaire: {
    experienceLevel:  String
    homeEnvironment:  String
    hoursLeftAlone:   Number
    hasOtherPets:     Boolean
  }
  status:   'Received' | 'In-Review' | 'Interview-Scheduled' | 'Approved' | 'Rejected'
            // default: 'Received'
  notes:    String
  createdAt, updatedAt: Date (auto)
}
```

### ChatRoom
```js
{
  participantIds: [ObjectId → User] (indexed)
  petRelatedId:   ObjectId → Pet    // context of the chat
  lastMessageId:  ObjectId → Message
  createdAt, updatedAt: Date (auto)
}
```

### Message
```js
{
  roomId:    ObjectId → ChatRoom (required, indexed)
  senderId:  ObjectId → User (required)
  text:      String (required)
  isRead:    Boolean (default: false)
  createdAt, updatedAt: Date (auto)
}
```

---

## 6. Authentication Flow

### Registration
1. `POST /api/auth/register` with `{ name, email, password, location, phoneNumber }`
2. Joi validates → duplicate email check → `new User({ passwordHash: password })` → pre-save hook bcrypt-hashes it → save → sign JWT → return `{ token, user }`
3. Frontend `AuthContext.registerUser()` stores token in `localStorage`, sets user state

### Login
1. `POST /api/auth/login` with `{ email, password }`
2. Find user by email → check `isBanned` → `user.comparePassword(password)` → sign JWT → return `{ token, user }`
3. Frontend `AuthContext.loginUser()`:
   - `rememberMe=true` → `localStorage`
   - `rememberMe=false` → `sessionStorage` ⚠️ (also written to localStorage — bug, see §12)

### Session Rehydration (on app load)
1. `AuthContext useEffect` checks `localStorage.getItem('token')`
2. If found → calls `GET /api/auth/me` → sets user state
3. If 401 → calls `logout()` → clears all tokens

### Protected Routes
- Backend: `protect` middleware extracts Bearer token from `Authorization` header or `req.cookies.token`
- Backend: `authorize(...roles)` checks `req.user.role`
- Frontend: `<ProtectedRoute>` in `routes/index.jsx` checks `isAuthenticated` + `user.role` before rendering

### Token Storage
- JWT stored in `localStorage['token']`
- Axios interceptor (`api.js`) reads from localStorage on every request
- On 401 → interceptor clears localStorage keys (but does NOT redirect — redirecting is commented out)

---

## 7. User Roles

| Role | Access |
|---|---|
| **Guest (unauthenticated)** | Browse pets, view landing page, register, login |
| **USER** | All guest + create/edit/delete own listings, submit adoption requests, view profile, chat |
| **ADMIN** | All USER + admin panel: approve/reject listings, mark adopted, view all listings, (user management — NOT YET IMPLEMENTED) |

---

## 8. API Endpoints

### `POST /api/auth/register`
- Body: `{ name, email, password, location: {city, state}, phoneNumber }`
- Returns: `{ status, token, user }`

### `POST /api/auth/login`
- Body: `{ email, password }`
- Returns: `{ status, token, user }`

### `GET /api/auth/me` 🔒
- Returns: `{ status, user }` (no passwordHash)

### `POST /api/auth/forgot-password` ⚠️ STUB
- Body: `{ email }` → Returns mock token (does NOT send email)

### `POST /api/auth/reset-password` ⚠️ STUB
- Body: `{ token, newPassword }` → Only accepts hardcoded `stub_reset_token_xxx_123`

---

### `GET /api/users/profile` 🔒
- Returns: `{ status, user }` (full profile, no passwordHash)

### `PUT /api/users/profile` 🔒
- Body: `{ name?, bio?, phoneNumber?, location?, socialAccounts? }`
- Returns: `{ status, user }`

### `POST /api/users/profile/picture` 🔒
- Multipart: field name `profilePicture` (single file)
- Returns: `{ status, profilePicture: { url, publicId } }`

### `PUT /api/users/profile/password` 🔒
- Body: `{ currentPassword, newPassword }`
- Returns: `{ status, message }`

### `GET /api/users/profile/listings?page=1&limit=10&status=` 🔒
- Returns: `{ status, total, page, pages, listings[] }`

### `GET /api/users/profile/adoption-requests?page=1&limit=10&status=` 🔒
- Returns: `{ status, total, page, pages, requests[] }` (populated petId, listerId)

### `GET /api/users/profile/adoption-history?page=1&limit=10&status=` 🔒
- Returns: `{ status, total, page, pages, history[] }` (populated petId, adopterId)

### `GET /api/users/profile/stats` 🔒
- Returns: `{ status, stats: { listings: {total, live, adopted}, adoptionRequestsSent: {total, pending, approved}, adoptionRequestsReceived: {total} } }`

---

### `GET /api/pets?search=&type=&breed=&location=&gender=&vaccinationStatus=&ageRange=&sort=newest&page=1&limit=9`
- Public. Only returns `status: 'Approved'` pets.
- Returns: `{ status, pets[], page, limit, totalCount, totalPages }`

### `GET /api/pets/:id`
- Public. Non-approved pets visible only to owner or admin.
- Returns: `{ status, pet }` (populated `listerId`)

### `POST /api/pets` 🔒
- Multipart: fields from pet schema + files `images[]` (max 5)
- Creates pet with `status: 'Pending'`
- Returns: `{ status, pet }`

### `GET /api/pets/user/listings` 🔒
- Returns all pets by authenticated user: `{ status, count, pets[] }`

### `PUT /api/pets/:id` 🔒
- Multipart update. Resets status to `'Pending'` (unless already `'Adopted'`).
- Only owner can update.
- Returns: `{ status, pet }`

### `DELETE /api/pets/:id` 🔒
- Only owner can delete.
- ⚠️ Does NOT delete images from Cloudinary (publicIds not stored on Pet)
- Returns: `{ status, message }`

---

### `POST /api/adoptions` 🔒 ❌ CRASHES (missing controller)
### `GET /api/adoptions/sent` 🔒 ❌ CRASHES
### `GET /api/adoptions/received` 🔒 ❌ CRASHES
### `PATCH /api/adoptions/:id/cancel` 🔒 ❌ CRASHES
### `PATCH /api/adoptions/:id/respond` 🔒 ❌ CRASHES

---

### `GET /api/admin/pets/pending` 🔒 ADMIN
- Returns all `status: 'Pending'` pets with populated listerId.

### `GET /api/admin/pets?status=&type=` 🔒 ADMIN
- Returns all pets (filterable). No pagination — returns all docs.

### `GET /api/admin/pets/stats` 🔒 ADMIN
- Returns: `{ stats: { totalListings, pendingListings, approvedListings, rejectedListings, adoptedListings, typeBreakdown[] } }`

### `PUT /api/admin/pets/:id/approve` 🔒 ADMIN
- Sets `status: 'Approved'`

### `PUT /api/admin/pets/:id/reject` 🔒 ADMIN
- Body: `{ reason }` (required) → Sets `status: 'Rejected'` ⚠️ reason is NOT saved to DB

### `PUT /api/admin/pets/:id/adopted` 🔒 ADMIN
- Sets `status: 'Adopted'`

---

### `GET /api/chats/rooms` 🔒 ❌ 501 STUB
### `GET /api/chats/rooms/:roomId/messages` 🔒 ❌ 501 STUB

---

### Socket.IO Events (server at `http://localhost:5000`)

| Event (client → server) | Payload | Description |
|---|---|---|
| `join_user_notifications` | `userId` | Joins personal notification room |
| `join_room` | `roomId` | Joins a chat room |
| `send_message` | `{ roomId, senderId, text, tempId }` | Broadcasts to room (NOT persisted) |
| `typing` | `{ roomId, senderName, isTyping }` | Broadcasts typing indicator |

| Event (server → client) | Payload | Description |
|---|---|---|
| `message_received` | `messageData` | New message in room |
| `typing_status` | `{ senderName, isTyping }` | Typing indicator |

---

## 9. Completed Modules

| Module | Files | Notes |
|---|---|---|
| **Auth** | `authController.js`, `authRoutes.js`, `authValidator.js`, `Login.jsx`, `Register.jsx`, `AuthContext.jsx` | Complete except forgot/reset password (stubs) |
| **User Profile** | `userController.js`, `userRoutes.js`, `Profile.jsx` | Full CRUD + avatar upload + password change + activity tabs |
| **Pet Listings (CRUD)** | `petController.js`, `petRoutes.js`, `petValidator.js`, `CreatePet.jsx`, `EditPet.jsx`, `Browse.jsx`, `PetDetails.jsx` | Full CRUD with Cloudinary images; delete doesn't remove Cloudinary assets |
| **Admin Pet Moderation** | `adminPetController.js`, `adminRoutes.js`, `Admin.jsx` | Approve/reject/mark adopted; no user management |
| **Dashboard** | `Dashboard.jsx` | Owner listing management with tabs (has orphaned JSX bug) |
| **Socket.IO Infrastructure** | `socket/index.js`, `SocketContext.jsx`, `useSocket.js` | Connected; events wired; no persistence |
| **Navigation** | `Navbar.jsx`, `RootLayout.jsx`, `routes/index.jsx` | Auth-aware navbar, protected routes |

---

## 10. Pending Modules (Priority Order)

### P0 — Blockers (Cannot run without these)
1. **Create `adoptionController.js`** — server crashes on boot without it
2. **Fix orphaned JSX** in `Dashboard.jsx` (lines 365–409) and `CreatePet.jsx` (lines 472–505)
3. **Configure real Cloudinary credentials** in `.env`

### P1 — Core Feature: Chat
- `controllers/chatController.js` — `getRooms`, `getMessages`, `createOrGetRoom`
- Replace stubs in `chatRoutes.js`
- Add Socket.IO auth middleware (verify JWT on connection event)
- Persist messages to `Message` model in `send_message` handler
- Update `ChatRoom.lastMessageId` on each message
- Rewrite `Chat.jsx` with real Socket.IO + REST integration

### P2 — Core Feature: Adopt Flow from PetDetails
- Wire "Submit Adoption Request" button → modal with questionnaire form → `POST /api/adoptions`
- Wire "Initiate Chat with Owner" button → `POST /api/chats/rooms` (create/get room) → navigate to `/chat?room=:id`

### P3 — Password Reset
- Add `resetToken` (String) and `resetTokenExpiry` (Date) to `User` model
- Implement `forgotPassword`: generate crypto token, hash it, save to user, send email (Nodemailer)
- Implement `resetPassword`: find user by hashed token, check expiry, update password
- Create `/reset-password` page in frontend

### P4 — Admin User Management
- Backend: `GET /api/admin/users`, `PUT /api/admin/users/:id/ban`, `DELETE /api/admin/users/:id`
- Frontend: new tab in `Admin.jsx` for user listing + ban/delete actions

### P5 — Data & Schema Fixes
- Fix Pet status enum: standardise on `'Approved'` everywhere (remove `'Live'` from enum OR rename all `'Approved'` to `'Live'` and update all controllers/queries/frontend maps)
- Add `rejectionReason: String` field to Pet schema and save it in `rejectPet`
- Store Cloudinary `publicId` per-image for Pet listings (change `imageUrls: [String]` to `images: [{ url, publicId }]`)
- Add `status` index on `Adoption` model

### P6 — Minor / Polish
- Create `/contact` page (Navbar links to it)
- Replace Landing page emoji placeholder with real image
- Audit `Sidebar.jsx` and `Footer.jsx`
- Add `ellipsis` pagination for large page counts in `Browse.jsx`
- Add stricter rate limiting on `/api/auth/login`

---

## 11. Environment Variables

### Backend (`pawconnect-backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...   # Currently set to real Atlas cluster
JWT_SECRET=...                  # Currently hardcoded weak key — change for prod
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=...       # ⚠️ Currently placeholder
CLOUDINARY_API_KEY=...          # ⚠️ Currently placeholder
CLOUDINARY_API_SECRET=...       # ⚠️ Currently placeholder
FRONTEND_URL=http://localhost:5173
```

### Frontend (`pawconnect-frontend/.env` — create if missing)
```env
VITE_BACKEND_URL=http://localhost:5000/api    # Used by api.js Axios instance
# Note: SocketContext uses 'http://localhost:5000' (no /api suffix) hardcoded with fallback
```

---

## 12. Known Bugs (Active)

| ID | Bug | File | Severity |
|---|---|---|---|
| B1 | `adoptionController.js` missing — server crash on start | `adoptionRoutes.js:4` | 🔴 Critical |
| B2 | Orphaned JSX after component close | `Dashboard.jsx:365–409` | 🔴 Critical |
| B3 | Orphaned JSX after component close | `CreatePet.jsx:472–505` | 🔴 Critical |
| B4 | Pet status enum: model has `'Live'`, controllers use `'Approved'` | `Pet.js`, `petController.js` | 🟠 High |
| B5 | `rememberMe=false` still writes to localStorage (token persists after session) | `AuthContext.jsx:53` | 🟡 Medium |
| B6 | `loginUser()` returns `undefined` if API returns non-success status (no explicit return) | `AuthContext.jsx:56` | 🟡 Medium |
| B7 | Pet delete doesn't remove Cloudinary images — no `publicId` stored | `petController.js:429` | 🟡 Medium |
| B8 | Reject reason accepted by API but not saved to Pet document | `adminPetController.js:124` | 🟡 Medium |
| B9 | Socket messages not persisted — lost on page refresh | `socket/index.js:28` | 🟡 Medium |
| B10 | Socket.IO has no auth guard | `socket/index.js:12` | 🟡 Medium |

---

## 13. Coding Conventions

### General
- **No TypeScript** — plain JavaScript throughout
- **ES Modules** on frontend (`import/export`), **CommonJS** on backend (`require/module.exports`)
- Async/await everywhere (no raw Promise chains)
- `next(error)` pattern in all Express controllers for error propagation
- All controllers wrapped in try/catch

### Backend
- Controller functions are named exports (named functions, not arrow functions on module.exports)
- Response format is always: `{ status: 'success'|'error', message: string, data?: any, errors?: object }`
- Use `protect` then `authorize` for role-guarded routes
- Validators run `schema.validate(req.body, { abortEarly: false })` and return 400 with error map
- Cloudinary uploads: always use `uploadToCloudinary(req.file.path, 'pawconnect/<folder>')` then set result on model

### Frontend
- Functional components only (no class components)
- One default export per file; named export also provided: `export const Foo = () => {}; export default Foo;`
- `useAuth()` hook for all auth state access (never read `AuthContext` directly in pages)
- `api.js` Axios instance for all HTTP calls (never raw `fetch`)
- `loading`, `error`, `success` state triad pattern in every data-fetching component
- Form state uses a single `formData` object or discrete state per field for small forms
- Bootstrap classes for layout; custom CSS variables (from `theme.css`) for brand theming

### Error Handling (Frontend)
```jsx
try {
  setLoading(true);
  setError(null);
  const res = await api.get('/endpoint');
  if (res.data?.status === 'success') { /* use data */ }
} catch (err) {
  setError(err.response?.data?.message || 'Fallback message');
} finally {
  setLoading(false);
}
```

---

## 14. Naming Conventions

### Backend
| Item | Convention | Example |
|---|---|---|
| Files | camelCase | `userController.js`, `authMiddleware.js` |
| Models | PascalCase filename, `mongoose.model('ModelName', schema)` | `User.js`, `mongoose.model('User', ...)` |
| Controller functions | camelCase verb+noun | `createPet`, `getMyListings`, `uploadProfilePicture` |
| Route paths | kebab-case | `/forgot-password`, `/adoption-requests` |
| DB fields | camelCase | `listerId`, `passwordHash`, `vaccinationStatus` |
| Env vars | UPPER_SNAKE_CASE | `JWT_SECRET`, `MONGODB_URI` |

### Frontend
| Item | Convention | Example |
|---|---|---|
| Components/Pages | PascalCase | `Login.jsx`, `CustomNavbar` |
| Hooks | camelCase, `use` prefix | `useAuth`, `useSocket` |
| Context files | PascalCase | `AuthContext.jsx` |
| Handler functions | `handle` prefix | `handleSubmit`, `handleDeleteClick` |
| State vars | camelCase | `isLoading`, `petData`, `showModal` |
| CSS classes (custom) | `paw-` prefix for brand | `paw-card`, `paw-input`, `btn-paw-primary` |
| Route paths | kebab-case | `/edit-pet/:id`, `/create-pet` |

---

## 15. Reusable Patterns & Components

### Backend
- **`protect` + `authorize` middleware** — applied to all guarded routes
- **`uploadToCloudinary(path, folder)`** — service function, always `await` it inside a try/catch
- **Error propagation**: throw from controller → `next(error)` → `errorMiddleware.js` sends JSON

### Frontend
- **`<ProtectedRoute allowedRoles={[...]}>` wrapper** — in `routes/index.jsx`; use for any page requiring auth
- **`api` Axios instance** — always import from `'../services/api'`; never instantiate a new Axios
- **`useAuth()` hook** — destructure `{ user, login, logout, register, updateUser, isAuthenticated, loading }`
- **`useSocket()` hook** — returns the raw socket.io-client instance (or `null` if not authenticated)

### Inline Sub-components (Profile.jsx)
- `<StatBox label value color />` — stat display card
- `<PasswordStrength password />` — animated strength meter
- `<EmptyState emoji message action />` — empty list placeholder

### Common State Pattern
```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);
```

### Common Modal Pattern (delete confirmation)
```jsx
const [showModal, setShowModal] = useState(false);
const [targetId, setTargetId] = useState(null);
// <Modal show={showModal} onHide={...} centered> ... </Modal>
```

### Status Badge Helper (duplicated — refactor target)
```jsx
const statusVariants = { Pending: 'warning', Approved: 'success', Rejected: 'danger', Adopted: 'info', Draft: 'secondary' };
<Badge bg={statusVariants[status] || 'secondary'}>{status}</Badge>
```

---

## 16. State Management

All state is managed with **React Context + useState**. No Redux or Zustand.

### AuthContext (global)
- `user` — current user object (`{ id, name, email, role, location, phoneNumber, bio, profilePicture }`)
- `token` — JWT string
- `loading` — boolean (true during initial session validation)
- `isAuthenticated` — computed: `!!user`
- `login(email, password, rememberMe)` → returns `{ success, message?, errors? }`
- `register(name, email, password, location, phoneNumber)` → returns `{ success, message?, errors? }`
- `logout()` — clears state + localStorage + sessionStorage
- `updateUser(partialData)` — merges partial update into user state + localStorage

### SocketContext (global)
- Exposes the raw `socket` instance (or `null`)
- Auto-connects when `token` is available, auto-disconnects on logout

### Local State (per page)
- Every page manages its own `loading`, `error`, `data` state
- No shared page-level state between pages (navigate is the only cross-page communication)

---

## 17. Design System

### Theme CSS Variables (from `theme.css`)
```css
--paw-primary: #FF6A00         /* Brand orange */
--paw-accent: [purple-ish]     /* Secondary accent */
--paw-bg-card: #1E1E1E         /* Card backgrounds */
--paw-bg-input: [dark input bg]
--paw-border: [dark border color]
```

### Custom CSS Classes
| Class | Purpose |
|---|---|
| `paw-card` | Dark card background with border |
| `paw-input` | Dark themed form input |
| `btn-paw-primary` | Orange branded button |
| `btn-paw-outline` | Outlined orange button |
| `paw-navbar` | Dark sticky navbar |
| `paw-accent-header` | Decorative lowercase display font |
| `paw-script` | Italic/cursive contextual label (e.g. `*discover*`) |
| `paw-nav-link` | Navbar link with active/hover state |

### UI Philosophy
- Dark-first design (black/near-black backgrounds)
- Lowercase display headers for brand voice
- Orange (`--paw-primary`) as the sole accent colour
- All interactive elements have hover transitions
- Modals use `backgroundColor: '#141414'` (header/footer) + `'#1E1E1E'` (body)

---

## 18. Current Blockers (Summary)

| # | Blocker | What must happen |
|---|---|---|
| 1 | **Missing `adoptionController.js`** | Create the file with `submitAdoptionRequest`, `getMyAdoptionRequests`, `getOwnerAdoptionRequests`, `cancelAdoptionRequest`, `respondToAdoptionRequest` |
| 2 | **Orphaned JSX in Dashboard.jsx** | Delete lines 365–409 (unreachable content after component close) |
| 3 | **Orphaned JSX in CreatePet.jsx** | Delete lines 472–505 (old drag-drop stub) |
| 4 | **Cloudinary credentials** | Replace placeholder values in `.env` with real Cloudinary account keys |
| 5 | **Chat.jsx is a static mockup** | Full rewrite needed (see §10 P1) |
| 6 | **Adopt + Chat buttons on PetDetails are dead** | Wire to proper handlers (see §10 P2) |

---

## 19. Running the Project

### Backend
```bash
cd pawconnect-backend
npm install
# Ensure .env has real CLOUDINARY_* values
npm run dev     # or: node src/server.js
# Runs on http://localhost:5000
```

### Frontend
```bash
cd pawconnect-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Creating an Admin User
```bash
cd pawconnect-backend
node src/utils/createAdmin.js
```

---

*Document generated: 2026-08-06 | Audit performed on full codebase read*
