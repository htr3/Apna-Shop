# Quick Start: Staff Login & Sales

## 🚀 Step-by-Step Guide

### 1. Start the Server
```bash
npm run dev
```

**Expected output:**
```
✓ Default users seeded (owner, staff1, staff2)
serving on port 5000
```

### 2. Open the App
Go to: **http://localhost:5000**

You'll be redirected to **Login** page.

---

## 👤 Logins Available

### Option A: Login as Staff (Full Access to Sales)
```
Username: staff1
Password: staff123
```

**Access:**
- Dashboard ✓
- Sales (Add/View) ✓
- Customers ✓
- Borrowings ✓
- Payment Settings ✗ (hidden)

### Option B: Login as Owner (Full Admin)
```
Username: owner
Password: owner123
```

**Access:**
- Dashboard ✓
- Sales ✓
- Customers ✓
- Borrowings ✓
- Payment Settings ✓ (admin only)

---

## 🛒 Add a Sale as Staff

### Navigate to Sales
1. Click **Sales** in left menu
2. Click **New Sale** button (top right)

### Fill in the Form
- **Customer** (Optional): Search by name or phone
- **Amount Paid** (₹): e.g., `100`
- **Amount Pending** (₹): e.g., `200` (for credit sale)
- **Payment Method**: CASH / ONLINE / CREDIT
- Click **Submit**

### Result
- Sale recorded ✓
- Dashboard updated (Pending Udhaar shows the ₹200)
- Customer metrics updated (if selected)

---

## 📊 Dashboard Shows Updated Metrics

After adding a sale, go back to **Dashboard**:
- **Today's Sales**: ₹300
- **Pending Udhaar**: ₹200 (from pending amount)
- **Trustable/Risky Customers**: Updated counts

---

## 🔐 Security Features

✓ Staff cannot see Payment Settings
✓ Staff cannot modify settings (route protected)
✓ Logout clears user session
✓ Role checked on both frontend & backend

---

## 🐛 If It Doesn't Work

1. **Users not seeded?**
   - Check server console: Look for `✓ Default users seeded`
   - If using DATABASE_URL, ensure DB is running

2. **Can't add sales?**
   - Refresh browser (F5)
   - Check browser console for errors
   - Ensure amount fields have valid numbers

3. **Payment Settings still visible?**
   - Logout and login again
   - Clear localStorage: `localStorage.clear()` in browser console

---

## 📝 Notes

- Default users created on **every server startup**
- In production, use environment variables for credentials
- Database tracks all sales in `sales` table
- Staff role: limited to frontend, backend still validates

---

**Next:** Try adding a customer first, then create a sale linked to them!

