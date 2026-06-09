import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useBorrowings, useCustomers, useCreateBorrowing, useUpdateBorrowingStatus, useUpdateBorrowingAmount, useRecordRepayment } from "@/hooks/use-shop";
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
  X,
  Wallet,
  FileText
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
import { format, isPast, parseISO, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { openUpiQrWindow } from "@/lib/upi";
import { openCustomerStatement } from "@/lib/statement";
import { sendWhatsAppReminder } from "@/lib/reminder";
import { QrCode, MessageCircle, Share2 } from "lucide-react";

// An entry is overdue when it still owes money and its due date has passed.
function isOverdue(item: any): boolean {
  return (
    !!item.dueDate &&
    Number(item.amount) > 0 &&
    item.status !== "PAID" &&
    isPast(new Date(item.dueDate))
  );
}

export default function Borrowings() {
  const { data: borrowings, isLoading } = useBorrowings();
  const { data: customers } = useCustomers();
  const updateStatus = useUpdateBorrowingStatus();
  const updateAmount = useUpdateBorrowingAmount();
  const recordRepayment = useRecordRepayment();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [editingBorrowingId, setEditingBorrowingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

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

  const handleDownloadStatement = (group: { customerId: number; customerName: string; borrowings: any[] }) => {
    const phone = customers?.find((c) => c.id === group.customerId)?.phone;
    openCustomerStatement({
      customerName: group.customerName,
      customerPhone: phone,
      entries: group.borrowings,
      paymentSettings,
      toast,
    });
  };

  const handleShareLink = async (group: { customerId: number; customerName: string }) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/customers/${group.customerId}/share-link`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to create link");
      const { token: shareToken } = await res.json();
      const url = `${window.location.origin}/ledger/${shareToken}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: `Share this link with ${group.customerName} to view their balance & pay.`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not create link", variant: "destructive" });
    }
  };

  const handleSendReminder = (group: { customerId: number; customerName: string; total: number; borrowings: any[] }) => {
    const phone = customers?.find((c) => c.id === group.customerId)?.phone;
    const earliestDue = group.borrowings
      .filter((b) => Number(b.amount) > 0 && b.dueDate)
      .map((b) => b.dueDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    const ok = sendWhatsAppReminder(phone, {
      customerName: group.customerName,
      amount: group.total,
      upiId: paymentSettings?.enableUpi === false ? null : paymentSettings?.ownerUpiId,
      dueDate: earliestDue,
    });
    if (!ok) {
      toast({
        title: "No phone number",
        description: `Add a phone number for ${group.customerName} to send directly. Opened WhatsApp with the message ready to copy.`,
      });
    }
  };

  const filteredBorrowings = borrowings?.filter(b => 
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.amount.includes(search)
  ).sort((a, b) => {
    // Sort: actually-overdue first, then pending, then paid
    const rank = (x: typeof a) => (isOverdue(x) ? 0 : x.status === "PAID" ? 2 : 1);
    const statusDiff = rank(a) - rank(b);
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

  const handleCollectFromCustomer = (
    group: { customerId: number; customerName: string; total: number; borrowings: any[] },
    payment: number,
    note: string
  ) => {
    const collected = Math.min(Math.max(0, payment), group.total);
    if (collected <= 0) {
      toast({ title: "Invalid amount", description: "Enter an amount greater than 0", variant: "destructive" });
      return;
    }
    const dateStr = format(new Date(), "MMM dd, yyyy");
    const description = note?.trim()
      ? note.trim()
      : `Payment received: ₹${collected.toLocaleString()} on ${dateStr}`;

    recordRepayment.mutate(
      { customerId: group.customerId, amount: collected, notes: description },
      {
        onSuccess: () => {
          const leftover = Math.max(0, Number((group.total - collected).toFixed(2)));
          toast({
            title: "Payment recorded",
            description: leftover <= 0
              ? `₹${collected.toLocaleString()} collected from ${group.customerName}. All cleared!`
              : `₹${collected.toLocaleString()} collected. ₹${leftover.toLocaleString()} udhaar remaining.`,
          });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to record payment", variant: "destructive" });
        },
      }
    );
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
              <div
                onClick={() => setSelectedCustomer(selectedCustomer === group.customerId ? null : group.customerId)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900">{group.customerName}</h3>
                      {(() => {
                        const overdueCount = group.borrowings.filter(isOverdue).length;
                        return overdueCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            {overdueCount} overdue
                          </span>
                        ) : null;
                      })()}
                    </div>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadStatement(group);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Download account statement (PDF)"
                  >
                    <FileText className="h-4 w-4" />
                    Statement
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareLink(group);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Copy a shareable ledger link for this customer"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  {group.total > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendReminder(group);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      title="Send WhatsApp payment reminder"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Remind
                    </button>
                  )}
                  {group.total > 0 && (
                    <CustomerCollectButton
                      group={group}
                      onCollect={handleCollectFromCustomer}
                      isPending={recordRepayment.isPending}
                    />
                  )}
                  <div className={cn(
                    "h-6 w-6 transition-transform text-slate-400",
                    selectedCustomer === group.customerId && "rotate-180"
                  )}>
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
              </div>

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
  const isPayment = Number(item.amount) < 0;
  const overdue = isOverdue(item);
  const displayStatus = overdue ? "OVERDUE" : item.status;

  if (isPayment) {
    return (
      <div className="px-6 py-4 flex items-center justify-between bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">
              {item.notes || "Payment received"}
            </p>
            <p className="text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 inline mr-1" />
              {format(new Date(item.date || ""), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-emerald-600">− ₹{Math.abs(Number(item.amount)).toLocaleString()}</p>
          <p className="text-xs text-emerald-600/70">Paid</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "px-6 py-4 flex items-center justify-between group transition-colors",
      overdue ? "bg-red-50/50 hover:bg-red-50 border-l-4 border-red-500" : "hover:bg-slate-50/50"
    )}>
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-sm font-medium text-slate-700">
              {item.notes && !item.notes.includes('Auto-created') ? item.notes : 'Udhaar Record'}
            </p>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1",
              displayStatus === "PAID" && "bg-emerald-100 text-emerald-700",
              displayStatus === "PENDING" && "bg-amber-100 text-amber-700",
              displayStatus === "OVERDUE" && "bg-red-100 text-red-700"
            )}>
              {displayStatus === "PAID" && <CheckCircle2 className="h-3 w-3" />}
              {displayStatus === "PENDING" && <Clock className="h-3 w-3" />}
              {displayStatus === "OVERDUE" && <AlertTriangle className="h-3 w-3" />}
              {displayStatus}
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
              {item.dueDate && item.status !== "PAID" && (() => {
                const days = differenceInCalendarDays(new Date(item.dueDate), new Date());
                return (
                  <p className={cn("text-xs font-medium", overdue ? "text-red-600" : "text-slate-500")}>
                    {overdue
                      ? `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`
                      : days === 0
                        ? "Due today"
                        : `Due in ${days} day${days === 1 ? "" : "s"}`}
                  </p>
                );
              })()}
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
            title="Mark as fully paid"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function CustomerCollectButton({
  group,
  onCollect,
  isPending,
}: {
  group: { customerId: number; customerName: string; total: number; borrowings: any[] };
  onCollect: (group: any, payment: number, note: string) => void;
  isPending: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

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

  const remainingAfter = Math.max(0, group.total - Number(payAmount || 0));

  const handleShowQr = async () => {
    const amount = Math.min(Math.max(0, Number(payAmount || 0)), group.total);
    if (amount <= 0) {
      toast({ title: "Enter an amount", description: "Set the amount to collect first", variant: "destructive" });
      return;
    }
    const result = await openUpiQrWindow({
      paymentSettings,
      label: `Udhaar — ${group.customerName}`,
      amount,
    });
    if (!result.ok) {
      toast({
        title: result.error === "UPI not configured" ? "UPI not configured" : "Error",
        description: result.error === "UPI not configured"
          ? "Add your UPI ID in Payment Settings to generate a pay QR."
          : result.error || "Could not generate QR",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setPayAmount(String(group.total));
          setNote("");
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          title="Collect payment from this customer"
        >
          <Wallet className="h-4 w-4" />
          Collect
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Collect from {group.customerName}</DialogTitle>
          <DialogDescription>
            Total outstanding udhaar: ₹{group.total.toLocaleString()}. Enter how much they repaid — it will be
            settled across their entries automatically (oldest first).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Amount Received (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={group.total}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPayAmount(String(group.total))}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Full (₹{group.total.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => setPayAmount(String((group.total / 2).toFixed(2)))}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Half
              </button>
            </div>
            {Number(payAmount) > 0 && Number(payAmount) < group.total && (
              <p className="text-xs text-amber-600">
                Remaining udhaar after this: ₹{remainingAfter.toLocaleString()}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Paid in cash, partial settlement"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleShowQr}
            disabled={!payAmount || Number(payAmount) <= 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            <QrCode className="h-4 w-4" />
            Show QR
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onCollect(group, Number(payAmount || 0), note);
                setOpen(false);
              }}
              disabled={isPending || !payAmount || Number(payAmount) <= 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
