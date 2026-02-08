import { useDashboardStats, useSales } from "@/hooks/use-shop";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { DailySummaryPanel } from "@/components/DailySummaryPanel";
import { 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  PieChart as PieChartIcon,
  Loader2
} from "lucide-react";
import { 
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
  Legend
} from 'recharts';
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const { data: sales, isLoading: isSalesLoading } = useSales();

  if (isStatsLoading || isSalesLoading) {
    return (
      <Layout>
        <div className="h-[80vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  // Format sales for chart
  const salesData = sales?.slice(0, 7).map(sale => ({
    date: format(new Date(sale.date || ""), "MMM dd"),
    amount: Number(sale.amount),
  })) || [];

  // Pie chart data
  const pieData = [
    { name: 'Trustable', value: stats?.trustableCount || 0, color: '#10b981' }, // Emerald-500
    { name: 'Risky', value: stats?.riskyCount || 0, color: '#ef4444' }, // Red-500
  ];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your shop today.</p>
        </div>
        <div className="text-sm font-medium bg-white px-4 py-2 rounded-full shadow-sm border text-slate-600">
          {format(new Date(), "EEEE, MMMM do, yyyy")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Sales"
          value={`₹${stats?.todaySales?.toLocaleString() || 0}`}
          icon={DollarSign}
          description="Total earnings today"
          trend="up"
          trendValue="12%"
          variant="default"
        />
        <StatsCard
          title="This Month"
          value={`₹${stats?.monthSales?.toLocaleString() || 0}`}
          icon={Calendar}
          description="Total earnings this month"
          variant="default"
        />
        <StatsCard
          title="Pending Udhaar"
          value={`₹${stats?.pendingUdhaar?.toLocaleString() || 0}`}
          icon={AlertCircle}
          description="Amount yet to be collected"
          variant="warning"
        />
        <StatsCard
          title="Risky Customers"
          value={stats?.riskyCount || 0}
          icon={PieChartIcon}
          description="Customers with low trust score"
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900">Sales Trends</h3>
              <p className="text-sm text-muted-foreground">Daily sales performance over the last 7 days</p>
            </div>
            <div className="p-2 bg-primary/5 rounded-lg text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₹${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                    }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ fill: '#fff', stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <TrendingUp className="h-10 w-10 mb-2 opacity-20" />
                <p>No sales data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Trust Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold font-display text-slate-900">Trust Distribution</h3>
            <p className="text-sm text-muted-foreground">Customer reliability breakdown</p>
          </div>
          
          <div className="h-[300px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
              <p className="text-3xl font-bold text-slate-900">{stats?.trustableCount || 0}</p>
              <p className="text-xs text-muted-foreground font-medium">TRUSTABLE</p>
            </div>
          </div>
        </div>

        {/* Daily Summary Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-full">
          <div className="mb-6">
            <h3 className="text-lg font-bold font-display text-slate-900">Daily Summary</h3>
            <p className="text-sm text-muted-foreground">View today's performance and schedule automated reports</p>
          </div>
          <DailySummaryPanel />
        </div>
      </div>
    </Layout>
  );
}
