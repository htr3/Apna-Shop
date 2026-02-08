# Code Changes - Staff Implementation

## File 1: server/db.ts

### Added: User Seeding Function

```typescript
// Seed default users (Owner + Staff)
export async function seedUsers() {
  try {
    if (!process.env.DATABASE_URL) {
      console.log("Skipping user seeding: DATABASE_URL not set");
      return;
    }

    // Check if owner already exists
    const existingOwner = await db.query.users.findFirst({
      where: (field, { eq }) => eq(field.username, "owner"),
    });

    if (existingOwner) {
      console.log("Default users already seeded");
      return;
    }

    // Create default owner
    await db.insert(schema.users).values({
      username: "owner",
      password: "owner123", // In production, use proper hashing
      email: "owner@shopkeeper.local",
      role: "OWNER",
      isActive: true,
    });

    // Create default staff users
    await db.insert(schema.users).values([
      {
        username: "staff1",
        password: "staff123",
        email: "staff1@shopkeeper.local",
        role: "STAFF",
        isActive: true,
      },
      {
        username: "staff2",
        password: "staff123",
        email: "staff2@shopkeeper.local",
        role: "STAFF",
        isActive: true,
      },
    ]);

    console.log("✓ Default users seeded (owner, staff1, staff2)");
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique constraint, already exists
      console.log("Users already exist, skipping seed");
    } else {
      console.error("Error seeding users:", error);
    }
  }
}
```

---

## File 2: server/index.ts

### Changed: Call seedUsers on startup

```typescript
// BEFORE
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { schedulerService } from "./services/schedulerService";

// AFTER
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { schedulerService } from "./services/schedulerService";
import { seedUsers } from "./db";  // ← ADDED

// ... rest of code ...

// BEFORE
(async () => {
  await registerRoutes(httpServer, app);
  schedulerService.startAll();

// AFTER
(async () => {
  await seedUsers();  // ← ADDED: Seed users before routes
  await registerRoutes(httpServer, app);
  schedulerService.startAll();
```

---

## File 3: client/src/App.tsx

### Changed: Role-based route protection

```typescript
// BEFORE
import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();
  const user = localStorage.getItem("shopOwner");

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (!user) return null;
  return <Component />;
}

// AFTER
import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";  // ← Added useState

function ProtectedRoute({ 
  component: Component, 
  requiredRole  // ← NEW: optional role parameter
}: { 
  component: React.ComponentType;
  requiredRole?: string;
}) {
  const [location, setLocation] = useLocation();
  const user = localStorage.getItem("shopOwner");
  const userRole = localStorage.getItem("userRole");  // ← NEW: get role

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }
    
    // ← NEW: Check role-based access
    if (requiredRole && userRole !== requiredRole) {
      setLocation("/");
      return;
    }
  }, [user, userRole, setLocation, requiredRole]);  // ← Added userRole, requiredRole

  if (!user) return null;
  if (requiredRole && userRole !== requiredRole) return null;  // ← NEW: check role
  return <Component />;
}

// ← CHANGED: Added requiredRole to PaymentSettings
function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/customers">
        <ProtectedRoute component={Customers} />
      </Route>
      <Route path="/borrowings">
        <ProtectedRoute component={Borrowings} />
      </Route>
      <Route path="/sales">
        <ProtectedRoute component={Sales} />
      </Route>
      <Route path="/payment-settings">
        <ProtectedRoute component={PaymentSettings} requiredRole="OWNER" />
        {/* ↑ ONLY OWNER CAN ACCESS */}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}
```

---

## File 4: client/src/components/Layout.tsx

### Changed: Role-based navigation menu

```typescript
// BEFORE
export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  
  const handleLogout = () => {
    localStorage.removeItem("shopOwner");
    window.location.href = "/login";
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/sales", label: "Sales", icon: ShoppingBag },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/borrowings", label: "Udhaar", icon: CreditCard },
    { href: "/payment-settings", label: "Payment Settings", icon: Settings },
    // ↑ SHOWN TO EVERYONE
  ];

// AFTER
export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const userRole = localStorage.getItem("userRole");  // ← NEW: get role
  
  const handleLogout = () => {
    localStorage.removeItem("shopOwner");
    localStorage.removeItem("userRole");  // ← NEW: clear role
    localStorage.removeItem("userId");    // ← NEW: clear userId
    window.location.href = "/login";
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/sales", label: "Sales", icon: ShoppingBag },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/borrowings", label: "Udhaar", icon: CreditCard },
    // ← NEW: Payment Settings only for OWNER
    ...(userRole === "OWNER" ? [{ href: "/payment-settings", label: "Payment Settings", icon: Settings }] : []),
  ];
```

---

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `server/db.ts` | Added `seedUsers()` | Create default users on startup |
| `server/index.ts` | Call `seedUsers()` before routes | Ensure users exist before requests |
| `client/src/App.tsx` | Added `requiredRole` param | Protect admin routes (OWNER only) |
| `client/src/components/Layout.tsx` | Filter navItems by role | Hide Payment Settings from staff |

---

## Testing the Changes

### 1. Start server
```bash
npm run dev
```

### 2. Check console output
```
✓ Default users seeded (owner, staff1, staff2)
```

### 3. Open app and login as staff
- Username: `staff1`
- Password: `staff123`

### 4. Verify staff sees
- ✓ Dashboard
- ✓ Sales
- ✓ Customers
- ✓ Borrowings
- ✗ Payment Settings (hidden)

### 5. Logout and login as owner
- Username: `owner`
- Password: `owner123`

### 6. Verify owner sees
- ✓ Dashboard
- ✓ Sales
- ✓ Customers
- ✓ Borrowings
- ✓ Payment Settings (visible!)

---

## Lines of Code

- `server/db.ts`: ~60 lines added
- `server/index.ts`: 1 import + 1 function call (2 lines)
- `client/src/App.tsx`: ~8 lines modified
- `client/src/components/Layout.tsx`: ~3 lines modified

**Total:** ~75 lines added/modified across 4 files

All changes are **backwards compatible** and non-breaking.

