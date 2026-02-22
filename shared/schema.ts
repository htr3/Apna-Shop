import { pgTable, text, serial, integer, boolean, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sale item payload schema for stock updates during sale creation.
const saleItemPayloadSchema = z.object({
  productId: z.number().int().optional(),
  productName: z.string().optional(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

// === TABLE DEFINITIONS ===

// Customers Table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  userId: integer("user_id").notNull(),
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
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
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
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  userId: integer("user_id").notNull(),
  amount: numeric("amount").notNull(), // Total amount (paid + pending)
  paidAmount: numeric("paid_amount").default("0"), // Amount paid immediately
  pendingAmount: numeric("pending_amount").default("0"), // Amount on credit/pending
  date: timestamp("date").defaultNow(),
  paymentMethod: text("payment_method", { enum: ["CASH", "ONLINE", "CREDIT"] }).default("CASH"),
  customerId: integer("customer_id"), // Optional, for tracking who bought what
});

// Sale Items Table (for tracking which products are sold)
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  productId: integer("product_id"), // NULL if isOther is true
  productName: text("product_name").notNull(), // Denormalized for quick access
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(), // Price per unit
  total: numeric("total").notNull(), // quantity * price
  isOther: boolean("is_other").default(false), // NEW: true if custom product, false if from product list
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification Settings Table
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  customerId: integer("customer_id").notNull(),
  whatsappEnabled: boolean("whatsapp_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  emailEnabled: boolean("email_enabled").default(false),
  reminderDaysBefore: integer("reminder_days_before").default(1), // Send reminder N days before due date
});

// Notifications Log Table (for tracking sent reminders)
export const notificationsLog = pgTable("notifications_log", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(), // Tenant identifier
  borrowingId: integer("borrowing_id").notNull(),
  customerId: integer("customer_id").notNull(),
  type: text("type", { enum: ["WHATSAPP", "SMS", "EMAIL"] }).notNull(),
  status: text("status", { enum: ["SENT", "FAILED", "PENDING"] }).default("PENDING"),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices Table (for tracking generated invoices)
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(), // Tenant identifier
  saleId: integer("sale_id").notNull(),
  customerId: integer("customer_id"),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: numeric("amount").notNull(),
  items: text("items"), // JSON stringified
  status: text("status", { enum: ["PENDING", "SENT", "CANCELLED"] }).default("PENDING"),
  invoiceUrl: text("invoice_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products Table (for quick product management in sales)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  quantity: integer("quantity").default(0), // Stock quantity
  unit: text("unit"), // e.g., "Piece", "Kg", "Liter", "Box"
  category: text("category"), // Optional: Snacks, Beverages, etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory Table (for tracking products)
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(), // Tenant identifier
  name: text("name").notNull(),
  sku: text("sku"),
  quantity: integer("quantity").default(0),
  minThreshold: integer("min_threshold").default(10), // Alert when below this
  avgDailySales: numeric("avg_daily_sales").default("0"),
  lastRestockDate: timestamp("last_restock_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory Transactions (for tracking inventory changes)
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(), // Tenant identifier
  itemId: integer("item_id").notNull(),
  type: text("type", { enum: ["SALE", "RESTOCK", "ADJUSTMENT", "LOSS"] }).notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses Table (for tracking shop expenses)
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  category: text("category", {
    enum: [
      "RENT",
      "ELECTRICITY",
      "SUPPLIER_PAYMENT",
      "SALARIES",
      "MAINTENANCE",
      "SHIPPING",
      "ADVERTISING",
      "UTILITIES",
      "OTHER",
    ],
  }).notNull(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
  invoiceNumber: text("invoice_number"),
  paymentMethod: text("payment_method", { enum: ["CASH", "CHECK", "ONLINE"] }).default("CASH"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users Table (for multi-user support)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull().unique(),  // ✨ CHANGED: Unique identifier for shopkeeper
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role", { enum: ["OWNER"] }).default("OWNER"),
  permissions: text("permissions"), // JSON stringified array of permissions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Activity Log (for audit trail)
export const userActivityLog = pgTable("user_activity_log", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // e.g., "CREATE_SALE", "VIEW_REPORT", "DELETE_EXPENSE"
  module: text("module").notNull(), // e.g., "SALES", "EXPENSES", "CUSTOMERS"
  resourceId: integer("resource_id"),
  changes: text("changes"), // JSON stringified changes
  timestamp: timestamp("timestamp").defaultNow(),
});

// Suppliers Table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  paymentTerms: text("payment_terms"), // e.g., "NET_30", "NET_60"
  totalOwed: numeric("total_owed").default("0"), // Total outstanding balance
  totalPurchased: numeric("total_purchased").default("0"), // Lifetime purchases
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supplier Transactions (purchases and payments)
export const supplierTransactions = pgTable("supplier_transactions", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  supplierId: integer("supplier_id").notNull(),
  type: text("type", { enum: ["PURCHASE", "PAYMENT", "RETURN", "ADJUSTMENT"] }).notNull(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  invoiceNumber: text("invoice_number"),
  dueDate: timestamp("due_date"),
  status: text("status", { enum: ["PAID", "PENDING", "OVERDUE"] }).default("PENDING"),
  createdAt: timestamp("created_at").defaultNow(),
});

// UPI Payments Table (for tracking online UPI payments)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  customerId: integer("customer_id").notNull(),
  borrowingId: integer("borrowing_id"), // Optional: links to specific borrowing
  amount: numeric("amount").notNull(),
  paymentMethod: text("payment_method", { enum: ["UPI", "BANK_TRANSFER", "CARD", "CASH"] }).default("UPI"),
  transactionId: text("transaction_id").notNull(), // Unique transaction ID from payment provider
  status: text("status", { enum: ["SUCCESS", "PENDING", "FAILED"] }).default("PENDING"),
  reference: text("reference"), // Payment reference/order ID
  upiId: text("upi_id"), // Customer's UPI ID
  payerName: text("payer_name"), // Name of person who paid
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Settings Table (for storing owner's payment configuration)
export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  mobileNo: text("mobile_no").notNull(),  // ✨ CHANGED: Shopkeeper identifier
  ownerUpiId: text("owner_upi_id"), // Owner's UPI ID
  ownerUpiName: text("owner_upi_name"), // Owner's name for UPI
  ownerPhoneNumber: text("owner_phone_number"), // Owner's phone number
  bankName: text("bank_name"), // Bank name for bank transfers
  bankAccountNumber: text("bank_account_number"), // Bank account number
  bankIfsc: text("bank_ifsc"), // IFSC code
  qrCodeUrl: text("qr_code_url"), // URL or base64 of QR code image
  razorpayApiKey: text("razorpay_api_key"), // Razorpay API key (should be encrypted in production)
  razorpayWebhookSecret: text("razorpay_webhook_secret"), // Razorpay webhook secret (should be encrypted in production)
  enableUpi: boolean("enable_upi").default(true),
  enableBankTransfer: boolean("enable_bank_transfer").default(false),
  enableCard: boolean("enable_card").default(false),
  enableCash: boolean("enable_cash").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHEMAS ===

// Manual schema creation to avoid drizzle-zod omit issues
export const insertCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  trustScore: z.number().int().min(0).max(100).optional(),
  totalPurchase: z.string().optional(),
  borrowedAmount: z.string().optional(),
  isRisky: z.boolean().optional(),
});

export const insertBorrowingSchema = z.object({
  customerId: z.number().int(),
  amount: z.string(),
  date: z.union([z.date(), z.string().datetime()]).pipe(z.coerce.date()).optional(),
  dueDate: z.union([z.date(), z.string().datetime()]).pipe(z.coerce.date()).optional(),
  status: z.enum(["PAID", "PENDING", "OVERDUE"]).optional(),
  notes: z.string().optional(),
});

export const insertSaleSchema = z.object({
  amount: z.string(),
  paidAmount: z.string().optional(),
  pendingAmount: z.string().optional(),
  date: z.union([z.date(), z.string().datetime()]).pipe(z.coerce.date()).optional(),
  paymentMethod: z.enum(["CASH", "ONLINE", "CREDIT"]).optional(),
  customerId: z.number().int().optional(),
  items: z.union([z.string(), z.array(saleItemPayloadSchema)]).optional(),
});

export const insertSaleItemSchema = z.object({
  saleId: z.number().int(),
  productId: z.number().int(),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.string(),
  total: z.string(),
  isOther: z.boolean().optional(),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  price: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = insertProductSchema.partial();

export const insertNotificationSettingsSchema = z.object({
  customerId: z.number().int(),
  whatsappEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  reminderDaysBefore: z.number().int().optional(),
});

export const insertNotificationsLogSchema = z.object({
  borrowingId: z.number().int(),
  customerId: z.number().int(),
  message: z.string().min(1),
  type: z.enum(["WHATSAPP", "SMS", "EMAIL"]),
  status: z.enum(["SENT", "FAILED", "PENDING"]).optional(),
  sentAt: z.union([z.date(), z.string().datetime()]).pipe(z.coerce.date()).optional(),
});

export const insertInvoiceSchema = z.object({
  saleId: z.number().int(),
  customerId: z.number().int().optional(),
  invoiceNumber: z.string().min(1),
  amount: z.string(),
  items: z.string().optional(),
  status: z.enum(["PENDING", "SENT", "CANCELLED"]).optional(),
});

export const insertInventorySchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.number().int().min(0),
  minThreshold: z.number().int().min(0).optional(),
  avgDailySales: z.string().optional(),
  lastRestockDate: z.union([z.date(), z.string().datetime()]).pipe(z.coerce.date()).optional(),
});

export const insertInventoryTransactionSchema = z.object({
  itemId: z.number().int(),
  quantity: z.number().int(),
  type: z.enum(["SALE", "RESTOCK", "ADJUSTMENT", "LOSS"]),
  notes: z.string().optional(),
});

export const insertExpenseSchema = z.object({
  category: z.enum([
    "RENT",
    "ELECTRICITY",
    "SUPPLIER_PAYMENT",
    "SALARIES",
    "MAINTENANCE",
    "SHIPPING",
    "ADVERTISING",
    "UTILITIES",
    "OTHER",
  ]),
  amount: z.string(),
  description: z.string().optional(),
  date: z.union([z.date(), z.string().datetime()]).pipe(z.coerce.date()).optional(),
  invoiceNumber: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CHECK", "ONLINE"]).optional(),
});

export const insertUserSchema = z.object({
  mobileNo: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  email: z.string().email().optional(),
  role: z.enum(["OWNER"]).optional(),
  permissions: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertUserActivityLogSchema = z.object({
  userId: z.number().int(),
  action: z.string().min(1),
  module: z.string().min(1),
  resourceId: z.number().int().optional(),
  changes: z.string().optional(),
  timestamp: z.union([z.date(), z.string().datetime()]).pipe(z.coerce.date()).optional(),
});

export const insertSupplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  totalOwed: z.string().optional(),
  totalPurchased: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertSupplierTransactionSchema = z.object({
  supplierId: z.number().int(),
  type: z.enum(["PURCHASE", "PAYMENT", "RETURN", "ADJUSTMENT"]),
  amount: z.string(),
  description: z.string().optional(),
  invoiceNumber: z.string().optional(),
  dueDate: z.union([z.date(), z.string().datetime()]).pipe(z.coerce.date()).optional(),
  status: z.enum(["PAID", "PENDING", "OVERDUE"]).optional(),
});

export const insertPaymentSchema = z.object({
  customerId: z.number().int(),
  borrowingId: z.number().int().optional(),
  amount: z.string(),
  paymentMethod: z.enum(["UPI", "BANK_TRANSFER", "CARD", "CASH"]).optional(),
  transactionId: z.string().min(1),
  status: z.enum(["SUCCESS", "PENDING", "FAILED"]).optional(),
  reference: z.string().optional(),
  upiId: z.string().optional(),
  payerName: z.string().optional(),
  paymentDate: z.union([z.date(), z.string().datetime()]).pipe(z.coerce.date()).optional(),
});

export const insertPaymentSettingsSchema = z.object({
  ownerUpiId: z.string().optional(),
  ownerUpiName: z.string().optional(),
  ownerPhoneNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  qrCodeUrl: z.string().optional(),
  razorpayApiKey: z.string().optional(),
  razorpayWebhookSecret: z.string().optional(),
  enableUpi: z.boolean().optional(),
  enableBankTransfer: z.boolean().optional(),
  enableCard: z.boolean().optional(),
  enableCash: z.boolean().optional(),
});

// === EXPLICIT API TYPES ===

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Borrowing = typeof borrowings.$inferSelect;
export type InsertBorrowing = z.infer<typeof insertBorrowingSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;

export type NotificationsLog = typeof notificationsLog.$inferSelect;
export type InsertNotificationsLog = z.infer<typeof insertNotificationsLogSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventorySchema>;

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type SupplierTransaction = typeof supplierTransactions.$inferSelect;
export type InsertSupplierTransaction = z.infer<typeof insertSupplierTransactionSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;

// Role permissions
export type UserRole = "OWNER";
export const rolePermissions: Record<UserRole, string[]> = {
  OWNER: [
    "VIEW_DASHBOARD",
    "CREATE_SALE",
    "VIEW_SALES",
    "EDIT_SALE",
    "DELETE_SALE",
    "CREATE_CUSTOMER",
    "VIEW_CUSTOMERS",
    "EDIT_CUSTOMER",
    "DELETE_CUSTOMER",
    "CREATE_BORROWING",
    "VIEW_BORROWINGS",
    "EDIT_BORROWING",
    "DELETE_BORROWING",
    "CREATE_EXPENSE",
    "VIEW_EXPENSES",
    "EDIT_EXPENSE",
    "DELETE_EXPENSE",
    "VIEW_REPORTS",
    "MANAGE_INVENTORY",
    "MANAGE_SUPPLIERS",
    "MANAGE_USERS",
    "VIEW_ANALYTICS",
  ],
};

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
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginRequest = z.infer<typeof loginSchema>;

// OTP and password reset
export const otpRequestSchema = z.object({
  identifier: z.string().min(1, "Username or mobile number is required"),
});
export const otpVerifySchema = z.object({
  identifier: z.string().min(1, "Username or mobile number is required"),
  otp: z.string().min(4, "OTP is required"),
});
export const passwordResetRequestSchema = otpRequestSchema;
export const passwordResetSchema = z.object({
  identifier: z.string().min(1, "Username or mobile number is required"),
  otp: z.string().min(4, "OTP is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

