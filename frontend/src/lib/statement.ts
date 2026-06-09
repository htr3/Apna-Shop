import QRCode from "qrcode";
import { buildUpiUri } from "@/lib/upi";

export interface StatementEntry {
  date?: string | null;
  amount: string | number;
  notes?: string | null;
  dueDate?: string | null;
  status?: string | null;
}

export interface CustomerStatementOptions {
  customerName: string;
  customerPhone?: string | null;
  entries: StatementEntry[];
  paymentSettings?: any;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  autoPrint?: boolean;
}

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/**
 * Opens a printable per-customer account statement (Khatabook-style ledger) in a
 * new window. Users can "Save as PDF" from the browser print dialog.
 */
export async function openCustomerStatement(opts: CustomerStatementOptions): Promise<void> {
  const { customerName, customerPhone, entries, paymentSettings, toast, autoPrint = true } = opts;

  const shopName = localStorage.getItem("shopOwner") || "Apna Shop";
  const generatedOn = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Oldest first so the running balance reads top-to-bottom.
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
  );

  let running = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  const rows = sorted
    .map((e) => {
      const amt = Number(e.amount) || 0;
      const isCredit = amt < 0; // payment received
      const debit = isCredit ? 0 : amt;
      const credit = isCredit ? Math.abs(amt) : 0;
      running += amt;
      totalDebit += debit;
      totalCredit += credit;
      const label = e.notes && !e.notes.includes("Auto-created") ? e.notes : isCredit ? "Payment received" : "Udhaar";
      return `
        <tr>
          <td>${fmtDate(e.date)}</td>
          <td>${label}${e.dueDate && !isCredit ? `<span class="due">Due: ${fmtDate(e.dueDate)}</span>` : ""}</td>
          <td class="num debit">${debit > 0 ? fmt(debit) : ""}</td>
          <td class="num credit">${credit > 0 ? fmt(credit) : ""}</td>
          <td class="num bal">${fmt(running)}</td>
        </tr>`;
    })
    .join("");

  const outstanding = Math.max(0, running);

  let qrBlock = "";
  const upiUri = outstanding > 0 ? buildUpiUri(paymentSettings, `Statement — ${customerName}`, outstanding) : null;
  if (upiUri) {
    try {
      const qrDataUrl = await QRCode.toDataURL(upiUri, { width: 220, margin: 1 });
      qrBlock = `
  <div class="qr">
    <img src="${qrDataUrl}" alt="UPI QR" />
    <p>Scan to pay ${fmt(outstanding)} via UPI</p>
    <p class="upi">${paymentSettings?.ownerUpiId}</p>
  </div>`;
    } catch {
      qrBlock = "";
    }
  }

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Statement — ${customerName}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px; }
  .sheet { max-width: 720px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
  .header h1 { margin: 0; font-size: 24px; }
  .header .sub { font-size: 13px; color: #64748b; margin-top: 2px; }
  .header .right { text-align: right; font-size: 12px; color: #64748b; }
  .party { background: #f8fafc; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; }
  .party .name { font-size: 16px; font-weight: 700; }
  .party .phone { font-size: 13px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 10px; text-align: left; }
  thead th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
  tbody td { border-bottom: 1px solid #eef2f7; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .debit { color: #dc2626; }
  .credit { color: #16a34a; }
  .bal { font-weight: 600; }
  .due { display: block; font-size: 11px; color: #ea580c; }
  .summary { margin-top: 18px; display: flex; gap: 12px; justify-content: flex-end; }
  .summary .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; min-width: 140px; text-align: right; }
  .summary .box span { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; }
  .summary .box strong { font-size: 18px; }
  .summary .outstanding strong { color: #dc2626; }
  .qr { text-align: center; margin-top: 24px; border-top: 2px dashed #cbd5e1; padding-top: 16px; }
  .qr img { width: 180px; height: 180px; }
  .qr p { margin: 4px 0 0; font-size: 12px; color: #475569; }
  .qr .upi { font-size: 11px; color: #94a3b8; }
  .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1>${shopName}</h1>
        <div class="sub">Customer Account Statement</div>
      </div>
      <div class="right">Generated: ${generatedOn}</div>
    </div>
    <div class="party">
      <div class="name">${customerName}</div>
      ${customerPhone ? `<div class="phone">${customerPhone}</div>` : ""}
    </div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th class="num">Udhaar (Debit)</th>
          <th class="num">Paid (Credit)</th>
          <th class="num">Balance</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">No transactions</td></tr>`}</tbody>
    </table>
    <div class="summary">
      <div class="box"><span>Total Udhaar</span><strong>${fmt(totalDebit)}</strong></div>
      <div class="box"><span>Total Paid</span><strong>${fmt(totalCredit)}</strong></div>
      <div class="box outstanding"><span>Outstanding</span><strong>${fmt(outstanding)}</strong></div>
    </div>
    ${qrBlock}
    <div class="footer">This is a computer-generated statement.</div>
  </div>
  ${autoPrint ? `<script>window.onload = function() { window.print(); }</script>` : ""}
</body>
</html>`;

  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) {
    toast({ title: "Popup blocked", description: "Allow popups to view the statement", variant: "destructive" });
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
