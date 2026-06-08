import QRCode from "qrcode";

export function buildUpiUri(paymentSettings: any, label: string, amount: number): string | null {
  const upiId = paymentSettings?.ownerUpiId;
  if (!upiId || paymentSettings?.enableUpi === false) return null;
  const payeeName = paymentSettings?.ownerUpiName || localStorage.getItem("shopOwner") || "Apna Shop";
  const params = new URLSearchParams({ pa: upiId, pn: payeeName, cu: "INR", tn: label });
  if (amount > 0) params.set("am", amount.toFixed(2));
  return `upi://pay?${params.toString()}`;
}

export async function openUpiQrWindow(opts: {
  paymentSettings: any;
  label: string;
  amount: number;
}): Promise<{ ok: boolean; error?: string }> {
  const upiUri = buildUpiUri(opts.paymentSettings, opts.label, opts.amount);
  if (!upiUri) return { ok: false, error: "UPI not configured" };
  try {
    const qrDataUrl = await QRCode.toDataURL(upiUri, { width: 320, margin: 1 });
    const payeeName = opts.paymentSettings?.ownerUpiName || localStorage.getItem("shopOwner") || "Apna Shop";
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Pay QR — ${opts.label}</title>
      <style>body{font-family:'Segoe UI',Arial,sans-serif;text-align:center;padding:32px;color:#1e293b}
      h1{font-size:20px;margin:0 0 4px}.upi{color:#64748b;font-size:13px;margin:4px 0 16px}
      .amt{font-size:28px;font-weight:700;margin:12px 0}img{border:1px solid #e2e8f0;border-radius:12px;padding:8px}
      .hint{color:#94a3b8;font-size:12px;margin-top:14px}</style></head>
      <body><h1>${payeeName}</h1><div class="upi">${opts.paymentSettings?.ownerUpiId}</div>
      <div class="amt">₹${opts.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      <img src="${qrDataUrl}" alt="UPI QR"/>
      <div class="hint">Scan with any UPI app (GPay, PhonePe, Paytm) to pay</div></body></html>`;
    const win = window.open("", "_blank", "width=400,height=560");
    if (!win) return { ok: false, error: "Popup blocked" };
    win.document.open();
    win.document.write(html);
    win.document.close();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not generate QR code" };
  }
}
