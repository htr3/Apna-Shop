# Product Management Feature - Complete Guide

## 🎯 Overview

Shopkeepers can now track **what products they sell** when recording sales. Instead of just recording amounts, they can specify:
- Product names (Rice, Oil, Sugar, etc.)
- Quantity sold
- Price per unit
- Automatic calculation of total sale amount

## ✨ Features

### 1. **Add Products to Sales**
When recording a new sale:
- Enter product name (e.g., "Rice", "Oil")
- Enter quantity (e.g., 5 kg)
- Enter price per unit (e.g., ₹100)
- System automatically calculates: Quantity × Price = Total

### 2. **Multiple Products Per Sale**
Add multiple products to a single sale:
- Add Rice 5 kg @ ₹100 = ₹500
- Add Oil 2 L @ ₹200 = ₹400
- Add Sugar 2 kg @ ₹50 = ₹100
- **Total Sale: ₹1,000** ✓

### 3. **Track Inventory**
Products are stored with their details:
- `saleItems` table tracks every product sold
- Links sale → products sold
- Shows product name, quantity, price in database

### 4. **Product History**
- View all products sold in a transaction
- See dates, quantities, and prices
- Future: Generate product-wise reports

## 🚀 How to Use

### Step 1: Go to Sales Page
1. Click **Sales** in the navigation menu
2. Click **New Sale** button (top right)

### Step 2: Select Customer (Optional)
- Search and select a customer
- Or leave blank for anonymous sales

### Step 3: Add Products

**Option A: Using Product Form** (Recommended)
1. Scroll to "📦 Products Sold" section
2. Enter:
   - **Product name**: e.g., "Basmati Rice"
   - **Quantity**: e.g., 5 (kg/L/pieces)
   - **Price**: e.g., 100 (per unit in ₹)
3. Click **Add Product**
4. Repeat for more products

**Option B: Manual Entry** (If no products)
1. Use "💰 Manual Entry" section
2. Enter:
   - **Amount Paid**: ₹ paid upfront
   - **Amount Pending**: ₹ on credit

### Step 4: Choose Payment Method
- **CASH**: Paid in cash
- **ONLINE**: UPI/Bank transfer
- **CREDIT**: On credit (Udhaar)

### Step 5: Review & Submit
- Check **Total Amount** 
- Click **Record Sale**

### Step 6: Confirmation
- ✓ Sale recorded with products
- ✓ Dashboard updated
- ✓ Pending Udhaar updated (if credit)

---

## 📊 Data Structure

### Sales Table
```sql
sales
├─ id (Primary Key)
├─ userId
├─ amount (Total ₹)
├─ paidAmount
├─ pendingAmount
├─ date
├─ paymentMethod (CASH/ONLINE/CREDIT)
└─ customerId (optional)
```

### NEW: Sale Items Table
```sql
saleItems
├─ id (Primary Key)
├─ saleId (Links to sales)
├─ productId (Future: Link to inventory)
├─ productName (e.g., "Rice")
├─ quantity (e.g., 5)
├─ price (e.g., 100 per unit)
├─ total (quantity × price)
└─ createdAt
```

---

## 💡 Examples

### Example 1: Grocery Store Sale
```
Sale to: Rahul Sharma

Products:
├─ Rice (Basmati)
│  └─ 10 kg × ₹80 = ₹800
├─ Oil (Sunflower)
│  └─ 2 L × ₹250 = ₹500
└─ Sugar
   └─ 5 kg × ₹50 = ₹250

Total: ₹1,550
Payment: CASH (Paid ₹1,550)
```

### Example 2: Credit Sale
```
Sale to: Priya Patel

Products:
├─ Flour (Atta)
│  └─ 25 kg × ₹30 = ₹750

Total: ₹750
Payment: CREDIT
├─ Paid: ₹0
└─ Pending: ₹750 (Due next week)
```

---

## 🔄 Database Schema Changes

### New Table: `saleItems`
```typescript
// Added to shared/schema.ts
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
  total: numeric("total").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Updated: Sales Form
- Added product section with quantity/price inputs
- Auto-calculates product total amounts
- Stores product details in `items` JSON field

---

## 📈 Future Enhancements

### 1. **Inventory Integration**
- Link products to inventory table
- Automatically deduct sold quantity from stock
- Alert when stock is low

### 2. **Product Reports**
- Best-selling products
- Product-wise revenue
- Quantity trends

### 3. **Product Categories**
- Organize products (Grains, Oils, Spices)
- Filter by category
- Category-wise sales reports

### 4. **Product Pricing**
- Store product master with default prices
- Quick selection from dropdown
- Price history tracking

### 5. **Batch Management**
- Track batch numbers
- Expiry dates
- Cost price vs. selling price

---

## ⚠️ Important Notes

### Current Limitations
1. **Product names are free text** - No product master list yet
2. **No inventory deduction** - Manual entry only
3. **No product categories** - All products treated equally
4. **No pricing history** - Each sale has independent prices

### Best Practices
✅ Use consistent product names (e.g., always "Basmati Rice" not "Rice Basmati")
✅ Update prices based on current market rates
✅ Include units in quantity (e.g., "5 kg" or just number and remember)
✅ Link products to customers for better tracking

---

## 🧪 Testing the Feature

### Test Case 1: Single Product Sale
1. Go to Sales → New Sale
2. Add 1 product (Rice, 5, 100)
3. Total shows ₹500 ✓
4. Submit → Success ✓

### Test Case 2: Multiple Products
1. Go to Sales → New Sale
2. Add Product 1: Rice 5 × 100 = ₹500
3. Add Product 2: Oil 2 × 250 = ₹500
4. Total shows ₹1,000 ✓
5. Payment: CASH
6. Submit → Success ✓

### Test Case 3: Remove Product
1. Add 3 products
2. Click X on middle product
3. List updates (2 products left) ✓
4. Total recalculates ✓

### Test Case 4: Manual Entry (No Products)
1. Go to Sales → New Sale
2. Don't add any products
3. Use Manual Entry section
4. Enter Paid: 500, Pending: 100
5. Total shows ₹600 ✓
6. Submit → Success ✓

---

## 📱 UI Walkthrough

### Before (Old)
```
[New Sale Dialog]
├─ Customer: ___
├─ Amount Paid: ___
├─ Amount Pending: ___
├─ Payment Method: [CASH][ONLINE][CREDIT]
└─ [Record Sale]
```

### After (New)
```
[New Sale Dialog]
├─ Customer: ___
│
├─ 📦 Products Sold
│  ├─ [Product 1 card] [X]
│  ├─ [Product 2 card] [X]
│  └─ Add Product Form:
│     ├─ Product name: ___
│     ├─ Quantity: ___
│     ├─ Price: ___
│     └─ [Add Product]
│
├─ 💰 Manual Entry (if no products)
│  ├─ Amount Paid: ___
│  └─ Amount Pending: ___
│
├─ Total Amount: ₹1,000
├─ Payment Method: [CASH][ONLINE][CREDIT]
└─ [Record Sale]
```

---

## 💾 Data Persistence

### In Database
- Sale record created in `sales` table
- Each product stored in `saleItems` table
- Linked via `saleId` foreign key

### In Reports
- Product details visible when reviewing sale
- Can see which products were sold in each transaction
- Future: Generate product-wise reports

### Future API Endpoints
```
GET /api/sales/:id/items
  └─ Get all products in a sale

GET /api/products/best-sellers
  └─ Get top-selling products

GET /api/reports/product-revenue
  └─ Get product-wise revenue report
```

---

## 🎯 Next Steps

1. **Start Using It**
   - Record sales with products
   - Build product transaction history

2. **Create Product Master** (Optional)
   - Add a Products page
   - Pre-define products with default prices
   - Quick selection from dropdown

3. **Setup Inventory**
   - Set initial stock quantities
   - Auto-deduct sold products
   - Low stock alerts

4. **Generate Reports**
   - Best-selling products
   - Product revenue trends
   - Stock movement reports

---

## ✅ Verification Checklist

- [ ] Can add single product to sale
- [ ] Can add multiple products
- [ ] Total calculates correctly
- [ ] Can remove products
- [ ] Can still use manual entry (no products)
- [ ] Sales display "📦 Tracked"
- [ ] Database stores product details
- [ ] Dashboard metrics update correctly

---

**You're all set!** Start tracking your products today! 🎉

