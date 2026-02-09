import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useCustomers, useCreateCustomer } from "@/hooks/use-shop";
import {
  Plus, 
  Search, 
  Phone, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Loader2,
  UserPlus
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
import { insertCustomerSchema, type InsertCustomer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Customers() {
  const { data: customers, isLoading } = useCustomers();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter customers
  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database and trust scores.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span>Add Customer</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Create a profile to track sales and udhaar.
                </DialogDescription>
              </DialogHeader>
              <AddCustomerForm onSuccess={() => setIsOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredCustomers?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <UserPlus className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No customers found</h3>
          <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
            Try searching for something else or add your first customer to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Total Purchase</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Pending Udhaar</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Trust Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers?.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      ₹{Number(customer.totalPurchase).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {Number(customer.borrowedAmount) > 0 ? (
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md text-xs">
                          ₹{Number(customer.borrowedAmount).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <TrustBadge score={customer.trustScore || 100} />
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

function TrustBadge({ score }: { score: number }) {
  if (score >= 70) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
        <ShieldCheck className="h-3.5 w-3.5" />
        {score}
      </div>
    );
  }
  if (score >= 40) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
        <Shield className="h-3.5 w-3.5" />
        {score}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
      <ShieldAlert className="h-3.5 w-3.5" />
      {score}
    </div>
  );
}

function AddCustomerForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const createCustomer = useCreateCustomer();
  
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      trustScore: 100,
      totalPurchase: "0",
      borrowedAmount: "0",
      isRisky: false,
    }
  });

  const onSubmit = (data: InsertCustomer) => {
    createCustomer.mutate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Customer added successfully" });
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
        <label className="text-sm font-medium text-slate-700">Full Name</label>
        <input
          {...form.register("name")}
          placeholder="e.g. Amit Patel"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {form.formState.errors.name && (
          <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Phone Number</label>
        <input
          {...form.register("phone")}
          placeholder="e.g. 9876543210"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {form.formState.errors.phone && (
          <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={createCustomer.isPending}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {createCustomer.isPending ? "Creating..." : "Create Customer"}
        </button>
      </div>
    </form>
  );
}
