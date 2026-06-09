import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Layout } from "@/components/Layout";
import { useSales, useCustomers, useCreateSale, useProducts, useUpdateSale, useDeleteSale } from "@/hooks/use-shop";
import {
  Plus,
  Search,
  ShoppingBag,
  CreditCard,
  Banknote,
  Globe,
  Loader2,
  X,
  Edit2,
  Trash2,
  Receipt,
  QrCode,
  ScanLine
} from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSaleSchema, type InsertSale } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

type BillSale = {
  id?: number | null;
  items?: any;
  amount: number | string;
  discount?: number | string;
  discountType?: string;
  discountValue?: number | string;
  paidAmount?: number | string;
  pendingAmount?: number | string;
  date?: string | Date;
  customerName?: string | null;
  paymentMethod?: string;
};

function buildUpiUri(paymentSettings: any, billNo: string, amount: number): string | null {
  const upiId = paymentSettings?.ownerUpiId;
  if (!upiId || paymentSettings?.enableUpi === false) return null;
  const payeeName = paymentSettings?.ownerUpiName || localStorage.getItem("shopOwner") || "Apna Shop";
  const params = new URLSearchParams({ pa: upiId, pn: payeeName, cu: "INR", tn: `Bill #${billNo}` });
  if (amount > 0) params.set("am", amount.toFixed(2));
  return `upi://pay?${params.toString()}`;
}

async function openUpiQr(opts: { paymentSettings: any; billNo: string; amount: number; toast: any }) {
  const { paymentSettings, billNo, amount, toast } = opts;
  const upiUri = buildUpiUri(paymentSettings, billNo, amount);
  if (!upiUri) {
    toast({
      title: "UPI not configured",
      description: "Add your UPI ID in Payment Settings to generate a pay QR.",
      variant: "destructive",
    });
    return;
  }
  try {
    const qrDataUrl = await QRCode.toDataURL(upiUri, { width: 320, margin: 1 });
    const payeeName = paymentSettings?.ownerUpiName || localStorage.getItem("shopOwner") || "Apna Shop";
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Pay QR — Bill #${billNo}</title>
      <style>body{font-family:'Segoe UI',Arial,sans-serif;text-align:center;padding:32px;color:#1e293b}
      h1{font-size:20px;margin:0 0 4px}.upi{color:#64748b;font-size:13px;margin:4px 0 16px}
      .amt{font-size:28px;font-weight:700;margin:12px 0}img{border:1px solid #e2e8f0;border-radius:12px;padding:8px}
      .hint{color:#94a3b8;font-size:12px;margin-top:14px}</style></head>
      <body><h1>${payeeName}</h1><div class="upi">${paymentSettings?.ownerUpiId}</div>
      <div class="amt">₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      <img src="${qrDataUrl}" alt="UPI QR"/>
      <div class="hint">Scan with any UPI app (GPay, PhonePe, Paytm) to pay</div></body></html>`;
    const win = window.open("", "_blank", "width=400,height=560");
    if (!win) {
      toast({ title: "Popup blocked", description: "Allow popups to show the QR", variant: "destructive" });
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  } catch {
    toast({ title: "Error", description: "Could not generate QR code", variant: "destructive" });
  }
}

async function openSaleBill(opts: { sale: BillSale; paymentSettings: any; toast: any; autoPrint?: boolean; qrAmountOverride?: number }) {
  const { sale, paymentSettings, toast, autoPrint = true, qrAmountOverride } = opts;
  let items: Array<{ productName: string; quantity: number; price: number }> = [];
  try {
    const parsed = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    items = [];
  }

  const shopName = localStorage.getItem("shopOwner") || "Apna Shop";
  const billNo = sale.id ? String(sale.id).padStart(5, "0") : "DRAFT";
  const dateStr = format(new Date(sale.date || Date.now()), "MMM dd, yyyy • hh:mm a");
  const discount = Number(sale.discount || 0);
  const total = Number(sale.amount || 0);
  const subtotal = total + discount;
  const paid = Number(sale.paidAmount || 0);
  const pending = Number(sale.pendingAmount || 0);
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const itemRows = items.length > 0
    ? items.map((it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${it.productName ?? "Item"}</td>
          <td class="num">${it.quantity}</td>
          <td class="num">${fmt(Number(it.price) || 0)}</td>
          <td class="num">${fmt((Number(it.price) || 0) * (Number(it.quantity) || 0))}</td>
        </tr>`).join("")
    : `<tr><td colspan="5" class="muted center">No itemized products — total sale amount only</td></tr>`;

  const discountLabel = sale.discountType === "PERCENT" && Number(sale.discountValue) > 0
    ? `Discount (${Number(sale.discountValue)}%)`
    : "Discount";

  const qrAmount = qrAmountOverride !== undefined ? qrAmountOverride : (pending > 0 ? pending : total);
  const upiUri = buildUpiUri(paymentSettings, billNo, qrAmount);
  let qrBlock = "";
  if (upiUri) {
    try {
      const qrDataUrl = await QRCode.toDataURL(upiUri, { width: 220, margin: 1 });
      qrBlock = `
  <div class="qr">
    <img src="${qrDataUrl}" alt="UPI QR" />
    <p>Scan to pay ${fmt(qrAmount)} via UPI</p>
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
<title>Bill #${billNo}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; }
  .bill { max-width: 360px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px; }
  .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
  .header p { margin: 2px 0; font-size: 12px; color: #64748b; }
  .meta { font-size: 12px; color: #475569; margin-bottom: 12px; }
  .meta div { display: flex; justify-content: space-between; margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 6px 4px; text-align: left; }
  thead th { border-bottom: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #64748b; }
  tbody td { border-bottom: 1px dotted #e2e8f0; }
  .num { text-align: right; }
  .center { text-align: center; }
  .muted { color: #94a3b8; }
  .totals { margin-top: 12px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
  .totals .grand { border-top: 2px dashed #cbd5e1; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: 700; }
  .totals .discount { color: #16a34a; }
  .totals .pending { color: #ea580c; }
  .qr { text-align: center; margin-top: 16px; border-top: 2px dashed #cbd5e1; padding-top: 12px; }
  .qr img { width: 160px; height: 160px; }
  .qr p { margin: 4px 0 0; font-size: 12px; color: #475569; }
  .qr .upi { font-size: 11px; color: #94a3b8; }
  .footer { text-align: center; margin-top: 18px; font-size: 12px; color: #64748b; border-top: 2px dashed #cbd5e1; padding-top: 12px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="bill">
    <div class="header">
      <h1>${shopName}</h1>
      <p>Sales Receipt</p>
    </div>
    <div class="meta">
      <div><span>Bill No:</span><span>#${billNo}</span></div>
      <div><span>Date:</span><span>${dateStr}</span></div>
      <div><span>Customer:</span><span>${sale.customerName || "Walk-in"}</span></div>
      <div><span>Payment:</span><span>${(sale.paymentMethod || "CASH")}</span></div>
    </div>
    <table>
      <thead>
        <tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="totals">
      ${discount > 0 ? `<div><span>Subtotal</span><span>${fmt(subtotal)}</span></div>` : ""}
      ${discount > 0 ? `<div class="discount"><span>${discountLabel}</span><span>− ${fmt(discount)}</span></div>` : ""}
      <div class="grand"><span>Total</span><span>${fmt(total)}</span></div>
      <div><span>Paid</span><span>${fmt(paid)}</span></div>
      ${pending > 0 ? `<div class="pending"><span>Pending (Udhari)</span><span>${fmt(pending)}</span></div>` : ""}
    </div>
    ${qrBlock}
    <div class="footer">
      Thank you for your business!
    </div>
  </div>
  ${autoPrint ? `<script>window.onload = function() { window.print(); }</script>` : ""}
</body>
</html>`;

  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) {
    toast({ title: "Popup blocked", description: "Allow popups to view the bill", variant: "destructive" });
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export default function Sales() {
  const { data: sales, isLoading } = useSales();
  const { data: paymentSettings } = useQuery<any>({
    queryKey: ["/api/payment-settings"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/payment-settings", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return res.json();
    },
  });
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const now = new Date();
  const [filterMode, setFilterMode] = useState<"today" | "date" | "month" | "year" | "all">("today");
  const [filterDate, setFilterDate] = useState(format(now, "yyyy-MM-dd"));
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));

  const ROW_LIMIT = 100;

  const availableYears = Array.from(
    new Set((sales || []).map(s => s.date ? new Date(s.date).getFullYear() : now.getFullYear()))
  ).sort((a, b) => b - a);
  if (!availableYears.includes(now.getFullYear())) availableYears.unshift(now.getFullYear());

  const matchesDate = (s: any) => {
    const d = new Date(s.date || "");
    if (isNaN(d.getTime())) return filterMode === "all";
    switch (filterMode) {
      case "all": return true;
      case "today": return isSameDay(d, new Date());
      case "date": return format(d, "yyyy-MM-dd") === filterDate;
      case "month": return d.getMonth() + 1 === Number(filterMonth) && d.getFullYear() === Number(filterYear);
      case "year": return d.getFullYear() === Number(filterYear);
      default: return true;
    }
  };

  const matchesSearch = (s: any) =>
    s.amount.includes(search) ||
    s.paymentMethod?.toLowerCase().includes(search.toLowerCase()) ||
    (s.customerName || "").toLowerCase().includes(search.toLowerCase());

  const matchedSales = (sales || []).filter(s => matchesSearch(s) && matchesDate(s));
  const filteredTotal = matchedSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const filteredSales = matchedSales.slice(0, ROW_LIMIT);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Sales History</h1>
          <p className="text-muted-foreground mt-1">Track daily transactions and revenue.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span>New Sale</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
                <DialogDescription>Enter sale amount and payment method.</DialogDescription>
              </DialogHeader>
              <AddSaleForm onSuccess={() => setIsOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {([
              { id: "today", label: "Today" },
              { id: "date", label: "By Date" },
              { id: "month", label: "By Month" },
              { id: "year", label: "By Year" },
              { id: "all", label: "All" },
            ] as const).map(opt => (
              <button
                key={opt.id}
                onClick={() => setFilterMode(opt.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                  filterMode === opt.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filterMode === "date" && (
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            )}
            {filterMode === "month" && (
              <>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  {monthNames.map((m, i) => (
                    <option key={m} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  {availableYears.map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </>
            )}
            {filterMode === "year" && (
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {availableYears.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            )}
          </div>

          <div className="lg:ml-auto text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{matchedSales.length}</span> sales
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-green-600">₹{filteredTotal.toLocaleString()}</span>
            {matchedSales.length > ROW_LIMIT && (
              <span className="ml-2 text-xs text-amber-600">(showing first {ROW_LIMIT})</span>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center mt-6">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredSales?.length === 0 ? (
        <div className="mt-6 bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <ShoppingBag className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No sales recorded</h3>
          <p className="text-muted-foreground mt-1">Start recording your daily sales here.</p>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Created By</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount Paid</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount Pending</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Method</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Products</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales?.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} paymentSettings={paymentSettings} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

function AddSaleForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const createSale = useCreateSale();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { data: paymentSettings } = useQuery<any>({
    queryKey: ["/api/payment-settings"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/payment-settings", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return res.json();
    },
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [saleAmount, setSaleAmount] = useState<string>("0");
  const [paidAmount, setPaidAmount] = useState<string>("0");
  const [pendingAmount, setPendingAmount] = useState<string>("0");
  const [discountValue, setDiscountValue] = useState<string>("0");
  const [discountType, setDiscountType] = useState<"RUPEES" | "PERCENT">("RUPEES");

  // Product states
  const [items, setItems] = useState<Array<{ productId?: number; productName: string; quantity: number; price: number }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isOtherProduct, setIsOtherProduct] = useState(false);
  const [otherProductName, setOtherProductName] = useState("");
  const [otherProductPrice, setOtherProductPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  // Resolve a scanned barcode to a product and add it to the sale (or bump its qty).
  const handleScanDetect = (code: string) => {
    setScanOpen(false);
    const scanned = code.trim();
    const match = (products || []).find((p) => (p.barcode || "").trim() === scanned);
    if (!match) {
      setProductSearch(scanned);
      setShowProductDropdown(true);
      toast({
        title: "No product found",
        description: `No product matches barcode ${scanned}. Search by name or add it as "Other".`,
        variant: "destructive",
      });
      return;
    }
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.productId === match.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { productId: match.id, productName: match.name, quantity: 1, price: Number(match.price) }];
    });
    toast({ title: "Added to sale", description: `${match.name} (₹${Number(match.price).toFixed(2)})` });
  };

  const productMatches = (products || []).filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const form = useForm<InsertSale>({
    resolver: zodResolver(insertSaleSchema),
    defaultValues: {
      amount: "0",
      paidAmount: "0",
      pendingAmount: "0",
      paymentMethod: "CASH",
      date: new Date(),
      customerId: undefined,
    }
  });

  const filteredCustomers = customers?.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  // Subtotal comes from added products, or the manually entered sale amount.
  const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const subtotal = itemsTotal > 0 ? itemsTotal : Number(saleAmount || 0);
  const discountAmount = Math.min(
    subtotal,
    Math.max(
      0,
      discountType === "PERCENT"
        ? (subtotal * Number(discountValue || 0)) / 100
        : Number(discountValue || 0)
    )
  );
  const effectiveTotal = Math.max(0, subtotal - discountAmount);
  const totalAmount = effectiveTotal.toFixed(2);
  const payingNow = Math.max(0, effectiveTotal - Number(pendingAmount || 0));

  const getDraftSale = (): BillSale => ({
    id: null,
    items,
    amount: effectiveTotal,
    discount: discountAmount,
    discountType,
    discountValue: Number(discountValue || 0),
    paidAmount: payingNow,
    pendingAmount: Number(pendingAmount || 0),
    date: new Date(),
    customerName: selectedCustomer?.name,
    paymentMethod: form.getValues("paymentMethod") || "CASH",
  });

  const handlePreviewBill = () => {
    if (subtotal === 0) {
      toast({ title: "Nothing to bill", description: "Add products or a sale amount first", variant: "destructive" });
      return;
    }
    const qrAmount = payingNow > 0 ? payingNow : effectiveTotal;
    openSaleBill({ sale: getDraftSale(), paymentSettings, toast, autoPrint: false, qrAmountOverride: qrAmount });
  };

  const handlePreviewQr = () => {
    if (effectiveTotal === 0) {
      toast({ title: "Nothing to pay", description: "Add products or a sale amount first", variant: "destructive" });
      return;
    }
    const amount = payingNow > 0 ? payingNow : effectiveTotal;
    openUpiQr({ paymentSettings, billNo: "DRAFT", amount, toast });
  };

  const addProduct = () => {
    let productId: number | undefined;
    let productName = "";
    let productPrice = 0;

    if (isOtherProduct) {
      if (!otherProductPrice) {
        toast({
          title: "Invalid Price",
          description: "Please enter the price for other product",
          variant: "destructive"
        });
        return;
      }
      productName = otherProductName.trim() ? otherProductName.trim() : "Other";
      productPrice = Number(otherProductPrice);
    } else {
      if (!selectedProductId) {
        toast({
          title: "Invalid Product",
          description: "Please select a product",
          variant: "destructive"
        });
        return;
      }

      const product = products?.find(p => p.id === Number(selectedProductId));
      if (!product) return;

      productId = product.id;
      productName = product.name;
      productPrice = Number(product.price);
    }

    if (Number(quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    setItems([
      ...items,
      { productId, productName, quantity: Number(quantity), price: productPrice }
    ]);

    // Reset fields
    setSelectedProductId("");
    setProductSearch("");
    setOtherProductName("");
    setOtherProductPrice("");
    setQuantity("1");
    setIsOtherProduct(false);
  };

  const removeProduct = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onSubmit = (data: InsertSale) => {
    if (subtotal === 0) {
      toast({
        title: "Invalid Sale",
        description: "Please add products or a sale amount",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...data,
      amount: totalAmount,
      paidAmount: payingNow.toString(),
      pendingAmount: pendingAmount, // ✨ Always include pending amount - syncs to Udhari
      customerId: selectedCustomerId || undefined,
      items: JSON.stringify(items.length > 0 ? items : []), // Store items as JSON
      discount: discountAmount.toFixed(2),
      discountType: discountType,
      discountValue: Number(discountValue || 0).toString(),
    };

    createSale.mutate(submitData as any, {
      onSuccess: () => {
        toast({ title: "Success", description: "Sale recorded successfully" });
        setSelectedCustomerId(null);
        setCustomerSearch("");
        setSaleAmount("0");
        setPaidAmount("0");
        setPendingAmount("0");
        setDiscountValue("0");
        setDiscountType("RUPEES");
        setItems([]);
        form.reset();
        onSuccess();
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Customer (Optional)</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setShowCustomerDropdown(true);
            }}
            onFocus={() => setShowCustomerDropdown(true)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />

          {selectedCustomer && (
            <button
              type="button"
              onClick={() => {
                setSelectedCustomerId(null);
                setCustomerSearch("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {showCustomerDropdown && customerSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
              {filteredCustomers?.length === 0 ? (
                <div className="p-3 text-sm text-slate-500 text-center">No customers found</div>
              ) : (
                filteredCustomers?.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setCustomerSearch(customer.name);
                      setShowCustomerDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <div className="font-medium text-slate-900">{customer.name}</div>
                    <div className="text-xs text-slate-500">{customer.phone}</div>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedCustomer && (
            <p className="mt-1 text-xs text-slate-500">{selectedCustomer.phone}</p>
          )}
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-900">📦 Products Sold</h3>
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            title="Scan a product barcode with your camera"
          >
            <ScanLine className="h-4 w-4" />
            Scan
          </button>
        </div>

        {items.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-900">{item.productName}</p>
                  <p className="text-xs text-slate-500">{item.quantity} × ₹{item.price.toLocaleString()} = ₹{(item.quantity * item.price).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(idx)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-300">
          <div className="grid grid-cols-1 gap-2">
            {/* Product Selection */}
            {!isOtherProduct ? (
              <>
                <label className="text-xs font-medium text-slate-600">Select Product</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or choose a product..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedProductId("");
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {(productSearch || selectedProductId) && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch("");
                        setSelectedProductId("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {showProductDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-52 overflow-y-auto">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setIsOtherProduct(true);
                          setOtherProductName(productSearch.trim());
                          setSelectedProductId("");
                          setShowProductDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-primary/5 border-b border-slate-100 sticky top-0 bg-white"
                      >
                        + Other Product{productSearch.trim() ? ` — "${productSearch.trim()}"` : " (type name & price)"}
                      </button>
                      {productMatches.length === 0 ? (
                        <div className="p-3 text-sm text-slate-500 text-center">No matching products — use "Other Product" above</div>
                      ) : (
                        productMatches.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSelectedProductId(String(product.id));
                              setProductSearch(product.name);
                              setShowProductDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex justify-between items-center gap-2",
                              selectedProductId === String(product.id) && "bg-primary/5"
                            )}
                          >
                            <span className="font-medium text-slate-800">{product.name}</span>
                            <span className="text-slate-500 whitespace-nowrap">₹{Number(product.price).toFixed(2)}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <label className="text-xs font-medium text-slate-600">Other Product (type name & price)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={otherProductName}
                    onChange={(e) => setOtherProductName(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price (₹)"
                    value={otherProductPrice}
                    onChange={(e) => setOtherProductPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtherProduct(false);
                      setOtherProductName("");
                      setOtherProductPrice("");
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Back to product list
                  </button>
                </div>
              </>
            )}

            {/* Quantity */}
            <div>
              <label className="text-xs font-medium text-slate-600">Quantity</label>
              <input
                type="number"
                placeholder="Qty"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="button"
              onClick={addProduct}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all"
            >
              Add to Sale
            </button>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <h3 className="font-medium text-slate-900">💰 Payment Details</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Discount (Optional)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                {(["RUPEES", "PERCENT"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDiscountType(type)}
                    className={cn(
                      "px-4 py-2.5 text-sm font-medium transition-all",
                      discountType === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {type === "RUPEES" ? "₹" : "%"}
                  </button>
                ))}
              </div>
            </div>
            {discountAmount > 0 && (
              <p className="text-xs text-green-600">Discount applied: −₹{discountAmount.toLocaleString()}</p>
            )}
          </div>

          {items.length === 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sale Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={saleAmount}
                onChange={(e) => {
                  const newTotal = Number(e.target.value || 0);
                  setSaleAmount(e.target.value);
                  if (Number(pendingAmount || 0) > newTotal) {
                    setPendingAmount(Math.max(0, newTotal).toString());
                  }
                }}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount Paid (₹)</label>
              <input
                type="number"
                step="0.01"
                value={payingNow}
                onChange={(e) => setPendingAmount(Math.min(effectiveTotal, Math.max(0, effectiveTotal - Number(e.target.value || 0))).toString())}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-green-600 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-red-600">Amount Pending (₹) - Udhari</label>
              <input
                type="number"
                step="0.01"
                value={pendingAmount}
                onChange={(e) => setPendingAmount(Math.min(effectiveTotal, Math.max(0, Number(e.target.value || 0))).toString())}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/40 text-red-600 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">Enter either amount — the other fills in automatically from the total.</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
        {discountAmount > 0 && (
          <div className="space-y-1 pb-2 border-b border-slate-200 text-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-green-600">
              <span>Discount{discountType === "PERCENT" ? ` (${Number(discountValue || 0)}%)` : ""}</span>
              <span>−₹{discountAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-slate-900">₹{Number(totalAmount).toLocaleString()}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handlePreviewBill}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Receipt className="h-4 w-4" />
            View Bill
          </button>
          <button
            type="button"
            onClick={handlePreviewQr}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <QrCode className="h-4 w-4" />
            Show QR
          </button>
        </div>
        {Number(pendingAmount) > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">Paying Now</div>
              <div className="text-lg font-bold text-green-600">₹{payingNow.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-0.5">Udhari (Pending)</div>
              <div className="text-lg font-bold text-orange-600">₹{Number(pendingAmount).toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Payment Method</label>
        <div className="grid grid-cols-3 gap-2">
          {["CASH", "ONLINE", "CREDIT"].map((method) => (
            <label
              key={method}
              className={cn(
                "cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all",
                form.watch("paymentMethod") === method
                  ? "bg-primary/5 border-primary text-primary"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              )}
            >
              <input
                type="radio"
                value={method}
                {...form.register("paymentMethod")}
                className="hidden"
              />
              {method === "CASH" && <Banknote className="h-5 w-5" />}
              {method === "ONLINE" && <Globe className="h-5 w-5" />}
              {method === "CREDIT" && <CreditCard className="h-5 w-5" />}
              <span className="text-xs font-bold">{method}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
        <button
          type="submit"
          disabled={createSale.isPending || subtotal === 0}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {createSale.isPending ? "Recording..." : "Record Sale"}
        </button>
      </div>

      {scanOpen && (
        <BarcodeScanner
          title="Scan to Sell"
          subtitle="Scan a product barcode to add it to this sale"
          onClose={() => setScanOpen(false)}
          onDetect={handleScanDetect}
        />
      )}
    </form>
  );
}

function SaleRow({ sale, paymentSettings }: { sale: any; paymentSettings?: any }) {
  const { toast } = useToast();
  const updateSale = useUpdateSale();
  const deleteSale = useDeleteSale();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    paymentMethod: sale.paymentMethod || "CASH",
    paidAmount: sale.paidAmount || "0",
    pendingAmount: sale.pendingAmount || "0",
  });

  const handleShowQr = () => {
    const amount = Number(sale.pendingAmount || 0) > 0 ? Number(sale.pendingAmount) : Number(sale.amount || 0);
    openUpiQr({ paymentSettings, billNo: String(sale.id).padStart(5, "0"), amount, toast });
  };

  const handlePrintBill = () => {
    openSaleBill({ sale, paymentSettings, toast, autoPrint: true });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this sale? This action cannot be undone.")) {
      deleteSale.mutate(sale.id, {
        onSuccess: () => {
          toast({ title: "Success", description: "Sale deleted successfully" });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleUpdateSale = () => {
    updateSale.mutate({
      id: sale.id,
      data: {
        paymentMethod: editData.paymentMethod as any,
        paidAmount: editData.paidAmount,
        pendingAmount: editData.pendingAmount,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Sale updated successfully" });
        setIsEditOpen(false);
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <>
      <tr className="hover:bg-slate-50/50 transition-colors">
        <td className="px-6 py-4 text-sm text-slate-500">
          {format(new Date(sale.date || ""), "MMM dd, yyyy • hh:mm a")}
        </td>
        <td className="px-6 py-4 text-sm font-medium text-slate-700">
          {sale.customerName || "Walk-in"}
        </td>
        <td className="px-6 py-4 text-sm font-medium text-slate-700">
          {sale.createdByUserName || "Admin"}
        </td>
        <td className="px-6 py-4">
          <span className="font-bold text-green-600">₹{Number(sale.paidAmount || 0).toLocaleString()}</span>
        </td>
        <td className="px-6 py-4">
          <span className="font-bold text-orange-600">₹{Number(sale.pendingAmount || 0).toLocaleString()}</span>
        </td>
        <td className="px-6 py-4">
          <span className="font-bold text-slate-900">₹{Number(sale.amount).toLocaleString()}</span>
          {Number(sale.discount || 0) > 0 && (
            <div className="text-xs text-slate-400 line-through">₹{(Number(sale.amount) + Number(sale.discount)).toLocaleString()}</div>
          )}
          {Number(sale.discount || 0) > 0 && (
            <div className="text-xs font-medium text-green-600">
              −₹{Number(sale.discount).toLocaleString()}
              {sale.discountType === "PERCENT" && Number(sale.discountValue) > 0 ? ` (${Number(sale.discountValue)}%)` : ""} off
            </div>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {sale.paymentMethod === "CASH" && <Banknote className="h-4 w-4 text-green-600" />}
            {sale.paymentMethod === "ONLINE" && <Globe className="h-4 w-4 text-blue-600" />}
            {sale.paymentMethod === "CREDIT" && <CreditCard className="h-4 w-4 text-purple-600" />}
            <span className="font-medium capitalize">{sale.paymentMethod?.toLowerCase()}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-slate-600">📦 Tracked</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintBill}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              Bill
            </button>
            <button
              onClick={handleShowQr}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              QR
            </button>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Sale</DialogTitle>
                  <DialogDescription>Update sale details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["CASH", "ONLINE", "CREDIT"].map((method) => (
                        <button
                          key={method}
                          onClick={() => setEditData({ ...editData, paymentMethod: method })}
                          className={cn(
                            "py-2 px-3 rounded-lg border font-medium text-sm transition-all",
                            editData.paymentMethod === method
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {method === "CASH" && <Banknote className="h-4 w-4 inline mr-1" />}
                          {method === "ONLINE" && <Globe className="h-4 w-4 inline mr-1" />}
                          {method === "CREDIT" && <CreditCard className="h-4 w-4 inline mr-1" />}
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Amount Paid (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.paidAmount}
                        onChange={(e) => setEditData({ ...editData, paidAmount: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Amount Pending (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.pendingAmount}
                        onChange={(e) => setEditData({ ...editData, pendingAmount: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSale}
                    disabled={updateSale.isPending}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updateSale.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            <button
              onClick={handleDelete}
              disabled={deleteSale.isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}
