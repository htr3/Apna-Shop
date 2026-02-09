# Product Management Feature - FAQs & Troubleshooting

## ❓ Frequently Asked Questions

### Q: Where do I add new products?
**A:** Go to the **Dashboard** page and scroll to the **Products** section at the bottom. Click the **"Add Product"** button to open the form.

### Q: Can I use products in sales?
**A:** Yes! When recording a sale, the products you added appear in a dropdown. Just select the product, enter quantity, and click "Add to Sale".

### Q: What if my product is not in the list?
**A:** Select **"Other Product"** from the dropdown. You can then enter the product name and price on the fly.

### Q: Can I edit or delete products?
**A:** In the current version, products cannot be edited or deleted after creation. If you need to modify, contact your admin. (This feature will be added in the next update)

### Q: Do I need to add a category and description?
**A:** No, they are optional. Only **Product Name** and **Price** are required.

### Q: Can multiple staff members add products?
**A:** Yes! Each staff member can add products from the Dashboard. All products appear in the shared list for all users.

### Q: What currency is used?
**A:** All prices are in **₹ (Indian Rupees)** as per your shop configuration.

### Q: How many products can I add?
**A:** There's no limit! Add as many products as you need.

### Q: Will added products be saved if I close the app?
**A:** Yes! Products are saved to the database and will persist even if you close and reopen the app.

---

## 🔧 Troubleshooting

### Problem: Products dropdown is empty in Sales page
**Solution:**
1. Make sure you've added products from the Dashboard first
2. Refresh the page (F5 or Cmd+R)
3. Check if product creation was successful (check Dashboard grid)

### Problem: "Other Product" option doesn't appear
**Solution:**
1. Check if the dropdown is fully expanded
2. Scroll down in the dropdown if there are many products
3. Try refreshing the page

### Problem: Can't add product - getting error
**Troubleshoot:**
- Make sure **Product Name** is not empty
- Make sure **Price** is a valid number (e.g., 10, 10.50, not "ten")
- Check if you have internet connection
- Try again or refresh the page

### Problem: Product added but not showing in sales dropdown
**Solution:**
1. Refresh the Sales page
2. Check if the product is marked as "Active"
3. Make sure you're logged in with the same user account
4. Clear browser cache and try again

### Problem: Price calculation is wrong
**Solution:**
- Verify the unit price you entered
- Check quantity is correct
- Sales form auto-calculates: Quantity × Price = Total
- Example: 2 items × ₹10 = ₹20

### Problem: Quantity field not working
**Solution:**
1. Make sure quantity is a whole number (no decimals)
2. Quantity must be at least 1
3. Use arrow keys or type directly in the field

### Problem: "Back to list" link not visible
**Solution:**
1. Make sure "Other Product" is selected
2. Scroll down in the form if needed
3. The link appears below the price input field

---

## 📊 Data Validation Rules

### Product Form Validation
```
Field              Type        Required    Rules
─────────────────────────────────────────────────
Product Name       Text        ✓           Non-empty
Price              Number      ✓           > 0, max 2 decimals
Category           Text        ✗           Any text
Description        Text        ✗           Any text
```

### Sale Product Validation
```
Field              Type        Required    Rules
─────────────────────────────────────────────────
Product            Select      ✓           Existing product or "Other"
Product Name       Text        ✓*          Required if "Other Product"
Product Price      Number      ✓*          Required if "Other Product"
Quantity           Number      ✓           > 0, whole number
```
*Only required when "Other Product" is selected

---

## 📋 Checklist for Using Products

### First Time Setup
- [ ] Navigate to Dashboard
- [ ] Find Products section
- [ ] Click "Add Product"
- [ ] Add 3-5 commonly sold products
- [ ] Verify products appear in the grid
- [ ] Go to Sales page
- [ ] Check if products appear in dropdown
- [ ] Test selecting a product
- [ ] Test "Other Product" option
- [ ] Test adding product to sale

### Daily Usage
- [ ] Check product list on Dashboard
- [ ] Use dropdown to quickly select products during sales
- [ ] Add new products as needed
- [ ] Verify sale totals are correct

---

## 🎓 Best Practices

### For Product Names
✅ **Good Examples:**
- "Tea (Cup)" - Clear size/unit
- "Samosa (Single)" - Clear quantity
- "Coffee - Black" - Clear variant
- "Milk 500ml" - Clear volume

❌ **Avoid:**
- "item1", "product" - Unclear
- "Tea Tea Tea" - Repetitive
- Extra spaces or special characters

### For Pricing
✅ **Good Practice:**
- Set realistic prices (₹10, ₹10.50, ₹100)
- Update if wholesale price changes
- Round to nearest 0.50 or 1.00 for simplicity
- Review pricing monthly

❌ **Avoid:**
- Negative prices
- Extremely high prices (unless wholesale)
- 0 price (unless free item)

### For Categories
✅ **Suggested Categories:**
- Beverages (Tea, Coffee, Milk, Juice)
- Snacks (Samosa, Biscuits, Chips, Cookies)
- Groceries (Rice, Oil, Sugar, Salt)
- Dry Goods (Flour, Spices, Pulses)
- Frozen (Ice Cream, Frozen Food)
- Custom (Add your own)

### For Organization
✅ **Best Practices:**
- Group similar products together
- Use consistent naming conventions
- Update descriptions for clarity
- Remove old/discontinued products (coming in next update)
- Review list monthly

---

## 💡 Pro Tips

1. **Quick Add During Sales:**
   - If a frequent item is missing, use "Other Product"
   - Add it to products list later from Dashboard

2. **Accurate Totals:**
   - Products list auto-calculates totals
   - Manual entry is only for non-product sales
   - Mix both products and manual amounts if needed

3. **Customer Context:**
   - Add products BEFORE selecting customer
   - Then select customer to apply terms (cash/credit)

4. **Mobile Friendly:**
   - All forms work on mobile devices
   - Responsive dropdowns on touch screens
   - Easy thumb-tap buttons

5. **Batch Operations:**
   - Add multiple products before closing app
   - Products persist in database
   - No daily reset needed

---

## 🔐 Permissions & Access

### Product Management Permissions
- **Owner**: Can add, view, edit, delete products ✓
- **Manager**: Can add, view, edit products ✓
- **Staff**: Can add, view products ✓

### Feature Access
- **Dashboard**: Available to all roles
- **Product Manager**: Available to Owner, Manager, Staff
- **Sales**: Can use products for recording sales (all roles)

---

## 📞 Support

For issues not covered here:
1. Check the main documentation
2. Review the Product Implementation guide
3. Contact your system administrator
4. Report bugs with specific error messages

---

**Last Updated:** February 2025
**Feature Version:** 1.0
**Status:** Stable

