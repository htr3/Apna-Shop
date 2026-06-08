import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import OtpLogin from "@/pages/OtpLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Borrowings from "@/pages/Borrowings";
import Sales from "@/pages/Sales";
import Products from "@/pages/Products";
import PaymentSettings from "@/pages/PaymentSettings";
import { I18nProvider } from "@/i18n/I18nContext";
import Signup from "@/pages/Signup";

// Auth Guard Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();
  const user = localStorage.getItem("shopOwner");

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }
  }, [user, setLocation]);

  if (!user) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/login/otp" component={OtpLogin} />
      <Route path="/forgot-password" component={ForgotPassword} />
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
        <ProtectedRoute component={PaymentSettings} />
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
