import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useSales, useCustomers, useBorrowings, useProducts } from "@/hooks/use-shop";
import {
  BarChart3,
  TrendingUp,
  Wallet,
  AlertCircle,
  Package,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subDays, subMonths, differenceInCalendarDays } from "date-fns";

const LOW_STOCK_THRESHOLD = 10;
const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#84cc16"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

type Range = "7days" | "30days" | "6months" | "1year" | "overall";

function parseItems(raw: any): Array<{ productName?: string; quantity?: number; price?: number }> {
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export default function Insights() {
  const { data: sales, isLoading: l1 } = useSales();
  const { data: customers, isLoading: l2 } = useCustomers();
  const { data: borrowings, isLoading: l3 } = useBorrowings();
  const { data: products, isLoading: l4 } = useProducts();
  const [range, setRange] = useState<Range>("30days");
  const [now] = useState(() => new Date());
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth());

  const startDate = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "7days": return subDays(now, 7);
      case "30days": return subDays(now, 30);
      case "6months": return subMonths(now, 6);
      case "1year": return subMonths(now, 12);
      case "overall": return new Date(0);
    }
  }, [range]);

  const useMonthly = range === "6months" || range === "1year" || range === "overall";

  const filteredSales = useMemo(
    () => (sales || []).filter((s: any) => new Date(s.date || 0) >= startDate),
    [sales, startDate]
  );

  // --- Totals ---
  const totals = useMemo(() => {
    let revenue = 0, collected = 0, outstanding = 0;
    filteredSales.forEach((s: any) => {
      revenue += Number(s.amount) || 0;
      collected += Number(s.paidAmount) || 0;
      outstanding += Number(s.pendingAmount) || 0;
    });
    const count = filteredSales.length;
    return { revenue, collected, outstanding, count, aov: count ? revenue / count : 0 };
  }, [filteredSales]);

  // --- Monthly report (pick any month/year) ---
  const availableYears = useMemo(() => {
    const years = new Set<number>([now.getFullYear()]);
    (sales || []).forEach((s: any) => {
      const y = new Date(s.date || 0).getFullYear();
      if (y > 1970) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [sales, now]);

  const monthReport = useMemo(() => {
    const start = new Date(reportYear, reportMonth, 1).getTime();
    const end = new Date(reportYear, reportMonth + 1, 1).getTime();
    const inMonth = (sales || []).filter((s: any) => {
      const t = new Date(s.date || 0).getTime();
      return t >= start && t < end;
    });
    let revenue = 0, collected = 0, outstanding = 0;
    const daily: Record<number, { label: string; amount: number }> = {};
    const prod: Record<string, number> = {};
    inMonth.forEach((s: any) => {
      revenue += Number(s.amount) || 0;
      collected += Number(s.paidAmount) || 0;
      outstanding += Number(s.pendingAmount) || 0;
      const day = new Date(s.date || 0).getDate();
      if (!daily[day]) daily[day] = { label: String(day), amount: 0 };
      daily[day].amount += Number(s.amount) || 0;
      parseItems(s.items).forEach((it) => {
        const name = it.productName || "Other";
        prod[name] = (prod[name] || 0) + (Number(it.price) || 0) * (Number(it.quantity) || 0);
      });
    });
    return {
      count: inMonth.length,
      revenue,
      collected,
      outstanding,
      aov: inMonth.length ? revenue / inMonth.length : 0,
      dailyData: Object.entries(daily).map(([d, v]) => ({ day: Number(d), ...v })).sort((a, b) => a.day - b.day),
      topProducts: Object.entries(prod).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5),
    };
  }, [sales, reportYear, reportMonth]);

  // --- Revenue trend (paid vs pending) ---
  const revenueTrend = useMemo(() => {
    const buckets: Record<string, { label: string; paid: number; pending: number; sortKey: number }> = {};
    filteredSales.forEach((s: any) => {
      const d = new Date(s.date || 0);
      const key = useMonthly ? format(d, "yyyy-MM") : format(d, "yyyy-MM-dd");
      const label = useMonthly ? format(d, "MMM yy") : format(d, "MMM dd");
      if (!buckets[key]) buckets[key] = { label, paid: 0, pending: 0, sortKey: d.getTime() };
      buckets[key].paid += Number(s.paidAmount) || 0;
      buckets[key].pending += Number(s.pendingAmount) || 0;
    });
    return Object.values(buckets).sort((a, b) => a.sortKey - b.sortKey).slice(-30);
  }, [filteredSales, useMonthly]);

  // --- Payment method split ---
  const paymentMethods = useMemo(() => {
    const m: Record<string, number> = {};
    filteredSales.forEach((s: any) => {
      const method = s.paymentMethod || "CASH";
      m[method] = (m[method] || 0) + (Number(s.amount) || 0);
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  // --- Top products by revenue (parse item JSON) ---
  const { topProducts, categoryRevenue } = useMemo(() => {
    const nameToCategory: Record<string, string> = {};
    (products || []).forEach((p: any) => {
      if (p.name) nameToCategory[p.name.toLowerCase()] = p.category || "Uncategorized";
    });
    const prod: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const cat: Record<string, number> = {};
    filteredSales.forEach((s: any) => {
      parseItems(s.items).forEach((it) => {
        const name = it.productName || "Other";
        const revenue = (Number(it.price) || 0) * (Number(it.quantity) || 0);
        if (!prod[name]) prod[name] = { name, quantity: 0, revenue: 0 };
        prod[name].quantity += Number(it.quantity) || 0;
        prod[name].revenue += revenue;
        const category = nameToCategory[name.toLowerCase()] || "Other";
        cat[category] = (cat[category] || 0) + revenue;
      });
    });
    return {
      topProducts: Object.values(prod).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
      categoryRevenue: Object.entries(cat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    };
  }, [filteredSales, products]);

  // --- Top debtors (outstanding udhaar) ---
  const topDebtors = useMemo(
    () =>
      (customers || [])
        .map((c: any) => ({ name: c.name, amount: Number(c.borrowedAmount) || 0 }))
        .filter((c) => c.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8),
    [customers]
  );

  // --- Udhaar aging buckets ---
  const aging = useMemo(() => {
    const b = { "Not due": 0, "0-30 days": 0, "31-60 days": 0, "61-90 days": 0, "90+ days": 0 };
    (borrowings || []).forEach((x: any) => {
      const amt = Number(x.amount) || 0;
      if (amt <= 0 || x.status === "PAID") return;
      if (!x.dueDate) { b["Not due"] += amt; return; }
      const overdueDays = differenceInCalendarDays(new Date(), new Date(x.dueDate));
      if (overdueDays < 0) b["Not due"] += amt;
      else if (overdueDays <= 30) b["0-30 days"] += amt;
      else if (overdueDays <= 60) b["31-60 days"] += amt;
      else if (overdueDays <= 90) b["61-90 days"] += amt;
      else b["90+ days"] += amt;
    });
    return Object.entries(b).map(([bucket, amount]) => ({ bucket, amount }));
  }, [borrowings]);

  // --- Low stock ---
  const lowStock = useMemo(
    () =>
      (products || [])
        .map((p: any) => ({ name: p.name, quantity: Number(p.quantity) || 0, unit: p.unit }))
        .filter((p) => p.quantity < LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 10),
    [products]
  );

  if (l1 || l2 || l3 || l4) {
    return (
      <Layout>
        <div className="h-[80vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  const tooltipStyle = {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Insights</h1>
          <p className="text-muted-foreground mt-1">Visual analytics across sales, products, customers and time.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["7days", "30days", "6months", "1year", "overall"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                range === r ? "bg-primary text-primary-foreground shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {r === "7days" && "7 Days"}
              {r === "30days" && "30 Days"}
              {r === "6months" && "6 Months"}
              {r === "1year" && "1 Year"}
              {r === "overall" && "All"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="Revenue" value={fmt(totals.revenue)} tint="text-indigo-600" />
        <KpiCard icon={Wallet} label="Collected" value={fmt(totals.collected)} tint="text-emerald-600" />
        <KpiCard icon={AlertCircle} label="Outstanding" value={fmt(totals.outstanding)} tint="text-orange-600" />
        <KpiCard icon={BarChart3} label="Avg Order" value={fmt(totals.aov)} tint="text-slate-700" />
      </div>

      {/* Monthly report */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Monthly Report
            </h3>
            <p className="text-sm text-muted-foreground">Pick any month to see its sales</p>
          </div>
          <div className="flex gap-2">
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard icon={TrendingUp} label="Total Sales" value={fmt(monthReport.revenue)} tint="text-indigo-600" />
          <KpiCard icon={Wallet} label="Collected" value={fmt(monthReport.collected)} tint="text-emerald-600" />
          <KpiCard icon={AlertCircle} label="Outstanding" value={fmt(monthReport.outstanding)} tint="text-orange-600" />
          <KpiCard icon={BarChart3} label="Orders" value={String(monthReport.count)} tint="text-slate-700" />
          <KpiCard icon={BarChart3} label="Avg Order" value={fmt(monthReport.aov)} tint="text-slate-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[260px]">
            <p className="text-sm font-medium text-slate-600 mb-2">
              Daily sales — {MONTH_NAMES[reportMonth]} {reportYear}
            </p>
            {monthReport.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={monthReport.dailyData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} labelFormatter={(l) => `Day ${l}`} />
                  <Bar dataKey="amount" name="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty hint="No sales this month" />}
          </div>
          <div className="h-[260px]">
            <p className="text-sm font-medium text-slate-600 mb-2">Top products</p>
            {monthReport.topProducts.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {monthReport.topProducts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-slate-700 truncate pr-2">{i + 1}. {p.name}</span>
                    <span className="text-sm font-bold text-indigo-600 whitespace-nowrap">{fmt(p.value)}</span>
                  </li>
                ))}
              </ul>
            ) : <Empty hint="No itemized sales" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend */}
        <ChartCard title="Revenue Trend" subtitle="Paid vs pending (udhaar)" className="lg:col-span-2">
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend iconType="circle" />
                <Bar dataKey="paid" name="Paid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>

        {/* Payment method split */}
        <ChartCard title="Payment Methods" subtitle="By sale value">
          {paymentMethods.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value">
                  {paymentMethods.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>

        {/* Top products */}
        <ChartCard title="Top Products" subtitle="By revenue">
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty hint="No itemized sales in range" />}
        </ChartCard>

        {/* Category revenue */}
        <ChartCard title="Revenue by Category" subtitle="Product categories">
          {categoryRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryRevenue} cx="50%" cy="50%" outerRadius={95} dataKey="value" nameKey="name">
                  {categoryRevenue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty hint="No itemized sales in range" />}
        </ChartCard>

        {/* Top debtors */}
        <ChartCard title="Top Udhaar Customers" subtitle="Outstanding balance">
          {topDebtors.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDebtors} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="amount" name="Outstanding" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty hint="No outstanding udhaar" />}
        </ChartCard>

        {/* Udhaar aging */}
        <ChartCard title="Udhaar Aging" subtitle="Outstanding by overdue period">
          {aging.some((a) => a.amount > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aging} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]}>
                  {aging.map((_, i) => <Cell key={i} fill={["#10b981", "#f59e0b", "#fb923c", "#f87171", "#dc2626"][i] || "#94a3b8"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty hint="No outstanding udhaar" />}
        </ChartCard>

        {/* Low stock list */}
        <ChartCard title="Low Stock Alerts" subtitle={`Below ${LOW_STOCK_THRESHOLD} units`} noPadChart>
          <div className="h-full overflow-y-auto px-1">
            {lowStock.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {lowStock.map((p, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <Package className="h-4 w-4 text-slate-400" />
                      {p.name}
                    </span>
                    <span className={`text-sm font-bold ${p.quantity === 0 ? "text-red-600" : "text-orange-500"}`}>
                      {p.quantity} {p.unit || ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <Empty hint="All products well stocked" />}
          </div>
        </ChartCard>
      </div>
    </Layout>
  );
}

function KpiCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: string; tint: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
        <Icon className={`h-4 w-4 ${tint}`} />
      </div>
      <p className={`text-2xl font-bold mt-2 ${tint}`}>{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
  noPadChart = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  noPadChart?: boolean;
}) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-bold font-display text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-[300px] w-full">{children}</div>
    </div>
  );
}

function Empty({ hint = "No data yet" }: { hint?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
      <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
      <p className="text-sm">{hint}</p>
    </div>
  );
}
