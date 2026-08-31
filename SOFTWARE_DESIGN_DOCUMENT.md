# Software Design Document (SDD)
## Project: PawConnect (AI-Powered Centralized Pet Adoption Platform)
### Author: Senior Software Architect & Full Stack Engineer
### Status: Draft (Awaiting Approval)
### Date: July 2026

---

## 1. Introduction and Scope
PawConnect is a next-generation web application designed to centralize and automate the pet adoption cycle, creating a trustworthy, secure, and intuitive digital marketplace for pet owners, animal shelters, and prospective adopters. 

By integrating AI technology (computer-vision-based breed identification and classification models to detect fraudulent listings) and direct real-time communication channels, PawConnect seeks to address key fragmentation and lack of trust issues plaguing modern urban pet adoption systems.

### Technology Stack Overview:
*   **Frontend:** React (SPA, Vite, Vanilla CSS with custom design tokens)
*   **Backend:** Node.js with Express.js (Layered architectural design)
*   **Database:** MongoDB (Managed documents, NoSQL modeling, indexes)
*   **Real-time Communication:** Socket.IO / WebSockets
*   **AI Service Node:** Python-based FASTAPI (Image breed recognition, anomaly fraud vetting)

---

## 2. UI/UX Design Strategy (Design Theme Integration)
The layout and interface of PawConnect are inspired by the deep charcoal/amber-orange palette of the reference theme (`PawConnectTheme.png`). The visual guidelines maintain an emotional, luxurious, yet highly clean dark-theme aesthetic, emphasizing visual hierarchy and spaciousness.

### A. Core Visual Elements
*   **Visual Style:** Deep dark theme canvas (`#0A0A0A`). Dark components focus attention strictly on high-contrast pet images. We reject standard "cutesy" or cartoon-oriented styles in favor of a clean, premium, and sophisticated dark interface that emphasizes the dignity and value of pet lives.
*   **Visual Structure:** 
    *   Generous margins and large sections (desktop containers are padded to `8%` left/right).
    *   High-contrast typography blocks pairing standard sans-serif text with hand-drawn, cursive script descriptors.
*   **Color Scheme (Design Tokens):**
    *   `--color-bg-primary`: `#0A0A0A` (canvas body)
    *   `--color-bg-secondary`: `#141414` (cards, navbars, dashboards)
    *   `--color-bg-tertiary`: `#1A1A1A` (inputs, buttons, focus elements)
    *   `--color-accent`: `#E07A2F` (active orange accent)
    *   `--color-accent-light`: `#F0924F` (hover orange accent)
    *   `--color-text-primary`: `#FFFFFF` (high contrast content)
    *   `--color-text-secondary`: `#9E9E9E` (subheadings, secondary details)
    *   `--color-text-muted`: `#525252` (footers, slide denominators)
    *   `--border-dark`: `#222222` (default separators)
    *   `--border-focus`: `#444444` (highlight details)
*   **Typography:**
    *   *Sans-Serif (Standard):* `Inter` or `Montserrat` for readability.
    *   *Script Font Family (Emphasized Words):* `Caveat` or `Playfair Display (italic)` to write cursive accents above primary header nodes (e.g. *happy* **beginnings.** or *unconditional* **loyalty.**).
    *   *Display Titles:* Heavy bold lowercase words with an orange dot separator (e.g., `cuteness.`, `friendship.`).
*   **Card Designs:**
    *   Uniform grids, subtle border (`1px solid #222222`), `12px` border-radius.
    *   Hover state triggers a smooth `-6px` Y-axis translation, brightens border-color to match Accent Orange (`#E07A2F`), and adds a soft background glow (`box-shadow: 0 12px 30px rgba(224, 122, 47, 0.12)`).
*   **Button and Input Elements:**
    *   Primary buttons exhibit solid orange layout with active hover scaling (`transform: scale(1.02)`).
    *   Inputs employ a dark background (`#1A1A1A`) with orange focus outlines (`box-shadow: 0 0 8px rgba(224, 122, 47, 0.25)`).
*   **Mobile Adaptability:** Minimalist double-line hamburger menu, collapsing sidebar layouts, full horizontal swipe touch-gestures for carousel elements, and vertical form wrapping.
*   **Transitions:** Strict 300ms ease transitions (`transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)`) applied control-wide to ensure buttery-smooth animation profiles.

---

## 3. Functional Requirements (FR)
Parsed directly from the SRS:

*   **FR-1: User Authentication & Onboarding**
    *   Standard email/password signup and login.
    *   JWT token issuance with split authorization for base users and administrators.
    *   Unified role access: a single user profile acts as both an adopter (browsing and submitting requests) and a lister (creating and managing listings) without login swapping.
*   **FR-2: User Profile Management**
    *   Manage personal biography, address/location, contact preferences.
    *   View active pet adoption requests, and view/manage listed pets historical timeline.
*   **FR-3: Pet Listing CRUD Management**
    *   Creation of pet details (Name, Age, Breed, Gender, Size, Vaccinations, Health History, Location, Images).
    *   Status states: `Draft`, `Pending Admin Review`, `Live / Approved`, `Adopted`, `Rejected`.
*   **FR-4: AI Fraud & Vision Integration**
    *   Computer vision backend handles uploaded pet images, automatically predicting the breed to avoid entry fraud or input typos.
    *   ML anomaly detection scans listing descriptions and metadata to flag potential pet scams, duplicate items, or commercial exploitation.
*   **FR-5: Search and Discovery**
    *   Full-text search combined with granular multi-filtering (Pet Type, Breed, Age group, Location, Gender, Size).
    *   Personalized recommendations algorithm showing compatible pets based on user interests/profile preferences.
*   **FR-6: Core Adoption System**
    *   Submit formalized adoption request questionnaires.
    *   Real-time status updates: Received, In-Review, Interview-Scheduled, Approved, Rejected.
*   **FR-7: Instant Messaging & Chat**
    *   Real-time communication framework linking adopters and current pet owners/shelters.
    *   Store messaging logs persistently in the database for legal/fraud tracking.
*   **FR-8: Platform Administration Dashboard**
    *   Admin vetting workflow: review flagged listings, manually approve/deny pending listing cards, ban malicious accounts, generate analytics and summary metrics.

---

## 4. Non-Functional Requirements (NFR)
*   **NFR-1: Usability and Aesthetics**
    *   Consistency rating of 100% across color schemes, font heights, button styling, and alignments as per `DESIGN_SYSTEM.md`. Zero native browser styling wrappers.
*   **NFR-2: Performance & Load Speed**
    *   Initial load time below 2 seconds. API requests returned within 200ms.
    *   Automatic backend compression of uploaded imagery (converting raw inputs to optimized WebP formats) to reduce payload size.
*   **NFR-3: Reliability & Availability**
    *   99.9% uptime target. Stateless Express backend instances enabling quick restarts and high resilience.
*   **NFR-4: Security & Compliance**
    *   Passwords stored with high-iteration bcrypt hashing.
    *   Protected API routes guarded by JWT validation middleware.
    *   Database connection strings and server secrets stored strictly under custom-managed ENV variables.
*   **NFR-5: Scalability**
    *   MongoDB query indexing on frequently searched keys (breed, location, status).
    *   Separation of Node.js API logic and Python ML model logic into standalone microservices.

---

## 5. Complete Software Architecture
PawConnect follows a classic decoupled Client-Server architecture, optimized for live, real-time messaging, centralized NoSQL database transactions, and isolated machine learning processing.

```
                    +--------------------------------------------+
                    |           React Web Client (SPA)           |
                    |         - Design Tokens (Dark Theme)       |
                    |         - Axios API client                 |
                    |         - Socket.IO client                 |
                    +--------------------------------------------+
                            |                            ^
                  HTTPS APIs|                            |Socket.IO
                            v                            v
               +-------------------------------------------------------+
               |                  Node.js / Express Gateway            |
               |         - Router & Controller Middleware Layers       |
               |         - MongoDB ORM (Mongoose Connection)           |
               |         - WebSocket Server Manager (Socket.IO)        |
               +-------------------------------------------------------+
                     |                     |                     ^
         MongoDB Connection|         Internal HTTP |          Storage|
                     v                     v                     v
            +-----------------+  +--------------------+  +---------------+
            |  MongoDB Cluster|  | Python AI Service  |  | Local / Cloud |
            |  - Users        |  | - FastAPI Server   |  | Asset Directory|
            |  - Pets         |  | - Computer Vision  |  | - WebP Images  |
            |  - Chats / Logs |  | - Fraud Check ML   |  +---------------+
            +-----------------+  +--------------------+
```

*   **Vite React Client:** Serves UI rendering. Employs vanilla CSS properties (`index.css`), tracking views and form statuses locally, calling APIs asynchronously.
*   **Express.js Gateway:** Handles routing, checks token access layers, handles multi-part files (images), interacts with database hooks, and broadcasts websocket updates.
*   **Python AI Service:** Independent ML runner. Provides breed classification using convolutional neural networks (CNNs), and text spam evaluation using NLP metrics.
*   **MongoDB Cluster:** Holds primary application data. Documents are modeled via Mongoose.

---

## 6. System Workflow (Data Flow Overview)
```
[User Action] ---> [Vite React Client] ---> [Express API Gateway] ---> [Database (MongoDB)]
                          |                             |
                          | (Image Upload)              | (Verify Matches) 
                          v                             v
                  [AI Python Microservice] <============+
                  - Detect/Classify Breed
                  - Assess Fraud Risk Index
```
1.  **Request Input Validation:** Inputs are processed on the frontend form level, then sanitised and validated on the Express layer.
2.  **AI Classification Trigger:** When a listing is created, photos are directed to the Python AI service. The extracted breed results are appended to the listing, alongside a fraud rating based on text content checks.
3.  **Vetting Checkpoint:** If fraud indicators score text/image fields as suspicious, the listing status is marked as `Pending Admin Review`. Clean items are marked `Live`.
4.  **Action Persistence:** Complete data documents register on MongoDB, triggering corresponding audit logs and UI websocket events.

---

## 7. User Workflow

```
[Register/Login] --> [Dashboard Home] --> [Browse/Search Pets] --> [Open Real-time Chat]
                                |                                         |
                                +--> [Create / Manage Pet Listing]       +--> [Submit Adoption Request]
                                           |                                      |
                                           v                                      v
                                    [AI Breed Scan]                       [Track Status Queue]
                                           |
                                           v
                                    [Verify Details]
```

*   **Registration/Access Phase:** User defines role metrics, validates email structure target, logs in, and gets authenticated workspace profile.
*   **Explore Phase:** User inputs location filters, reads personalized pet recommendation list, opens pet summary details page.
*   **Adoption Engagement Phase:**
    1.  User starts direct chat with shelter owner to communicate pet traits.
    2.  User proceeds to formal digital Adoption Application screen.
    3.  User fills background credentials questionnaire and hits Submit.
    4.  Tracks progress checklist status (Received -> In Review -> Approved).
*   **Creation Phase (Listing a Pet):**
    1.  User enters pet profile information (Name, Age, Bio) and uploads images.
    2.  System runs automated background AI Breed Prediction.
    3.  User reviews predicted breeds, attaches vaccine files, and saves.
    4.  Approved state goes live on main feed grid.

---

## 8. Platform Admin Workflow
```
[Admin Log In] ---> [Overview Dashboard] ---> [Review Flagged Alerts] ---> [Inspect Verification Details]
                                                 |                                   |
                                                 | (Approve/Reject)                  v
                                                 +--------------------------> [Update MongoDB Status]
                                                                                     |
                                                                                     v
                                                                          [Audit Logs Registered]
```
*   **Moderator Operations Dashboard:** Tracks operational queue data (system health status, registered user logs, active adoptions index, flagged listing cards count).
*   **Moderation Pipeline:**
    1.  Admin opens listing approval queue containing entries flagged by AI filters or reported by base users.
    2.  Admin views AI breed validation details and computed fraud evaluation risk indicators.
    3.  Admin makes binary decision: `Approve` (transitioning status state to `Live / Verified`) or `Reject` (notifying the user, changing state to `Rejected`, hiding card).
    4.  Admin retains privilege to temporarily lock or permanently ban profile IDs violating platform protocols.

---

## 9. Core Module Relationships
```
        +------------------+             +-------------------+
        |   User Module    |             |    Chat Module    |
        | - Auth & Profiles|             | - Socket Messages |
        +------------------+             | - Message Logs    |
          |              |               +-------------------+
          | 1            | 1               |               |
          |              +-----------------+               |
          |                                                |
          v 1..*                                           v 1..*
    +-------------------+                           +-------------------+
    |   Pet Module      |                           |  Adoption Module  |
    | - Listings (CRUD) |<--------------------------| - Applications    |
    | - AI Verification | 1                         | - Status Tracking |
    +-------------------+                           +-------------------+
            ^
            | 1..* (Reports/Moderation Actions)
            |
    +-------------------+
    |   Admin Module    |
    | - Dashboard Logs  |
    | - Member Vetting  |
    +-------------------+
```

---

## 10. Folder Structure

Below is the directory design mapping out the frontend client, backend engine, and AI model node, aligning with complete isolation and modern production design configurations.

```
PawConnect/
│
├── DESIGN_SYSTEM.md                # Style guidelines reference
├── SOFTWARE_DESIGN_DOCUMENT.md     # Production architectural schema
├── srs_content.txt                 # Extracted project goals from PDF
│
├── pawconnect-frontend/            # React Client Workspace (Vite Build)
│   ├── public/                     # Icons, static branding files
│   ├── src/
│   │   ├── assets/                 # SVGs, cursive custom fonts, patterns
│   │   ├── components/             # Reusable UI controls
│   │   │   ├── ui/                 # Atomic design components (Buttons, Inputs, Badges)
│   │   │   ├── layout/             # Layout constructs (Header, Footer, Sidebars)
│   │   │   └── cards/              # Style cards (PetCard, ChatBubble, ApplicationCard)
│   │   ├── context/                # Global contexts (Auth, SocketIO, Theme)
│   │   ├── hooks/                  # Custom utility web-hooks (useAuth, useSocket)
│   │   ├── pages/                  # Structural page components
│   │   │   ├── Landing.jsx         # Image-rich landing screen (similar to style image)
│   │   │   ├── Dashboard.jsx       # Unified user workbench
│   │   │   ├── Search.jsx          # Discovery pet search board
│   │   │   ├── PetDetails.jsx      # Pet profile summary breakdown
│   │   │   ├── Chat.jsx            # Communication dashboard
│   │   │   ├── Admin/              # Moderator control sheets
│   │   │   └── NotFound.jsx        # Standard elegant error sheet
│   │   ├── services/               # HTTP client connectors (Axios configs)
│   │   │   ├── api.js              # Base interceptor pipeline
│   │   │   ├── authService.js      # Auth API client
│   │   │   ├── petService.js       # Pet listings API client
│   │   │   └── chatService.js      # Chat logic API client
│   │   ├── styles/                 # Pure CSS design token system
│   │   │   ├── index.css           # Global tokens & base styling setup
│   │   │   ├── animations.css      # Core cubic transition sheets
│   │   │   └── components.css      # Card styles, button variants
│   │   ├── App.jsx                 # Routing configuration matrix
│   │   └── main.jsx                # Web application entry point
│   ├── index.html                  # HTML5 base document
│   ├── vite.config.js              # Vite compiler configuration
│   └── package.json                # Frontend package dependencies
│
├── pawconnect-backend/             # Node.js Server Workspace (Express Framework)
│   ├── src/
│   │   ├── config/                 # Setup configuration files (DB, WebSockets, Storage)
│   │   ├── controllers/            # Request processing controllers (payload checks)
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── petController.js
│   │   │   ├── adoptionController.js
│   │   │   ├── chatController.js
│   │   │   └── adminController.js
│   │   ├── middlewares/            # Route gatekeeper modules
│   │   │   ├── authMiddleware.js   # JWT validation & role controls
│   │   │   ├── errorMiddleware.js  # Global exception response formatter
│   │   │   ├── uploadMiddleware.js # Multer multi-part parser & image compressor
│   │   │   └── validation.js       # Form validators (using Joi schemas)
│   │   ├── models/                 # Mongoose database models
│   │   │   ├── User.js
│   │   │   ├── Pet.js
│   │   │   ├── Adoption.js
│   │   │   ├── ChatRoom.js
│   │   │   ├── Message.js
│   │   │   └── AuditLog.js
│   │   ├── routes/                 # Endpoint routing channels
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── petRoutes.js
│   │   │   ├── adoptionRoutes.js
│   │   │   ├── chatRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── services/               # Complex logic execution layers
│   │   │   ├── socketService.js    # Websockets connection registers
│   │   │   └── aiService.js        # Relays to Python server endpoints
│   │   ├── app.js                  # App controller instantiation
│   │   └── server.js               # Service runtime execution endpoint
│   ├── uploads/                    # Local temporary file folder
│   ├── .env.example                # Template system configurations
│   ├── package.json                # Back-end dependencies and start engines
│   └── yarn.lock
│
└── pawconnect-ai/                  # Python AI Service Workspace (ML Engine)
    ├── src/
    │   ├── models/                 # Model checkpoints and weights
    │   ├── services/
    │   │   ├── breedClassifier.py  # Image processing logic
    │   │   └── fraudScrubber.py    # Text spam/fraud classification
    │   └── main.py                 # FastAPI microservice endpoint
    ├── requirements.txt            # Python scientific dependencies
    └── Dockerfile                  # Dev container build rules
```

---

## 11. React Component Hierarchy

```
App (Routes Configuration Matrix)
│
├── AuthProvider (Global Authentication Context Provider)
├── SocketProvider (WebSocket Connection Handler)
│
├── LandingPage (Carousels, High-Contrast Slides, Accent Fonts, Social Tags)
│
├── MainAppLayout (Header Navigation, Sliding Hamburger Menu Sidebar, Footer Block)
│   │
│   ├── BrowsePetsPage (Search Filters Shelf, Grid System)
│   │   └── PetCard (Hover Glows, Linear Fade Image Overlays)
│   │
│   ├── PetDetailsPage (High-Contrast Header, Technical Specifications Panel, Action Triggers)
│   │   └── AdoptionFormModal (Questionnaire step-by-step inputs)
│   │
│   ├── UserDashboard (Left Summary Deck, Multi-Tab Listing and Requests Tables)
│   │   ├── ListedPetsList (List view edit/update modal triggers)
│   │   │   └── CreatePetModal (Image drag-drop upload, AI feedback status cards)
│   │   └── AdoptionRequestsList (Detail view grids)
│   │
│   ├── ChatDashboard (Split Window View)
│   │   ├── UserRoomList (Active thread index item)
│   │   └── ActiveChatBox (Dynamic scrolling area, Message Bins, Input with orange focus)
│   │
│   └── AdminDashboard (Stats Header Cards, Side-by-Side Queue Sheets)
│       ├── FlaggedReportsQueue (Anomalies highlight list)
│       └── ManualApprovalsPendingList (Review inspection sheets)
```

---

## 12. React Architecture

### Routing Strategy:
Uses `react-router-dom` (Version 6) with nested routes structure. Routes are separated into three primary access access categories:
1.  **Public routes:** Landing screen `/`, Discover feed `/browse`, Details view `/pet/:id`.
2.  **Protected Adopter/Lister routes:** Dashboard panel `/dashboard`, Creative canvas `/create-pet`, Live workspace `/chat`.
3.  **Restricted Administrator routes:** Mod Panel `/admin`.

### Global State Context Structure:
*   `AuthContext`: Stores the current authenticated user instance profile, JWT memory token, roles hierarchy metadata, and status validation methods.
*   `SocketContext`: Instantiates and holds open a reusable websocket connection to the Express API (handling reconnects, session checks, and state transfers).
*   `ThemeContext`: Controls CSS document styling attributes (managing transition states and dynamic font resizing).

### Styling Strategy:
CSS is authored in pure, vanilla CSS files (`styles/index.css`), avoiding nested styling complications. Colors, layouts, and typography patterns are bound strictly to local CSS variables (`:root`) that reflect the branding elements of the design references.

---

## 13. Backend Architecture
The backend application uses a classic clean dependency decoupling model. All execution steps follow a predictable, layered order:

```
[HTTP Request] 
      │
      ▼
[Routing Layer] 
      │
      ▼
[Security & Validation Middleware] (JWT validation, Joi validation schema, rate limits check)
      │
      ▼
[Controller Layer] (Translates inputs, delegates orchestration, structures status outputs)
      │
      ▼
[Service Domain Layer] (Applies business rules, performs logic calculations, integrates AI calls)
      │
      ▼
[Data Persistence Model] (Schema-validated Database write commands using Mongoose)
      │
      ▼
[Response Target]
```

*   **App Separation:** Controllers handle the request-response cycle and do not interact directly with Mongoose models. Instead, controllers delegate to the Service Layer, keeping database mutations isolated and modular.

---

## 14. MongoDB Collection Design

To match production data integrity requirements, the schema details specify structures, data types, and index parameters. NoSQL design patterns prioritize high-read pet filtering.

### A. Collection: `users`
This collection holds user accounts.
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String (Unique, Indexed)",
  "passwordHash": "String (Bcrypt Hash)",
  "role": "String (Enum: ['USER', 'ADMIN'], default: 'USER')",
  "location": {
    "city": "String",
    "state": "String"
  },
  "phoneNumber": "String",
  "bio": "String",
  "socialAccounts": {
    "instagram": "String"
  },
  "isBanned": "Boolean (default: false)",
  "createdAt": "Date (default: Date.now)",
  "updatedAt": "Date (default: Date.now)"
}
```
**Database Indexes:**
*   `email: 1` (Unique index for lightning-fast lookups during login).

### B. Collection: `pets`
This collection holds listings of pets up for adoption.
```json
{
  "_id": "ObjectId",
  "listerId": "ObjectId (Ref: 'users', Indexed)",
  "name": "String",
  "type": "String (Enum: ['Dog', 'Cat', 'Other'], Indexed)",
  "breed": "String (Indexed)",
  "aiPredictedBreed": {
    "detectedBreed": "String",
    "confidenceScore": "Number"
  },
  "age": {
    "number": "Number",
    "unit": "String (Enum: ['Months', 'Years'])"
  },
  "gender": "String (Enum: ['Male', 'Female'])",
  "size": "String (Enum: ['Small', 'Medium', 'Large'])",
  "vaccinationStatus": "String (Enum: ['Fully', 'Partially', 'None'])",
  "medicalHistory": "String",
  "description": "String",
  "imageUrls": ["String"],
  "location": {
    "city": "String (Indexed)",
    "state": "String"
  },
  "status": "String (Enum: ['Draft', 'Pending', 'Live', 'Adopted', 'Rejected'], default: 'Pending', Indexed)",
  "fraudVerificationScore": "Number (0.0 to 1.0, derived by AI Anomaly Engine)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
**Database Indexes:**
*   `listerId: 1` (Retrieves pets listed by a user).
*   `status: 1` (Retrieves only active/approved pets on the front feed).
*   `type: 1`, `breed: 1`, `location.city: 1` (Sparsely creates multi-key compound indexes for matching search filters).

### C. Collection: `adoptions`
Records the formal adoption applications.
```json
{
  "_id": "ObjectId",
  "petId": "ObjectId (Ref: 'pets', Indexed)",
  "adopterId": "ObjectId (Ref: 'users', Indexed)",
  "listerId": "ObjectId (Ref: 'users', Indexed)",
  "questionnaire": {
    "experienceLevel": "String",
    "homeEnvironment": "String",
    "hoursLeftAlone": "Number",
    "hasOtherPets": "Boolean"
  },
  "status": "String (Enum: ['Received', 'In-Review', 'Interview-Scheduled', 'Approved', 'Rejected'], default: 'Received')",
  "notes": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
**Database Indexes:**
*   `adopterId: 1` (View application history).
*   `listerId: 1` (View incoming applications for listed pets).
*   `petId: 1` (Checks duplicate applications on the same animal).

### D. Collection: `chatrooms`
Represents communication threads between two members.
```json
{
  "_id": "ObjectId",
  "participantIds": ["ObjectId (Ref: 'users', Indexed)"],
  "petRelatedId": "ObjectId (Ref: 'pets', Optional)",
  "lastMessageId": "ObjectId (Ref: 'messages')",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
**Database Indexes:**
*   `participantIds: 1` (Retrieves active conversations for a user).

### E. Collection: `messages`
Individual message items linked to conversations.
```json
{
  "_id": "ObjectId",
  "roomId": "ObjectId (Ref: 'chatrooms', Indexed)",
  "senderId": "ObjectId (Ref: 'users')",
  "text": "String",
  "isRead": "Boolean (default: false)",
  "createdAt": "Date (default: Date.now)"
}
```
**Database Indexes:**
*   `roomId: 1, createdAt: -1` (Serves sorted message logs directly to the chat window).

---

## 15. Entity-Relationship (ER) Diagram Description
Since MongoDB is a document-oriented model, we design relationships to strike a balance between performance, scaling, and normalized integrity structures:

*   **Users to Pets (1 to Many):** One User card is referenced as a `listerId` within many Pet documents. The relationship is stored via a simple ObjectId reference inside `pets`, which prevents user details duplication.
*   **Pets to Adoptions (1 to Many):** A pet profile can receive multiple submission questionnaires. The `adoptions` document stores references to `petId`, `adopterId`, and `listerId`.
*   **Users to ChatRooms (Many to Many):** A chatroom lists exactly two target ids in the `participantIds` array field. Queries search for user matches inside this array index.
*   **ChatRooms to Messages (1 to Many):** A message has a lookup constraint mapping it to one parent `roomId`. The chatroom references `lastMessageId` to allow preview rendering in message lists without loading the entire thread.

---

## 16. REST API Documentation

All request payloads are submitted as `application/json` interfaces. Secure routes require standard JWT tokens sent in the Authorization Header: `Authorization: Bearer <token>` or HTTP-Only cookie.

### A. Authentication Module
*   `POST /api/auth/register`
    *   *Body:* `{ "name", "email", "password", "location": { "city", "state" }, "phoneNumber" }`
    *   *Response (201):* `{ "status": "success", "user": { "id", "name", "email", "role" }, "token" }`
*   `POST /api/auth/login`
    *   *Body:* `{ "email", "password" }`
    *   *Response (200):* `{ "status": "success", "user": { "id", "name", "email", "role" }, "token" }`

### B. Users Module
*   `GET /api/users/profile` (Protected)
    *   *Response (200):* `{ "status": "success", "user": { "id", "name", "email", "bio", "location", "phoneNumber" } }`
*   `PUT /api/users/profile` (Protected)
    *   *Body:* `{ "name", "bio", "location", "phoneNumber", "socialAccounts" }`
    *   *Response (200):* Updated JSON representation.

### C. Pets CRUD Module
*   `GET /api/pets` (Public/Searchable)
    *   *Query:* `?type=Dog&breed=Dachshund&location=NYC&page=1`
    *   *Response (200):* `{ "status": "success", "results": [...], "pagination": { "current", "total" } }`
*   `GET /api/pets/:id` (Public)
    *   *Response (200):* Detailed pet record object.
*   `POST /api/pets` (Protected)
    *   *Body:* Multipart Form Data (`name`, `type`, `breed`, `ageNumber`, `ageUnit`, `gender`, `size`, `vaccinationStatus`, `description`, `images` file field)
    *   *Processing:* Backend routes uploaded file objects, hits the internal AI Breed Parser, updates results, and saves document properties.
    *   *Response (201):* `{ "status": "success", "pet": { "id", "name", "breed", "aiPredictedBreed", "status" } }`
*   `PUT /api/pets/:id` (Protected, Lister only)
    *   *Response (200):* Updated pet schema representation.
*   `DELETE /api/pets/:id` (Protected, Lister/Admin only)
    *   *Response (200):* Status deletion confirmation.

### D. Adoptions Module
*   `POST /api/adoptions` (Protected, Adopter only)
    *   *Body:* `{ "petId", "questionnaire": { "experienceLevel", "homeEnvironment", "hoursLeftAlone", "hasOtherPets" } }`
    *   *Response (201):* `{ "status": "success", "applicationId", "status": "Received" }`
*   `GET /api/adoptions/sent` (Protected, Adopter access)
    *   *Response (200):* List of user's submitted adoption applications.
*   `GET /api/adoptions/received` (Protected, Lister access)
    *   *Response (200):* List of adoption applications submitted for listed pets.
*   `PATCH /api/adoptions/:id/status` (Protected, Lister access)
    *   *Body:* `{ "status": "Enum: ['In-Review', 'Interview-Scheduled', 'Approved', 'Rejected']", "notes" }`
    *   *Response (200):* Updated application properties.

### E. Chat Module
*   `GET /api/chats/rooms` (Protected)
    *   *Response (200):* Listing of active chat rooms corresponding to user ID.
*   `GET /api/chats/rooms/:roomId/messages` (Protected)
    *   *Response (200):* Message logs list.
*   `POST /api/chats/rooms` (Protected)
    *   *Body:* `{ "recipientId", "petRelatedId" }`
    *   *Response (200/201):* Existing or updated Room JSON model.

### F. Administrative Module
*   `GET /api/admin/pets/pending` (Admin restricted)
    *   *Response (200):* Unprocessed queue listings.
*   `PATCH /api/admin/pets/:id/vetting` (Admin restricted)
    *   *Body:* `{ "decision": "Approve / Reject" }`
    *   *Response (200):* Operation confirmation message.
*   `PATCH /api/admin/users/:id/ban` (Admin restricted)
    *   *Body:* `{ "isBanned": true }`
    *   *Response (200):* Mod status modification success log.

---

## 17. Authentication Flow

JWT generation and check details:

```
[SignUp/LogIn Input] ---> [Verify Hash (Bcrypt)] ---> [Generate Access Token]
                                                             │ (Expires: 1 hour)
                                                             v
[Store Cookie (HTTP-Only)] <---------------------------------+
```

1.  **Transport Layer:** During sign-in, standard credentials map to verification blocks on Express.
2.  **Access token payload:** Contains `{ userId, role }` signed using a cryptographic private key.
3.  **Storage Engine:** The access token is set in an HTTP-Only, SameSite secure cookie to prevent Cross-Site Scripting (XSS) client token parsing. A volatile runtime memory pointer is updated in React.
4.  **Session expiration:** Refresh token design enables short-lived (15 minutes) request keys.

---

## 18. Role-Based Access Control Flow (RBAC)
Routes require valid authentication and verify specific roles (`USER` vs `ADMIN`).

```
[API Target Route] 
      │
      ▼
[IsAuthenticated Middleware] (Verifies JWT validation, returns req.user)
      │
      ▼
[RequireRole('ADMIN')] (Conditional checks: req.user.role === 'ADMIN'? Next() : Return 403)
      │
      ▼
[Exec Controllers Route Logic]
```

*   **Route Guards:** Express utilizes generic middleware arrays (e.g., `router.get('/pending', isAuthenticated, requireRole('ADMIN'), getPendingListings)`).
*   **React view validation:** PrivateRoute JSX components fetch profiles context state. Out of bounds targets automatically redirect requests back to the Dashboard page.

---

## 19. State Management Design
To ensure optimal performance and eliminate redundant API calls:

*   **React Context Controllers:** Used for lightweight static states (Active Auth profile, active client WebSocket connection, component themes).
*   **Fetch/Cache Middleware:** API integration patterns use React hooks combined with localized temporary memory caches to manage components data. Query parameters or key indices (like `petId`) invalidates records as required.
*   **Chat State Lifecycles:** Appended messaging chunks are held directly in memory inside Chat context providers, scrolling components instantly on socket message events.

---

## 20. Image Upload & AI Vetting Strategy

```
[Images Uploaded] ---> [Multer Stream Handler] ---> [Save Temp File] ---> [Hit Python AI FastAPI]
                                                                                │
[Live Feed Schema Status Updated] <--- [Compress to WebP] <--- [Review Score] <-+ 
```

1.  **Upload Reception:** Input forms post file sets as multipart payloads. Node Server receives streams using `Multer`.
2.  **AI Microservice Call:** The backend relays details directly (using HTTP rest payloads) to Python AI modules. 
3.  **Breed & Text Fraud classification:** Python modules review the pet image using a pre-trained CNN, and check descriptions using a fraud prediction check, returning output properties: `{ predictedBreed: "Husky", confidence: 0.95, fraudRiskScore: 0.12 }`.
4.  **Optimization:** The image is compressed and converted to WebP formats using the Node project library `sharp`.
5.  **Status categorization:** If image indices match prediction metrics and fraud risks remain below 0.3, the listing status updates to `Live`. Failure flags are moved to `Pending Admin Review`.

---

## 21. WebSocket Real-time Messaging Flow
Client interactions utilize modern WebSocket protocols mediated using `socket.io`.

```
[React Client] ----> Send WebSkt Connection Request ----> [Express Socket Manager]
      │                                                           │
      │ (Emit joinRoom event)                                     │
      v                                                           v
  [Joined Room] <=========== Broadcast confirmation <======= [Listen for Events]
      │
      │ (Sends new message payload)
      ▼
[Socket Emit message] ════> Store Mongoose Db message ════> Broadcast message to recipient
```

1.  **Connection handshake:** Client authenticates with the WebSocket server using its JWT token.
2.  **Target Room joining:** Active communication windows request Room initialization, joining specific channel identifiers (`room_id`).
3.  **Transmission processing:** When a message is entered, the client emits `message_sent` events, which are intercepted by the backend router. The backend writes structural JSON details to the MongoDB message sheet, updates the target chatroom's `lastMessageId`, and broadcasts `message_received` events to the active recipient channel.

---

## 22. Detailed WebSocket Chat and Notification Flow

### Message Delivery Timeline
*   Client A constructs a message payload: `{ text: "Hello", roomId: "X", tempId: "random_uuid" }`.
*   Client A emits `send_message` payload.
*   Backend intercepts the event, performs JWT authentication, saves message to DB, and updates status to `delivered`.
*   Backend emits `new_message` to Client B (if active in room) or triggers dynamic socket notifications to client channel listener dashboards.
*   Client B client reads the message, emitting `mark_read` events to clear read states in the database.

### System Notifications Engine
Notifications (adoption submission, admin approval, user reports status updates) execute off transaction triggers, sending WebSocket payloads directly to online users, using dynamic toast alerts on front grids.

---

## 23. Error Handling Blueprint
A strict uniform error boundary prevents system disclosure and keeps debugging transparent:

*   **Backend Error handling:** All Express routes throw exceptions to a single central error handler middleware.
```js
// Shared Backend API Interface Response Structure
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    status: "error",
    statusCode: status,
    message: err.message || "Internal server error details.",
    errors: err.validationInfo || null
  });
});
```
*   **React Error Boundaries:** Component containers use React Error Boundaries. In case of unexpected rendering errors, a clean error screen is shown instead of crashing the page.

---

## 24. Input Validation Blueprint
*   **Validation Levels:** Built at both client interface (instant input constraints styling) and server endpoint (blocking unsafe data modifications).
*   **Server schemas definition:** Controller target routing maps parameters against standard **Joi** layouts (e.g., validating proper password constraints during registration, coordinates data structure constraints). Invalid payload configurations are blocked immediately, returning 400 structures with validation info logs.

---

## 25. Security Architecture
PawConnect implements enterprise-grade security protocols:

*   **JWT Storage Protection:** Volatile react memory context logic binds session details, while tokens are set securely in client cookies with `HTTPOnly`, `Secure` (SSL/HTTPS only), and `SameSite=Strict` flags.
*   **Security Headers (Helmet):** Express applies package configurations setting Content Security Policy (CSP), blocking clickjacking, and preventing MIME sniffing.
*   **Rate-limiting:** Secure endpoints (like login and password reset) are throttled via `express-rate-limit` (allowing a maximum of 5 requests per minute from a single IP to prevent brute-force attacks).
*   **Database sanitization:** Mongoose schemas sanitize keys to block NoSQL Injection attacks.

---

## 26. Deployment and Infrastructure
The setup runs on Docker Container systems, making configuration transfers transparent.

```
                  +----------------------------------+
                  |      Nginx Reverse Proxy         |
                  +----------------------------------+
                       |                        |
             /api      v                        v   / (Asset / Frontend)
        +--------------------------+      +--------------------------+
        |   Express Server Container|      |  React Frontend Container|
        |   (Node.js / PM2 runtime)|      |  (Compiled via Vite/HTML)|
        +--------------------------+      +--------------------------+
                     |
                     v
        +--------------------------+
        |  FastAPI AI Container    |
        |  (Python / PyTorch env)  |
        +--------------------------+
```

*   **Container Separation:** The ecosystem separates into independent containers defined in `docker-compose.yml`:
    1.  `pawconnect-frontend`: Compiled via Vite and served from optimized Nginx static storage nodes.
    2.  `pawconnect-backend`: Node execution environment using PM2 run scripts.
    3.  `pawconnect-ai`: FastAPI server running PyTorch/TensorFlow modules for breed verification.
*   **Configuration management:** Secret files (`.env`), SSL certificate paths, database credentials, API integration secret values are stored inside secure env files, keeping code repositories 100% clean of sensitive keys.
