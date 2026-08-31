# Module 3 – Quick Start & Testing Guide

## Prerequisites

Ensure you have:
- MongoDB running and connected
- Cloudinary account with API credentials
- Node.js and npm installed
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`

---

## Environment Setup

### Backend (.env)

```env
JWT_SECRET=supersecretpawconnectkey12345!
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

MONGODB_URI=mongodb://localhost:27017/pawconnect
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)

```env
VITE_BACKEND_URL=http://localhost:5000/api
```

---

## Starting the Application

### Terminal 1 - Backend
```bash
cd pawconnect-backend
npm install  # Only first time
npm run dev
```

### Terminal 2 - Frontend
```bash
cd pawconnect-frontend
npm install  # Only first time
npm run dev
```

---

## Testing Workflow

### 1. User Registration & Login

1. Navigate to http://localhost:5173/register
2. Create account: 
   - Name: "Demo User"
   - Email: demo@example.com
   - Password: DemoPassword123
   - Location: New York, NY
   - Phone: 555-1234

3. Log in at http://localhost:5173/login

### 2. Create Pet Listing

1. Navigate to **Create Pet** from navbar
2. Fill in form:
   - **Name:** Buddy
   - **Type:** Dog
   - **Breed:** Golden Retriever
   - **Age:** 2 Years
   - **Gender:** Male
   - **Size:** Large
   - **Vaccination:** Fully
   - **Description:** Friendly and energetic dog loves playing fetch
   - **Location:** New York, NY
   - **Images:** Upload 2-3 dog images (JPG/PNG, max 5MB)

3. Click **Create Listing**
4. Verify success message and redirect to dashboard

### 3. User Dashboard

1. Navigate to **Dashboard**
2. View profile card with stats
3. Check **All Listings** tab - Your pet appears with "Pending" status
4. Note: Listing not visible on Browse yet (awaiting approval)

### 4. Admin Approval Workflow

**Setup Admin Account:**
1. Create new user account or modify existing to ADMIN role in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "ADMIN" } }
)
```

2. Log in as admin
3. Navigate to **Admin Panel**
4. View statistics showing:
   - Total Listings: 1
   - Pending: 1
   - Approved: 0

5. Click **Pending Review** tab
6. Click **Review** button on your listing
7. Review modal opens showing:
   - Pet image
   - Full details
   - Lister information
   - Action buttons

8. Click **Approve** → Modal closes, listing moves to approved
9. Return to admin, click **All Listings** tab
10. Verify listing now shows "Approved"

### 5. Browse & View Details

**As regular user:**
1. Log in as demo user (or new user)
2. Navigate to **Browse**
3. Click **Apply Filters** without changing any (shows all approved)
4. Your approved listing appears in grid
5. Click **View Details** on your pet card

6. Pet Details page shows:
   - Image carousel
   - Full specifications
   - Lister info card
   - Edit/Delete buttons (for owner)
   - "Ready for Adoption" badge

7. Test carousel - click prev/next arrows

### 6. Filter Pets

1. On Browse page
2. Apply filters:
   - **Type:** Dog
   - **Breed:** leave empty
   - **City:** New York
3. Click **Apply Filters**
4. Results update to show only matching pets

5. Try **Reset** button - all filters clear

### 7. Edit Listing

1. On Dashboard or Pet Details
2. Click **Edit**
3. Modify fields:
   - Change name to "Buddy Jr"
   - Update description
   - Add new image (optional)
4. Click **Update Listing**
5. Redirect to dashboard
6. Note: Status changed back to "Pending" for re-review

### 8. Delete Listing

1. On Dashboard, click **Delete** button
2. Confirmation modal appears
3. Click **Delete** to confirm
4. Listing removed from table
5. Verify only shows in "All Listings" count (not active)

### 9. Test Pagination

1. Create multiple pet listings (3-4 more)
2. Approve all as admin
3. On Browse page
4. Should see pagination controls if >9 items
5. Test Next/Previous buttons
6. Test page number buttons

### 10. Admin Stats Dashboard

1. Log in as admin
2. Navigate to **Admin Panel**
3. Verify stat cards show:
   - **Total Listings:** Count of all pets
   - **Awaiting Vetting:** Count pending
   - **Approved Live:** Count approved

4. Create/approve more listings to update counts
5. Verify stats refresh in real-time

---

## Error Testing

### 1. Validation Errors

1. Try to create pet without:
   - Pet name → Error message
   - Images → Error message
   - Location → Error message

2. Try uploading:
   - Video file → File type error
   - File > 5MB → File size error

### 2. Permission Errors

1. Log in as User A
2. Create listing
3. Log in as User B
4. Try to access User A's edit page directly
5. Should see permission error

### 3. Ownership Verification

1. Create listing as User A
2. Open browser dev console
3. Manually change auth token
4. Try to edit listing
5. API should reject with 403 Forbidden

---

## Troubleshooting

### Images Not Uploading
- Check Cloudinary credentials in .env
- Verify folder structure in Cloudinary settings
- Check browser console for multer errors

### Database Connection Issues
- Ensure MongoDB is running: `mongod`
- Check MongoDB connection string in .env
- Verify database name is correct

### API Not Responding
- Ensure backend server is running on port 5000
- Check `VITE_BACKEND_URL` in frontend .env
- Look for CORS errors in browser console

### Listing Not Appearing After Approval
- Clear browser cache
- Refresh page (Ctrl+Shift+R)
- Check MongoDB that status is "Approved"
- Verify API is returning the listing

### Images Not Displaying
- Verify Cloudinary URLs are valid
- Check CloudinaryCORS settings
- Ensure secure_url is being used (not just url)

---

## API Testing with cURL

### Create Pet Listing
```bash
curl -X POST http://localhost:5000/api/pets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Buddy" \
  -F "type=Dog" \
  -F "breed=Golden Retriever" \
  -F "gender=Male" \
  -F "size=Large" \
  -F "location={\"city\":\"NY\"}" \
  -F "images=@/path/to/image.jpg"
```

### Get Approved Listings
```bash
curl http://localhost:5000/api/pets?type=Dog&city=NY
```

### Get User Listings
```bash
curl http://localhost:5000/api/pets/user/listings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin Approve Listing
```bash
curl -X PUT http://localhost:5000/api/admin/pets/PETID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Expected Results Summary

| Feature | Status | Expected |
|---------|--------|----------|
| Create listing | ✓ | Pending status in DB, not on browse |
| View created listing | ✓ | Only owner/admin can see pending |
| Admin approval | ✓ | Status changes to Approved |
| Browse approved | ✓ | Public can see approved listings |
| Pet details | ✓ | Full info + carousel works |
| Edit own listing | ✓ | Status resets to Pending |
| Delete with confirmation | ✓ | Listing removed from DB |
| Image upload/Cloudinary | ✓ | Images stored as URLs |
| Validation errors | ✓ | User-friendly error messages |
| Permission checks | ✓ | 403 on unauthorized access |
| Pagination | ✓ | Shows 9 per page |
| Admin stats | ✓ | Accurate counts |
| Status badges | ✓ | Correct color/text per status |
| Responsive design | ✓ | Works on mobile/tablet |

---

## Success Indicators

✅ All tests pass without errors  
✅ No console errors in browser DevTools  
✅ All images display correctly  
✅ Status changes reflected immediately  
✅ Admin stats update in real-time  
✅ Pagination works smoothly  
✅ API responses match expected format  
✅ Database updates correctly  

**If all above pass, Module 3 integration is complete!**
