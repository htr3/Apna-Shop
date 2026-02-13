# 🧪 Edit Sale & Delete Sale - Quick Testing Guide

## ⚡ Quick Start Test (5 minutes)

### **Prerequisites:**
- Server running: `npm run dev`
- Browser open to http://localhost:5173
- Logged in with valid account
- At least 1 sale in your history

---

## Test #1: Edit a Sale ✏️

### **Steps:**
1. Navigate to **Sales** page
2. Find any existing sale in the table
3. Click the **blue "Edit"** button
4. You should see a dialog with:
   - Payment Method (3 buttons: CASH, ONLINE, CREDIT)
   - Amount Paid (input field)
   - Amount Pending (input field)

### **Test Case 1a: Change Payment Method**
- Click on a different payment method button
- Expected: Button should highlight in blue/primary color
- Click "Save Changes"
- Expected: Success toast notification
- Expected: Table updates with new payment method icon

### **Test Case 1b: Update Amounts**
- Change "Amount Paid" from existing value to 100
- Change "Amount Pending" from existing value to 50
- Click "Save Changes"
- Expected: Success message
- Expected: Table shows ₹100 (paid) and ₹50 (pending)
- Expected: Dashboard stats update

### **Expected Results:**
✅ Dialog closes automatically after save
✅ Toast shows "Sale updated successfully"
✅ Table refreshes without page reload
✅ Dashboard recalculates totals

---

## Test #2: Delete a Sale 🗑️

### **Steps:**
1. Navigate to **Sales** page
2. Find the sale you want to delete
3. Click the **red "Delete"** button
4. A confirmation dialog appears

### **Test Case 2a: Confirm Deletion**
- Read the confirmation message
- Click "OK" to confirm
- Expected: Sale disappears from table
- Expected: Success toast: "Sale deleted successfully"
- Expected: Dashboard totals decrease

### **Test Case 2b: Cancel Deletion**
- Click Delete button on a sale
- Click "Cancel" in the confirmation
- Expected: Sale remains in table
- Expected: No changes to data

### **Expected Results:**
✅ Confirmation dialog appears
✅ After confirmation, sale is removed immediately
✅ Dashboard automatically updates
✅ Sales list refreshes

---

## Test #3: Verify Data Persistence 💾

### **Steps:**
1. Edit a sale and change amount to 500
2. Refresh the browser (F5)
3. Navigate back to Sales page
4. Find the same sale

### **Expected Result:**
✅ Amount should still be 500 (not reverted)
✅ Data persisted to database

---

## Test #4: Dashboard Integration 📊

### **Steps:**
1. Note the "Today's Sales" amount on Dashboard
2. Go to Sales page
3. Edit a sale: increase its amount
4. Go back to Dashboard

### **Expected Result:**
✅ Dashboard totals have increased
✅ No manual refresh needed

---

## Test #5: Error Handling ❌

### **Test Case 5a: Network Error Simulation**
- Open browser DevTools (F12)
- Go to Network tab
- Throttle to "Offline"
- Try to edit a sale
- Expected: Error toast appears
- Expected: Data not saved
- Expected: UI remains usable

### **Test Case 5b: Invalid Input**
- Edit a sale
- Try to enter negative amounts (if not blocked)
- Click Save
- Expected: Error message or validation

---

## Test #6: Multiple Users (Optional) 👥

### **If you have multiple test accounts:**
1. Login with User A
2. Record a sale
3. Login with User B
4. User B should NOT see User A's sales
5. User B should NOT be able to edit User A's sales

---

## 📋 Checklist

Mark as you complete each test:

**Edit Sale:**
- [ ] Edit dialog opens correctly
- [ ] Payment method selection works
- [ ] Amount inputs accept values
- [ ] Save button works
- [ ] Success toast appears
- [ ] Table updates without page reload
- [ ] Dashboard updates

**Delete Sale:**
- [ ] Delete button is visible
- [ ] Confirmation dialog appears
- [ ] Can confirm deletion
- [ ] Can cancel deletion
- [ ] Sale disappears after confirmation
- [ ] Success toast appears
- [ ] Dashboard updates

**Data Persistence:**
- [ ] Changes remain after page refresh
- [ ] Data is in database (not just UI)

**Integration:**
- [ ] Dashboard updates automatically
- [ ] No page refresh needed
- [ ] All notifications display correctly

---

## 🐛 Troubleshooting

### **Edit Button Not Appearing?**
- Check browser console (F12) for errors
- Verify you're logged in
- Verify sales exist in the table
- Try refreshing the page

### **Edit Dialog Won't Open?**
- Check console for JavaScript errors
- Verify Dialog component is imported
- Try opening developer tools and checking network requests

### **Changes Not Saving?**
- Check network requests in DevTools (Network tab)
- Verify API endpoint is returning 200 OK
- Check server logs for errors
- Ensure you have valid authentication token

### **Delete Not Working?**
- Verify delete button appears
- Check confirmation dialog appears
- Check console for errors
- Verify database connection

### **Dashboard Not Updating?**
- Manual refresh should show updates
- Check React Query devtools
- Verify API responses are correct

---

## 📊 Sample Test Data

If you need test sales, use these values:

**Sale 1:**
- Amount: ₹500 (₹300 paid, ₹200 pending)
- Method: CASH
- Customer: Walk-in

**Sale 2:**
- Amount: ₹750 (₹750 paid, ₹0 pending)
- Method: ONLINE
- Customer: Rahul Sharma

**Sale 3:**
- Amount: ₹1000 (₹0 paid, ₹1000 pending)
- Method: CREDIT
- Customer: Anita Desai

---

## 🎯 Success Criteria

Your implementation is complete when:

✅ Edit Sale:
- Dialog opens with current data
- Can update payment method
- Can update paid/pending amounts
- Changes save to database
- Dashboard updates automatically

✅ Delete Sale:
- Confirmation dialog appears
- Sale is deleted from database
- Dashboard updates automatically
- Success message appears

✅ No Errors:
- Browser console has no errors
- Network requests are successful
- No TypeScript warnings

---

## 📞 Questions?

If something isn't working:
1. Check the EDIT_DELETE_SALE_FEATURE.md file
2. Review error messages in browser console
3. Check server logs in terminal
4. Verify database is connected

---

**Happy Testing! 🎉**

Run these tests before deploying to production.


