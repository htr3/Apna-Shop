import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, ArrowRight, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"REQUEST" | "RESET">("REQUEST");
  const [mobileNo, setMobileNo] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.requestPasswordReset.path, {
        method: api.auth.requestPasswordReset.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: mobileNo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Failed to request OTP" }));
        throw new Error(data.message || "Failed to request OTP");
      }
      return res.json();
    },
    onSuccess: () => {
      setStep("RESET");
      toast({ title: "OTP sent", description: "Check WhatsApp for your reset code." });
    },
    onError: (error: Error) => {
      toast({ title: "Request failed", description: error.message, variant: "destructive" });
    }
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.resetPassword.path, {
        method: api.auth.resetPassword.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: mobileNo, otp, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Failed to reset password" }));
        throw new Error(data.message || "Failed to reset password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password updated", description: "You can log in now." });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    }
  });

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNo.trim()) return;
    requestMutation.mutate();
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4 || newPassword.length < 6) return;
    resetMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Reset Password</h1>
          <p className="text-muted-foreground">Verify OTP to set a new password.</p>
        </div>

        {step === "REQUEST" ? (
          <form onSubmit={handleRequest} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Mobile Number</label>
              <input
                type="text"
                placeholder="9999999999"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!mobileNo.trim() || requestMutation.isPending}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Enter OTP</label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">New Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={otp.length < 4 || newPassword.length < 6 || resetMutation.isPending}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Password
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

