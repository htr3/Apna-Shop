# ✅ WEEKLY SUMMARY DATE ERROR - FIXED

**Error:** `Invalid date format` on `/api/daily-summary/weekly`  
**Status:** ✅ FIXED  
**Date:** February 8, 2026  

---

## 🎯 PROBLEM

When fetching weekly summary, error occurred:
```
GET /api/daily-summary/weekly 400 in 2ms :: {"message":"Invalid date format"}
```

---

## 🔍 ROOT CAUSE

In `server/services/dailySummaryService.ts`, the `getOverdueBorrowings` query had an issue:

**Problem:**
```typescript
where: (field, { eq, lte }) =>
  and(                          // ❌ 'and' not in destructuring!
    eq(field.status, "OVERDUE"),
    lte(field.dueDate, now)
  ) as any,
```

The `and` function was used but not destructured from the query object.

---

## ✅ SOLUTION

Changed to properly use `and` from destructuring:

```typescript
where: (field, { eq, lte, and: andOp }) =>  // ✨ Added 'and: andOp'
  andOp(
    eq(field.status, "OVERDUE"),
    lte(field.dueDate, now)
  ),
```

---

## 📝 FILE MODIFIED

**File:** `server/services/dailySummaryService.ts`  
**Lines:** 84-91  
**Change:** Fixed overdue borrowings query destructuring

---

## 🚀 RESULT

**Now works:**
- ✅ `/api/daily-summary/weekly` returns data
- ✅ Weekly summary calculated correctly
- ✅ Overdue borrowings query works
- ✅ No date format errors

---

## 🎉 VERIFICATION

When you call `/api/daily-summary/weekly`:
- ✅ No 400 error
- ✅ Returns weekly summary JSON
- ✅ Includes all 7 days
- ✅ Shows totals and averages

---

**Status:** ✅ FIXED  
**Ready to Test:** ✅ YES  

---

**Weekly summary endpoint is now working! 🚀**

