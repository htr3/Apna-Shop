# Product Management Feature - Testing Guide

## 🧪 Manual Testing Checklist

### Pre-Testing Setup
- [ ] Server running (`npm run dev` or similar)
- [ ] Database connected (or using in-memory storage)
- [ ] Browser DevTools open (for console errors)
- [ ] Test user logged in

---

## ✅ Test Cases

### Test Suite 1: Product Creation

#### TC-1.1: Add Product with All Fields
**Steps:**
1. Navigate to Dashboard
2. Scroll to "Products" section
3. Click "Add Product" button
4. Fill all fields:
   - Name: "Chai Tea"
   - Price: "15"
   - Category: "Beverages"
   - Description: "Traditional Indian tea"
5. Click "Add Product"

**Expected Results:**
- [ ] Dialog closes
- [ ] Success toast appears
- [ ] Product appears in grid immediately
- [ ] Grid shows: "Chai Tea - ₹15.00"
- [ ] Category visible: "Beverages"
- [ ] Description visible: "Traditional Indian tea"

#### TC-1.2: Add Product with Minimum Fields
**Steps:**
1. Navigate to Dashboard
2. Click "Add Product"
3. Fill required fields only:
   - Name: "Water"
   - Price: "5"
4. Leave Category and Description empty
5. Click "Add Product"

**Expected Results:**
- [ ] Product created successfully
- [ ] Toast confirms creation
- [ ] Product appears in grid
- [ ] No error messages

#### TC-1.3: Validation - Empty Product Name
**Steps:**
1. Open "Add Product" dialog
2. Leave Name field empty
3. Fill Price: "10"
4. Click "Add Product"

**Expected Results:**
- [ ] Error message appears
- [ ] Form does not submit
- [ ] Dialog remains open
- [ ] Error text: "Product Name is required"

#### TC-1.4: Validation - Invalid Price
**Steps:**
1. Open "Add Product" dialog
2. Name: "Tea"
3. Price: "-10" (negative)
4. Click "Add Product"

**Expected Results:**
- [ ] Price validation error
- [ ] Form does not submit
- [ ] Toast shows error message
- [ ] OR: Price field shows validation error

#### TC-1.5: Validation - Price with 3+ Decimals
**Steps:**
1. Open "Add Product" dialog
2. Name: "Coffee"
3. Price: "10.999"
4. Click "Add Product"

**Expected Results:**
- [ ] Either accepts and rounds to 2 decimals
- [ ] OR shows validation error
- [ ] No data corruption

#### TC-1.6: Special Characters in Product Name
**Steps:**
1. Open "Add Product" dialog
2. Name: "Tea & Coffee - Special!"
3. Price: "20"
4. Click "Add Product"

**Expected Results:**
- [ ] Product created successfully
- [ ] Special characters preserved in display
- [ ] No encoding issues

#### TC-1.7: Long Product Name (100+ chars)
**Steps:**
1. Open "Add Product" dialog
2. Name: "This is a very long product name that exceeds 100 characters and we need to test how the system handles it in the UI"
3. Price: "10"
4. Click "Add Product"

**Expected Results:**
- [ ] Product created
- [ ] Long name truncated or wrapped in grid
- [ ] No UI layout breaks

---

### Test Suite 2: Product Grid Display

#### TC-2.1: Grid Shows All Products
**Steps:**
1. Go to Dashboard
2. Verify Products section

**Expected Results:**
- [ ] All active products displayed
- [ ] Seed products visible:
  - [ ] Tea (Cup) - ₹10
  - [ ] Coffee (Cup) - ₹20
  - [ ] Samosa - ₹5
  - [ ] Biscuits Pack - ₹30
  - [ ] Milk (250ml) - ₹15
- [ ] Plus any newly added products

#### TC-2.2: Product Card Display
**Steps:**
1. Look at each product card in grid

**Expected Results:**
- [ ] Each card shows:
  - [ ] Product name (bold, large)
  - [ ] Price (highlighted, currency symbol)
  - [ ] Category (if present)
  - [ ] Description (if present)
- [ ] Cards are well-spaced
- [ ] Cards are readable

#### TC-2.3: Empty State
**Steps:**
1. (After testing) Delete all products (future feature)
2. OR: Check if no products exist

**Expected Results:**
- [ ] Message displays: "No products added yet"
- [ ] "Add Product" button still visible
- [ ] No errors in console

#### TC-2.4: Loading State
**Steps:**
1. Open Developer Tools - Network tab
2. Throttle network to "Slow 3G"
3. Refresh Dashboard
4. Observe Products section loading

**Expected Results:**
- [ ] Loading spinner appears
- [ ] No grid shown during loading
- [ ] Products load and display
- [ ] No timeout errors

---

### Test Suite 3: Sales Form Integration

#### TC-3.1: Product Dropdown Populated
**Steps:**
1. Go to Sales page
2. Click product dropdown in AddSaleForm

**Expected Results:**
- [ ] Dropdown opens
- [ ] "Choose a product..." placeholder visible
- [ ] All products listed with prices:
  ```
  Tea (Cup) - ₹10.00
  Coffee (Cup) - ₹20.00
  Samosa - ₹5.00
  Biscuits Pack - ₹30.00
  Milk (250ml) - ₹15.00
  ```
- [ ] "Other Product" option at bottom

#### TC-3.2: Select Product from Dropdown
**Steps:**
1. Open Sales page
2. Click product dropdown
3. Select "Tea (Cup)"
4. Observe state change

**Expected Results:**
- [ ] Dropdown closes
- [ ] Selected product shows in dropdown
- [ ] Quantity field enabled
- [ ] "Other Product" mode OFF
- [ ] Form ready to input quantity

#### TC-3.3: Add Product to Sale
**Steps:**
1. Select "Tea (Cup)" from dropdown
2. Enter Quantity: "2"
3. Click "Add to Sale"

**Expected Results:**
- [ ] Item added to sale items list
- [ ] Shows: "Tea (Cup)"
- [ ] Shows: "2 × ₹10 = ₹20"
- [ ] Remove button (X) visible
- [ ] Form fields reset:
  - [ ] Dropdown: "Choose a product..."
  - [ ] Quantity: "1"
- [ ] Ready to add another product

#### TC-3.4: Add Multiple Products
**Steps:**
1. Add Product 1: Tea (Cup) - Qty 2
2. Add Product 2: Samosa - Qty 3
3. Add Product 3: Coffee (Cup) - Qty 1
4. Observe items list

**Expected Results:**
- [ ] All 3 items in list
- [ ] Each shows correct calculation
- [ ] Total shows: ₹20 + ₹15 + ₹20 = ₹55
- [ ] Can remove any item
- [ ] Can add more items

#### TC-3.5: Remove Product from Sale
**Steps:**
1. Add multiple products
2. Click X button on first item

**Expected Results:**
- [ ] Item removed from list
- [ ] Remaining items still visible
- [ ] Total recalculates
- [ ] No errors

#### TC-3.6: Quantity Validation
**Steps:**
1. Select product
2. Enter Quantity: "0"
3. Click "Add to Sale"

**Expected Results:**
- [ ] Error message: "Quantity must be greater than 0"
- [ ] Item NOT added
- [ ] Form remains open

#### TC-3.7: Quantity as Decimal
**Steps:**
1. Select product
2. Enter Quantity: "2.5"
3. Click "Add to Sale"

**Expected Results:**
- [ ] Either accepts and treats as 2.5
- [ ] OR shows error: "Quantity must be whole number"
- [ ] Consistent behavior

---

### Test Suite 4: Other Product Feature

#### TC-4.1: Select "Other Product" Option
**Steps:**
1. Go to Sales page
2. Click product dropdown
3. Select "Other Product"

**Expected Results:**
- [ ] Dropdown form changes
- [ ] Shows "Other Product" label
- [ ] Input field for product name appears
- [ ] Input field for price appears
- [ ] "Back to list" link visible
- [ ] Previous dropdown value cleared

#### TC-4.2: Add Other Product
**Steps:**
1. Select "Other Product"
2. Enter Name: "Noodles"
3. Enter Price: "25"
4. Enter Quantity: "1"
5. Click "Add to Sale"

**Expected Results:**
- [ ] Item added: "Noodles - 1 × ₹25 = ₹25"
- [ ] Form resets to dropdown mode
- [ ] Can add more products normally
- [ ] Other product name/price cleared

#### TC-4.3: Other Product Validation - Empty Name
**Steps:**
1. Select "Other Product"
2. Leave Name empty
3. Enter Price: "10"
4. Click "Add to Sale"

**Expected Results:**
- [ ] Error message: "Product name is required"
- [ ] Item NOT added
- [ ] Form stays in "Other Product" mode

#### TC-4.4: Other Product Validation - Missing Price
**Steps:**
1. Select "Other Product"
2. Enter Name: "Juice"
3. Leave Price empty
4. Click "Add to Sale"

**Expected Results:**
- [ ] Error message about price
- [ ] Item NOT added

#### TC-4.5: Back to List Link
**Steps:**
1. Select "Other Product"
2. Click "Back to list" link

**Expected Results:**
- [ ] Form reverts to dropdown mode
- [ ] "Other Product" inputs cleared
- [ ] Dropdown shows "Choose a product..."

#### TC-4.6: Mix Products and Other Products
**Steps:**
1. Add Product: "Tea" - Qty 2
2. Add Other: "Juice" - Qty 1
3. Add Product: "Samosa" - Qty 3
4. View items list

**Expected Results:**
- [ ] All items visible
- [ ] Mix of preset and custom products
- [ ] Totals calculated correctly
- [ ] Can remove any item

---

### Test Suite 5: Total Calculation

#### TC-5.1: Single Product Total
**Steps:**
1. Add: Tea - Qty 1
2. Check total

**Expected Results:**
- [ ] Item shows: "1 × ₹10 = ₹10"
- [ ] Sale total updates

#### TC-5.2: Multi-Product Total
**Steps:**
1. Add: Tea (Cup) - Qty 2 = ₹20
2. Add: Coffee (Cup) - Qty 1 = ₹20
3. Add: Samosa - Qty 5 = ₹25
4. View sale total

**Expected Results:**
- [ ] Each item calculated correctly
- [ ] Sale total: ₹65
- [ ] No rounding errors

#### TC-5.3: Large Quantity
**Steps:**
1. Add: Tea - Qty 100
2. Verify calculation: 100 × ₹10 = ₹1000

**Expected Results:**
- [ ] Correct total: ₹1000
- [ ] No overflow or UI issues

#### TC-5.4: Decimal Price Calculation
**Steps:**
1. Add Other: "Tea" - Price 10.50 - Qty 2
2. Verify: 2 × ₹10.50 = ₹21.00

**Expected Results:**
- [ ] Calculation correct
- [ ] Proper decimal handling
- [ ] 2 decimal places shown

---

### Test Suite 6: Sale Submission

#### TC-6.1: Submit Sale with Products
**Steps:**
1. Add products to sale
2. Select payment method (CASH)
3. Click "Record Sale"

**Expected Results:**
- [ ] Sale created successfully
- [ ] Success toast appears
- [ ] Sales list updated
- [ ] Items list cleared
- [ ] Form reset
- [ ] Dialog closes (if modal)

#### TC-6.2: Submit Sale without Products/Amounts
**Steps:**
1. Don't add any products
2. Leave paid/pending amounts at 0
3. Click "Record Sale"

**Expected Results:**
- [ ] Error message: "Please add products or amounts"
- [ ] Sale NOT created
- [ ] Form remains open

#### TC-6.3: Sale with Customer
**Steps:**
1. Select customer
2. Add product
3. Submit sale

**Expected Results:**
- [ ] Sale recorded with customerId
- [ ] Customer totals updated
- [ ] Trust score recalculated (if applicable)

#### TC-6.4: Sale without Customer
**Steps:**
1. Don't select customer
2. Add product
3. Submit sale

**Expected Results:**
- [ ] Sale created successfully
- [ ] customerId = null/undefined
- [ ] No errors

---

### Test Suite 7: Mobile & Responsiveness

#### TC-7.1: Product Grid on Mobile
**Steps:**
1. Open DevTools
2. Set device to iPhone 12
3. Go to Dashboard
4. View Products section

**Expected Results:**
- [ ] Grid adapts to mobile width
- [ ] 1 column layout on mobile
- [ ] Cards readable
- [ ] "Add Product" button accessible
- [ ] No horizontal scroll needed

#### TC-7.2: Sales Form on Mobile
**Steps:**
1. DevTools - Mobile viewport
2. Go to Sales page
3. Test product dropdown

**Expected Results:**
- [ ] Dropdown works with touch
- [ ] Form inputs accessible
- [ ] Buttons tap-friendly size
- [ ] No UI cutoff

#### TC-7.3: Dialog on Mobile
**Steps:**
1. Mobile viewport
2. Click "Add Product"
3. Fill form
4. Submit

**Expected Results:**
- [ ] Dialog fills screen appropriately
- [ ] All fields visible/scrollable
- [ ] Buttons easily tappable
- [ ] Keyboard doesn't hide form

---

### Test Suite 8: Error Handling

#### TC-8.1: Network Error on Product Fetch
**Steps:**
1. DevTools - Network tab
2. Go offline
3. Refresh Dashboard

**Expected Results:**
- [ ] Error message shown
- [ ] "Add Product" button still available
- [ ] No crash or white screen

#### TC-8.2: Network Error on Create
**Steps:**
1. Add product form filled
2. Go offline
3. Click "Add Product"

**Expected Results:**
- [ ] Error toast appears
- [ ] Product NOT added to grid
- [ ] Form remains with data (user can retry)

#### TC-8.3: Server Error Response
**Steps:**
1. (Simulate) Send invalid product data
2. Observe error handling

**Expected Results:**
- [ ] Error toast shows user-friendly message
- [ ] No technical error details exposed
- [ ] Form doesn't submit

#### TC-8.4: Timeout Handling
**Steps:**
1. Slow network throttling
2. Add product with delay
3. Observe loading state

**Expected Results:**
- [ ] Loading spinner shows
- [ ] Button disabled during submit
- [ ] Timeout handled gracefully
- [ ] User can retry

---

### Test Suite 9: Data Persistence

#### TC-9.1: Products Persist After Refresh
**Steps:**
1. Add new product
2. Refresh page (F5)
3. Check Dashboard

**Expected Results:**
- [ ] Product still visible
- [ ] All details preserved
- [ ] No data loss

#### TC-9.2: Products Available in Sales After Refresh
**Steps:**
1. Add product "Tea"
2. Refresh page
3. Go to Sales
4. Check dropdown

**Expected Results:**
- [ ] "Tea" available in dropdown
- [ ] Can select and use immediately

#### TC-9.3: Multiple Browser Sessions
**Steps:**
1. Browser Window 1: Add product "Coffee"
2. Browser Window 2: Refresh Dashboard
3. Check if product visible

**Expected Results:**
- [ ] Both windows show same products
- [ ] Real-time sync (or refresh shows update)

---

### Test Suite 10: Permissions & Access

#### TC-10.1: Staff Can Add Products
**Steps:**
1. Login as Staff user
2. Go to Dashboard
3. Try "Add Product"

**Expected Results:**
- [ ] "Add Product" button visible
- [ ] Can open dialog
- [ ] Can create product

#### TC-10.2: Staff Can Use Products in Sales
**Steps:**
1. Login as Staff
2. Go to Sales
3. Check product dropdown

**Expected Results:**
- [ ] Dropdown populated with products
- [ ] Can select and use
- [ ] Can submit sale with products

#### TC-10.3: Products Shared Across Users
**Steps:**
1. User A adds product
2. User B refreshes
3. Check if product visible to B

**Expected Results:**
- [ ] Yes, product visible
- [ ] Shared across all users
- [ ] No isolation per user (for products)

---

## 🔍 Browser Testing

### Chrome
- [ ] All tests pass
- [ ] No console errors
- [ ] No warnings

### Firefox
- [ ] All tests pass
- [ ] Dropdown works correctly
- [ ] Form submission smooth

### Safari
- [ ] All tests pass
- [ ] Number input works
- [ ] No layout issues

### Edge
- [ ] All tests pass
- [ ] Responsive design works
- [ ] Forms functional

### Mobile Chrome
- [ ] Touch dropdown works
- [ ] Mobile keyboard shows
- [ ] Form accessible

### Mobile Safari
- [ ] All features work
- [ ] No crashes
- [ ] Responsive layout

---

## 📊 Performance Testing

### TC-P1: Load Time with 10 Products
**Steps:**
1. Add 10 products to system
2. Go to Dashboard
3. Measure load time

**Expected Results:**
- [ ] Page loads in < 2 seconds
- [ ] Grid renders quickly
- [ ] Smooth scrolling

### TC-P2: Load Time with 50 Products
**Steps:**
1. Add 50 products
2. Go to Dashboard
3. Measure load time

**Expected Results:**
- [ ] Page loads in < 3 seconds
- [ ] Dropdown still responsive
- [ ] No lag on selection

### TC-P3: Dropdown Performance with Many Products
**Steps:**
1. Add 100 products
2. Go to Sales
3. Open product dropdown
4. Measure response time

**Expected Results:**
- [ ] Dropdown opens < 500ms
- [ ] Scrolling smooth
- [ ] No jank or freezing

---

## 🔒 Security Testing

### TC-SEC1: SQL Injection Prevention
**Steps:**
1. Add product with name: `"; DROP TABLE products; --`
2. Observe handling

**Expected Results:**
- [ ] Product created with literal name
- [ ] No SQL injection
- [ ] Data preserved

### TC-SEC2: XSS Prevention
**Steps:**
1. Add product with name: `<script>alert('xss')</script>`
2. View in grid

**Expected Results:**
- [ ] Script not executed
- [ ] Text displayed as literal string
- [ ] Properly escaped in HTML

### TC-SEC3: CSRF Protection
**Steps:**
1. Submit form normally
2. Check request headers

**Expected Results:**
- [ ] Proper CSRF tokens if applicable
- [ ] POST requests validated
- [ ] Security headers present

---

## 📝 Test Report Template

```
Test Suite: [Name]
Tester: [Name]
Date: [Date]
Duration: [Time]

Results:
- Total Tests: [ ] / [ ]
- Passed: [ ]
- Failed: [ ]
- Skipped: [ ]

Issues Found:
1. [Issue Description]
   Severity: [High/Medium/Low]
   Steps to Reproduce: [...]
   Expected: [...]
   Actual: [...]

Sign-off:
Tester: ________ Date: ________
Manager: ________ Date: ________
```

---

**Testing Start Date:** February 8, 2026  
**Testing Status:** Ready for manual testing  
**Last Updated:** February 8, 2026

