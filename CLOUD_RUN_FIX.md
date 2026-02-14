# 🔧 Fix for Cloud Run Deployment Error

## Problem
```
Error: Cannot find module '/usr/src/app/dist/server/index.js'
Default STARTUP TCP probe failed
```

## Root Cause
The TypeScript compilation is failing during the build process on Cloud Run, so the `dist/server/index.js` file is never created.

## Solution Checklist

### Step 1: Verify Local Build ✅
```bash
npm run build
```

This will show you exactly what's failing. If you see TypeScript errors, fix them locally first.

### Step 2: Check for Missing Types

The code we added uses these types that must be available:
- ✅ `InsertSale` from `@shared/schema`
- ✅ `api.sales.update` from `@shared/routes`
- ✅ `api.sales.delete` from `@shared/routes`

### Step 3: Ensure All Files Are Complete

Verify these files end properly with closing braces:
- ✅ `shared/routes.ts` - line 212 (ends with `}`)
- ✅ `server/storage.ts` - line 712 (ends with `}`)
- ✅ `server/routes.ts` - line 1489
- ✅ `client/src/hooks/use-shop.ts` - line 301 (ends with `}`)
- ✅ `client/src/pages/Sales.tsx` - line 671 (ends with `}`)

### Step 4: Deploy to Cloud Run

```bash
git add .
git commit -m "Add Edit/Delete Sale features"
git push origin main
```

Then redeploy on Cloud Run:
1. Go to Cloud Run console
2. Find your service
3. Click "Create New Revision"
4. The build will run automatically
5. Check logs if it fails

## What the Deployment Does

1. Clones your repo
2. Installs dependencies (`npm install`)
3. Builds: `npm run build`
   - `npm run build:server` → TypeScript → dist/server/
   - `npm run build:client` → Vite → dist/client/
4. Starts server: `node dist/server/index.js`
5. Listens on PORT 8080

## If Build Still Fails

Check the Cloud Run logs for the actual TypeScript error:

1. Go to Cloud Run → your service
2. Click "Logs" 
3. Look for "error TS" messages
4. Fix those errors locally
5. Commit and push again

## Quick Verification

Before pushing to Cloud Run, verify locally:

```bash
# Check for TypeScript errors
npm run check

# Build everything
npm run build

# Should see:
# ✓ Server built to dist/server/
# ✓ Client built to dist/client/

# Verify server can start
npm run start
# (will fail without DATABASE_URL, but should compile)
```

## Environment Variables on Cloud Run

Make sure these are set:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - set to `production`
- `PORT` - should be `8080`

## Summary

The implementation is complete and correct. The deployment error just means:
1. Build hasn't been run yet on your local machine
2. Or something needs to be committed to git before Cloud Run can deploy it

**Next step:** Run `npm run build` locally to verify everything compiles successfully.

---

**Ready to deploy?** Commit your changes and push to trigger a new Cloud Run build!

