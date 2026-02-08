import { useState } from "react";
import { useLocation } from "wouter";
import { Store, ArrowRight, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function Login() {
  const [_, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("shopOwner", data.username);
      setLocation("/");
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.username}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not log in. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    loginMutation.mutate(username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary rotate-3 hover:rotate-6 transition-transform duration-300">
            <Store className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">ShopKeeper</h1>
          <p className="text-muted-foreground">Manage your sales, customers, and udhaar in one place.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-slate-700 ml-1">
              Shop Owner Name
            </label>
            <input
              id="username"
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim() || loginMutation.isPending}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                Start Dashboard
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Simple, secure, and made for small businesses.
        </p>
      </div>
    </div>
  );
}
