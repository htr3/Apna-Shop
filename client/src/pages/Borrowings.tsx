import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useBorrowings, useCustomers, useCreateBorrowing, useUpdateBorrowingStatus, useUpdateBorrowingAmount } from "@/hooks/use-shop";
import {
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Loader2,
  Edit2,
  Save,
  X
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
  const updateAmount = useUpdateBorrowingAmount();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [editingBorrowingId, setEditingBorrowingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  const filteredBorrowings = borrowings?.filter(b => 
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.amount.includes(search)
  ).sort((a, b) => {
    // Sort: Overdue first, then Pending, then Paid
    const statusOrder = { OVERDUE: 0, PENDING: 1, PAID: 2 };
    const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.date || "").getTime() - new Date(a.date || "").getTime();
  }) || [];

  // Group borrowings by customer and calculate totals
  const groupedByCustomer = filteredBorrowings.reduce((acc, item) => {
    if (!acc[item.customerId]) {
      acc[item.customerId] = {
        customerId: item.customerId,
        customerName: item.customerName,
        borrowings: [],
        total: 0
      };
    }
    acc[item.customerId].borrowings.push(item);
    acc[item.customerId].total += Number(item.amount);
    return acc;
  }, {} as Record<number, { customerId: number; customerName: string; borrowings: typeof filteredBorrowings; total: number }>);

  const customerGroups = Object.values(groupedByCustomer);

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
      ) : customerGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <CheckCircle2 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All clear!</h3>
          <p className="text-muted-foreground mt-1">No borrowings match your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customerGroups.map((group) => (
            <div key={group.customerId} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Customer Header with Total */}
              <button
                onClick={() => setSelectedCustomer(selectedCustomer === group.customerId ? null : group.customerId)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{group.customerName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {group.borrowings.length} {group.borrowings.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Udhaar</p>
                    <p className="text-2xl font-bold text-red-600">₹{group.total.toLocaleString()}</p>
                  </div>
                  <div className={cn(
                    "h-6 w-6 transition-transform text-slate-400",
                    selectedCustomer === group.customerId && "rotate-180"
                  )}>
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded Borrowings List */}
              {selectedCustomer === group.customerId && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {group.borrowings.map((item) => (
                    <BorrowingItem
                      key={item.id}
                      item={item}
                      isEditing={editingBorrowingId === item.id}
                      editAmount={editAmount}
                      onEditStart={() => {
                        setEditingBorrowingId(item.id);
                        setEditAmount(item.amount);
                      }}
                      onEditCancel={() => setEditingBorrowingId(null)}
                      onEditAmountChange={setEditAmount}
                      onSaveAmount={(amount) => {
                        updateAmount.mutate({ id: item.id, amount }, {
                          onSuccess: () => {
                            toast({ title: "Success", description: "Amount updated" });
                            setEditingBorrowingId(null);
                          },
                          onError: (err: any) => {
                            toast({ title: "Error", description: err.message, variant: "destructive" });
                          }
                        });
                      }}
                      onStatusUpdate={handleStatusUpdate}
                      updateStatus={updateStatus}
                      updateAmount={updateAmount}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

function BorrowingItem({
  item,
  isEditing,
  editAmount,
  onEditStart,
  onEditCancel,
  onEditAmountChange,
  onSaveAmount,
  onStatusUpdate,
  updateStatus,
  updateAmount
}: {
  item: any;
  isEditing: boolean;
  editAmount: string;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditAmountChange: (amount: string) => void;
  onSaveAmount: (amount: string) => void;
  onStatusUpdate: (id: number, status: "PAID" | "PENDING" | "OVERDUE") => void;
  updateStatus: any;
  updateAmount: any;
}) {
  return (
    <div className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-sm font-medium text-slate-700">
              {item.notes && !item.notes.includes('Auto-created') ? item.notes : 'Udhaar Record'}
            </p>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1",
              item.status === "PAID" && "bg-emerald-100 text-emerald-700",
              item.status === "PENDING" && "bg-amber-100 text-amber-700",
              item.status === "OVERDUE" && "bg-red-100 text-red-700"
            )}>
              {item.status === "PAID" && <CheckCircle2 className="h-3 w-3" />}
              {item.status === "PENDING" && <Clock className="h-3 w-3" />}
              {item.status === "OVERDUE" && <AlertTriangle className="h-3 w-3" />}
              {item.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            {format(new Date(item.date || ""), "MMM dd, yyyy")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={editAmount}
              onChange={(e) => onEditAmountChange(e.target.value)}
              className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={() => onSaveAmount(editAmount)}
              disabled={updateAmount.isPending}
              className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors disabled:opacity-50"
              title="Save"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={onEditCancel}
              className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                ₹{Number(item.amount).toLocaleString()}
              </p>
              {item.dueDate && (
                <p className={cn(
                  "text-xs",
                  isPast(new Date(item.dueDate)) && item.status !== "PAID" ? "text-red-600" : "text-slate-500"
                )}>
                  Due: {format(new Date(item.dueDate), "MMM dd")}
                </p>
              )}
            </div>

            {item.status !== "PAID" && (
              <button
                onClick={onEditStart}
                className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Edit amount"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </>
        )}

        {item.status !== "PAID" && (
          <button
            onClick={() => onStatusUpdate(item.id, "PAID")}
            disabled={updateStatus.isPending}
            className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
            title="Mark as paid"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
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
