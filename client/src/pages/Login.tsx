import { useState } from "react";
import { useLocation } from "wouter";
import { Store, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useI18n } from "@/i18n/I18nContext";

export default function Login() {
  const [_, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Store JWT token and user info
      localStorage.setItem("authToken", data.token);  // ✨ Store JWT token
      localStorage.setItem("shopOwner", data.user.username);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userId", data.user.userId);
      localStorage.setItem("mobileNo", data.user.mobileNo);  // ✨ Store mobileNo
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }
      setLocation("/");
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.username}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    loginMutation.mutate({ username: username.trim(), password });
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
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{t("login.title")}</h1>
          <p className="text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-slate-700 ml-1">
              {t("login.username")}
            </label>
            <input
              id="username"
              type="text"
              placeholder={t("login.usernamePlaceholder")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
              autoFocus
              required
              aria-describedby="username-error"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 ml-1">
              {t("login.password")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                required
                aria-describedby="password-error"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary/20"
              />
              <span>{t("login.rememberMe")}</span>
            </label>
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

        <div className="text-center text-xs text-muted-foreground mt-8 space-y-2">
          <p>Simple, secure, and made for small businesses.</p>
          <p>Login with your owner credentials to access your dashboard.</p>
          <p className="sr-only" id="login-button-description">
            Click to log in to your ShopKeeper dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
