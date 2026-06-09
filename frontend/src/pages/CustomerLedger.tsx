import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { buildUpiUri } from "@/lib/upi";
import { Loader2, AlertTriangle, Store } from "lucide-react";

interface LedgerEntry {
  date?: string | null;
  amount: string | number;
  notes?: string | null;
  dueDate?: string | null;
  status?: string | null;
}

interface LedgerResponse {
  customerName: string;
  shopName: string;
  outstanding: string | number;
  payment?: { enableUpi?: boolean; ownerUpiId?: string | null; ownerUpiName?: string | null };
  entries: LedgerEntry[];
}

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function CustomerLedger() {
  const [, params] = useRoute("/ledger/:token");
  const token = params?.token;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<LedgerResponse>({
    queryKey: [`/api/public/ledger/${token}`],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`/api/public/ledger/${token}`);
      if (!res.ok) throw new Error("Ledger not found");
      return res.json();
    },
  });

  const outstanding = Number(data?.outstanding || 0);
  const upiUri = useMemo(
    () =>
      data && outstanding > 0 && data.payment?.enableUpi !== false
        ? buildUpiUri(
            { ownerUpiId: data.payment?.ownerUpiId, ownerUpiName: data.payment?.ownerUpiName, enableUpi: data.payment?.enableUpi },
            `Udhaar — ${data.customerName}`,
            outstanding
          )
        : null,
    [data, outstanding]
  );

  useEffect(() => {
    if (upiUri) {
      QRCode.toDataURL(upiUri, { width: 240, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [upiUri]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
        <h1 className="text-xl font-bold text-slate-900">Link not valid</h1>
        <p className="text-slate-500 mt-1">This statement link is invalid or has expired.</p>
      </div>
    );
  }

  let running = 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Store className="h-4 w-4" />
            {data.shopName}
          </div>
          <p className="mt-4 text-sm opacity-90">Hello {data.customerName},</p>
          <p className="text-xs opacity-75 mt-1">Your outstanding balance</p>
          <p className="text-4xl font-bold mt-1">{fmt(outstanding)}</p>
        </div>

        {outstanding > 0 && upiUri && (
          <div className="p-6 border-b border-slate-100 text-center">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="UPI QR" className="mx-auto w-44 h-44 rounded-xl border border-slate-200 p-2" />
            )}
            <p className="text-sm text-slate-600 mt-3">Scan with any UPI app to pay</p>
            <a
              href={upiUri}
              className="inline-block mt-3 px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow hover:shadow-md transition-all"
            >
              Pay {fmt(outstanding)} via UPI
            </a>
            {data.payment?.ownerUpiId && (
              <p className="text-xs text-slate-400 mt-2">{data.payment.ownerUpiId}</p>
            )}
          </div>
        )}

        <div className="p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Transaction History</h2>
          <div className="divide-y divide-slate-100">
            {data.entries.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No transactions yet.</p>
            )}
            {data.entries.map((e, i) => {
              const amt = Number(e.amount) || 0;
              const isCredit = amt < 0;
              running += amt;
              return (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {e.notes && !e.notes.includes("Auto-created")
                        ? e.notes
                        : isCredit
                          ? "Payment received"
                          : "Udhaar"}
                    </p>
                    <p className="text-xs text-slate-400">{fmtDate(e.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isCredit ? "text-emerald-600" : "text-slate-900"}`}>
                      {isCredit ? "− " : "+ "}
                      {fmt(Math.abs(amt))}
                    </p>
                    <p className="text-xs text-slate-400">Bal: {fmt(Math.max(0, running))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 text-center text-xs text-slate-400">
          Powered by {data.shopName} · Apna Shop
        </div>
      </div>
    </div>
  );
}
