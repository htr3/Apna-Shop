# Udhari (Credit/Borrowing) Sync Fix

## Problem
When adding a sale with pending amount (udhari/credit), the data was not automatically syncing to the Udhari tab. You had to manually create a borrowing record for the pending amount to appear in the Udhari tab.

## Solution
Updated the `createSale()` method in both storage implementations to automatically create a borrowing record when a sale has a pending amount.

## Changes Made

### 1. MemStorage.createSale() (Lines 213-243)
Added automatic borrowing record creation:
```typescript
// ✨ Auto-create borrowing record if sale has pending amount (udhari)
const pendingAmount = Number(insertSale.pendingAmount || 0);
if (pendingAmount > 0 && sale.customerId) {
  const borrowingId = this.currentId.borrowings++;
  const borrowing: Borrowing = {
    id: borrowingId,
    mobileNo,
    customerId: sale.customerId,
    amount: pendingAmount.toString(),
    date: sale.date,
    dueDate: null,
    status: "PENDING",
    notes: `Auto-created from Sale #${sale.id}`,
  };
  this.borrowings.set(borrowingId, borrowing);
}
```

### 2. DbStorage.createSale() (Lines 483-535)
Added automatic borrowing record creation with database insert:
```typescript
// ✨ Auto-create borrowing record if sale has pending amount (udhari)
if (pendingAmount > 0) {
  try {
    await db.insert(borrowings).values({
      customerId: customerId,
      amount: pendingAmount.toString(),
      date: newSale.date || new Date(),
      dueDate: null,
      status: "PENDING",
      notes: `Auto-created from Sale #${newSale.id}`,
      mobileNo: mobileNo,
    });
  } catch (error) {
    console.error("Failed to create automatic borrowing record:", error);
  }
}
```

## How It Works Now

When you add a sale:
1. ✅ Sale record is created with amount, paidAmount, and pendingAmount
2. ✅ Customer's totalPurchase and borrowedAmount are automatically updated
3. ✅ **NEW**: If pendingAmount > 0, a borrowing record is automatically created
4. ✅ The borrowing appears in the Udhari tab with:
   - Amount = pendingAmount from the sale
   - Status = PENDING
   - Notes = "Auto-created from Sale #[saleId]"
   - Linked to the same customer

## Example Flow

**Adding Sale:**
- Customer: Rahul
- Amount: 1000
- Paid Amount: 600
- Pending Amount: 400

**Result:**
- Sale created with all details
- Customer's totalPurchase increased by 1000
- Customer's borrowedAmount increased by 400
- **Borrowing record auto-created:**
  - customerId: Rahul's ID
  - amount: 400
  - status: PENDING
  - Automatically appears in Udhari tab ✅

## Testing
1. Go to Sales tab
2. Create a new sale with pending amount (udhari)
3. Check Udhari tab - the borrowing should appear automatically
4. No manual creation needed!

## ✨ NEW: Pending Amount Update Sync

When you **update an existing sale's pending amount**, it automatically syncs to the Udhari tab:

### Update Scenarios:

**Scenario 1: Increase Pending Amount**
- Original Sale: 1000 total, 500 pending
- Update to: 1000 total, 700 pending
- **Result**: Borrowing amount updated from 500 to 700, customer's borrowedAmount increased by 200

**Scenario 2: Decrease Pending Amount**
- Original Sale: 1000 total, 700 pending  
- Update to: 1000 total, 300 pending
- **Result**: Borrowing amount updated from 700 to 300, customer's borrowedAmount decreased by 400

**Scenario 3: Pay Full Amount**
- Original Sale: 1000 total, 500 pending
- Update to: 1000 total, 0 pending (fully paid)
- **Result**: Borrowing record automatically deleted, customer's borrowedAmount updated to 0

## How UpdateSale Works

Both MemStorage and DbStorage now:
1. Get the existing sale's pending amount
2. Compare with the new pending amount
3. If changed:
   - Find the auto-created borrowing record (using notes: "Auto-created from Sale #[id]")
   - Update or delete the borrowing record accordingly
   - Update customer's borrowedAmount
4. Changes appear instantly in Udhari tab ✅

## Related Files
- `server/storage.ts` - Main storage implementation (createSale & updateSale)
- `server/routes.ts` - API endpoints for sales creation/update
- `shared/schema.ts` - Database schema definitions

