import { useState } from "react";
import { useCreateProduct, useProducts, useUpdateProduct, useDeleteProduct } from "@/hooks/use-shop";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Package, Edit2, Trash2, Search, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertProductSchema, type InsertProduct } from "@shared/schema";
import { Layout } from "@/components/Layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";

export default function Products() {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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

  const categories = products ? Array.from(new Set(products.map(p => p.category).filter(Boolean))) : [];

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const onSubmit = async (data: InsertProduct) => {
    try {
      if (isEditMode && editingId) {
        await updateProduct.mutateAsync({ id: editingId, data });
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await createProduct.mutateAsync(data);
        toast({
          title: "Success",
          description: "Product added successfully",
        });
      }
      form.reset();
      setIsOpen(false);
      setIsEditMode(false);
      setEditingId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: any) => {
    form.reset({
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity || 0,
      unit: product.unit || "",
      category: product.category || "",
      description: product.description || "",
    });
    setEditingId(product.id);
    setIsEditMode(true);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct.mutateAsync(id);
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete product",
          variant: "destructive"
        });
      }
    }
  };

  const handleAddNew = () => {
    form.reset();
    setIsEditMode(false);
    setEditingId(null);
    setIsOpen(true);
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Products Manager
          </h1>
          <p className="text-muted-foreground mt-1">Add and manage your products anytime</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button onClick={handleAddNew} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all shadow-md">
              <Plus className="h-5 w-5" />
              <span>Add New Product</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {isEditMode ? "Update product details" : "Add a product to your inventory"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
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
                  Price (₹) <span className="text-red-500">*</span>
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
                disabled={createProduct.isPending || updateProduct.isPending}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditMode ? "Update Product" : "Add Product"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-600">Total Products</p>
          <p className="text-3xl font-bold text-primary mt-2">{filteredProducts?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-600">With Stock</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {filteredProducts?.filter(p => p.quantity && p.quantity > 0).length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-600">Out of Stock</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {filteredProducts?.filter(p => !p.quantity || p.quantity === 0).length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-600">Categories</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {new Set(filteredProducts?.map(p => p.category).filter(Boolean)).size || 0}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat || ""}>{cat || "Uncategorized"}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Your Products</h2>
            <p className="text-sm text-slate-500">{filteredProducts.length} products found</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-all hover:border-primary/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 text-lg flex-1">{product.name}</h3>
                  {product.quantity && product.quantity > 0 ? (
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded">
                      In Stock
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded">
                      Out
                    </span>
                  )}
                </div>

                <p className="text-2xl font-bold text-primary mb-3">₹{Number(product.price).toFixed(2)}</p>

                <div className="space-y-2 mb-4">
                  {product.quantity !== null && product.quantity !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Quantity:</span>
                      <span className="bg-blue-50 px-3 py-1 rounded text-blue-700 font-semibold">
                        {product.quantity} {product.unit || "pcs"}
                      </span>
                    </div>
                  )}

                  {product.category && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Category:</span>
                      <span className="text-sm font-medium text-slate-700">{product.category}</span>
                    </div>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm text-slate-600 border-t border-slate-100 pt-3 mb-3">
                    {product.description}
                  </p>
                )}

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded font-medium hover:bg-blue-100 transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded font-medium hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  {product.createdAt && (
                    <span>Added: {new Date(product.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchTerm ? "No products found" : "No Products Yet"}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Start building your product inventory. Click the \"Add New Product\" button to get started!"
            }
          </p>
          {!searchTerm && (
            <button onClick={handleAddNew} className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all">
              <Plus className="h-4 w-4" />
              <span>Add Your First Product</span>
            </button>
          )}
        </div>
      )}
    </Layout>
  );
}

