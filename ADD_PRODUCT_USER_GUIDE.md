# 📱 How to Add Products - Shopkeeper Guide

## 🎯 What is This Feature?

The **Add Product** feature lets you quickly add new products to your shop's inventory. Once added, these products appear in your Dashboard and can be used when recording sales.

---

## ✨ What You Can Track

When adding a product, you can set:

| Field | What It Means | Example | Required? |
|-------|---------------|---------|-----------|
| **Product Name** | Name of the product | Tea Cup, Samosa, Milk Packet | ✅ Yes |
| **Price** | Price per unit (₹) | 10.00, 25.50 | ✅ Yes |
| **Quantity** | How many units in stock | 50, 100, 250 | ❌ Optional |
| **Unit** | How it's measured | Piece, Kg, Liter | ❌ Optional |
| **Category** | Type of product | Beverages, Snacks | ❌ Optional |
| **Description** | Extra details | Hot beverage, Fresh stock | ❌ Optional |

---

## 🚀 Step-by-Step: How to Add a Product

### Step 1: Open Dashboard
- Login to Shopkeeper-Insights
- Click on **Dashboard** in the menu
- Scroll down to the **Products** section

### Step 2: Click "Add Product" Button
- Look for the blue **"+ Add Product"** button at the top right
- Click it to open the product form

### Step 3: Fill in Product Details

#### Required Fields ⭐
1. **Product Name**
   - Type the name of your product
   - Example: "Tea Cup", "Samosa", "Milk Packet"
   - Be specific so you can find it easily

2. **Price (₹)**
   - Enter the selling price
   - Example: "10.00", "25.50"
   - Include rupees and paise

#### Optional Fields
3. **Quantity**
   - How many units you currently have in stock
   - Leave blank or enter "0" if you want to track manually
   - Example: "50" for 50 cups

4. **Unit**
   - How you measure this product
   - Common options:
     - **Piece** - For individual items (cups, plates, eggs)
     - **Kg** - For weight in kilograms (flour, sugar, tea leaves)
     - **g** - For small amounts in grams (spices)
     - **Liter** - For liquids (milk, oil)
     - **ml** - For small liquids (sauce, essence)
     - **Box** - For packaged items
     - **Pack** - For multi-item packs
     - **Dozen** - For sets of 12
   - Example: Select "Piece" for cups, "Kg" for flour

5. **Category**
   - Group your products by type
   - Examples: "Beverages", "Snacks", "Dairy", "Spices"
   - You can create your own categories

6. **Description**
   - Add extra details about the product
   - Examples: "Hot beverage", "Fresh batch", "Homemade"
   - This helps you remember details about the product

### Step 4: Submit the Form
- Review the information is correct
- Click **"Add Product"** button
- Wait for the success message

### Step 5: Verify It Was Added
- Look at the product grid below the form
- Your new product should appear immediately
- You should see a success notification

---

## 📝 Examples

### Example 1: Tea Cup
```
Product Name: Tea Cup
Price: ₹10.00
Quantity: 50
Unit: Piece
Category: Beverages
Description: Hot beverage, ceramic cup
```

**Will Display As:**
```
┌──────────────┐
│ Tea Cup      │
│ ₹10.00       │
│ [50 Piece]   │
│ Beverages    │
│ Hot beverage │
└──────────────┘
```

### Example 2: Flour (Bulk)
```
Product Name: Wheat Flour
Price: ₹25.00
Quantity: 100
Unit: Kg
Category: Grocery
Description: Fine quality, pure wheat
```

**Will Display As:**
```
┌─────────────────┐
│ Wheat Flour     │
│ ₹25.00          │
│ [100 Kg]        │
│ Grocery         │
│ Fine quality    │
└─────────────────┘
```

### Example 3: Milk (No Quantity)
```
Product Name: Full Cream Milk
Price: ₹60.00
Quantity: (leave blank)
Unit: (leave blank)
Category: Dairy
Description: Fresh daily supply
```

**Will Display As:**
```
┌──────────────────┐
│ Full Cream Milk  │
│ ₹60.00           │
│ Dairy            │
│ Fresh daily      │
└──────────────────┘
```

---

## 🎯 Best Practices

### 1. Use Clear Product Names
✅ Good: "Ginger Tea", "Iced Coffee", "Cheese Sandwich"  
❌ Bad: "Item", "Product 1", "Thing"

### 2. Accurate Pricing
✅ Good: "10.00", "25.50", "100.00"  
❌ Bad: "10", "25.5", "100"

### 3. Consistent Categories
- Decide on 3-5 main categories
- Use the same categories every time
- Examples: Beverages, Snacks, Food, Dairy, Other

### 4. Set Quantity When Relevant
- Update quantity when you restock
- Set to 0 when out of stock
- Leave blank if you don't track inventory yet

### 5. Choose Appropriate Units
| Product Type | Best Unit |
|--------------|-----------|
| Cups, Plates, Items | Piece |
| Flour, Sugar, Spices | Kg or g |
| Milk, Oil, Syrup | Liter |
| Bulk items | Box or Pack |
| Eggs, Baked goods | Dozen |

---

## ❓ Frequently Asked Questions

### Q1: Can I change a product after adding?
**A:** Currently, no. But you can add a new product with the updated details. In future updates, edit functionality will be added.

### Q2: What if I add a product by mistake?
**A:** The product will show in your list, but won't be available in sales until you use it. Let your admin know to delete it if needed.

### Q3: Do I have to fill in quantity and unit?
**A:** No, they're optional. You can add just the name and price, and add quantity/unit later.

### Q4: Can multiple staff add products?
**A:** Yes! Every staff member with access can add products. All products are shared across the shop.

### Q5: Will the product appear in my sales dropdown?
**A:** Yes! Once added, the product automatically appears in the product dropdown on the Sales page.

### Q6: Can I add products without being on Dashboard?
**A:** Currently, products are added from Dashboard only. But this can be added to other pages in the future.

### Q7: What happens if I add a product with a duplicate name?
**A:** The system allows duplicate names. This is useful if you have the same product at different prices or units.

### Q8: Can I delete a product?
**A:** Currently, no. Products stay in the system once added. Deletion feature will be added later.

### Q9: What if I need a custom unit not in the list?
**A:** Currently, you must choose from the predefined list. Custom units will be added in a future update.

### Q10: Are products visible to all staff?
**A:** Yes! All products added are visible and usable by all staff members in the shop.

---

## 🔍 Troubleshooting

### Issue: "Add Product" Button Not Visible
**Solution:**
1. Make sure you're on the Dashboard page
2. Scroll down to the Products section
3. Refresh the page if needed
4. Check if you have permission to add products

### Issue: Product Not Appearing After Adding
**Solution:**
1. Wait a moment - it should appear instantly
2. Check if you got the success notification
3. Refresh the page
4. Check the error message for details

### Issue: Can't Select a Unit
**Solution:**
1. Click on the "Unit" dropdown
2. Select from the list provided
3. Unit is optional - you can skip it
4. Contact admin if dropdown doesn't work

### Issue: Price Shows As Invalid
**Solution:**
1. Make sure you entered a number (no letters)
2. Use decimal format: "10.00" not "10"
3. Don't include the ₹ symbol
4. Use positive numbers only

### Issue: Getting an Error Message
**Solution:**
1. Read the error message carefully
2. Check which field has the error
3. Fill all required fields (marked with *)
4. Click "Add Product" again
5. If still not working, contact admin

---

## 📊 Product List View

Once you add products, they appear in a grid on the Dashboard:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Tea Cup         │  │ Samosa          │  │ Milk Packet     │
│ ₹10.00          │  │ ₹5.00           │  │ ₹30.00          │
│ [50 Piece]      │  │ [100 Piece]     │  │ [20 Liter]      │
│ Beverages       │  │ Snacks          │  │ Dairy           │
│ Hot beverage    │  │ Crispy snack    │  │ Fresh daily     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 🎨 What Information Shows on the Product Card

When you add a product, it displays:

1. **Product Name** (bold, large)
2. **Price** (in big blue text with ₹)
3. **Quantity & Unit** (blue badge) - Only if you entered them
4. **Category** (small gray text) - Only if you entered it
5. **Description** (small text) - Only if you entered it

---

## 💡 Tips for Managing Products

### Organize by Category
Group similar products:
- **Beverages:** Tea, Coffee, Juice
- **Snacks:** Samosa, Pakora, Chips
- **Dairy:** Milk, Yogurt, Cheese

### Track Inventory
Update quantity when you:
- Add new stock
- Sell products
- Notice items are missing

### Use Descriptions
Help yourself remember:
- "Homemade" vs "Store-bought"
- Batch date or expiry
- Special notes about the item

### Set Correct Units
Makes it clear what you're selling:
- Piece = Individual items
- Kg = Bulk weight
- Liter = Liquid volume

---

## 🔔 Notifications

### Success Notification
When a product is added successfully, you see:
```
✅ Success
   Product added successfully
```

### Error Notification
If something goes wrong, you see:
```
❌ Error
   [Details of what went wrong]
```

---

## 🎓 Next Steps

After adding products, you can:
1. **Use in Sales** - Select from dropdown when recording sales
2. **Update Quantity** - Keep track of inventory
3. **View Analytics** - See which products sell most
4. **Export Report** - Generate product reports (future)

---

## 📞 Getting Help

### If You Get Stuck
1. Check this guide again
2. Ask your shop manager
3. Check the FAQ section above
4. Contact support with:
   - What you're trying to do
   - The error message (if any)
   - What you've already tried

### Common Issues Checklist
- [ ] Are all required fields filled? (marked with *)
- [ ] Is the price a valid number?
- [ ] Did you get the success notification?
- [ ] Did you wait for the product to appear?
- [ ] Is the page refreshed?
- [ ] Do you have permission to add products?

---

## 🎯 Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Open Dashboard | 10 sec |
| 2 | Click "Add Product" | 5 sec |
| 3 | Fill in required fields | 30 sec |
| 4 | Fill in optional fields | 20 sec |
| 5 | Click "Add Product" | 2 sec |
| 6 | Verify product appears | 5 sec |
| **Total** | **Complete** | **~1 minute** |

---

## 🚀 You're Ready!

You now know how to:
✅ Add products with name and price  
✅ Track quantity and units  
✅ Organize products by category  
✅ Add helpful descriptions  
✅ Verify products were added  
✅ Troubleshoot common issues  

Start adding your products to Shopkeeper-Insights today! 🎉

---

**Last Updated:** February 8, 2026  
**Version:** 1.0  
**Status:** Complete

