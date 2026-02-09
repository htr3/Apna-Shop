add# Product Management Feature - Deployment Guide

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No console errors
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Database migrations ready
- [ ] Backup of current database taken
- [ ] Rollback plan documented
- [ ] Change management approval obtained

### Environment Setup

#### Development Environment
```bash
# Already working - no changes needed
npm run dev
```

#### Staging Environment
```bash
# Build production version
npm run build

# Test in staging
npm start

# Verify all features work
```

#### Production Environment
```bash
# Pull latest code
git pull origin main

# Install dependencies (if any new)
npm install

# Build production bundle
npm run build

# Run database migrations (if using PostgreSQL)
npm run migrate

# Restart services
npm start
```

---

## 📦 Database Migration

### PostgreSQL Migration Steps

#### Step 1: Create Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster queries
CREATE INDEX idx_products_user_id ON products(user_id);

-- Create index on is_active for filtering
CREATE INDEX idx_products_is_active ON products(is_active);
```

#### Step 2: Add Sample Data (Optional)
```sql
-- Insert seed products
INSERT INTO products (user_id, name, price, category, description, is_active)
VALUES
  (1, 'Tea (Cup)', '10', 'Beverages', 'Hot tea', true),
  (1, 'Coffee (Cup)', '20', 'Beverages', 'Black coffee', true),
  (1, 'Samosa', '5', 'Snacks', 'Fried samosa', true),
  (1, 'Biscuits Pack', '30', 'Snacks', 'Cookie biscuits', true),
  (1, 'Milk (250ml)', '15', 'Beverages', 'Fresh milk', true);
```

#### Step 3: Verify Table Creation
```sql
-- Check table exists
\dt products

-- Check columns
\d products

-- Count records
SELECT COUNT(*) FROM products WHERE is_active = true;
```

### SQLite Migration (Development)
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  category TEXT,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 Deployment Steps

### Step 1: Code Deployment

```bash
# Clone/pull latest code
cd /var/www/shopkeeper-insights

# Backup current version
cp -r . ../backups/shopkeeper-insights-backup-$(date +%Y%m%d)

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build production
npm run build
```

### Step 2: Database Deployment

```bash
# Backup database before migration
pg_dump shopkeeper_db > backup-$(date +%Y%m%d-%H%M%S).sql

# Run migrations
npm run migrate
# OR manually execute SQL from section above

# Verify migration
psql shopkeeper_db -c "SELECT COUNT(*) FROM products;"
```

### Step 3: Service Restart

```bash
# Stop current service
systemctl stop shopkeeper-insights

# Start with new code
systemctl start shopkeeper-insights

# Verify service is running
systemctl status shopkeeper-insights

# Check logs
tail -f /var/log/shopkeeper-insights.log
```

### Step 4: Verification

```bash
# Test API endpoints
curl http://localhost:3000/api/products

# Check frontend loads
curl -s http://localhost:3000 | grep "products"

# Run health check
npm run health-check
```

---

## 🔍 Post-Deployment Verification

### Health Checks

- [ ] API endpoint `/api/products` returns 200
- [ ] Dashboard loads without errors
- [ ] Products appear in grid
- [ ] Sales page dropdown populated
- [ ] Can add new product
- [ ] Can create sale with product
- [ ] Database queries perform well (< 100ms)
- [ ] No console errors in browser
- [ ] Mobile interface responsive
- [ ] Error handling works

### Smoke Tests

```bash
# Test product creation
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":"10","category":"Test"}'

# Test product fetch
curl http://localhost:3000/api/products

# Expected: 200 OK with product data
```

### Log Analysis

```bash
# Check for errors
grep "ERROR" /var/log/shopkeeper-insights.log

# Check for warnings
grep "WARN" /var/log/shopkeeper-insights.log

# Check response times
grep "Response time:" /var/log/shopkeeper-insights.log | tail -20
```

---

## 📊 Monitoring

### Key Metrics to Monitor

1. **API Response Times**
   - `/api/products` - GET should be < 100ms
   - `/api/products` - POST should be < 500ms

2. **Database Performance**
   - Query time for product list < 50ms
   - No slow queries in logs

3. **Error Rates**
   - 0 errors in product operations
   - No 500 errors
   - No unhandled exceptions

4. **User Activity**
   - Number of products added per day
   - Popular products in sales
   - Usage patterns

### Monitoring Commands

```bash
# Real-time logs
tail -f /var/log/shopkeeper-insights.log | grep -i product

# Error count
grep -c "ERROR" /var/log/shopkeeper-insights.log

# Performance metrics
grep "Response time:" /var/log/shopkeeper-insights.log | awk '{sum+=$NF; count++} END {print "Avg:", sum/count}'
```

---

## 🔄 Rollback Plan

### If Issues Occur

#### Rollback Step 1: Revert Code
```bash
# Stop service
systemctl stop shopkeeper-insights

# Restore backup
rm -rf /var/www/shopkeeper-insights
cp -r /var/www/backups/shopkeeper-insights-backup-YYYYMMDD \
      /var/www/shopkeeper-insights

# Start service
systemctl start shopkeeper-insights
```

#### Rollback Step 2: Revert Database
```bash
# Only if schema changes caused issues
# Restore from backup
psql shopkeeper_db < backup-YYYYMMDD-HHMMSS.sql

# Verify data integrity
SELECT COUNT(*) FROM products;
```

#### Rollback Step 3: Verification
```bash
# Test old version works
curl http://localhost:3000/api/products

# Check application stability
systemctl status shopkeeper-insights

# Monitor logs
tail -f /var/log/shopkeeper-insights.log
```

---

## 📋 Deployment Checklist

### Before Deployment
- [ ] All code committed and pushed
- [ ] All tests passing locally
- [ ] Code review approved
- [ ] Staging tests completed
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Downtime communicated (if any)
- [ ] All team members notified

### During Deployment
- [ ] Pull latest code
- [ ] Run database migrations
- [ ] Build production bundle
- [ ] Restart services
- [ ] Run smoke tests
- [ ] Monitor logs for errors
- [ ] Test critical features
- [ ] Verify all APIs responding

### After Deployment
- [ ] All health checks passed
- [ ] No errors in logs
- [ ] Performance metrics normal
- [ ] User-facing features working
- [ ] Mobile version tested
- [ ] Database integrity verified
- [ ] Monitoring setup confirmed
- [ ] Team notified of success

---

## 📞 Support & Troubleshooting

### Common Issues

#### Issue: Table Not Found
```
Error: relation "products" does not exist
```
**Solution:**
1. Run database migration (see Database Migration section)
2. Verify table creation: `SELECT COUNT(*) FROM products;`
3. Restart application

#### Issue: API Returns 500 Error
```
POST /api/products returned 500
```
**Solution:**
1. Check server logs: `tail -f /var/log/shopkeeper-insights.log`
2. Verify database connection
3. Check database has products table
4. Verify environment variables set

#### Issue: Products Dropdown Empty
```
Sales page product dropdown shows no options
```
**Solution:**
1. Verify products table has data
2. Check `is_active = true` for products
3. Refresh page
4. Clear browser cache
5. Check API: `curl http://localhost:3000/api/products`

#### Issue: Database Connection Failed
```
Error: Cannot connect to database
```
**Solution:**
1. Check DATABASE_URL environment variable
2. Verify PostgreSQL service running: `systemctl status postgresql`
3. Check database credentials
4. Test connection: `psql -U user -d shopkeeper_db -c "SELECT 1"`

---

## 📊 Performance Optimization

### Before Deployment
```sql
-- Create indexes for faster queries
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Analyze table
ANALYZE products;
```

### After Deployment
```sql
-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM products WHERE is_active = true;

-- Check index usage
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename = 'products';
```

---

## 🔐 Security Checklist

- [ ] Database credentials not in code
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] SQL injection prevention (ORM in use)
- [ ] XSS prevention (React escaping enabled)
- [ ] CSRF tokens if applicable
- [ ] SSL/HTTPS configured
- [ ] Database backups encrypted
- [ ] Access logs reviewed

---

## 📈 Post-Deployment Monitoring (First 24 Hours)

### Hour 1
- [ ] Check error logs every 5 minutes
- [ ] Monitor database connections
- [ ] Verify API response times
- [ ] Check user reports

### Hour 2-6
- [ ] Monitor performance metrics
- [ ] Check error rate trends
- [ ] Verify all features working
- [ ] Monitor database size

### Hour 6-24
- [ ] Continue monitoring
- [ ] Check peak usage patterns
- [ ] Analyze logs for issues
- [ ] Performance regression testing

### Metrics to Track
- API response times
- Error rates
- Database query times
- User activity
- System resource usage (CPU, RAM, Disk)

---

## 🎓 Team Communication

### Pre-Deployment Notification
```
Subject: Product Management Feature Deployment - [Date/Time]

Dear Team,

We are deploying the new Product Management Feature on [Date] at [Time].

Changes:
- New Products table in database
- Product management on Dashboard
- Product dropdown in Sales form
- "Other Product" option for unlisted items

Expected downtime: [None/X minutes]
Rollback plan: Available

If you have questions, contact: [Name/Email]

Thank you,
Development Team
```

### Post-Deployment Notification
```
Subject: Product Management Feature Successfully Deployed

Dear Team,

The Product Management Feature has been successfully deployed to production.

Features now available:
✅ Add products from Dashboard
✅ View products in grid
✅ Select products in Sales form
✅ Use "Other Product" for unlisted items

All systems are running normally.

For documentation, see:
- PRODUCT_QUICK_START.md
- PRODUCT_FAQ.md

Thank you,
Development Team
```

---

## 📚 Documentation References

- `PRODUCT_FEATURE_IMPLEMENTATION.md` - Technical guide
- `PRODUCT_QUICK_START.md` - User guide
- `PRODUCT_FAQ.md` - FAQs
- `PRODUCT_TESTING_GUIDE.md` - Testing procedures
- `PRODUCT_ARCHITECTURE_DIAGRAMS.md` - System design
- `PRODUCT_CHANGELOG.md` - Change log

---

## ✅ Final Verification

```bash
#!/bin/bash

echo "Verifying Product Management Feature Deployment..."

# Check service running
if systemctl is-active --quiet shopkeeper-insights; then
  echo "✅ Service running"
else
  echo "❌ Service not running"
  exit 1
fi

# Check API endpoint
if curl -s http://localhost:3000/api/products | grep -q "id"; then
  echo "✅ API endpoint working"
else
  echo "❌ API endpoint not responding"
  exit 1
fi

# Check database
if psql shopkeeper_db -c "SELECT 1 FROM products LIMIT 1" 2>/dev/null; then
  echo "✅ Database connected"
else
  echo "❌ Database connection failed"
  exit 1
fi

# Check logs for errors
if grep -c "ERROR" /var/log/shopkeeper-insights.log > /dev/null; then
  echo "⚠️  Review error logs"
else
  echo "✅ No critical errors in logs"
fi

echo ""
echo "✅ Deployment verification complete!"
```

---

**Deployment Guide Version:** 1.0  
**Last Updated:** February 8, 2026  
**Status:** Ready for Deployment

