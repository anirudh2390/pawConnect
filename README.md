# 🐾 PawConnect

**PawConnect** is a full-stack, production-quality pet adoption platform built as a Mini-Project for S3 MCA. It enables pet owners to list animals for adoption, potential adopters to discover and apply for pets, and administrators to moderate the entire platform — all in real time.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **Authentication** | JWT-based register/login, role-based access (USER / ADMIN), password reset |
| **Pet Listings** | Create, edit, delete, and browse pet listings with image uploads via Cloudinary |
| **Discovery / Browse** | Full-text search + multi-filter + sort + pagination |
| **Adoption Workflow** | Submit, cancel, approve / reject adoption requests; auto-rejects competing requests on approval |
| **Real-time Chat** | Socket.IO powered private messaging between adopter and pet owner (gated by active adoption request) |
| **Notifications** | Real-time in-app notifications for adoption events |
| **User Profile** | Profile management, avatar upload, activity history, statistics |
| **Admin Dashboard** | Pet moderation, user management (ban/delete), report handling, platform statistics |
| **Error Pages** | Custom 404, 403, 500 pages |

---

## 🛠 Technology Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 (Vite) |
| UI Library | React Bootstrap 2 + Bootstrap 5 |
| Routing | React Router DOM v6 |
| Real-time | Socket.IO Client |
| Animations | Framer Motion |
| HTTP | Axios |
| Styling | Vanilla CSS (design system in `theme.css`) |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | MongoDB (via Mongoose 8) |
| Auth | JWT + bcryptjs |
| Real-time | Socket.IO 4 |
| File Uploads | Multer + Sharp + Cloudinary |
| Security | Helmet, CORS, express-rate-limit |
| Validation | Joi |

---

## 📋 Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

---

## 🚀 Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd PawConnect
```

### 2. Backend setup

```bash
cd pawconnect-backend
npm install
```

Create a `.env` file in `pawconnect-backend/`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/pawconnect

# JWT
JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Optional – disable rate limiting in dev
DISABLE_RATE_LIMIT=true
```

### 3. Frontend setup

```bash
cd pawconnect-frontend
npm install
```

Create a `.env` file in `pawconnect-frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## ▶️ Running the Application

### Backend

```bash
cd pawconnect-backend
npm run dev         # nodemon hot-reload
# OR
npm start           # production mode
```

The API will be available at `http://localhost:5000`.

### Frontend

```bash
cd pawconnect-frontend
npm run dev         # Vite dev server at http://localhost:5173
```

### Build for production

```bash
cd pawconnect-frontend
npm run build
npm run preview
```

---

## 🗄️ MongoDB Setup

1. Start MongoDB locally: `mongod` (or use MongoDB Atlas)
2. The backend automatically creates collections on first run via Mongoose models
3. To seed sample data (optional): see [`pawconnect-backend/scripts/seedData.js`](pawconnect-backend/scripts/seedData.js)

```bash
cd pawconnect-backend
node scripts/seedData.js
```

---

## 📁 Project Structure

```
PawConnect/
├── pawconnect-backend/
│   ├── src/
│   │   ├── config/          # DB and Cloudinary config
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Auth, error, upload middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic services
│   │   ├── socket/          # Socket.IO event handlers
│   │   ├── utils/           # Utility functions
│   │   ├── validators/      # Joi validation schemas
│   │   ├── app.js           # Express app factory
│   │   └── server.js        # Entry point (HTTP + Socket.IO)
│   ├── scripts/             # Utility/seed scripts
│   └── .env                 # ⚠️  NOT committed to git
│
├── pawconnect-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # Navbar, Footer, Sidebar
│   │   │   └── ui/          # Skeletons, shared UI
│   │   ├── contexts/        # AuthContext, SocketContext
│   │   ├── hooks/           # useAuth, useSocket
│   │   ├── layouts/         # RootLayout
│   │   ├── pages/           # Route-level page components
│   │   ├── routes/          # Router config (lazy-loaded)
│   │   ├── services/        # Axios API instance
│   │   ├── styles/          # theme.css design system
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # Global reset
│   └── .env                 # ⚠️  NOT committed to git
│
└── docs/
    ├── API_DOCUMENTATION.md
    ├── MONGODB_DOCUMENTATION.md
    └── POSTMAN_COLLECTION.json
```

---

## 🔐 Environment Variables Summary

### Backend `.env`

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port | No (default 5000) |
| `NODE_ENV` | `development` or `production` | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `JWT_EXPIRES_IN` | Token expiry duration | No (default 7d) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `FRONTEND_URL` | Allowed CORS origin | Yes |
| `DISABLE_RATE_LIMIT` | Set `true` to disable rate limiting in dev | No |

### Frontend `.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.IO server URL |

---

## 🔑 Admin Access

To grant admin access to a user:
1. Register a normal account through the app
2. In MongoDB, update the user's `role` field to `"ADMIN"`:

```javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "ADMIN" } })
```

The admin panel is accessible at `/admin` (ADMIN role required).

---

## 📜 Main Modules Summary

### Module 1 — Authentication
JWT-based auth with register, login, password reset. Role-based access control: `USER` and `ADMIN`.

### Module 2 — Pet Listing Management
Create pets with multi-image upload (Cloudinary), edit and delete. Listings go through admin moderation before appearing publicly.

### Module 3 — Browse & Discovery
Paginated browsing with search, category, breed, location, gender, age, and vaccination filters.

### Module 4 — User Profile
Profile editing, avatar upload, password change, stats summary, adoption history.

### Module 5 — Adoption Workflow
Submit, cancel, approve/reject adoption requests. Auto-rejects competing requests on approval. Status updates via real-time notifications.

### Module 6 — Real-time Chat
Socket.IO powered private conversations between adopter and pet owner. Chat access gated by active adoption request. Typing indicators, online presence, unread badges.

### Module 7 — Notifications
Real-time adoption event notifications delivered via Socket.IO. Badge counts in Navbar.

### Module 8 — Admin Platform Administration
Pet moderation (approve/reject/mark adopted), user management (ban/unban/delete), report handling, platform statistics with charts.

---

## 🧪 Testing

> Full end-to-end testing is a separate phase. Currently the project has been manually verified for all module workflows.

```bash
# Quick sanity — frontend build
cd pawconnect-frontend && npm run build

# Quick sanity — backend start
cd pawconnect-backend && npm start
```

---

## ⚠️ Security Notes

- **Never commit** `.env` files to version control
- `.env` files are listed in `.gitignore`
- JWT secrets should be strong random strings (≥ 32 chars)
- Cloudinary API credentials are server-side only

---

*© 2026 PawConnect — S3 MCA Mini-Project*
