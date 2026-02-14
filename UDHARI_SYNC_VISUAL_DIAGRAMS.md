# Udhari Sync - Visual Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  Sales Tab   │              │  Udhari Tab  │            │
│  ├──────────────┤              ├──────────────┤            │
│  │ • Add Sale   │ ─────────→  │ • Borrowings │            │
│  │ • Edit Sale  │ ←─────────   │ • Track Due  │            │
│  │ • Amount     │ (Auto Sync)  │ • Customer   │            │
│  │ • Pending    │              │   Amount     │            │
│  └──────────────┘              └──────────────┘            │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                     API ROUTES (routes.ts)                   │
├─────────────────────────────────────────────────────────────┤
│  POST /api/sales/create     → createSale()                  │
│  PUT  /api/sales/:id        → updateSale()                  │
│  POST /api/borrowings/create → createBorrowing()            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  STORAGE LAYER (storage.ts)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ╔═════════════════════════════════════════════════════╗   │
│  ║          createSale(sale, mobileNo)                 ║   │
│  ╠═════════════════════════════════════════════════════╣   │
│  ║ 1. Insert sale record                               ║   │
│  ║ 2. Update customer's totalPurchase                  ║   │
│  ║ 3. IF pending > 0:                                  ║   │
│  ║    ├─ Create borrowing record                       ║   │
│  ║    └─ Update customer's borrowedAmount              ║   │
│  ║ 4. Update trust score                               ║   │
│  ║ 5. Create invoice & send receipt                    ║   │
│  ╚═════════════════════════════════════════════════════╝   │
│                                                              │
│  ╔═════════════════════════════════════════════════════╗   │
│  ║          updateSale(id, updates, mobileNo)          ║   │
│  ╠═════════════════════════════════════════════════════╣   │
│  ║ 1. Get existing sale                                ║   │
│  ║ 2. Check ownership (mobileNo)                       ║   │
│  ║ 3. Update sale record                               ║   │
│  ║ 4. Compare pending amounts (old vs new)             ║   │
│  ║                                                      ║   │
│  ║ IF new > old (Increased):                           ║   │
│  ║  ├─ Find existing borrowing by "Sale #[id]"        ║   │
│  ║  ├─ Update borrowing to new amount                  ║   │
│  ║  └─ Increase customer's borrowedAmount              ║   │
│  ║                                                      ║   │
│  ║ ELSE IF new < old (Decreased):                      ║   │
│  ║  ├─ Find existing borrowing by "Sale #[id]"        ║   │
│  ║  ├─ IF new == 0: DELETE borrowing                   ║   │
│  ║  ├─ ELSE: Update borrowing to new amount            ║   │
│  ║  └─ Decrease customer's borrowedAmount              ║   │
│  ║                                                      ║   │
│  ║ 5. Return updated sale                              ║   │
│  ╚═════════════════════════════════════════════════════╝   │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Sales Table ────────────────┐                           │
│  │ id: 1                         │                           │
│  │ customerId: 5                 │                           │
│  │ amount: 1000                  │                           │
│  │ paidAmount: 600               │                           │
│  │ pendingAmount: 400 ───────────┼───┐                      │
│  │ date: 2024-02-14              │   │                      │
│  │ mobileNo: 9876543210          │   │                      │
│  └───────────────────────────────┘   │                      │
│                                       │ Links via notes     │
│  ┌─ Borrowings Table ────────────┐   │                      │
│  │ id: 42                         │   │                      │
│  │ customerId: 5                  │←──┘                      │
│  │ amount: 400                    │                          │
│  │ status: PENDING                │                          │
│  │ notes: "Auto-created from Sale #1"                       │
│  │ date: 2024-02-14               │                          │
│  │ mobileNo: 9876543210           │                          │
│  └────────────────────────────────┘                          │
│                                                              │
│  ┌─ Customers Table ─────────────┐                          │
│  │ id: 5                          │                          │
│  │ name: Rahul Singh              │                          │
│  │ totalPurchase: 1000            │                          │
│  │ borrowedAmount: 400            │                          │
│  │ mobileNo: 9876543210           │                          │
│  └────────────────────────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Flow: Adding a Sale with Pending Amount

```
User inputs:
├─ Customer: Rahul (ID: 5)
├─ Amount: 1000
├─ Paid: 600
└─ Pending: 400
    │
    ↓
[POST /api/sales/create]
    │
    ↓
createSale() in storage.ts
    │
    ├─ Insert into sales table
    │  └─ Sale ID: 1 created
    │
    ├─ Check if customerId exists (5)
    │  └─ Found ✓
    │
    ├─ Update customer totalPurchase
    │  └─ 0 + 1000 = 1000
    │
    ├─ pendingAmount > 0? (400 > 0)
    │  ├─ YES ✓
    │  │
    │  └─ Insert into borrowings table
    │     └─ Borrowing ID: 42 created
    │        ├─ customerId: 5
    │        ├─ amount: 400
    │        ├─ status: PENDING
    │        └─ notes: "Auto-created from Sale #1"
    │
    ├─ Update customer borrowedAmount
    │  └─ 0 + 400 = 400
    │
    ├─ Update trust score (trustScoreService)
    │
    ├─ Create invoice (invoiceService)
    │
    └─ Send receipt notification
        │
        ↓
    [Response to UI]
    ├─ Sale created ✓
    └─ Borrowing created ✓
        │
        ↓
    [UI Updates]
    ├─ Sales Tab: Shows new sale
    └─ Udhari Tab: Shows new borrowing (400) ✓
```

---

## Flow: Updating Pending Amount (400 → 700)

```
User edits sale:
└─ Changes pending: 400 → 700
    │
    ↓
[PUT /api/sales/1]
    │
    ↓
updateSale(id=1, {pendingAmount: 700}) in storage.ts
    │
    ├─ Get existing sale (ID: 1)
    │  └─ Found: pending was 400
    │
    ├─ Update sale record
    │  └─ pendingAmount: 400 → 700
    │
    ├─ Check if customerId exists (5)
    │  └─ Found ✓
    │
    ├─ Compare pending amounts
    │  ├─ Old: 400
    │  ├─ New: 700
    │  └─ Direction: INCREASED ↑
    │
    ├─ Calculate difference
    │  └─ 700 - 400 = 300
    │
    ├─ Find existing borrowing
    │  ├─ Search: notes LIKE "%Sale #1%"
    │  └─ Found: Borrowing ID 42 ✓
    │
    ├─ Update borrowing record
    │  ├─ amount: 400 → 700
    │  └─ Borrowing ID 42 updated ✓
    │
    ├─ Update customer borrowedAmount
    │  ├─ Old: 400
    │  ├─ Add: +300
    │  └─ New: 700
    │
    └─ Return updated sale
        │
        ↓
    [Response to UI]
    ├─ Sale updated ✓
    └─ Borrowing synced ✓
        │
        ↓
    [UI Updates]
    ├─ Sales Tab: Shows pending 700
    └─ Udhari Tab: Shows amount 700 ✓
```

---

## Flow: Paying Full Amount (300 → 0)

```
User edits sale:
└─ Changes pending: 300 → 0 (fully paid)
    │
    ↓
[PUT /api/sales/3]
    │
    ↓
updateSale(id=3, {pendingAmount: 0}) in storage.ts
    │
    ├─ Get existing sale (ID: 3)
    │  └─ Found: pending was 300
    │
    ├─ Update sale record
    │  └─ pendingAmount: 300 → 0
    │
    ├─ Check if customerId exists
    │  └─ Found ✓
    │
    ├─ Compare pending amounts
    │  ├─ Old: 300
    │  ├─ New: 0
    │  └─ Direction: DECREASED ↓
    │
    ├─ Find existing borrowing
    │  ├─ Search: notes LIKE "%Sale #3%"
    │  └─ Found: Borrowing ID X ✓
    │
    ├─ Check if new pending is 0
    │  ├─ 0 == 0? YES ✓
    │  │
    │  └─ DELETE borrowing record
    │     └─ Borrowing ID X DELETED
    │
    ├─ Update customer borrowedAmount
    │  ├─ Old: 300
    │  ├─ Subtract: -300
    │  └─ New: 0
    │
    └─ Return updated sale
        │
        ↓
    [Response to UI]
    ├─ Sale updated ✓
    └─ Borrowing deleted ✓
        │
        ↓
    [UI Updates]
    ├─ Sales Tab: Shows pending 0
    └─ Udhari Tab: Borrowing removed ✓
```

---

## Data Sync Timeline

```
Time  Event                          Sales Tab              Udhari Tab
─────────────────────────────────────────────────────────────────────
T0    Initial state                  (empty)                (empty)

T1    Add sale with pending          Sale #1 (pending 400)  [Auto] Borrowing (400)
      300 → 400                      ✓                      ✓

T2    Update pending                 Sale #1 (pending 700)  [Updated] Borrowing (700)
      400 → 700                      ✓                      ✓

T3    Update pending                 Sale #1 (pending 300)  [Updated] Borrowing (300)
      700 → 300                      ✓                      ✓

T4    Pay fully                      Sale #1 (pending 0)    [Deleted] Borrowing removed
      300 → 0                        ✓                      ✓
```

---

## Borrowing Link Mechanism

```
┌─────────────────────────────────────────┐
│         How Borrowings Are Linked        │
└─────────────────────────────────────────┘

    Sale Table                Borrowings Table
    ──────────────            ───────────────
    id: 1                     id: 42
    customerId: 5    ────→    customerId: 5
    pendingAmount: 400        amount: 400
                              notes: "Auto-created from Sale #1"
                                        ▲
                                        │
                    ╔═══════════════════╝
                    │
            Pattern: notes LIKE "%Sale #1%"
            
            Find: WHERE notes LIKE '%Sale #' || id || '%'
            
            This allows:
            ├─ Find borrowing for any sale
            ├─ Update without ID collision
            └─ Track relationship automatically
```

---

## Multi-Sale Scenario

```
Customer: Deepak

Sales Created:
┌─────────────────────────────────────────┐
│ Sale #1: 500 total, 300 pending         │
│ Sale #2: 1000 total, 400 pending        │
│ Sale #3: 2000 total, 0 pending          │
└─────────────────────────────────────────┘

Borrowings Auto-Created:
┌─────────────────────────────────────────┐
│ Borrowing #A: 300                       │
│ └─ notes: "Auto-created from Sale #1"   │
│                                         │
│ Borrowing #B: 400                       │
│ └─ notes: "Auto-created from Sale #2"   │
│                                         │
│ (No borrowing for Sale #3, pending=0)   │
└─────────────────────────────────────────┘

Customer's Borrowed Amount: 300 + 400 = 700

When Sale #1 pending changes to 500:
├─ Borrowing #A updates to 500
├─ Customer borrowedAmount: 500 + 400 = 900
└─ Each borrowing remains independent
```

---

## Error Scenarios

```
Scenario 1: Customer Not Found
    Add sale with non-existent customerId
    │
    ↓ Foreign key constraint error
    │
    └─ Throw "Customer not found"
    └─ No borrowing created
    └─ No customer update
    └─ User sees error message

Scenario 2: Borrowing Creation Fails
    Sale is created successfully
    │
    ↓ But borrowing insert fails
    │
    └─ Catch error and log it
    └─ Sale still successful
    └─ User can manually create borrowing
    └─ System doesn't crash

Scenario 3: Multiple Updates Simultaneously
    Same sale updated from:
    - Tab 1: pending 400 → 600
    - Tab 2: pending 400 → 500
    │
    ├─ First update processes (600)
    ├─ Second update sees old data (400)
    └─ Likely second update overwrites
    └─ (Normal concurrent behavior)
```

---

## Benefits Summary

```
┌─────────────────────────────────────────┐
│          BEFORE vs AFTER                 │
├─────────────────────────────────────────┤
│ Action: Add Sale with Udhari            │
│ BEFORE: Manual borrowing entry needed   │
│ AFTER:  Auto-synced ✓                   │
│                                         │
│ Action: Increase Pending                │
│ BEFORE: Manual borrowing update needed  │
│ AFTER:  Auto-synced ✓                   │
│                                         │
│ Action: Decrease Pending                │
│ BEFORE: Manual borrowing update needed  │
│ AFTER:  Auto-synced ✓                   │
│                                         │
│ Action: Pay Fully                       │
│ BEFORE: Manual borrowing deletion       │
│ AFTER:  Auto-deleted ✓                  │
│                                         │
│ Result: Less manual work, fewer errors  │
│         Instant sync, real-time updates │
│         No duplicate entries            │
│         Always in sync ✓                │
└─────────────────────────────────────────┘
```

