# 🚀 Edit Sale & Delete Sale - Deployment Guide

## ✅ Pre-Deployment Checklist

Before deploying your Edit Sale & Delete Sale feature, verify everything:

### **Code Quality:**
- [ ] Run `npm run check` - No TypeScript errors
- [ ] Run `npm run build` - Build completes successfully
- [ ] Run `npm run dev` - Dev server starts
- [ ] Test locally: Edit and delete a sale
- [ ] Browser console: No errors or warnings

### **Database:**
- [ ] Database migrations applied
- [ ] `sales` table exists with all columns
- [ ] `users` table has `mobileNo` column (for ownership check)
- [ ] Backend can connect to database

### **API Endpoints:**
- [ ] Test PUT `/api/sales/:id` in Postman/Thunder Client
- [ ] Test DELETE `/api/sales/:id` in Postman/Thunder Client
- [ ] Both endpoints require valid JWT token
- [ ] Invalid tokens return 401 error

### **Frontend Features:**
- [ ] Edit button appears on all sales
- [ ] Delete button appears on all sales
- [ ] Edit dialog opens/closes properly
- [ ] Delete confirmation appears
- [ ] Toast notifications show correctly
- [ ] Table updates after edit/delete

### **Security:**
- [ ] Users can only edit/delete own sales
- [ ] Invalid tokens are rejected
- [ ] CORS headers configured correctly
- [ ] Input validation working (Zod schemas)

### **Performance:**
- [ ] No memory leaks in React components
- [ ] No infinite re-renders
- [ ] API responses under 1 second
- [ ] UI feels responsive

---

## 📦 Deployment Steps

### **Step 1: Verify All Changes Are Committed**
```bash
git status
# Should show clean working directory
git log --oneline -5
# Should see your recent commits
```

### **Step 2: Build for Production**
```bash
npm run build
# Output:
# > npm run build:server
# > npm run build:client
# ✓ Built successfully
```

### **Step 3: Test Production Build Locally**
```bash
npm run start
# Should start on port 5000
# Test: http://localhost:5173
```

### **Step 4: Verify Environment Variables**
```bash
# Check .env has DATABASE_URL set
cat .env

# On production:
# DATABASE_URL=postgresql://...
# NODE_ENV=production
```

### **Step 5: Deploy Backend (Render/Railway)**
1. Push code to GitHub
2. Go to your Render/Railway dashboard
3. Redeploy service
4. Wait for build to complete
5. Test endpoints with curl/Postman

```bash
# Test backend is responding
curl https://your-backend.onrender.com/api/sales \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Step 6: Deploy Frontend (Netlify/Vercel)**
1. Push code to GitHub
2. Netlify/Vercel automatically triggers build
3. Build completes (5-10 minutes)
4. Test: Visit your app URL

### **Step 7: Post-Deployment Testing**
```bash
# Test in production
1. Go to app.yoursite.com
2. Login with test account
3. Record a sale
4. Click Edit - change payment method
5. Verify changes saved
6. Click Delete - verify deletion
7. Check dashboard updated
```

---

## 🔧 Configuration

### **Backend Configuration (server/routes.ts)**
```typescript
// These endpoints are already configured:
app.put(api.sales.update.path, authenticateToken, ...)
app.delete(api.sales.delete.path, authenticateToken, ...)
```

### **Frontend Configuration (client/src/hooks/use-shop.ts)**
```typescript
// These hooks are ready to use:
export function useUpdateSale() { ... }
export function useDeleteSale() { ... }
```

---

## 🔐 Security Considerations

### **Before Production:**
- [ ] HTTPS enabled (automatic on Render/Netlify)
- [ ] JWT secrets configured on server
- [ ] CORS origin set to your domain
- [ ] Database credentials secured
- [ ] No sensitive data in error messages

### **API Security:**
```typescript
// Authentication is checked:
app.put(api.sales.update.path, authenticateToken, async (req: AuthRequest, res) => {
  // User info is in req.user
  const mobileNo = req.user!.mobileNo;
  // Only allow edit if user owns the sale
})
```

### **Ownership Verification:**
```typescript
// Database checks ownership:
async updateSale(id: number, updates: Partial<InsertSale>, mobileNo?: string) {
  if (mobileNo) {
    const existing = await db.query.sales.findFirst({
      where: (field, { eq }) => eq(field.id, id),
    });
    
    // Deny if mobileNo doesn't match
    if (!existing || existing.mobileNo !== mobileNo) {
      return null;
    }
  }
}
```

---

## 📊 Monitoring After Deployment

### **Check Error Logs:**
```bash
# On Render:
Settings → Logs → Application Logs

# Look for:
- TypeScript errors
- Database connection errors
- API request errors
```

### **Monitor Performance:**
- Page load times
- API response times
- Database query times
- Memory usage

### **Test Critical Flows:**
1. Edit sale → Verify database update
2. Delete sale → Verify removal
3. Dashboard update → Verify refresh
4. Multiple edits → Verify no conflicts

---

## 🔄 Rollback Plan

If something goes wrong:

### **Option 1: Quick Rollback**
```bash
# Revert to previous commit
git revert HEAD
git push

# Redeploy
# Backend: Automatic on Render/Railway
# Frontend: Automatic on Netlify/Vercel
```

### **Option 2: Database Rollback**
If data corruption occurred:
```bash
# Restore from backup (if available)
# Contact your database provider for restore options
```

### **Option 3: Disable Feature**
If edit/delete is causing issues:
```typescript
// Temporarily disable in routes.ts
// Comment out the endpoints
// Redeploy
```

---

## 📈 Performance Optimization

### **Current Optimizations:**
✅ React Query caching
✅ Automatic cache invalidation
✅ Debounced updates
✅ Lazy loading of components

### **Additional Optimizations (Optional):**
- Add database indexes on `sales.id` and `sales.mobileNo`
- Enable gzip compression on server
- Implement pagination for large sale lists
- Cache dashboard stats

---

## 🧪 Testing in Production

### **Smoke Tests:**
```bash
# 1. Edit a sale
curl -X PUT https://api.yoursite.com/api/sales/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "paymentMethod": "ONLINE",
    "paidAmount": "500",
    "pendingAmount": "100"
  }'

# 2. Delete a sale
curl -X DELETE https://api.yoursite.com/api/sales/1 \
  -H "Authorization: Bearer TOKEN"

# Expected response: 200 OK with success message
```

### **User Acceptance Testing:**
1. Have team members test the feature
2. Gather feedback
3. Verify no data loss
4. Check dashboard accuracy

---

## 📞 Support Resources

### **If Deployment Fails:**
1. Check server logs
2. Verify environment variables
3. Check database connection
4. Review recent commits
5. Try rolling back previous version

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| 404 on edit endpoint | Verify routes are registered in server/routes.ts |
| 401 on API call | Check JWT token in localStorage |
| 500 error | Check server logs for database errors |
| UI not updating | Clear browser cache, hard refresh F5+Ctrl |
| Delete doesn't work | Verify DELETE method is correct in hooks |

---

## 🎉 Success Indicators

You know deployment is successful when:

✅ **Functionality:**
- Edit button works and saves changes
- Delete button works and removes sales
- Dashboard updates automatically
- No error messages in console

✅ **Performance:**
- Page loads in < 2 seconds
- Edit/delete completes in < 1 second
- No layout shifts or flashing

✅ **Security:**
- Users can't edit others' sales
- Invalid tokens are rejected
- All API calls use HTTPS

✅ **Reliability:**
- No errors in server logs
- Database connections stable
- All endpoints responding

---

## 📋 Post-Deployment Tasks

### **Day 1:**
- [ ] Monitor error logs
- [ ] Verify all features working
- [ ] Check database performance
- [ ] Test with multiple users

### **Week 1:**
- [ ] Gather user feedback
- [ ] Monitor crash reports
- [ ] Check analytics
- [ ] Review performance metrics

### **Ongoing:**
- [ ] Monitor for errors
- [ ] Keep dependencies updated
- [ ] Backup database regularly
- [ ] Review user feedback

---

## 🚀 Deployment Timeline

| Step | Time | Status |
|------|------|--------|
| Build & Test | 15 min | ✅ |
| Backend Deploy | 10 min | ✅ |
| Frontend Deploy | 5 min | ✅ |
| DNS/Config | 5 min | ✅ |
| Verification | 10 min | ✅ |
| **Total** | **45 min** | ✅ |

---

## 📞 Questions?

Before deploying, ensure:
1. All tests pass locally
2. No TypeScript errors
3. Environment variables set
4. Database connected
5. API endpoints verified

**You're ready to deploy! 🎉**

---

**Last Updated:** February 13, 2026
**Status:** Ready for Production

