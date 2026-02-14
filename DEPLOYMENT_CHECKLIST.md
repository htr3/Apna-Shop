# 🚀 Deployment Checklist: Supabase + Vercel

## Pre-Deployment (Local)

- [ ] Run `npm run check` - No TypeScript errors
- [ ] Run `npm run build` - Build succeeds
- [ ] Test locally: `npm run dev` works
- [ ] Database migrations run: `npm run db:push`
- [ ] Seeding works: `npm run seed`
- [ ] Login test: `owner` / `owner123` works
- [ ] Create customer test
- [ ] Add product test
- [ ] Make a sale test

## Supabase Setup

- [ ] Create Supabase project at https://supabase.com
- [ ] Wait for project initialization
- [ ] Copy PostgreSQL connection string
- [ ] Test connection string locally: `npm run db:push`
- [ ] Verify tables created in Supabase dashboard
- [ ] Run seed to create default user
- [ ] Check data in Supabase SQL editor

## GitHub Preparation

- [ ] Remove `.env` and `.env.local` from Git history (if added)
- [ ] Commit `.env.example` ✓
- [ ] Commit `.env.local.example` ✓
- [ ] Commit `vercel.json` ✓
- [ ] Commit `.gitignore` ✓
- [ ] Commit `DEPLOYMENT_SUPABASE_VERCEL.md` ✓
- [ ] Commit `package.json` with `db:pull` script ✓
- [ ] Commit all code changes
- [ ] Push to `main` branch

## Vercel Setup

- [ ] Create Vercel account at https://vercel.com
- [ ] Go to https://vercel.com/new
- [ ] Select "Import Git Repository"
- [ ] Choose `Shopkeeper-Insights` repo
- [ ] Framework: Select `Other` (or Vite if available)
- [ ] Build Command: `npm run build` ✓
- [ ] Output Directory: `dist` ✓
- [ ] Install Command: `npm install` ✓

## Vercel Environment Variables

Add these in **Settings → Environment Variables**:

- [ ] `DATABASE_URL` = `postgresql://...@db.supabase.co:5432/postgres`
- [ ] `NODE_ENV` = `production`
- [ ] `JWT_SECRET` = Random 32-char string
- [ ] `WHATSAPP_API_KEY` = (optional, can add later)
- [ ] `VITE_API_URL` = (will update after deployment)

## Deployment

- [ ] Click "Deploy" button
- [ ] Monitor build logs
- [ ] Wait for deployment to complete
- [ ] Copy Vercel domain (e.g., `https://shopkeeper-insights-xyz.vercel.app`)
- [ ] Update `VITE_API_URL` in Vercel with your domain
- [ ] Trigger redeploy from Deployments tab

## Post-Deployment Testing

### Health Checks
- [ ] Visit https://your-domain.vercel.app in browser
- [ ] Page loads without errors
- [ ] Check browser console (F12) - no errors

### API Tests
```bash
# Test login endpoint
curl -X POST https://your-domain.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"owner","password":"owner123"}'

# Test dashboard stats (requires JWT)
curl https://your-domain.vercel.app/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Feature Tests
- [ ] Login with owner credentials
- [ ] View dashboard
- [ ] Create a customer
- [ ] Add a product
- [ ] Make a sale
- [ ] Check if product quantity decreased
- [ ] Add an udhaar (borrowing)
- [ ] Create OTP login request
- [ ] Verify forgot password works

### Performance
- [ ] Page loads in < 3 seconds
- [ ] No 500 errors in Vercel logs
- [ ] Database queries complete in < 1 second

## Monitoring & Maintenance

- [ ] Set up Vercel alerts
- [ ] Monitor Supabase dashboard regularly
- [ ] Check error logs weekly
- [ ] Backup Supabase database (Settings → Backups)
- [ ] Update dependencies monthly: `npm update`

## Troubleshooting

### If Build Fails
1. Check Vercel build logs: **Deployments → [Latest] → Logs**
2. Verify `DATABASE_URL` is set
3. Verify `NODE_ENV=production`
4. Run `npm run build` locally to reproduce

### If Database Connection Fails
1. Test connection string in `.psql`
2. Verify Supabase project is active
3. Check firewall/network rules
4. Ensure `NODE_ENV=production` sets SSL: `ssl: { rejectUnauthorized: false }`

### If OTP Not Working
1. Ensure `WHATSAPP_API_KEY` is configured
2. Check `notificationService.ts` for correct provider
3. Review WhatsApp API logs

### If Frontend Not Loading
1. Check `VITE_API_URL` is correct
2. Verify `npm run build:client` runs locally
3. Check `dist/client/` folder exists after build

## Rollback Plan

If deployment breaks:

1. Go to Vercel Deployments
2. Find last working deployment
3. Click "⋮" → "Redeploy"
4. Wait for redeployment to complete

Or revert code:
```bash
git revert HEAD
git push origin main
# Vercel will auto-redeploy
```

## Success Criteria ✅

- [ ] App loads at `https://your-domain.vercel.app`
- [ ] Login works with `owner` / `owner123`
- [ ] Dashboard shows correct data
- [ ] Can create customers
- [ ] Can add products
- [ ] Can record sales with stock deduction
- [ ] OTP login works
- [ ] Forgot password works
- [ ] All API endpoints respond under 1 second

---

**Deployment Date**: ________________
**Deployed By**: ________________
**Notes**: ________________________

