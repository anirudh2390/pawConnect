# PawConnect — MongoDB Collection Documentation

All collections are managed through Mongoose 8. The database name is configurable via `MONGO_URI` in `.env`.

---

## Collection: `users`

**Model file:** `src/models/User.js`  
**Purpose:** Stores registered user accounts.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated primary key |
| `name` | String | Full display name (required) |
| `email` | String | Unique email address (required, lowercase) |
| `password` | String | bcrypt-hashed password (required) |
| `phone` | String | Optional contact phone |
| `role` | String (enum) | `USER` (default) or `ADMIN` |
| `bio` | String | Optional profile description |
| `location` | String | Optional city/region |
| `profilePicture.url` | String | Cloudinary image URL |
| `profilePicture.publicId` | String | Cloudinary public ID for deletion |
| `isBanned` | Boolean | Admin-set ban flag (default `false`) |
| `resetPasswordToken` | String | Password reset token (hashed) |
| `resetPasswordExpires` | Date | Token expiry |
| `createdAt` | Date | Mongoose timestamp |
| `updatedAt` | Date | Mongoose timestamp |

**Indexes:** `email` (unique)

---

## Collection: `pets`

**Model file:** `src/models/Pet.js`  
**Purpose:** Pet listings submitted by users.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated primary key |
| `owner` | ObjectId (ref: User) | User who listed the pet |
| `name` | String | Pet's name (required) |
| `type` | String (enum) | `Dog`, `Cat`, `Other` (required) |
| `breed` | String | Breed name (required) |
| `age.number` | Number | Age value |
| `age.unit` | String (enum) | `months` or `years` |
| `gender` | String (enum) | `Male` or `Female` |
| `size` | String (enum) | `Small`, `Medium`, `Large`, `Extra Large` |
| `vaccinationStatus` | String (enum) | `Fully`, `Partially`, `None` |
| `neutered` | Boolean | Whether the pet is neutered |
| `description` | String | Detailed description |
| `location.city` | String | City |
| `location.state` | String | State |
| `imageUrls` | String[] | Array of Cloudinary URLs (max 5) |
| `imagePublicIds` | String[] | Cloudinary public IDs for deletion |
| `status` | String (enum) | `Pending`, `Approved`, `Rejected`, `Adopted` (default `Pending`) |
| `adminNote` | String | Optional admin moderation note |
| `createdAt` | Date | Mongoose timestamp |
| `updatedAt` | Date | Mongoose timestamp |

**Relationships:** `owner` → `users._id`

---

## Collection: `adoptions`

**Model file:** `src/models/Adoption.js`  
**Purpose:** Tracks adoption requests between an adopter and a pet owner.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated primary key |
| `pet` | ObjectId (ref: Pet) | The pet being requested |
| `adopter` | ObjectId (ref: User) | User submitting the request |
| `owner` | ObjectId (ref: User) | Pet owner (denormalized for query efficiency) |
| `status` | String (enum) | `Pending`, `Approved`, `Rejected`, `Cancelled` (default `Pending`) |
| `message` | String | Adopter's message / introduction |
| `housingType` | String | `Apartment`, `House`, `Farm`, etc. |
| `hasYard` | Boolean | Whether the adopter has a yard |
| `otherPets` | Boolean | Whether the adopter has other pets |
| `experience` | String | Adopter's pet care experience |
| `adminNote` | String | Optional owner/admin response note |
| `chatRoomId` | ObjectId (ref: ChatRoom) | Linked chat room (set on approval) |
| `createdAt` | Date | Mongoose timestamp |
| `updatedAt` | Date | Mongoose timestamp |

**Relationships:**  
- `pet` → `pets._id`  
- `adopter` → `users._id`  
- `owner` → `users._id`  
- `chatRoomId` → `chatrooms._id`

**Business rules:**
- One pending request per adopter per pet (enforced at controller level)
- On approval, all other `Pending` requests for the same pet are auto-rejected
- Pet `status` is updated to `Adopted` on approval

---

## Collection: `chatrooms`

**Model file:** `src/models/ChatRoom.js`  
**Purpose:** Private 1-on-1 chat rooms between two users (adopter ↔ owner).

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated primary key |
| `participants` | ObjectId[] (ref: User) | Exactly 2 user IDs |
| `adoption` | ObjectId (ref: Adoption) | The adoption request that opened this chat |
| `lastMessage` | Mixed | Snapshot of the most recent message for listing previews |
| `createdAt` | Date | Mongoose timestamp |
| `updatedAt` | Date | Mongoose timestamp |

**Relationships:**
- `participants[]` → `users._id`
- `adoption` → `adoptions._id`

---

## Collection: `messages`

**Model file:** `src/models/Message.js`  
**Purpose:** Individual chat messages within a chat room.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated primary key |
| `room` | ObjectId (ref: ChatRoom) | The chat room this message belongs to |
| `sender` | ObjectId (ref: User) | User who sent the message |
| `content` | String | Message text (required) |
| `readBy` | ObjectId[] (ref: User) | Users who have read this message |
| `createdAt` | Date | Mongoose timestamp |
| `updatedAt` | Date | Mongoose timestamp |

**Relationships:**
- `room` → `chatrooms._id`
- `sender` → `users._id`

---

## Collection: `reports`

**Model file:** `src/models/Report.js`  
**Purpose:** User-submitted reports about problematic listings or users.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated primary key |
| `reportedBy` | ObjectId (ref: User) | User who submitted the report |
| `targetType` | String (enum) | `Pet` or `User` |
| `targetId` | ObjectId | ID of the reported pet or user |
| `reason` | String (enum) | Reason category (e.g., `Spam`, `Abuse`, `Inappropriate`, `Scam`, `Other`) |
| `description` | String | Detailed description from the reporter |
| `status` | String (enum) | `Pending`, `Resolved`, `Dismissed` (default `Pending`) |
| `resolvedBy` | ObjectId (ref: User) | Admin who resolved the report |
| `resolvedAt` | Date | Resolution timestamp |
| `adminNote` | String | Admin resolution note |
| `createdAt` | Date | Mongoose timestamp |
| `updatedAt` | Date | Mongoose timestamp |

**Relationships:**
- `reportedBy` → `users._id`
- `resolvedBy` → `users._id`

---

## Relationship Overview

```
users ─────┬──< pets (owner)
           ├──< adoptions (adopter)
           ├──< adoptions (owner)
           ├──< chatrooms (participants[])
           ├──< messages (sender)
           └──< reports (reportedBy)

pets ──────┬──< adoptions (pet)
           └── [status updated on adoption approval]

adoptions ─┴──> chatrooms (one adoption may open one chat room)

chatrooms ─┴──< messages (room)
```

---

## Indexes of Note

| Collection | Field | Index Type |
|------------|-------|-----------|
| `users` | `email` | Unique |
| `pets` | `status` | Regular (for moderation queries) |
| `adoptions` | `pet + adopter` | Composite (prevents duplicate requests) |
| `messages` | `room + createdAt` | Composite (for paginated history) |
