import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type InsertCustomer, 
  type InsertBorrowing, 
  type InsertSale,
  type DashboardStats
} from "@shared/schema";

// --- DASHBOARD STATS ---
export function useDashboardStats() {
  return useQuery({
    queryKey: [api.dashboard.stats.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.stats.path);
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
      const res = await fetch(api.customers.list.path);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return api.customers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const res = await fetch(api.customers.create.path, {
        method: api.customers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create customer");
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
      const res = await fetch(api.borrowings.list.path);
      if (!res.ok) throw new Error("Failed to fetch borrowings");
      return api.borrowings.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateBorrowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBorrowing) => {
      const res = await fetch(api.borrowings.create.path, {
        method: api.borrowings.create.method,
        headers: { "Content-Type": "application/json" },
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
      const url = buildUrl(api.borrowings.update.path, { id });
      const res = await fetch(url, {
        method: api.borrowings.update.method,
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(api.sales.list.path);
      if (!res.ok) throw new Error("Failed to fetch sales");
      return api.sales.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSale) => {
      const res = await fetch(api.sales.create.path, {
        method: api.sales.create.method,
        headers: { "Content-Type": "application/json" },
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
