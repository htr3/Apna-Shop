import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useSales, useCustomers, useCreateSale } from "@/hooks/use-shop";
import { 
  Plus, 
  Search, 
  ShoppingBag,
  CreditCard,
  Banknote,
  Globe,
  Loader2
} from "lucide-react";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Sales() {
  const { data: sales, isLoading } = useSales();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredSales = sales?.filter(s => 
    s.amount.includes(search) || 
    s.paymentMethod?.toLowerCase().includes(search.toLowerCase())
  );

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

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredSales?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <ShoppingBag className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No sales recorded</h3>
          <p className="text-muted-foreground mt-1">Start recording your daily sales here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales?.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(sale.date || ""), "MMM dd, yyyy • hh:mm a")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">₹{Number(sale.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        {sale.paymentMethod === "CASH" && <Banknote className="h-4 w-4 text-green-600" />}
                        {sale.paymentMethod === "ONLINE" && <Globe className="h-4 w-4 text-blue-600" />}
                        {sale.paymentMethod === "CREDIT" && <CreditCard className="h-4 w-4 text-purple-600" />}
                        <span className="font-medium capitalize">{sale.paymentMethod?.toLowerCase()}</span>
                      </div>
                    </td>
                  </tr>
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
  
  const form = useForm<InsertSale>({
    resolver: zodResolver(insertSaleSchema),
    defaultValues: {
      amount: "0",
      paymentMethod: "CASH",
      date: new Date(),
    }
  });

  const onSubmit = (data: InsertSale) => {
    createSale.mutate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Sale recorded successfully" });
        onSuccess();
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Amount (₹)</label>
        <input
          type="number"
          {...form.register("amount")}
          placeholder="0.00"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {form.formState.errors.amount && (
          <p className="text-red-500 text-xs">{form.formState.errors.amount.message}</p>
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

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={createSale.isPending}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {createSale.isPending ? "Recording..." : "Record Sale"}
        </button>
      </div>
    </form>
  );
}
