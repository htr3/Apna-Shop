import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  LogOut, 
  ShoppingBag,
  Store
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

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
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <Store className="h-6 w-6" />
          <span>ShopKeeper</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r h-screen sticky top-0 shadow-sm z-40">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 font-display text-2xl font-bold text-primary">
            <Store className="h-8 w-8" />
            <span>ShopKeeper</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 pl-10">Manage your business</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              )}>
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 flex justify-between items-center z-50 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
              isActive ? "text-primary" : "text-slate-400"
            )}>
              <item.icon className={cn("h-6 w-6", isActive && "fill-current/10")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-16 md:mb-0">
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
          {children}
        </div>
      </main>
    </div>
  );
}
