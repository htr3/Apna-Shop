import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Borrowings from "@/pages/Borrowings";
import Sales from "@/pages/Sales";
import Products from "@/pages/Products";
import PaymentSettings from "@/pages/PaymentSettings";
import { I18nProvider } from "@/i18n/I18nContext";

// Auth Guard Wrapper
function ProtectedRoute({ component: Component, requiredRole }: { component: React.ComponentType; requiredRole?: string }) {
  const [location, setLocation] = useLocation();
  const user = localStorage.getItem("shopOwner");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    // Check role-based access
    if (requiredRole && userRole !== requiredRole) {
      setLocation("/");
      return;
    }
  }, [user, userRole, setLocation, requiredRole]);

  if (!user) return null;
  if (requiredRole && userRole !== requiredRole) return null;
  return <Component />;
}

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
      <Route path="/products">
        <ProtectedRoute component={Products} />
      </Route>
      <Route path="/payment-settings">
        <ProtectedRoute component={PaymentSettings} requiredRole="OWNER" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
          <Toaster />
          <Router />
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
