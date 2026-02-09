import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  CreditCard,
  Smartphone,
  Banknote,
  QrCode,
  Save,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentSettingsData {
  ownerUpiId?: string;
  ownerUpiName?: string;
  ownerPhoneNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  qrCodeUrl?: string;
  razorpayApiKey?: string;
  razorpayWebhookSecret?: string;
  enableUpi?: boolean;
  enableBankTransfer?: boolean;
  enableCard?: boolean;
  enableCash?: boolean;
}

export default function PaymentSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettingsData>({
    enableUpi: true,
    enableBankTransfer: false,
    enableCard: false,
    enableCash: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payment-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast({
        title: "Error",
        description: "Failed to load payment settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one payment method is enabled
    if (
      !settings.enableUpi &&
      !settings.enableBankTransfer &&
      !settings.enableCard &&
      !settings.enableCash
    ) {
      toast({
        title: "Error",
        description: "Enable at least one payment method",
        variant: "destructive",
      });
      return;
    }

    // Validate UPI fields if enabled
    if (settings.enableUpi && !settings.ownerUpiId) {
      toast({
        title: "Error",
        description: "UPI ID is required when UPI is enabled",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment settings saved successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save payment settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900">
            Payment Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure how customers can pay you
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Payment Methods */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              Enabled Payment Methods
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={settings.enableUpi || false}
                  onChange={(e) =>
                    setSettings({ ...settings, enableUpi: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-medium text-slate-900">UPI</div>
                  <div className="text-sm text-muted-foreground">
                    Direct UPI transfer
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={settings.enableBankTransfer || false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enableBankTransfer: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-medium text-slate-900">Bank Transfer</div>
                  <div className="text-sm text-muted-foreground">
                    Direct bank transfer
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={settings.enableCard || false}
                  onChange={(e) =>
                    setSettings({ ...settings, enableCard: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-medium text-slate-900">Card Payment</div>
                  <div className="text-sm text-muted-foreground">
                    Credit/Debit card
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={settings.enableCash || false}
                  onChange={(e) =>
                    setSettings({ ...settings, enableCash: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-medium text-slate-900">Cash</div>
                  <div className="text-sm text-muted-foreground">
                    Cash payment on delivery
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* UPI Details */}
          {settings.enableUpi && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                UPI Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    UPI ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="yourname@upi"
                    value={settings.ownerUpiId || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ownerUpiId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your UPI ID for receiving payments
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    UPI Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={settings.ownerUpiName || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ownerUpiName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Name displayed for UPI payments
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={settings.ownerPhoneNumber || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ownerPhoneNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Phone number for receiving UPI payments (optional)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details */}
          {settings.enableBankTransfer && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Banknote className="h-5 w-5 text-primary" />
                Bank Transfer Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="State Bank of India"
                    value={settings.bankName || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="6789012345"
                    value={settings.bankAccountNumber || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankAccountNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="SBIN0001234"
                    value={settings.bankIfsc || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankIfsc: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <QrCode className="h-5 w-5 text-primary" />
              Payment QR Code
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                QR Code (Base64 or URL)
              </label>
              <textarea
                placeholder="Paste base64 encoded QR code or image URL"
                value={settings.qrCodeUrl || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    qrCodeUrl: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be displayed to customers for quick payment
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium">
                Keep your payment details secure
              </p>
              <p className="text-xs text-blue-800 mt-1">
                Your UPI ID and bank details will be visible to customers. Never share sensitive information like passwords or OTPs with anyone.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={fetchSettings}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
