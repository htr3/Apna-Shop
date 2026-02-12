# Deployment Guide: Shopkeeper Insights (Neon + Render + Netlify)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Netlify (Frontend)                     │
│  - React + Vite (Static SPA)                                 │
│  - Environment: VITE_API_BASE_URL                            │
│  - Points to: Render backend URL                             │
└─────────────────────────────────────────────────────────────┘
                              ↓ API calls
┌─────────────────────────────────────────────────────────────┐
│                     Render (Backend)                          │
│  - Node.js + Express + Drizzle ORM                           │
│  - Environment: DATABASE_URL, JWT_SECRET, NODE_ENV           │
│  - Serves on: HTTPS://<service-name>.render.com             │
└─────────────────────────────────────────────────────────────┘
                              ↓ Queries
┌─────────────────────────────────────────────────────────────┐
│                    Neon PostgreSQL                            │
│  - Managed Postgres database                                 │
│  - Connection pooling with PgBouncer                         │
│  - Automatic backups                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create Neon Database

### 1.1 Sign up / Log in to Neon
- Go to [neon.tech](https://neon.tech)
- Sign up with email or GitHub
- Verify email

### 1.2 Create a new project
1. Click **"New Project"**
2. Name: `shopkeeper-insights`
3. Database: `shopkeeper_insights` (default)
4. Region: Choose closest to your users
5. PostgreSQL Version: 16 (recommended)
6. Click **"Create Project"**

### 1.3 Get connection string
1. Go to **"Connection Strings"** tab
2. Select **"Pooled Connection"** (better for serverless/containers)
3. Copy the connection string, it looks like:
   ```
   postgresql://user:password@ep-xxxxx.neon.tech/shopkeeper_insights?sslmode=require
   ```
4. **Save this** — you'll need it for Render

### 1.4 Create database schema
Two options:

**Option A: Via Drizzle (recommended)**
```bash
# Locally, with DATABASE_URL set:
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/shopkeeper_insights?sslmode=require"
npx drizzle-kit push
```

**Option B: Manually via Neon SQL Editor**
1. In Neon dashboard, go to **"SQL Editor"**
2. Copy-paste your schema from `shared/schema.ts` (converted to raw SQL)
   - Or extract from your local migration files if available

---

## Step 2: Deploy Backend to Render

### 2.1 Sign up / Log in to Render
- Go to [render.com](https://render.com)
- Sign up with email or GitHub
- Verify email

### 2.2 Connect GitHub repository
1. In Render dashboard, click **"New+"** → **"Web Service"**
2. Select **"Connect a repository"**
3. Authorize GitHub and select your repo: `Shopkeeper-Insights`
4. Click **"Connect"**

### 2.3 Configure Web Service
| Field | Value |
|-------|-------|
| **Name** | `shopkeeper-insights-api` |
| **Environment** | `Node` |
| **Region** | Choose your preferred region |
| **Branch** | `main` |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `node -r esbuild-register server/index.ts` |

### 2.4 Set Environment Variables
1. In the service settings, scroll to **"Environment"**
2. Add these variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (Paste your Neon connection string from Step 1.3) |
| `JWT_SECRET` | (Generate: `openssl rand -hex 32`) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `CORS_ORIGIN` | `https://<your-netlify-site>.netlify.app` (set after deploying frontend) |
| `DEFAULT_MOBILE_NO` | (Your shop owner's mobile number, e.g., `9999999999`) |

### 2.5 Deploy
1. Click **"Create Web Service"**
2. Render will automatically deploy from GitHub
3. Watch the deployment logs (should take 2-5 minutes)
4. Once deployed, you'll get a URL like: `https://shopkeeper-insights-api.onrender.com`
5. **Save this URL** — you'll need it for Netlify

### 2.6 Verify Backend
```bash
# Test the backend is running
curl https://shopkeeper-insights-api.onrender.com/api/dashboard/stats
# Should return a JSON response (or 401 if auth required)
```

---

## Step 3: Deploy Frontend to Netlify

### 3.1 Sign up / Log in to Netlify
- Go to [netlify.com](https://netlify.com)
- Sign up with email or GitHub
- Verify email

### 3.2 Connect GitHub repository
1. In Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Authorize GitHub and select your repo: `Shopkeeper-Insights`
3. Click **"Import"**

### 3.3 Configure Build Settings
| Field | Value |
|-------|-------|
| **Base directory** | `.` (root) |
| **Build command** | `npm ci && npm run build` |
| **Publish directory** | `client/dist` |

### 3.4 Set Environment Variables
1. Go to **"Site Settings"** → **"Build & Deploy"** → **"Environment"**
2. Add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://shopkeeper-insights-api.onrender.com` (from Step 2.5) |

### 3.5 Deploy
1. Click **"Deploy"**
2. Netlify will automatically build and deploy
3. Once done, you'll get a URL like: `https://shopkeeper-insights-abc123.netlify.app`
4. **This is your public app URL**

### 3.6 Update CORS_ORIGIN in Render (Optional but Recommended)
1. Go back to Render service settings
2. Update `CORS_ORIGIN` environment variable to your Netlify site URL
3. Redeploy (click "Manual Deploy")

---

## Step 4: Test the Deployment

### 4.1 Access the Frontend
1. Open your Netlify URL in a browser: `https://shopkeeper-insights-abc123.netlify.app`
2. You should see the login page

### 4.2 Test Signup
1. Go to **Signup page**
2. Fill in:
   - **Username**: `testshop`
   - **Password**: `Test@123`
   - **Confirm Password**: `Test@123`
   - **Mobile Number**: `9000000000`
3. Click **"Sign Up"**
4. Check if account is created (you should be redirected to login)

### 4.3 Test Login
1. Enter credentials from signup
2. Click **"Log In"**
3. Should see **Dashboard**

### 4.4 Test Core Features
- Create a customer
- Create a sale
- View dashboard stats
- Check daily summary

### 4.5 Monitor Backend Logs
In Render dashboard, go to your service → **"Logs"** to see real-time server logs

---

## Step 5: Set Up Auto-Deployment

Both Render and Netlify watch your GitHub repository. Any push to `main` branch will trigger automatic deploys.

### To Deploy Changes
```bash
git add .
git commit -m "Update feature"
git push origin main
```

---

## Troubleshooting

### Issue: Build fails on Render
**Solution:**
1. Check Render logs: go to service → **"Logs"**
2. Look for `npm run build` errors
3. Common fixes:
   - Ensure `npm ci` completes (check package-lock.json is committed)
   - Verify TypeScript compiles: `npm run build:server`
   - Check all env vars are set

### Issue: 502 Bad Gateway from Render
**Solution:**
1. Check Render service is running: go to service → **"Events"**
2. Look for crash errors
3. Check `DATABASE_URL` is correct and Neon is accessible
4. Restart the service: **"Manual Deploy"**

### Issue: Frontend can't reach backend (CORS error)
**Solution:**
1. Verify `VITE_API_BASE_URL` is set correctly in Netlify
2. Verify `CORS_ORIGIN` matches your Netlify domain in Render
3. Rebuild frontend: push to GitHub or trigger manual Netlify rebuild

### Issue: Database connection timeout
**Solution:**
1. Check `DATABASE_URL` format is correct
2. Verify Neon project is not paused (Neon pauses free tier after 1 week of inactivity)
3. Test connection locally: `psql <DATABASE_URL>`

---

## Environment Variables Checklist

### Render (Backend)
- [ ] `DATABASE_URL` - Neon connection string
- [ ] `JWT_SECRET` - Random 32-char hex
- [ ] `NODE_ENV` - `production`
- [ ] `PORT` - `5000` (or match Render's expected port)
- [ ] `CORS_ORIGIN` - Your Netlify domain
- [ ] `DEFAULT_MOBILE_NO` - Your shop owner's mobile

### Netlify (Frontend)
- [ ] `VITE_API_BASE_URL` - Your Render service URL

---

## Monitoring & Maintenance

### Weekly
- Check Render logs for errors
- Verify database backups in Neon dashboard
- Monitor CPU/memory usage in Render metrics

### Monthly
- Review user activity in `user_activity_log` table
- Backup database manually if needed (Neon auto-backs up)
- Update dependencies: `npm update && npm audit`

### On-Demand
- Scale Render service if needed (go to Instance Type)
- Upgrade Neon plan if hitting connection limits

---

## Rollback (if needed)

### Render
1. Go to service → **"Deploys"**
2. Click on a previous successful deploy
3. Click **"Redeploy"**

### Netlify
1. Go to site → **"Deploys"**
2. Click on a previous successful deploy
3. Click **"Restore"**

---

## Useful Commands (Local)

```bash
# Test build locally
npm run build

# Test server locally
npm run dev

# Check TypeScript
npx tsc -p server/tsconfig.json --noEmit

# Run DB migrations (if using Drizzle)
npx drizzle-kit push

# Connect to Neon database directly
psql postgresql://user:pass@ep-xxx.neon.tech/shopkeeper_insights?sslmode=require
```

---

## Cost Estimate

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Neon** | 0.5 GB storage | Generous free tier; cheap beyond |
| **Render** | 750 free hours/month | Sleeps after 15 min inactivity; shared CPU |
| **Netlify** | Unlimited | Static hosting is free; perfect for frontend |

**Total: $0-10/month** if traffic is low

---

## Support & Documentation

- **Neon Docs**: https://neon.tech/docs
- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Drizzle ORM**: https://orm.drizzle.team

---

**Date**: February 12, 2026  
**Status**: Ready for deployment

