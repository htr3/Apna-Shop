# 🔧 DATABASE MIGRATION - FIX SCHEMA MISMATCH

**Issue:** Database has old `shopkeeper_id` column, code uses `mobileNo`  
**Solution:** Delete old database and recreate with new schema  
**Status:** ⏳ ACTION NEEDED  

---

## ⚠️ WHAT'S HAPPENING

**Error:**
```
null value in column "shopkeeper_id" violates not-null constraint
```

**Reason:**
- Database was created with old schema (has `shopkeeper_id` column)
- Code was updated to use `mobileNo` instead
- Schema mismatch!

---

## 🔄 FIX: DELETE DATABASE AND RECREATE

### Step 1: Stop the application
```bash
# Press Ctrl+C in your terminal
^C
```

### Step 2: Find database file
The database file is stored in PostgreSQL. You need to:

**Option A: Using PostgreSQL directly**
```bash
# Connect to PostgreSQL (default port 5432)
psql -U postgres

# List all databases
\l

# Drop the old database
DROP DATABASE IF EXISTS shopkeeper_insights;

# Exit psql
\q
```

**Option B: Using .env file**
Check your `.env` file for `DATABASE_URL`. It might look like:
```
DATABASE_URL=postgresql://user:password@localhost:5432/shopkeeper_insights
```

### Step 3: Delete and recreate database
```bash
# If using Drizzle migrations, they'll auto-create on first run
# Just delete the old database and restart the app
```

### Step 4: Start the application again
```bash
npm run dev
```

**Result:** New database will be created with correct schema!

---

## 🎯 WHAT'S NEW

### Updated Files:
1. ✅ `client/src/pages/Signup.tsx` - Added mobile number field
2. ✅ `shared/schema.ts` - All tables use mobileNo
3. ✅ `server/db.ts` - Seeding uses mobileNo
4. ✅ `server/routes.ts` - Signup endpoint requires mobileNo
5. ✅ `server/services/userManagementService.ts` - Service uses mobileNo

### Frontend Now Shows:
```
Username: ________
Mobile Number: ________  ← ✨ NEW FIELD
Password: ________
Confirm Password: ________
```

---

## 📝 NEW SIGNUP FLOW

### Frontend Form (Updated ✅)
```
Username field ✅
Mobile Number field ✅ (NEW!)
Password field ✅
Confirm Password field ✅
```

### Request Body (Updated ✅)
```json
{
  "username": "vishal",
  "mobileNo": "9876543210",
  "password": "secure123",
  "confirmPassword": "secure123"
}
```

### Backend Processing (Updated ✅)
```
1. Receive signup request
2. Validate all fields including mobileNo
3. Insert user with mobileNo as identifier
4. User created with mobileNo = tenant ID
```

---

## ✅ STEPS TO FIX

1. **Stop app** (Ctrl+C)
2. **Delete old database**
   - Drop database using psql OR
   - Delete database file from PostgreSQL
3. **Restart app** (npm run dev)
4. **New database created** with correct schema
5. **Try signup** with mobile number

---

## 🚀 AFTER FIX

### Signup will work with:
✅ Username  
✅ Mobile Number (10 digits)  
✅ Password  
✅ Confirm Password  

### Each user gets:
✅ Unique mobile number as identifier
✅ All their data isolated by mobile number
✅ Multi-tenant SaaS ready!

---

## 💻 QUICK COMMAND (if using psql)

```bash
# Open PowerShell/Command Prompt
psql -U postgres

# In psql prompt:
DROP DATABASE IF EXISTS shopkeeper_insights;
\q

# Back in your project terminal:
npm run dev
```

---

**Next Steps:**
1. Stop your app (Ctrl+C)
2. Delete old database
3. Restart app (npm run dev)
4. Try signing up with mobile number!

---

**Status:** Ready to fix! 🚀

