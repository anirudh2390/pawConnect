# Module 3 – Manage Pet Listings: Implementation Guide

## Overview

Module 3 has been successfully implemented with full CRUD operations for pet listings, admin approval workflows, and a complete user-facing adoption browsing experience.

---

## Backend Implementation

### 1. Pet Controller (`src/controllers/petController.js`)

**Main Functions:**

- **`createPet`** - Creates a new pet listing with status "Pending"
  - Validates required fields
  - Handles image uploads to Cloudinary
  - Returns 201 with pet details
  
- **`getPets`** - Returns only "Approved" pet listings for public browse
  - Supports filtering by type, breed, city, and state
  - Case-insensitive search
  - Populates lister information
  
- **`getPetById`** - Fetches single pet with full details
  - Allows owners and admins to view pending/rejected listings
  - Public users can only view approved listings
  
- **`getUserPets`** - Returns all listings for authenticated user
  - Protected route
  - Shows all statuses for user's own listings
  
- **`updatePet`** - Updates pet listing (owner only)
  - Verifies ownership
  - Resets status to "Pending" for admin re-review (unless Adopted)
  - Handles additional image uploads
  
- **`deletePet`** - Deletes pet listing (owner only)
  - Verifies ownership
  - Note: Requires publicId storage for Cloudinary deletion

### 2. Admin Pet Controller (`src/controllers/adminPetController.js`)

**Main Functions:**

- **`getPendingPets`** - Returns all pending listings for admin review
- **`getAllPetsAdmin`** - Admin view with all listings and status filtering
- **`approvePet`** - Changes status from Pending to Approved
- **`rejectPet`** - Changes status to Rejected (accepts reason)
- **`markAsAdopted`** - Changes status to Adopted
- **`getPetStats`** - Returns dashboard statistics

### 3. Pet Validator (`src/validators/petValidator.js`)

- **`validatePetCreate`** - Joi schema validation for pet creation
- **`validatePetUpdate`** - Joi schema validation for pet updates
- Required fields: name, type, breed, gender, size, location.city
- Optional fields: age, description, medicalHistory, vaccinationStatus

### 4. Routes

**Pet Routes (`src/routes/petRoutes.js`):**
```
GET    /api/pets                    - Get all approved listings
GET    /api/pets/:id                - Get pet details
GET    /api/pets/user/listings      - Get user's listings (protected)
POST   /api/pets                    - Create listing (protected)
PUT    /api/pets/:id                - Update listing (protected)
DELETE /api/pets/:id                - Delete listing (protected)
```

**Admin Routes (`src/routes/adminRoutes.js`):**
```
GET    /api/admin/pets              - Get all listings (admin only)
GET    /api/admin/pets/pending      - Get pending listings (admin only)
GET    /api/admin/pets/stats        - Dashboard stats (admin only)
PUT    /api/admin/pets/:id/approve  - Approve listing (admin only)
PUT    /api/admin/pets/:id/reject   - Reject listing (admin only)
PUT    /api/admin/pets/:id/adopted  - Mark adopted (admin only)
```

---

## Frontend Implementation

### 1. Create Pet Page (`src/pages/CreatePet.jsx`)

**Features:**
- Complete form with all pet fields
- Image upload preview (max 5, 5MB each)
- Real-time validation with field error display
- Nested state management for age and location objects
- Success message with redirect to dashboard
- Responsive Bootstrap layout
- Loading state during submission

**Key Functions:**
- `handleInputChange` - Handles both simple and nested state updates
- `handleImageUpload` - Validates and stores images with previews
- `handleRemoveImage` - Removes images from preview
- `validateForm` - Client-side validation before submission
- `handleSubmit` - Sends FormData to backend

### 2. Browse Page (`src/pages/Browse.jsx`)

**Features:**
- Real-time pet listing display
- Sticky filter sidebar with type, breed, city filters
- Pagination (9 items per page)
- Responsive card grid layout
- Hover effects on pet cards
- Loading and error states
- Filter reset functionality

**API Integration:**
- Fetches approved pets only
- Supports multiple filter parameters

### 3. Pet Details Page (`src/pages/PetDetails.jsx`)

**Features:**
- Image carousel (Bootstrap Carousel)
- Complete pet specifications display
- Lister information card
- Status badge for quick identification
- Edit/Delete buttons for owners
- Adoption request and chat buttons for other users
- Medical history and description sections
- Full lister contact information

**Key Functions:**
- Owner detection for conditional button display
- Image carousel navigation
- Permission-based rendering

### 4. Dashboard Page (`src/pages/Dashboard.jsx`)

**Features:**
- User profile preview card
- Statistics widget (total, approved, pending, adopted)
- Tabbed interface:
  - All Listings
  - Pending (awaiting review)
  - Approved (live)
  - Adopted
- Pet listing table with status badges
- Quick actions (View, Edit, Delete)
- Delete confirmation modal
- Responsive design

**Key Functions:**
- `fetchUserListings` - Loads user's pets
- `handleDeleteClick` - Opens delete confirmation
- `handleConfirmDelete` - Performs deletion with feedback
- Tab-based filtering logic

### 5. Admin Page (`src/pages/Admin.jsx`)

**Features:**
- Dashboard statistics cards
- Two-view interface:
  - Pending Review (pending listings only)
  - All Listings (all statuses)
- Admin pet review table
- Detail modal with:
  - Full pet information with image
  - Lister contact details
  - Description and medical history
  - Action buttons (Approve/Reject/Mark Adopted)
  - Rejection reason text area

**Key Functions:**
- `fetchAdminData` - Parallel API calls for stats, pending, all pets
- `handleApprovePet` - Status approval workflow
- `handleRejectPet` - Status rejection with reason
- `handleMarkAdopted` - Mark pet as adopted
- Real-time list updates after actions

### 6. Edit Pet Page (`src/pages/EditPet.jsx`)

**Features:**
- Pre-populate form with existing pet data
- Display current images separately
- Add new images while keeping existing ones
- Remove individual images
- Same validation as creation
- Status reset to "Pending" on update (except Adopted)
- Ownership verification

**Key Functions:**
- `fetchPetDetails` - Loads pet and verifies ownership
- `handleRemoveExistingImage` - Remove current images
- `handleRemoveNewImage` - Remove new upload previews
- Form update with FormData for mixed file/data submission

---

## Database Schema (Pet Model)

```javascript
{
  listerId: ObjectId,                    // Reference to User
  name: String,                          // Required, unique identifier
  type: Enum ['Dog', 'Cat', 'Other'],   // Required
  breed: String,                         // Required
  aiPredictedBreed: {                    // For future AI feature
    detectedBreed: String,
    confidenceScore: Number
  },
  age: {
    number: Number,
    unit: Enum ['Months', 'Years']
  },
  gender: Enum ['Male', 'Female'],       // Required
  size: Enum ['Small', 'Medium', 'Large'], // Required
  vaccinationStatus: Enum ['Fully', 'Partially', 'None'],
  medicalHistory: String,                // Optional
  description: String,                   // Optional
  imageUrls: [String],                   // Cloudinary URLs only
  location: {
    city: String,                        // Required
    state: String
  },
  status: Enum ['Draft', 'Pending', 'Live', 'Adopted', 'Rejected'],  
  fraudVerificationScore: Number,        // For future fraud detection
  timestamps: true                       // createdAt, updatedAt
}
```

---

## Status Workflow

```
User Creates Listing
    ↓
Status: "Pending" (Hidden from public)
    ↓
Admin Reviews ────→ Approve ────→ Status: "Approved" → Visible on Browse
    │
    └──→ Reject ────→ Status: "Rejected" → Hidden, Owner notified
    
User edits approved listing
    ↓
Status: "Pending" (Back to review)

Admin marks as adopted
    ↓
Status: "Adopted" → Visible but marked as unavailable
```

---

## Image Handling

**Multer Configuration:**
- Max 5 images per request
- 5MB per image limit
- Only image/* MIME types allowed
- Temporary disk storage before Cloudinary upload

**Cloudinary Integration:**
- Folder: `pawconnect/pets`
- Only secure URLs stored in database
- Images deleted from temp storage after upload
- Note: Future enhancement - store publicId for easy deletion

---

## Security Features

1. **Authentication:**
   - JWT token required for create, edit, delete
   - Token auto-injected via axios interceptor

2. **Authorization:**
   - Ownership verification for edit/delete
   - Admin role check for approval operations
   - Status-based access control (pending/rejected hidden from public)

3. **Data Validation:**
   - Joi schemas for both create and update
   - Field-level error responses
   - File type and size validation

4. **Protected Routes:**
   - Frontend route guards with ProtectedRoute component
   - Role-based access (allowedRoles prop)
   - Automatic redirect for unauthorized access

---

## API Response Format

All endpoints follow consistent response structure:

**Success:**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "Operation description",
  "pet": { /* pet data */ },
  "pets": [ /* array of pets */ ],
  "stats": { /* statistics */ }
}
```

**Error:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error description",
  "errors": { /* field-specific errors */ }
}
```

---

## Testing Checklist

- [ ] Create pet listing with images → Verify "Pending" status
- [ ] Browse approved listings → Filter by type, breed, city
- [ ] View pet details → Carousel works, owner info displays
- [ ] User dashboard → Show all listings with status tabs
- [ ] Edit pet listing → Updates and resets to "Pending"
- [ ] Delete pet → Confirmation modal, listing removed
- [ ] Admin approval → Pending listing moved to approved
- [ ] Admin rejection → Listing marked as rejected
- [ ] Mark adopted → Status changes in all views
- [ ] Admin stats → Accurate count display
- [ ] Image upload → Cloudinary integration, URL storage
- [ ] Validation → Field errors display on both pages
- [ ] Permission checks → Unauthorized access prevented

---

## Environment Variables Required

```env
# Backend
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
VITE_BACKEND_URL=http://localhost:5000/api
```

---

## File Structure Summary

```
Backend:
- src/controllers/petController.js ✓
- src/controllers/adminPetController.js ✓
- src/validators/petValidator.js ✓
- src/routes/petRoutes.js ✓ (updated)
- src/routes/adminRoutes.js ✓ (updated)
- src/models/Pet.js (existing, no changes)

Frontend:
- src/pages/CreatePet.jsx ✓
- src/pages/Browse.jsx ✓
- src/pages/PetDetails.jsx ✓
- src/pages/Dashboard.jsx ✓
- src/pages/EditPet.jsx ✓
- src/pages/Admin.jsx ✓
- src/routes/index.jsx ✓ (updated)
```

---

## Key Design Decisions

1. **Status Management:** Default "Pending" ensures no unauthorized listings go live
2. **Image Storage:** Only Cloudinary URLs stored - reduces database size, leverages CDN
3. **Nested State:** Location and age as objects for better data structure
4. **Separated Controllers:** Admin operations in different controller for clarity
5. **Validation Layer:** Both schema and field-level validation prevents bad data
6. **Owner Verification:** Consistent check before allowing edits/deletes
7. **Responsive Design:** Bootstrap grid used throughout for mobile compatibility

---

## Future Enhancements

1. Store Cloudinary publicId in Pet model for easier image deletion
2. Add AI breed detection using uploaded images
3. Implement adoption request workflow
4. Add messaging between users
5. Implement fraud detection scoring
6. Add search analytics
7. Implement review/rating system
8. Add email notifications for status changes

---

## Completed Features Summary

✅ **Create Pet Listing** - Full form with image upload and validation  
✅ **View Listings** - Public browse with filtering and pagination  
✅ **View Pet Details** - Carousel, full info, owner details  
✅ **Edit Listing** - Owner-only updates with image management  
✅ **Delete Listing** - Owner-only with confirmation  
✅ **Status Workflow** - Pending → Approved → Live or Rejected  
✅ **Admin Approval** - Approve, reject, mark adopted  
✅ **User Dashboard** - My listings with status tabs  
✅ **Admin Panel** - Review pending, manage all listings  
✅ **Image Upload** - Cloudinary integration  
✅ **Validation** - Frontend and backend  
✅ **Error Handling** - User-friendly messages  
✅ **Security** - Authorization, ownership verification  
✅ **Responsive UI** - Bootstrap styling  

**Module 3 is complete and ready for integration testing!**
