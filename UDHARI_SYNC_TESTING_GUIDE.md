# Udhari Sync - Complete Testing Guide

## Feature Overview
When you add or update a sale with a pending amount (udhari/credit), the Udhari tab automatically syncs with the changes.

---

## Test Case 1: Adding a New Sale with Pending Amount

### Steps:
1. Go to **Sales Tab**
2. Click "Add New Sale"
3. Fill in details:
   - Customer: Rahul Singh
   - Amount: 1000
   - Paid Amount: 600
   - Pending Amount: 400
   - Payment Method: Cash
4. Click "Save"

### Expected Result:
- ✅ Sale is created in Sales tab
- ✅ Borrowing record (400) automatically appears in Udhari tab
- ✅ Customer's borrowedAmount in dashboard updates to 400
- ✅ Sale notes link to the auto-created borrowing

### Data Sync:
```
Sales Table:
  ID: 1, Customer: Rahul, Amount: 1000, Paid: 600, Pending: 400

Udhari/Borrowings Table:
  ID: 1, Customer: Rahul, Amount: 400, Status: PENDING, 
  Notes: "Auto-created from Sale #1"
```

---

## Test Case 2: Increasing Pending Amount on Existing Sale

### Setup:
- Existing Sale: ID 1, Rahul, Amount 1000, Paid 600, Pending 400
- Existing Borrowing: ID 1, Rahul, Amount 400, Status PENDING

### Steps:
1. Go to **Sales Tab**
2. Find the sale (Rahul - 1000)
3. Click "Edit"
4. Change Pending Amount from 400 to 700
5. Click "Save"

### Expected Result:
- ✅ Sale pending amount updates to 700
- ✅ Borrowing record updates from 400 to 700
- ✅ Customer's borrowedAmount increases by 300 (600 → 900)
- ✅ No duplicate borrowing records created
- ✅ Udhari tab shows the updated amount

### Data Sync:
```
Before Update:
  Sales: Pending: 400
  Udhari: Amount: 400, BorrowedAmount: 400

After Update (Pending 400 → 700):
  Sales: Pending: 700
  Udhari: Amount: 700, BorrowedAmount: 700
  Customer BorrowedAmount: +300 added
```

---

## Test Case 3: Decreasing Pending Amount on Existing Sale

### Setup:
- Existing Sale: ID 2, Priya, Amount 2000, Paid 1000, Pending 1000
- Existing Borrowing: ID 2, Priya, Amount 1000, Status PENDING

### Steps:
1. Go to **Sales Tab**
2. Find the sale (Priya - 2000)
3. Click "Edit"
4. Change Pending Amount from 1000 to 300
5. Click "Save"

### Expected Result:
- ✅ Sale pending amount updates to 300
- ✅ Borrowing record updates from 1000 to 300
- ✅ Customer's borrowedAmount decreases by 700 (1000 → 300)
- ✅ Udhari tab shows the reduced amount

### Data Sync:
```
Before Update:
  Sales: Pending: 1000
  Udhari: Amount: 1000, BorrowedAmount: 1000

After Update (Pending 1000 → 300):
  Sales: Pending: 300
  Udhari: Amount: 300, BorrowedAmount: 300
  Customer BorrowedAmount: -700 removed
```

---

## Test Case 4: Paying Full Amount (Pending to 0)

### Setup:
- Existing Sale: ID 3, Amit, Amount 500, Paid 200, Pending 300
- Existing Borrowing: ID 3, Amit, Amount 300, Status PENDING

### Steps:
1. Go to **Sales Tab**
2. Find the sale (Amit - 500)
3. Click "Edit"
4. Change Pending Amount from 300 to 0
5. Click "Save"

### Expected Result:
- ✅ Sale pending amount updates to 0
- ✅ Borrowing record is automatically DELETED
- ✅ Customer's borrowedAmount decreases to 0
- ✅ No pending udhari shown for this customer

### Data Sync:
```
Before Update:
  Sales: Pending: 300
  Udhari: Amount: 300, BorrowedAmount: 300

After Update (Pending 300 → 0):
  Sales: Pending: 0
  Udhari: Record DELETED for this sale
  Customer BorrowedAmount: 0
```

---

## Test Case 5: Multiple Sales for Same Customer

### Setup:
- Customer: Deepak
- Sale 1: 500 total, 300 pending → Borrowing 1: 300
- Sale 2: 1000 total, 400 pending → Borrowing 2: 400

### Steps:
1. Edit Sale 1: Change pending from 300 to 500
2. Check Udhari tab
3. Edit Sale 2: Change pending from 400 to 200
4. Check Udhari tab again

### Expected Result:
- ✅ Each sale has its own linked borrowing record
- ✅ Both borrowings appear in Udhari tab for Deepak
- ✅ Total borrowedAmount = 700 (500 + 200)
- ✅ Each borrowing shows which sale it's linked to

### Data Sync:
```
Sales:
  Sale 1: Deepak, Pending: 500
  Sale 2: Deepak, Pending: 200

Udhari:
  Borrowing 1: Amount 500, Notes: "Auto-created from Sale #1"
  Borrowing 2: Amount 200, Notes: "Auto-created from Sale #2"

Customer Deepak:
  borrowedAmount: 700
```

---

## Test Case 6: Partially Paid Sale (No Udhari Initially)

### Setup:
- New Sale: 1000, Paid 1000, Pending 0

### Steps:
1. Create sale with NO pending amount
2. Check Udhari tab - no borrowing created
3. Edit the sale
4. Change Pending from 0 to 100
5. Check Udhari tab again

### Expected Result:
- ✅ Initially: No borrowing record (pending was 0)
- ✅ After edit: Borrowing record is CREATED with 100
- ✅ Udhari tab shows the new borrowing
- ✅ Customer's borrowedAmount updates to 100

---

## Dashboard Integration

All these changes should reflect in the **Dashboard**:

```
Dashboard Stats:
- Pending Udhari (Total): Sum of all pending amounts from sales + borrowings
- Customer Trust Score: Recalculated based on payment history
- Total Borrowed: Sum from customer's borrowedAmount field
```

---

## Troubleshooting

### Issue: Pending amount changed but Udhari doesn't update
- **Solution**: Refresh the page or clear browser cache
- **Check**: Ensure customer ID is set on the sale
- **Backend**: Check server logs for errors

### Issue: Multiple borrowing records for same sale
- **Solution**: This shouldn't happen with v2.0
- **Check**: Verify borrowing notes match the pattern "Auto-created from Sale #[id]"
- **Fix**: Delete duplicate borrowing records manually if needed

### Issue: Customer borrowedAmount doesn't match Udhari total
- **Solution**: This could indicate a sync issue
- **Check**: Sum of all borrowings + pending amounts from sales
- **Fix**: May need database cleanup/recalculation

---

## Summary of Changes

| Action | Before | After |
|--------|--------|-------|
| Add Sale with Pending | Manual borrowing entry needed | Auto-created borrowing ✅ |
| Increase Pending | Manual update needed | Auto-updated borrowing ✅ |
| Decrease Pending | Manual update needed | Auto-updated borrowing ✅ |
| Pay Full Amount | Manual borrowing deletion | Auto-deleted borrowing ✅ |
| Customer Borrowed Amount | Manual calculation | Auto-synced ✅ |

---

## Implementation Details

### Database Level:
- Borrowing records are linked to sales via `notes` field
- Pattern: `Auto-created from Sale #[saleId]`

### Sync Logic:
1. On create sale: If pending > 0, create borrowing
2. On update sale: 
   - If pending increased: Update or create borrowing
   - If pending decreased: Update or delete borrowing
   - If pending = 0: Delete borrowing

### Customer Impact:
- borrowedAmount field auto-synced on all changes
- Trust score recalculated after each update


