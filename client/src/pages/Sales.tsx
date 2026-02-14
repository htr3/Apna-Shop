import { useState } from "react";
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
  Trash2
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
                  <SaleRow key={sale.id} sale={sale} />
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paidAmount, setPaidAmount] = useState<string>("0");
  const [pendingAmount, setPendingAmount] = useState<string>("0");

  // Product states
  const [items, setItems] = useState<Array<{ productName: string; quantity: number; price: number }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isOtherProduct, setIsOtherProduct] = useState(false);
  const [otherProductName, setOtherProductName] = useState("");
  const [otherProductPrice, setOtherProductPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

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

  // Calculate total from items or manual amounts
  const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const manualTotal = Number(paidAmount) + Number(pendingAmount);
  const totalAmount = itemsTotal > 0 ? itemsTotal.toFixed(2) : manualTotal.toFixed(2);

  const addProduct = () => {
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
      productName = "Other";  // ✅ Set as "Other" - no product name needed
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

    setItems([...items, { productName, quantity: Number(quantity), price: productPrice }]);

    // Reset fields
    setSelectedProductId("");
    setOtherProductName("");
    setOtherProductPrice("");
    setQuantity("1");
    setIsOtherProduct(false);
  };

  const removeProduct = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onSubmit = (data: InsertSale) => {
    if (Number(totalAmount) === 0) {
      toast({
        title: "Invalid Sale",
        description: "Please add products or amounts",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...data,
      amount: totalAmount,
      paidAmount: itemsTotal > 0 ? (Number(totalAmount) - Number(pendingAmount)).toString() : paidAmount,
      pendingAmount: pendingAmount, // ✨ Always include pending amount - syncs to Udhari
      customerId: selectedCustomerId || undefined,
      items: JSON.stringify(items.length > 0 ? items : []), // Store items as JSON
    };

    createSale.mutate(submitData as any, {
      onSuccess: () => {
        toast({ title: "Success", description: "Sale recorded successfully" });
        setSelectedCustomerId(null);
        setCustomerSearch("");
        setPaidAmount("0");
        setPendingAmount("0");
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
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
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

          {selectedCustomer && !showCustomerDropdown && (
            <div className="absolute inset-0 px-4 py-2.5 flex items-center justify-between pointer-events-none">
              <div>
                <div className="font-medium text-slate-900 text-sm">{selectedCustomer.name}</div>
                <div className="text-xs text-slate-500">{selectedCustomer.phone}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <h3 className="font-medium text-slate-900">📦 Products Sold</h3>

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
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "other") {
                      setIsOtherProduct(true);
                      setSelectedProductId("");
                    } else {
                      setSelectedProductId(val);
                    }
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Choose a product...</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₹{Number(product.price).toFixed(2)}
                    </option>
                  ))}
                  <option value="other">Other Product</option>
                </select>
              </>
            ) : (
              <>
                <label className="text-xs font-medium text-slate-600">Other Product Price Only (₹)</label>
                <div className="space-y-2">
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
        {items.length === 0 ? (
          // Manual entry mode
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount Paid (₹)</label>
              <input
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount Pending (₹)</label>
              <input
                type="number"
                step="0.01"
                value={pendingAmount}
                onChange={(e) => setPendingAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        ) : (
          // Products mode - show pending amount field
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Amount Pending (₹) - Udhari</label>
            <input
              type="number"
              step="0.01"
              value={pendingAmount}
              onChange={(e) => setPendingAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="text-xs text-slate-500">Enter the amount customer will pay later (Udhari/Credit)</p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-slate-900">₹{Number(totalAmount).toLocaleString()}</div>
        </div>
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
          disabled={createSale.isPending || Number(totalAmount) === 0}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {createSale.isPending ? "Recording..." : "Record Sale"}
        </button>
      </div>
    </form>
  );
}

function SaleRow({ sale }: { sale: any }) {
  const { toast } = useToast();
  const updateSale = useUpdateSale();
  const deleteSale = useDeleteSale();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    paymentMethod: sale.paymentMethod || "CASH",
    paidAmount: sale.paidAmount || "0",
    pendingAmount: sale.pendingAmount || "0",
  });

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
