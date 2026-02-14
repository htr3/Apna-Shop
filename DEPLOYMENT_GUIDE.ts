/**
 * DEPLOYMENT GUIDE: Shopkeeper Insights
 *
 * This app is a Full-Stack TypeScript application:
 * - Frontend: React (Vite)
 * - Backend: Node.js + Express
 * - Database: PostgreSQL (Supabase)
 *
 * DEPLOYMENT OPTIONS:
 *
 * OPTION 1: FRONTEND ON VERCEL + BACKEND ON RAILWAY/RENDER (RECOMMENDED)
 * OPTION 2: FULL STACK ON RAILWAY/RENDER
 * OPTION 3: DOCKER DEPLOYMENT
 */

// ============================================
// OPTION 1: VERCEL (FRONTEND) + RAILWAY/RENDER (BACKEND) - RECOMMENDED
// ============================================

const OPTION1_FRONTEND_VERCEL = `
STEP 1: Deploy Frontend to Vercel
---------------------------------

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework Preset: Vite
4. Build Command: npm run build:client
5. Output Directory: dist/public
6. NO Environment Variables needed (frontend only)
7. Click Deploy

NOTE: Frontend will be deployed, but API calls will fail until backend is deployed


STEP 2: Deploy Backend to Railway or Render
---------------------------------

A) Using Railway (Recommended - Easier setup):

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose your Shopkeeper-Insights repo
5. Railway will auto-detect Node.js
6. Add Environment Variables:
   - DATABASE_URL (from Supabase)
   - NODE_ENV = production
   - JWT_SECRET (from Supabase)
7. Set start script to: npm run start
8. Deploy

Your backend will be at: https://[project-name]-[random].up.railway.app


B) Using Render:

1. Go to https://render.com
2. Click "New +" and select "Web Service"
3. Connect GitHub repository
4. Name: shopkeeper-insights
5. Runtime: Node
6. Build Command: npm run build
7. Start Command: npm run start
8. Add Environment Variables (same as above)
9. Deploy


STEP 3: Update Frontend API URL
---------------------------------

1. In client/src/lib/queryClient.ts (or similar):
   Change: const API_URL = 'http://localhost:5000'
   To:     const API_URL = 'https://[your-backend-url]'

2. Or set in Vercel Environment Variables at runtime

3. Redeploy frontend to Vercel


STEP 4: Test
-----------
- Visit your Vercel frontend URL
- Login with owner/owner123
- All API calls should work now
`;

const OPTION2_FULL_STACK_SINGLE_PLATFORM = `
OPTION 2: FULL STACK ON RAILWAY OR RENDER
==========================================

USING RAILWAY:

1. Go to https://railway.app
2. Create new project
3. Deploy from GitHub (select your repo)
4. Railway auto-detects Node.js
5. Set up Environment Variables:
   - DATABASE_URL
   - NODE_ENV = production
   - JWT_SECRET
6. Add start script: npm run start
7. Railway assigns you a URL
8. Frontend will be served along with API

Your app will be at: https://[project-name]-[random].up.railway.app
`;

const OPTION3_DOCKER = `
OPTION 3: DOCKER DEPLOYMENT (AWS, Google Cloud, DigitalOcean, etc)
==================================================================

Using the provided Dockerfile:

1. Build Docker image:
   docker build -t shopkeeper-insights .

2. Run locally:
   docker run -p 3000:3000 \\
     -e DATABASE_URL=postgresql://... \\
     -e NODE_ENV=production \\
     shopkeeper-insights

3. Deploy to cloud:
   - AWS ECS
   - Google Cloud Run
   - DigitalOcean App Platform
   - Azure Container Instances
`;

// ============================================
// QUICK DECISION MATRIX
// ============================================

const DECISION = `
Choose based on your needs:

┌─────────────────┬──────────────┬─────────────┬──────────────┐
│ Option          │ Cost         │ Ease        │ Best for     │
├─────────────────┼──────────────┼─────────────┼──────────────┤
│ Vercel+Railway  │ Free tier ok │ Medium      │ Scalable     │
│ Single Platform │ $7-20/month  │ Easy        │ Simple setup │
│ Docker          │ $5-100/month │ Hard        │ Full control │
└─────────────────┴──────────────┴─────────────┴──────────────┘

RECOMMENDATION: Use Option 1 (Vercel Frontend + Railway Backend)
- Free tier for both
- Easy to set up
- Good performance
- Clear separation of concerns
`;

// ============================================
// ENVIRONMENT VARIABLES NEEDED
// ============================================

const ENV_VARS_NEEDED = `
For Backend (Railway/Render):

DATABASE_URL
  From: Supabase Dashboard > Settings > Database > Connection String
  Format: postgresql://user:password@db.supabase.co:5432/postgres

NODE_ENV
  Value: production

JWT_SECRET
  From: Supabase Dashboard > Settings > API > JWT Secret
  Or Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
`;

// ============================================
// AFTER DEPLOYMENT CHECKLIST
// ============================================

const AFTER_DEPLOYMENT = `
✅ AFTER DEPLOYMENT CHECKLIST:

1. Frontend loads at Vercel URL
2. Login page appears
3. Try login with owner/owner123
4. Dashboard loads
5. Create customer - works?
6. Add product - works?
7. Make a sale - works?
8. Check API logs in backend platform (Railway/Render)
9. Check database in Supabase
10. Test OTP login (if WhatsApp configured)
11. Test forgot password
`;

// ============================================
// TROUBLESHOOTING
// ============================================

const TROUBLESHOOTING = `
API calls return 404/error:
  → Check backend URL in frontend code
  → Verify backend is deployed and running
  → Check CORS settings on backend

Database connection fails:
  → Verify DATABASE_URL is correct
  → Check Supabase project is active
  → Ensure IP whitelist allows connections

Build fails:
  → Run npm run check locally
  → Check Node version is 24.x
  → Check all dependencies are installed

Login doesn't work:
  → Check DATABASE_URL is correct
  → Run npm run seed to create default user
  → Check JWT_SECRET is set
`;

export default {
  OPTION1_FRONTEND_VERCEL,
  OPTION2_FULL_STACK_SINGLE_PLATFORM,
  OPTION3_DOCKER,
  DECISION,
  ENV_VARS_NEEDED,
  AFTER_DEPLOYMENT,
  TROUBLESHOOTING
};

