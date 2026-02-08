import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useBorrowings, useCustomers, useCreateBorrowing, useUpdateBorrowingStatus } from "@/hooks/use-shop";
import { 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBorrowingSchema, type InsertBorrowing } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function Borrowings() {
  const { data: borrowings, isLoading } = useBorrowings();
  const updateStatus = useUpdateBorrowingStatus();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const filteredBorrowings = borrowings?.filter(b => 
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.amount.includes(search)
  ).sort((a, b) => {
    // Sort: Overdue first, then Pending, then Paid
    const statusOrder = { OVERDUE: 0, PENDING: 1, PAID: 2 };
    const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.date || "").getTime() - new Date(a.date || "").getTime();
  });

  const handleStatusUpdate = (id: number, status: "PAID" | "PENDING" | "OVERDUE") => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast({ title: "Updated", description: `Marked as ${status}` });
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Udhaar (Borrowings)</h1>
          <p className="text-muted-foreground mt-1">Track pending payments and overdue accounts.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search borrowings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span>New Udhaar</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Borrowing</DialogTitle>
                <DialogDescription>Add a new pending payment record.</DialogDescription>
              </DialogHeader>
              <AddBorrowingForm onSuccess={() => setIsOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredBorrowings?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <CheckCircle2 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All clear!</h3>
          <p className="text-muted-foreground mt-1">No borrowings match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBorrowings?.map((item) => (
            <div 
              key={item.id} 
              className={cn(
                "group relative bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md",
                item.status === "OVERDUE" ? "border-red-200 bg-red-50/30" : "border-slate-100"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{item.customerName}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    Borrowed: {format(new Date(item.date || ""), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                  item.status === "PAID" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  item.status === "PENDING" && "bg-amber-50 text-amber-700 border-amber-200",
                  item.status === "OVERDUE" && "bg-red-100 text-red-700 border-red-200 animate-pulse-slow"
                )}>
                  {item.status === "PAID" && <CheckCircle2 className="h-3 w-3" />}
                  {item.status === "PENDING" && <Clock className="h-3 w-3" />}
                  {item.status === "OVERDUE" && <AlertTriangle className="h-3 w-3" />}
                  {item.status}
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-display font-bold text-slate-900 block mb-1">
                  ₹{Number(item.amount).toLocaleString()}
                </span>
                {item.dueDate && (
                  <p className={cn(
                    "text-xs font-medium",
                    isPast(new Date(item.dueDate)) && item.status !== "PAID" ? "text-red-600" : "text-slate-500"
                  )}>
                    Due: {format(new Date(item.dueDate), "MMM dd, yyyy")}
                  </p>
                )}
              </div>

              {item.status !== "PAID" && (
                <button
                  onClick={() => handleStatusUpdate(item.id, "PAID")}
                  disabled={updateStatus.isPending}
                  className="w-full py-2.5 bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 group-hover:shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Paid
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

function AddBorrowingForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const createBorrowing = useCreateBorrowing();
  const { data: customers } = useCustomers();
  
  const form = useForm<InsertBorrowing>({
    resolver: zodResolver(insertBorrowingSchema),
    defaultValues: {
      customerId: 0,
      amount: "0",
      notes: "",
      status: "PENDING",
      date: new Date(),
    }
  });

  const onSubmit = (data: InsertBorrowing) => {
    createBorrowing.mutate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Borrowing recorded" });
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
        <label className="text-sm font-medium text-slate-700">Select Customer</label>
        <select
          {...form.register("customerId", { valueAsNumber: true })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
        >
          <option value={0} disabled>Select a customer...</option>
          {customers?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {form.formState.errors.customerId && (
          <p className="text-red-500 text-xs">Please select a customer</p>
        )}
      </div>

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
        <label className="text-sm font-medium text-slate-700">Due Date (Optional)</label>
        <input
          type="date"
          {...form.register("dueDate", { setValueAs: (v) => v ? new Date(v) : undefined })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={createBorrowing.isPending}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {createBorrowing.isPending ? "Recording..." : "Add Udhaar"}
        </button>
      </div>
    </form>
  );
}
