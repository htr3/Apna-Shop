# Deployment Guide: Supabase + Vercel

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Enter project name: `shopkeeper-insights`
4. Choose region close to your users
5. Wait for project to initialize

### 1.2 Get Connection String
1. In Supabase dashboard, go to **Settings → Database**
2. Copy the **Connection string** (PostgreSQL URI)
3. Save it safely (we'll use it in Vercel)

### 1.3 Run Migrations
```bash
# In your local project directory
export DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres"
npm run db:push
npm run seed
```

---

## Step 2: GitHub Setup

### 2.1 Push to GitHub
```bash
git add .
git commit -m "Ready for Supabase + Vercel deployment"
git push origin main
```

Make sure these files are committed:
- `.env.example` (NO secrets here)
- `vercel.json`
- `package.json` (with db:pull script)
- `.gitignore` (excludes .env)

---

## Step 3: Vercel Deployment

### 3.1 Connect Repository
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `Shopkeeper-Insights` repo
4. Click "Import"

### 3.2 Configure Environment Variables
In Vercel dashboard, go to **Settings → Environment Variables**

Add these variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://user:password@db.supabase.co:5432/postgres` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |
| `WHATSAPP_API_KEY` | Your WhatsApp API key (or leave blank for now) |
| `VITE_API_URL` | Will be auto-filled after first deployment |

### 3.3 Configure Build Settings
- **Framework Preset**: `Other`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.4 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Copy your Vercel domain (e.g., `https://shopkeeper-insights-7k2x.vercel.app`)

### 3.5 Update VITE_API_URL
1. Go back to Vercel **Settings → Environment Variables**
2. Update `VITE_API_URL` = your Vercel domain
3. Go to **Deployments** and click "Redeploy" on latest deployment

---

## Step 4: Post-Deployment Testing

### 4.1 Test Database Connection
```bash
curl https://your-vercel-domain.vercel.app/api/dashboard/stats \
  -H "Authorization: Bearer test-token"
```

### 4.2 Test Login
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"owner","password":"owner123"}'
```

### 4.3 Test in Browser
1. Open https://your-vercel-domain.vercel.app
2. Login with: `owner` / `owner123`
3. Create a customer, add a sale, etc.

---

## Step 5: CI/CD (Automatic Deployments)

Vercel automatically deploys on every push to `main` branch.

To disable automatic deployments:
1. Go to Vercel **Settings → Git**
2. Uncheck "Deploy on every push"
3. Manually trigger from "Deployments" tab

---

## Troubleshooting

### Build Fails: "DATABASE_URL not set"
**Solution**: Ensure `DATABASE_URL` is set in Vercel Environment Variables

### Database Connection Error: "ECONNREFUSED"
**Solution**: 
- Check Supabase connection string is correct
- Ensure Supabase project is active
- Check firewall rules allow Vercel IP

### OTP WhatsApp Not Sending
**Solution**:
- Add `WHATSAPP_API_KEY` to Vercel Environment Variables
- Or configure in `notificationService.ts` with actual provider

### Static Files Not Loading
**Solution**:
- Rebuild with `npm run build:client`
- Check `dist/` folder has `client/` subdirectory

---

## Monitoring & Logging

### Vercel Logs
```bash
vercel logs --follow
```

### Database Monitoring
- Supabase dashboard shows query counts and storage usage
- Check **Database → Logs** for SQL errors

---

## Environment Variables Checklist

- [ ] `DATABASE_URL` = Supabase connection string
- [ ] `NODE_ENV` = `production`
- [ ] `JWT_SECRET` = Random 32-char string
- [ ] `WHATSAPP_API_KEY` = (optional)
- [ ] `VITE_API_URL` = Vercel domain

---

## Scaling & Performance

- **Supabase**: Auto-scaling PostgreSQL, max 5 concurrent connections (free tier)
- **Vercel**: Serverless functions scale automatically
- **Recommend**: Add Redis cache for OTP storage (upgrade from in-memory)

---

## Next Steps

1. Add custom domain to Vercel
2. Set up SSL/TLS (automatic with Vercel)
3. Configure CI/CD with GitHub Actions for automated testing
4. Add monitoring with Sentry or LogRocket
5. Migrate OTP to Redis for persistence

