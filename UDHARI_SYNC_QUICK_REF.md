# Udhari Sync - Quick Reference

## What Changed?

When you add or edit a sale with a **pending amount** (udhari/credit), the **Udhari tab automatically updates** without needing manual entries.

---

## Quick Actions & Expected Results

### 1️⃣ Adding a New Sale with Udhari

**You do:**
```
Sales Tab → Add Sale
- Customer: Rahul
- Amount: 1000
- Paid: 600
- Pending: 400 ← This is the udhari
```

**System does automatically:**
- ✅ Creates sale record
- ✅ Creates borrowing record with amount 400
- ✅ Updates customer's borrowedAmount
- ✅ Shows in Udhari tab instantly

---

### 2️⃣ Updating Pending Amount (Increasing)

**You do:**
```
Sales Tab → Edit Existing Sale
- Change Pending: 400 → 700
```

**System does automatically:**
- ✅ Updates sale to pending 700
- ✅ Updates borrowing from 400 to 700
- ✅ Increases customer borrowedAmount by 300
- ✅ Udhari tab shows new amount 700

---

### 3️⃣ Updating Pending Amount (Decreasing)

**You do:**
```
Sales Tab → Edit Existing Sale
- Change Pending: 700 → 300
```

**System does automatically:**
- ✅ Updates sale to pending 300
- ✅ Updates borrowing from 700 to 300
- ✅ Decreases customer borrowedAmount by 400
- ✅ Udhari tab shows new amount 300

---

### 4️⃣ Paying Full Amount (Pending to 0)

**You do:**
```
Sales Tab → Edit Existing Sale
- Change Pending: 300 → 0 (fully paid)
```

**System does automatically:**
- ✅ Updates sale pending to 0
- ✅ DELETES the borrowing record
- ✅ Updates customer borrowedAmount to 0
- ✅ Removes from Udhari tab

---

## Files Modified

```
server/storage.ts
├── MemStorage.createSale() - Creates borrowing with sale
├── MemStorage.updateSale() - Syncs pending amount changes
├── DbStorage.createSale() - Creates borrowing with sale
└── DbStorage.updateSale() - Syncs pending amount changes
```

---

## How Borrowing Records Are Linked

Each auto-created borrowing has a **notes** field:
```
notes: "Auto-created from Sale #[saleId]"
```

This allows the system to:
- Find the right borrowing when updating/deleting
- Show the connection between sale and udhari
- Prevent duplicate entries

---

## Dashboard Impact

The dashboard automatically shows:
- **Pending Udhari**: Total of all pending amounts
- **Customer Status**: Based on borrowedAmount
- **Trust Score**: Recalculated after each change

---

## Key Points to Remember

| Scenario | Before | After |
|----------|--------|-------|
| Add Sale with Pending | Manual entry needed | ✅ Auto synced |
| Update Pending Amount | Manual update needed | ✅ Auto synced |
| Clear Pending (pay all) | Manual delete needed | ✅ Auto deleted |
| Customer Borrowed Total | Manual calculation | ✅ Auto calculated |

---

## Sync Happens In Real-Time

- No need to refresh
- No need to manually create/update borrowings
- Changes visible in Udhari tab instantly

---

## Questions?

Check:
- `UDHARI_SYNC_FIX.md` - Technical details
- `UDHARI_SYNC_TESTING_GUIDE.md` - Test cases

