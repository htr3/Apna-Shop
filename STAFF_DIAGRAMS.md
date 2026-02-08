# Staff User System - Visual Diagrams

## 🎯 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SHOPKEEPER INSIGHTS                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
                        ┌────────────┐
                        │   LOGIN    │
                        └────────────┘
                              │
                ┌─────────────┼─────────────┐
                ↓             ↓             ↓
            OWNER1        STAFF1        STAFF2
         owner/123    staff1/123     staff2/123
                │             │             │
                └─────────────┼─────────────┘
                              ↓
                    ┌──────────────────┐
                    │ DASHBOARD        │
                    │ • Sales Total    │
                    │ • Pending Udhaar │
                    │ • Customer Stats │
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
    ┌────────┐         ┌───────────┐         ┌────────────┐
    │ SALES  │         │ CUSTOMERS │         │ BORROWINGS │
    │ ADD    │         │ MANAGE    │         │ VIEW       │
    │ VIEW   │         │ CREATE    │         │ TRACK      │
    │ LIST   │         │ SEARCH    │         │            │
    └────────┘         └───────────┘         └────────────┘
                              │
                    ┌─────────┴─────────┐
                    ↓                   ↓
                  STAFF            OWNER ONLY
                (Can Use)         ┌──────────────────┐
                                  │ PAYMENT SETTINGS │
                                  │ • UPI Settings   │
                                  │ • Bank Details   │
                                  │ • QR Code        │
                                  │ • Razorpay Keys  │
                                  └──────────────────┘
```

---

## 🔐 Role-Based Access Control (RBAC)

```
┌──────────────────────────────────────────────────────────────┐
│                     ROLE MATRIX                              │
├──────────────────────────────────────────────────────────────┤
│                │  STAFF  │  OWNER  │  MANAGER  │  UNUSED    │
├────────────────┼─────────┼─────────┼───────────┼────────────┤
│ Dashboard      │    ✓    │    ✓    │     ✓     │      ✗     │
│ Sales (Add)    │    ✓    │    ✓    │     ✓     │      ✗     │
│ Sales (View)   │    ✓    │    ✓    │     ✓     │      ✗     │
│ Customers      │    ✓    │    ✓    │     ✓     │      ✗     │
│ Borrowings     │    ✓    │    ✓    │     ✓     │      ✗     │
│ Payments       │    ✗    │    ✓    │     ✗     │      ✗     │
│ Settings       │    ✗    │    ✓    │     ✗     │      ✗     │
│ User Mgmt      │    ✗    │    ✗    │     ✗     │      ✗     │
└────────────────┴─────────┴─────────┴───────────┴────────────┘

✓ = Can Access
✗ = Cannot Access
```

---

## 📱 Staff User Journey

```
STAFF USER OPENS APP
        │
        ↓
   LOGIN PAGE
   ┌─────────────────────┐
   │ Username: staff1    │
   │ Password: ••••••    │
   │ [Sign In]           │
   └─────────────────────┘
        │
        ↓
   AUTHENTICATE
   ├─ Check DB for user
   ├─ Verify password
   ├─ Get role: "STAFF"
   └─ Return: { username, role, userId }
        │
        ↓
   STORE IN BROWSER
   ├─ localStorage.shopOwner = "staff1"
   ├─ localStorage.userRole = "STAFF"
   └─ localStorage.userId = 2
        │
        ↓
   DASHBOARD LOADED
   ├─ Check role: STAFF? ✓
   ├─ Show allowed pages
   └─ Hide admin pages
        │
        ↓
   NAVIGATION MENU
   ┌──────────────────────┐
   │ ☑ Dashboard          │
   │ ☑ Sales              │
   │ ☑ Customers          │
   │ ☑ Borrowings         │
   │ ☐ Payment Settings   │ (hidden)
   │ ┌──────────────────┐ │
   │ │ Sign Out         │ │
   │ └──────────────────┘ │
   └──────────────────────┘
        │
        ↓
   STAFF CLICKS "SALES"
        │
        ↓
   SALES PAGE
   ┌─────────────────────────┐
   │ Sales History           │
   │ [Search...]             │
   │ [+ New Sale]            │
   ├─────────────────────────┤
   │ Date | Paid | Pending   │
   │ ...records...           │
   └─────────────────────────┘
        │
        ↓
   CLICKS "NEW SALE"
        │
        ↓
   ADD SALE FORM
   ┌──────────────────────────┐
   │ Customer (optional)      │
   │ [Search...]              │
   │                          │
   │ Amount Paid (₹)          │
   │ [100            ]        │
   │                          │
   │ Amount Pending (₹)       │
   │ [50             ]        │
   │                          │
   │ Payment Method           │
   │ [CASH ▼]                 │
   │                          │
   │ [Submit]                 │
   └──────────────────────────┘
        │
        ↓
   SUBMIT SALE
   ├─ Send to: POST /api/sales
   ├─ Include: userId from localStorage
   └─ Backend creates record
        │
        ↓
   SUCCESS
   ├─ Show toast: "Sale recorded"
   ├─ Update dashboard
   ├─ Clear form
   └─ Return to Sales list
        │
        ↓
   DASHBOARD NOW SHOWS
   ├─ Today's Sales: +₹150
   ├─ Pending Udhaar: +₹50
   └─ Customer metrics updated
```

---

## 🔐 Login Validation Flow

```
USER SUBMITS LOGIN FORM
        │
        │ { username: "staff1", password: "staff123" }
        ↓
    POST /api/auth/login
        │
        ├─ Database lookup: WHERE username = 'staff1'
        │       │
        │       ├─ User not found? → Error 401
        │       └─ User found ✓
        │
        ├─ Check if active: isActive = true
        │       │
        │       ├─ Inactive? → Error 401
        │       └─ Active ✓
        │
        ├─ Password match? (currently plaintext)
        │       │
        │       ├─ No match? → Error 401
        │       └─ Match ✓
        │
        └─ Return: {
              username: "staff1",
              role: "STAFF",
              userId: 2
            }
        │
        ↓
    FRONTEND RECEIVES
        │
        ├─ localStorage.shopOwner = "staff1"
        ├─ localStorage.userRole = "STAFF"
        ├─ localStorage.userId = 2
        │
        └─ Redirect to: /
        │
        ↓
    ROUTE PROTECTION CHECK
        │
        ├─ Route: / (Dashboard)
        │   └─ Required role: NONE → ALLOW ✓
        │
        └─ Page loads: Dashboard with STAFF view
```

---

## 🛡️ Protected Route Check

```
USER NAVIGATES TO ROUTE
        │
        ├─ Destination: /payment-settings
        │
        └─ Check ProtectedRoute:
            │
            ├─ Step 1: Check if logged in
            │   └─ Is localStorage.shopOwner set? YES ✓
            │
            ├─ Step 2: Check role requirement
            │   └─ Required role: OWNER
            │   └─ User role (from localStorage): STAFF
            │   └─ STAFF !== OWNER? → DENY ✗
            │
            └─ Action: Redirect to /
                    │
                    └─ User sent back to Dashboard
                    └─ Cannot access /payment-settings

---

CONTRAST: OWNER USER
        │
        └─ Destination: /payment-settings
            │
            └─ Check ProtectedRoute:
                │
                ├─ Step 1: Logged in? YES ✓
                ├─ Step 2: Role check?
                │   └─ Required: OWNER
                │   └─ User role: OWNER
                │   └─ OWNER === OWNER? → ALLOW ✓
                │
                └─ Page loads: Payment Settings
```

---

## 🌳 Navigation Tree

```
APP ROOT
│
├─ /login
│  └─ Public page
│
├─ / (Dashboard)
│  ├─ Protected: Any authenticated user
│  └─ Shows:
│     ├─ Today's sales
│     ├─ Month sales
│     ├─ Pending Udhaar
│     └─ Customer metrics
│
├─ /sales
│  ├─ Protected: Any authenticated user
│  └─ Features:
│     ├─ List sales
│     └─ Add new sale
│
├─ /customers
│  ├─ Protected: Any authenticated user
│  └─ Features:
│     ├─ Search customers
│     ├─ View details
│     └─ Add new customer
│
├─ /borrowings
│  ├─ Protected: Any authenticated user
│  └─ Features:
│     ├─ List borrowings
│     ├─ Filter by status
│     └─ View details
│
└─ /payment-settings
   ├─ Protected: OWNER only
   └─ Features:
      ├─ UPI settings
      ├─ Bank details
      ├─ QR code upload
      └─ Razorpay config
```

---

## 📊 Database Schema (Users Table)

```sql
users
├─ id (PRIMARY KEY)
│  └─ Auto-increment integer
│
├─ username (UNIQUE)
│  ├─ owner
│  ├─ staff1
│  └─ staff2
│
├─ password
│  └─ Plaintext (⚠️ HASH IN PRODUCTION)
│
├─ email
│  ├─ owner@shopkeeper.local
│  ├─ staff1@shopkeeper.local
│  └─ staff2@shopkeeper.local
│
├─ role (ENUM)
│  ├─ OWNER
│  ├─ STAFF
│  └─ MANAGER (unused)
│
├─ is_active (BOOLEAN)
│  └─ true (all are active)
│
├─ created_at (TIMESTAMP)
│  └─ Server-set on insert
│
└─ updated_at (TIMESTAMP)
   └─ Server-set on insert
```

---

## 🔄 Data Flow: Add Sale

```
FRONTEND               BACKEND                DATABASE
   │                    │                        │
   │─ New Sale Form ──→ │                        │
   │  ├─ amount         │                        │
   │  ├─ paidAmount     │                        │
   │  ├─ pendingAmount  │                        │
   │  ├─ paymentMethod  │                        │
   │  └─ customerId     │                        │
   │                    │                        │
   │                    │─ POST /api/sales ───→ │
   │                    │  ├─ Validate input    │
   │                    │  ├─ Check user_id     │
   │                    │  │  (from JWT/token)  │
   │                    │  │                    │
   │                    │  └─ INSERT sale ────→ sales table
   │                    │                        │
   │                    │ ← Success + ID ────────┤
   │                    │                        │
   │ ← 201 Response ────│                        │
   │  ├─ id             │                        │
   │  ├─ amount         │                        │
   │  └─ date           │                        │
   │                    │                        │
   ├─ Show toast       │                        │
   ├─ Update queries   │                        │
   ├─ Refresh list     │                        │
   └─ Close form       │                        │
```

---

## 🎓 Key Concepts

### Authentication vs Authorization
```
AUTHENTICATION: "Who are you?"
└─ Login endpoint checks password
└─ Returns user info + role

AUTHORIZATION: "What can you do?"
└─ ProtectedRoute checks role
└─ Hides/allows pages based on role
```

### Frontend vs Backend Security
```
FRONTEND:
├─ Hides UI elements (UX)
├─ Redirects unauthorized routes
└─ Checks localStorage role

BACKEND (Future):
├─ Validates every API request
├─ Checks request contains valid role
└─ Enforces data access rules
```

---

**Ready to use!** 🚀

