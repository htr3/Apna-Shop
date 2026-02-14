import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, ArrowRight, Phone } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function OtpLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.requestOtp.path, {
        method: api.auth.requestOtp.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Failed to request OTP" }));
        throw new Error(data.message || "Failed to request OTP");
      }
      return res.json();
    },
    onSuccess: () => {
      setStep("VERIFY");
      toast({ title: "OTP sent", description: "Check WhatsApp for your code." });
    },
    onError: (error: Error) => {
      toast({ title: "OTP request failed", description: error.message, variant: "destructive" });
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.verifyOtp.path, {
        method: api.auth.verifyOtp.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Failed to verify OTP" }));
        throw new Error(data.message || "Failed to verify OTP");
      }
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("shopOwner", data.user.username);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userId", data.user.userId);
      localStorage.setItem("mobileNo", data.user.mobileNo);
      setLocation("/");
      toast({ title: "Welcome back!", description: `Logged in as ${data.user.username}` });
    },
    onError: (error: Error) => {
      toast({ title: "OTP verification failed", description: error.message, variant: "destructive" });
    }
  });

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    requestMutation.mutate();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) return;
    verifyMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <Phone className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Login with OTP</h1>
          <p className="text-muted-foreground">Use WhatsApp OTP to sign in.</p>
        </div>

        {step === "REQUEST" ? (
          <form onSubmit={handleRequest} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Username or Mobile</label>
              <input
                type="text"
                placeholder="owner / 9999999999"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!identifier.trim() || requestMutation.isPending}
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
          <form onSubmit={handleVerify} className="space-y-6">
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

            <button
              type="submit"
              disabled={otp.length < 4 || verifyMutation.isPending}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep("REQUEST")}
              className="w-full text-sm text-slate-600 hover:underline"
            >
              Change phone/username
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

