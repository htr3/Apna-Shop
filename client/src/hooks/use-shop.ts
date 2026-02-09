import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type InsertCustomer, 
  type InsertBorrowing, 
  type InsertSale,
  type InsertProduct,
  type DashboardStats
} from "@shared/schema";

// --- DASHBOARD STATS ---
export function useDashboardStats() {
  return useQuery({
    queryKey: [api.dashboard.stats.path],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(api.dashboard.stats.path, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.dashboard.stats.responses[200].parse(await res.json());
    },
  });
}

// --- CUSTOMERS ---
export function useCustomers() {
  return useQuery({
    queryKey: [api.customers.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");  // ✨ Get token
      const res = await fetch(api.customers.list.path, {
        headers: {
          "Authorization": `Bearer ${token}`,  // ✨ Send token
        },
      });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return api.customers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const token = localStorage.getItem("authToken");  // ✨ Get token
      const res = await fetch(api.customers.create.path, {
        method: api.customers.create.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,  // ✨ Send token
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to create customer" }));
        throw new Error(errorData.message || "Failed to create customer");
      }
      return api.customers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.customers.list.path] });
    },
  });
}

// --- BORROWINGS (UDHAAR) ---
export function useBorrowings() {
  return useQuery({
    queryKey: [api.borrowings.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(api.borrowings.list.path, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch borrowings");
      return api.borrowings.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateBorrowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBorrowing) => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(api.borrowings.create.path, {
        method: api.borrowings.create.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add borrowing record");
      return api.borrowings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.borrowings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] }); // Update stats too
      queryClient.invalidateQueries({ queryKey: [api.customers.list.path] }); // Update totals
    },
  });
}

export function useUpdateBorrowingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "PAID" | "PENDING" | "OVERDUE" }) => {
      const token = localStorage.getItem("authToken");
      const url = buildUrl(api.borrowings.update.path, { id });
      const res = await fetch(url, {
        method: api.borrowings.update.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.borrowings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.borrowings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

// --- SALES ---
export function useSales() {
  return useQuery({
    queryKey: [api.sales.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(api.sales.list.path, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch sales");
      return api.sales.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSale) => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(api.sales.create.path, {
        method: api.sales.create.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record sale");
      return api.sales.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sales.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

// --- PRODUCTS ---
export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(api.products.list.path, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProduct) => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(api.products.create.path, {
        method: api.products.create.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return api.products.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProduct> }) => {
      const token = localStorage.getItem("authToken");
      const url = buildUrl(api.products.update.path, { id });
      const res = await fetch(url, {
        method: api.products.update.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return api.products.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("authToken");
      const url = buildUrl(api.products.delete.path, { id });
      const res = await fetch(url, {
        method: api.products.delete.method,
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}
