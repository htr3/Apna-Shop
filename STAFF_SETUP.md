# Staff User Setup & Permissions

## Overview
Staff members can now log in and add sales/payments. The system uses role-based access control (RBAC) to restrict certain features to the owner only.

## User Roles & Permissions

### Owner (OWNER)
- View Dashboard
- Add Sales
- Manage Customers
- View Borrowings
- **Payment Settings** (exclusive)

### Staff (STAFF)
- View Dashboard
- Add Sales ✓
- Manage Customers
- View Borrowings
- ~~Payment Settings~~ (hidden)

## Default Credentials

When the server starts, it automatically creates these default users:

| Username | Password | Role | Email |
|----------|----------|------|-------|
| `owner` | `owner123` | OWNER | owner@shopkeeper.local |
| `staff1` | `staff123` | STAFF | staff1@shopkeeper.local |
| `staff2` | `staff123` | STAFF | staff2@shopkeeper.local |

> **Note:** In production, use proper password hashing (bcrypt/argon2) and don't hardcode credentials.

## How It Works

### Backend Changes
1. **User Seeding** (`server/db.ts`)
   - `seedUsers()` function runs on server startup
   - Creates default OWNER and STAFF users
   - Idempotent: skips if users already exist

2. **Server Startup** (`server/index.ts`)
   - Calls `seedUsers()` before registering routes
   - Ensures users exist before any requests

### Frontend Changes

1. **Login** (`client/src/pages/Login.tsx`)
   - Already stores `userRole` from login response
   - Works for both OWNER and STAFF

2. **Protected Routes** (`client/src/App.tsx`)
   - `ProtectedRoute` now checks both auth and role
   - Redirects staff to dashboard if they try to access `/payment-settings`
   - Example:
     ```tsx
     <Route path="/payment-settings">
       <ProtectedRoute component={PaymentSettings} requiredRole="OWNER" />
     </Route>
     ```

3. **Navigation** (`client/src/components/Layout.tsx`)
   - Payment Settings only shows in menu for OWNER users
   - Staff see: Dashboard, Sales, Customers, Borrowings (no Settings)

## Testing Staff Access

### Step 1: Start the server
```bash
npm run dev
```

You should see:
```
✓ Default users seeded (owner, staff1, staff2)
```

### Step 2: Log in as Staff
- Go to `/login`
- Username: `staff1`
- Password: `staff123`
- Click "Sign In"

### Step 3: Verify Access
- ✓ Dashboard visible
- ✓ Sales page accessible → can add new sales
- ✓ Customers page accessible
- ✓ Borrowings page accessible
- ✗ Payment Settings **not visible** in menu
- ✗ Visiting `/payment-settings` redirects to Dashboard

### Step 4: Log in as Owner
- Logout (click Sign Out)
- Login as `owner` / `owner123`
- ✓ All pages visible
- ✓ Payment Settings **visible** in menu and accessible

## Key Files Modified

1. **server/db.ts** - Added `seedUsers()` function
2. **server/index.ts** - Call `seedUsers()` on startup
3. **client/src/App.tsx** - Added role-based route protection
4. **client/src/components/Layout.tsx** - Role-based navigation

## Staff Can Add Sales

Staff members can now:
1. Click **Sales** in the menu
2. Click **New Sale** button
3. Fill in:
   - Amount Paid (₹)
   - Amount Pending (₹)
   - Payment Method (CASH / ONLINE / CREDIT)
   - Customer (optional)
4. Click Submit

**Payment Settings** is automatically hidden from staff view.

## Database Seed Behavior

- **First startup:** Creates owner + 2 staff users
- **Subsequent startups:** Checks if owner exists, skips if already seeded
- **No errors:** Gracefully handles existing users (unique constraint)

## Future Enhancements

1. **Admin Panel:** Create staff users from UI (not hardcoded)
2. **Password Reset:** Secure password management
3. **Audit Trail:** Log actions by user (already in schema: `userActivityLog`)
4. **Custom Permissions:** Granular role-based permissions per module
5. **Session Management:** Token-based auth instead of localStorage

## Notes

- Staff cannot create other staff members (permission not granted)
- Logout clears `userRole` and `userId` from localStorage
- Role checking happens on both client and server
- Payment settings are owner-exclusive feature

