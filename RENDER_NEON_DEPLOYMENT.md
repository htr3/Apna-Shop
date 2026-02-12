# 🚀 Complete Deployment Guide: Render + Neon PostgreSQL

This guide will deploy your **Shopkeeper-Insights** SaaS app to production with:
- **Backend API** on Render
- **Frontend React App** on Render
- **PostgreSQL Database** on Neon

**Estimated Time:** 30-40 minutes
**Cost:** $0 (completely free!)

---

## 📋 Prerequisites

Before starting, you need:
- ✅ GitHub account
- ✅ Render account
- ✅ Neon account

**Sign up for free:**
- GitHub: https://github.com
- Render: https://render.com
- Neon: https://neon.tech

---

## Part 1: Set Up Neon PostgreSQL Database

### Step 1.1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Click **Sign Up**
3. Choose **Sign up with GitHub** (easier)
4. Authorize Neon
5. Verify your email

### Step 1.2: Create New Project

1. In Neon dashboard, click **New Project**
2. Fill in:
   - **Project name:** `shopkeeper-insights`
   - **Database name:** `shopkeeper_insights` (auto-filled)
   - **Region:** Select closest to your location
   - **PostgreSQL version:** 15 or higher

3. Click **Create Project**

### Step 1.3: Get Connection String

1. After project created, click **Connection String** tab
2. Select **Connection string** (psql format)
3. Copy the entire string:

```
postgresql://user:password@ep-xxx.neon.tech/shopkeeper_insights?sslmode=require
```

4. **SAVE THIS** - You'll need it for Render

### Step 1.4: Save Neon Credentials

Keep these safe:
```
DATABASE_URL: postgresql://user:password@ep-xxx.neon.tech/shopkeeper_insights?sslmode=require
Neon Host: ep-xxx.neon.tech
Database Name: shopkeeper_insights
User: neon_user
Password: (shown in connection string)
```

---

## Part 2: Prepare Your Project

### Step 2.1: Create TypeScript Config for Server

Create `server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "../dist/server",
    "rootDir": "."
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 2.2: Update Server Entry Point

Edit `server/index.ts` to support production:

```typescript
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { seedUsers } from "./db";
import { createServer } from "http";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Register routes
const httpServer = createServer(app);
registerRoutes(httpServer, app);

// Seed database
seedUsers().catch((err) => {
  console.error("Failed to seed database:", err);
  // Continue even if seeding fails
});

// Start server
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});
```

### Step 2.3: Update Database Connection

Edit `server/db.ts`:

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ DATABASE_URL environment variable is required!");
}

console.log("📦 Connecting to database...");

export const pool = new Pool({
  connectionString,
  // Neon-specific settings
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });

export async function seedUsers() {
  try {
    console.log("🌱 Seeding database...");
    
    const existingOwner = await db.query.users.findFirst({
      where: eq(users.username, "owner"),
    });

    if (existingOwner) {
      console.log("✅ Default users already exist");
      return;
    }

    await db.insert(users).values([
      {
        mobileNo: "9999999999",
        username: "owner",
        password: "owner123", // ⚠️ Use bcrypt in production
        email: "owner@shopkeeper.local",
        role: "OWNER",
        isActive: true,
      },
      {
        mobileNo: "9999999998",
        username: "staff",
        password: "staff123", // ⚠️ Use bcrypt in production
        email: "staff@shopkeeper.local",
        role: "STAFF",
        isActive: true,
      },
    ]);

    console.log("✅ Default users seeded successfully");
  } catch (error: any) {
    if (error.code === "23505") {
      console.log("✅ Users already exist, skipping seed");
    } else {
      console.error("❌ Error seeding users:", error);
      throw error;
    }
  }
}
```

### Step 2.4: Create Environment Files

Create `.env.local` (for local development):

```bash
# Local Development
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/shopkeeper_insights
JWT_SECRET=dev-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Create `.env.production.local` (for production - DO NOT COMMIT):

```bash
# Production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/shopkeeper_insights?sslmode=require
JWT_SECRET=your-super-secret-key-generate-this
FRONTEND_URL=https://your-app-name.onrender.com
PORT=3000
```

### Step 2.5: Update Client Environment

Create `client/.env.production`:

```bash
VITE_API_URL=https://your-app-name.onrender.com/api
```

Update `client/src/lib/queryClient.ts` to use API URL:

```typescript
export const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:3000/api";
```

### Step 2.6: Create Render Configuration

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: shopkeeper-insights
    env: node
    region: oregon
    plan: free
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: postgresql://user:password@ep-xxx.neon.tech/shopkeeper_insights?sslmode=require
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://shopkeeper-insights.onrender.com

staticSite:
  name: shopkeeper-client
  buildCommand: cd client && npm run build
  staticPublishPath: client/dist
  routes:
    - path: /api/*
      destination: http://localhost:3000/api
```

---

## Part 3: Push to GitHub

### Step 3.1: Initialize Git Repository

```bash
cd C:\Users\visha\All\project\Shopkeeper-Insights

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Render + Neon deployment"
```

### Step 3.2: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Fill in:
   - **Repository name:** `Shopkeeper-Insights`
   - **Description:** SaaS shop management system
   - **Visibility:** Public or Private (your choice)
3. **DO NOT** initialize with README
4. Click **Create repository**

### Step 3.3: Connect Local to GitHub

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/Shopkeeper-Insights.git

# Rename branch
git branch -M main

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3.4: Verify on GitHub

1. Go to your repository on GitHub
2. Verify all files are there
3. Check that `.env.production.local` is NOT uploaded (should be in .gitignore)

---

## Part 4: Deploy to Render

### Step 4.1: Create Render Account

1. Go to [render.com](https://render.com)
2. Click **Sign up**
3. Choose **Continue with GitHub**
4. Authorize Render
5. Complete signup

### Step 4.2: Create Web Service

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **New +** → **Web Service**
3. Click **Connect repository**
4. Search for and select `Shopkeeper-Insights`
5. Click **Connect**

### Step 4.3: Configure Service

Fill in the configuration form:

| Setting | Value |
|---------|-------|
| **Name** | `shopkeeper-insights` |
| **Environment** | `Node` |
| **Region** | `Oregon` (or nearest to you) |
| **Branch** | `main` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

### Step 4.4: Add Environment Variables

Click **Advanced** → **Add Environment Variable** for each:

**Add These Variables:**

```
NODE_ENV = production

DATABASE_URL = postgresql://user:password@ep-xxx.neon.tech/shopkeeper_insights?sslmode=require

JWT_SECRET = abc123XyZ789qwertyuiopasdfghjklmnbvcxz

FRONTEND_URL = https://shopkeeper-insights.onrender.com
```

⚠️ **For JWT_SECRET:** Generate a strong random string:
- Go to https://randomkeygen.com
- Copy a **CodeIgniter Encryption Keys** value
- Paste into JWT_SECRET field

### Step 4.5: Deploy

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. You'll see build logs in real-time
4. Once done, you get a URL like: `https://shopkeeper-insights.onrender.com`

### Step 4.6: Check Deployment Status

1. Go to your service dashboard
2. Check for these signs of success:
   - ✅ Green "live" indicator
   - ✅ URL is accessible
   - ✅ Logs show "Server running on port 3000"

---

## Part 5: Initialize Database

### Step 5.1: Run Database Seed

After deployment succeeds:

1. In Render dashboard, click **Shell** tab
2. Run this command:

```bash
npm run seed
```

3. You should see:
```
🌱 Seeding database...
✅ Default users seeded successfully
```

### Step 5.2: Verify Database in Neon

1. Go to [neon.tech](https://neon.tech) dashboard
2. Click your project
3. Go to **SQL Editor**
4. Run this query:

```sql
SELECT COUNT(*) as user_count FROM users;
```

You should see: `user_count: 2` (owner + staff)

### Step 5.3: Test API Health

In your browser, visit:

```
https://shopkeeper-insights.onrender.com/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "2026-02-11T10:30:00.000Z"
}
```

---

## Part 6: Test Your App

### Step 6.1: Open Your App

1. Go to: `https://shopkeeper-insights.onrender.com`
2. You should see the login page

### Step 6.2: Test Login

**Default Credentials:**

| Field | Value |
|-------|-------|
| **Mobile No** | `9999999999` |
| **Password** | `owner123` |

Or:

| Field | Value |
|-------|-------|
| **Mobile No** | `9999999998` |
| **Password** | `staff123` |

### Step 6.3: Verify Features

After login, test:
- ✅ Dashboard loads
- ✅ Can add customers
- ✅ Can record sales
- ✅ Can view daily summary
- ✅ Data saves to database

### Step 6.4: Test Multi-Tenancy

1. Create new account with mobile: `9111111111`
2. Add some sales
3. Logout
4. Create new account with mobile: `9222222222`
5. Add different sales
6. Login as first account → Should see only their sales
7. Login as second account → Should see only their sales

✅ **Multi-tenancy is working!**

---

## 🔧 Troubleshooting

### Issue 1: Build Fails with "Cannot find module"

**Error:**
```
npm ERR! Cannot find module '@shared/schema'
```

**Solution:**
Make sure all dependencies are installed:

```bash
npm install
npm run build
git add package-lock.json
git commit -m "Update dependencies"
git push
```

Then trigger rebuild in Render (Manual Deploy → Deploy latest commit)

---

### Issue 2: Database Connection Error

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Verify DATABASE_URL in Render environment variables
2. Make sure it includes `?sslmode=require` at the end
3. Copy the EXACT connection string from Neon
4. Restart Render service

---

### Issue 3: Login Fails with 401

**Error:**
```
401 Unauthorized
```

**Solution:**
1. Make sure you ran `npm run seed` in Render Shell
2. Check that users table has data:
   ```sql
   SELECT * FROM users;
   ```
3. Try default credentials again

---

### Issue 4: App Shows "Cannot GET /"

**Error:**
```
Cannot GET /
```

**Solution:**
1. Frontend might not be building
2. Check build logs in Render
3. Make sure `client/dist` exists after build
4. Verify `start` command includes serving static files

---

### Issue 5: CORS Errors

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
Update `server/index.ts`:

```typescript
app.use(cors({
  origin: [
    "https://shopkeeper-insights.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true,
}));
```

Then:
```bash
git add .
git commit -m "Fix CORS"
git push
```

---

## 📊 Monitoring Your App

### Check Logs

In Render dashboard:
1. Click your service
2. Go to **Logs** tab
3. See real-time server logs

### Monitor Database

In Neon dashboard:
1. Click your project
2. Go **Monitoring** tab
3. See connection count, queries, etc.

### Free Tier Limits

- **Render:** 750 hours/month (plenty for always-on hobby)
- **Neon:** 3 GB storage, 100 hours/month free compute
- **Bandwidth:** 100 GB/month (more than enough)

---

## 🎉 You're Live!

Your app is now deployed! Share this URL with shopkeepers:

```
https://shopkeeper-insights.onrender.com
```

**They can:**
1. Sign up with their mobile number
2. Create customers
3. Record sales
4. View daily summary
5. Track borrowing (Udhaar)

---

## 📝 Maintenance

### Update Your App

```bash
# Make changes locally
git add .
git commit -m "Fix bugs / Add features"
git push

# Render automatically redeploys!
```

### Database Backups

In Neon:
1. Go to **Backups** tab
2. Backups are automatic
3. Can restore if needed

### Monitor Costs

- **Render:** Free tier is $0/month
- **Neon:** Free tier is $0/month
- **Total:** $0/month 🎉

---

## 🚀 Next Steps (Optional)

### Add Custom Domain

1. Get domain from GoDaddy, Namecheap, etc. ($1-5/year)
2. In Render:
   - Go **Settings**
   - **Custom Domain**
   - Add your domain
3. Update DNS records as shown
4. Wait 24 hours for propagation

### Enable HTTPS (Automatic)

Render automatically gives you HTTPS on `onrender.com` domain. If you add custom domain, certificate is auto-provisioned.

### Add Password Hashing

For production, replace plaintext passwords with bcrypt:

```bash
npm install bcrypt
```

Then update your user creation code to hash passwords.

---

## 📞 Support

If you have issues:

1. **Check Render Logs:** Service → Logs
2. **Check Neon Logs:** Project → Monitoring
3. **Check Connection:** Test with psql
4. **Ask in Communities:**
   - Render Discord: https://discord.gg/render
   - Neon Discord: https://discord.gg/neon

---

## ✅ Deployment Checklist

- [ ] Neon account created
- [ ] Neon database created
- [ ] Connection string saved
- [ ] `server/tsconfig.json` created
- [ ] `server/index.ts` updated
- [ ] `server/db.ts` updated
- [ ] `.env.local` created (not committed)
- [ ] `render.yaml` created
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Database seeded
- [ ] App tested with login
- [ ] Multi-tenancy verified

---

**Congratulations! Your SaaS app is live! 🚀**

Share the URL with shopkeepers and start making an impact! 💪

