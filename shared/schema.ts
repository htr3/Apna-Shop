import { pgTable, text, serial, integer, boolean, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Customers Table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  trustScore: integer("trust_score").default(100), // 0-100
  totalPurchase: numeric("total_purchase").default("0"),
  borrowedAmount: numeric("borrowed_amount").default("0"), // Total outstanding
  isRisky: boolean("is_risky").default(false),
});

// Borrowings (Udhaar) Table
export const borrowings = pgTable("borrowings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  amount: numeric("amount").notNull(),
  date: timestamp("date").defaultNow(),
  dueDate: timestamp("due_date"),
  status: text("status", { enum: ["PAID", "PENDING", "OVERDUE"] }).default("PENDING"),
  notes: text("notes"),
});

// Sales Table (for daily sales tracking)
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  amount: numeric("amount").notNull(),
  date: timestamp("date").defaultNow(),
  paymentMethod: text("payment_method", { enum: ["CASH", "ONLINE", "CREDIT"] }).default("CASH"),
  customerId: integer("customer_id"), // Optional, for tracking who bought what
});

// === SCHEMAS ===

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertBorrowingSchema = createInsertSchema(borrowings).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true });

// === EXPLICIT API TYPES ===

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Borrowing = typeof borrowings.$inferSelect;
export type InsertBorrowing = z.infer<typeof insertBorrowingSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

// Dashboard Stats Interface
export interface DashboardStats {
  todaySales: number;
  monthSales: number;
  pendingUdhaar: number;
  trustableCount: number;
  riskyCount: number;
}

// Login
export const loginSchema = z.object({
  username: z.string().min(1, "Name is required"),
});
export type LoginRequest = z.infer<typeof loginSchema>;
