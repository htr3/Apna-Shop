import { useState } from "react";
import { useCreateProduct, useProducts } from "@/hooks/use-shop";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertProductSchema, type InsertProduct } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";

export function ProductManager() {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      price: "0",
      quantity: 0,
      unit: "",
      category: "",
      description: "",
      isActive: true,
    }
  });

  const onSubmit = async (data: InsertProduct) => {
    try {
      await createProduct.mutateAsync(data);
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      form.reset();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Products</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all">
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Add a product to your list for quick selection during sales.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Tea Cup, Samosa"
                  {...form.register("name", { required: true })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 10.00"
                  {...form.register("price", { required: true })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g., 50"
                    {...form.register("quantity", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit
                  </label>
                  <select
                    {...form.register("unit")}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select unit</option>
                    <option value="Piece">Piece</option>
                    <option value="Kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="Liter">Liter</option>
                    <option value="ml">Milliliter</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Dozen">Dozen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g., Beverages, Snacks"
                  {...form.register("category")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Optional description"
                  {...form.register("description")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={createProduct.isPending}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {createProduct.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {createProduct.isPending ? "Adding..." : "Add Product"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-900">{product.name}</h4>
              </div>
              <p className="text-lg font-bold text-primary mb-2">₹{Number(product.price).toFixed(2)}</p>
              <div className="flex items-center gap-3 mb-2 text-sm text-slate-600">
                {product.quantity !== null && product.quantity !== undefined && (
                  <span className="bg-blue-50 px-2 py-1 rounded text-blue-700 font-medium">
                    {product.quantity} {product.unit || "pcs"}
                  </span>
                )}
              </div>
              {product.category && (
                <p className="text-xs text-slate-500 mb-2">{product.category}</p>
              )}
              {product.description && (
                <p className="text-sm text-slate-600">{product.description}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p>No products added yet. Add your first product to get started!</p>
        </div>
      )}
    </div>
  );
}

