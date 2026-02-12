import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { notificationService } from "./services/notificationService";
import { invoiceService } from "./services/invoiceService";
import { insightsService } from "./services/insightsService";
import { inventoryService } from "./services/inventoryService";
import { trustScoreService } from "./services/trustScoreService";
import { expenseService } from "./services/expenseService";
import { generateToken, authenticateToken, AuthRequest } from "./middleware/auth";  // ✨ NEW
import { userManagementService } from "./services/userManagementService";
import { supplierService } from "./services/supplierService";
import { reportService } from "./services/reportService";
import { dailySummaryService } from "./services/dailySummaryService";
import { paymentService } from "./services/paymentService";
import { db } from "./db";
import { notificationSettings, notificationsLog, paymentSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

// Helper: safely parse input that may be string | string[] | undefined into Date | undefined
function parseRequestDate(val: unknown): Date | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) val = val[0];
  if (typeof val === "string" && val.trim() !== "") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  return undefined;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Login (Mock)
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          message: "Username and password are required"
        });
      }

      // Check if user exists in database
      const user = await db.query.users.findFirst({
        where: (field, { eq }) => eq(field.username, username),
      });

      if (!user) {
        return res.status(401).json({
          message: "Invalid username or password"
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          message: "Account is deactivated"
        });
      }

      // Simple password check (in production, use proper hashing)
      if (user.password !== password) {
        return res.status(401).json({
          message: "Invalid username or password"
        });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        username: user.username,
        mobileNo: user.mobileNo,
        role: user.role ?? "STAFF"
      });

      // Return user info with token
      res.json({
        success: true,
        token,  // ✨ JWT token for authentication
        user: {
          username: user.username,
          role: user.role,
          userId: user.id,
          mobileNo: user.mobileNo
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        message: "Internal server error"
      });
    }
  });

  // Signup
  app.post(api.auth.signup.path, async (req, res) => {
    try {
      const { username, password, confirmPassword, mobileNo } = req.body;

      if (!username || !password || !confirmPassword || !mobileNo) {
        return res.status(400).json({
          message: "Username, password, confirm password, and mobile number are required"
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          message: "Passwords do not match"
        });
      }

      const user = await userManagementService.signup({
        username,
        password,
        mobileNo  // ✨ CHANGED: Required field
      });

      res.status(201).json({
        success: true,
        username: user.username
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({
        message: error.message || "Signup failed"
      });
    }
  });

  // Dashboard Stats
  app.get(api.dashboard.stats.path, authenticateToken, async (req: AuthRequest, res) => {
    const mobileNo = req.user!.mobileNo;
    const stats = await storage.getDashboardStats(mobileNo);
    res.json(stats);
  });

  // Customers
  app.get(api.customers.list.path, authenticateToken, async (req: AuthRequest, res) => {
    const mobileNo = req.user!.mobileNo;  // ✨ Get from authenticated user
    const customers = await storage.getCustomers(mobileNo);  // ✨ Filter by mobileNo
    res.json(customers);
  });

  app.post(api.customers.create.path, authenticateToken, async (req: AuthRequest, res) => {
    try {
      const input = api.customers.create.input.parse(req.body);
      const mobileNo = req.user!.mobileNo;  // ✨ Get from authenticated user
      const customer = await storage.createCustomer(input, mobileNo);  // ✨ Use user's mobileNo
      res.status(201).json(customer);
    } catch (error: any) {
      console.error("Customer creation error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }

      // Check for custom error messages first
      if (error?.message) {
        if (error.message.includes("already registered")) {
          return res.status(400).json({ message: error.message });
        }
        if (error.message.includes("Customer not found")) {
          return res.status(404).json({ message: error.message });
        }
      }

      // Check for PostgreSQL error codes
      if (error?.code === "23505") {
        return res.status(400).json({ message: "This phone number is already registered" });
      }

      // Fallback error
      return res.status(500).json({ message: error?.message || "Failed to create customer" });
    }
  });

  app.get(api.customers.get.path, async (req, res) => {
    const customer = await storage.getCustomer(Number(req.params.id));
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  });

  // Borrowings
  app.get(api.borrowings.list.path, authenticateToken, async (req: AuthRequest, res) => {
    const mobileNo = req.user!.mobileNo;
    const borrowings = await storage.getBorrowings(mobileNo);
    res.json(borrowings);
  });

  app.post(api.borrowings.create.path, authenticateToken, async (req: AuthRequest, res) => {
    try {
      const input = api.borrowings.create.input.parse(req.body);
      const mobileNo = req.user!.mobileNo;
      const borrowing = await storage.createBorrowing(input, mobileNo);
      res.status(201).json(borrowing);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else if (error.message?.includes("Customer not found")) {
        res.status(400).json({ message: error.message });
      } else if (error.code === "23503") {
        // PostgreSQL foreign key constraint violation (fallback)
        res.status(400).json({ message: "Customer not found" });
      } else {
        console.error("Error creating borrowing:", error);
        res.status(500).json({ message: error.message || "Failed to create borrowing" });
      }
    }
  });

  app.patch(api.borrowings.update.path, authenticateToken, async (req: AuthRequest, res) => {
    const { status } = req.body;
    try {
      const borrowing = await storage.updateBorrowingStatus(Number(req.params.id), status);
      res.json(borrowing);
    } catch (error: any) {
      if (error.message?.includes("Borrowing not found")) {
        res.status(404).json({ message: "Borrowing not found" });
      } else {
        console.error("Error updating borrowing status:", error);
        res.status(500).json({ message: error.message || "Failed to update borrowing status" });
      }
    }
  });

  // Sales
  app.get(api.sales.list.path, authenticateToken, async (req: AuthRequest, res) => {
    const mobileNo = req.user!.mobileNo;
    const sales = await storage.getSales(mobileNo);
    res.json(sales);
  });

  app.post(api.sales.create.path, authenticateToken, async (req: AuthRequest, res) => {
    try {
      const input = api.sales.create.input.parse(req.body);
      const mobileNo = req.user!.mobileNo;
      const sale = await storage.createSale(input, mobileNo);
      res.status(201).json(sale);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else if (error.message?.includes("Customer not found")) {
        res.status(400).json({ message: error.message });
      } else if (error.message?.includes("trust score")) {
        console.error("Error calculating trust score:", error);
        res.status(500).json({ message: "Failed to calculate customer trust score" });
      } else if (error.code === "23503") {
        // PostgreSQL foreign key constraint violation (fallback)
        res.status(400).json({ message: "Customer not found" });
      } else {
        console.error("Error creating sale:", error);
        res.status(500).json({ message: error.message || "Failed to create sale" });
      }
    }
  });

  // === PRODUCTS ROUTES ===
  app.get(api.products.list.path, authenticateToken, async (req: AuthRequest, res) => {
    const mobileNo = req.user!.mobileNo;
    const products = await storage.getProducts(mobileNo);
    res.json(products);
  });

  app.post(api.products.create.path, authenticateToken, async (req: AuthRequest, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const mobileNo = req.user!.mobileNo;
      const product = await storage.createProduct(input, mobileNo);
      res.status(201).json(product);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error("Error creating product:", error);
        res.status(500).json({ message: error.message || "Failed to create product" });
      }
    }
  });

  app.put(api.products.update.path, authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(String(req.params.id));
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(id, input);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error("Error updating product:", error);
        res.status(500).json({ message: error.message || "Failed to update product" });
      }
    }
  });

  app.delete(api.products.delete.path, authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(String(req.params.id));
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: error.message || "Failed to delete product" });
    }
  });

  // === NOTIFICATION ROUTES ===

  // Get notification settings for a customer
  app.get("/api/notifications/settings/:customerId", async (req, res) => {
    try {
      const settings = await db.query.notificationSettings.findFirst({
        where: (field, { eq }) => eq(field.customerId, Number(req.params.customerId)),
      });
      res.json(settings || { customerId: Number(req.params.customerId) });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  // Update notification settings for a customer (WhatsApp only)
  app.post("/api/notifications/settings", async (req, res) => {
    try {
      const { customerId, whatsappEnabled, reminderDaysBefore } = req.body;

      const existing = await db.query.notificationSettings.findFirst({
        where: (field, { eq }) => eq(field.customerId, customerId),
      });

      if (existing) {
        await db
          .update(notificationSettings)
          .set({
            whatsappEnabled: whatsappEnabled ?? true,
            reminderDaysBefore: reminderDaysBefore ?? 1
          })
          .where(eq(notificationSettings.customerId, customerId));
      } else {
        await db.insert(notificationSettings).values({
          customerId,
          whatsappEnabled: whatsappEnabled ?? true,
          smsEnabled: false,
          emailEnabled: false,
          reminderDaysBefore: reminderDaysBefore ?? 1,
        });
      }

      res.json({ success: true, message: "Notification settings updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Get notification logs for a customer
  app.get("/api/notifications/logs/:customerId", async (req, res) => {
    try {
      const logs = await db.query.notificationsLog.findMany({
        where: (field, { eq }) => eq(field.customerId, Number(req.params.customerId)),
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification logs" });
    }
  });

  // Manually trigger overdue reminders (for testing or scheduled jobs)
  app.post("/api/notifications/send-overdue-reminders", async (req, res) => {
    try {
      await notificationService.sendOverdueReminders();
      res.json({ success: true, message: "Overdue reminders sent" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  // Manually trigger upcoming due reminders
  app.post("/api/notifications/send-upcoming-reminders", async (req, res) => {
    try {
      await notificationService.sendUpcomingDueReminders();
      res.json({ success: true, message: "Upcoming reminders sent" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  // === INVOICE ROUTES ===

  // Create invoice for a sale
  app.post("/api/invoices/create", async (req, res) => {
    try {
      const { saleId, customerId, items, amount } = req.body;
      const invoice = await invoiceService.createInvoice({
        saleId,
        customerId,
        items,
        amount,
      });
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Get invoice by ID
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await invoiceService.getInvoice(Number(req.params.id));
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Get invoices for a sale
  app.get("/api/invoices/sale/:saleId", async (req, res) => {
    try {
      const invoices = await invoiceService.getInvoicesBySaleId(
        Number(req.params.saleId)
      );
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get invoices for a customer
  app.get("/api/invoices/customer/:customerId", async (req, res) => {
    try {
      const invoices = await invoiceService.getInvoicesByCustomer(
        Number(req.params.customerId)
      );
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer invoices" });
    }
  });

  // Update invoice status
  app.patch("/api/invoices/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const invoice = await invoiceService.updateInvoiceStatus(
        Number(req.params.id),
        status
      );
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Send receipt via WhatsApp/SMS/Email after a sale
  app.post("/api/receipts/send", async (req, res) => {
    try {
      const { saleId, customerId, invoiceId } = req.body;
      const result = await notificationService.sendSaleReceipt(
        saleId,
        customerId,
        invoiceId
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to send receipt" });
    }
  });

  // === INSIGHTS ROUTES ===

  // Get all business insights
  app.get("/api/insights/all", async (req, res) => {
    try {
      const insights = await insightsService.getAllInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  // Get critical alerts only
  app.get("/api/insights/critical", async (req, res) => {
    try {
      const alerts = await insightsService.getCriticalAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch critical alerts" });
    }
  });

  // === INVENTORY ROUTES ===

  // Add inventory item
  app.post("/api/inventory/add", async (req, res) => {
    try {
      const { name, sku, quantity, minThreshold } = req.body;
      const item = await inventoryService.addInventoryItem({
        name,
        sku,
        quantity,
        minThreshold,
      });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to add inventory item" });
    }
  });

  // Get all inventory items
  app.get("/api/inventory/all", async (req, res) => {
    try {
      const items = await inventoryService.getAllItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  // Record inventory transaction
  app.post("/api/inventory/transaction", async (req, res) => {
    try {
      const { itemId, type, quantity, notes } = req.body;
      const result = await inventoryService.recordTransaction({
        itemId,
        type,
        quantity,
        notes,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to record transaction" });
    }
  });

  // Get inventory predictions
  app.get("/api/inventory/predictions", async (req, res) => {
    try {
      const predictions = await inventoryService.getAllInventoryPredictions();
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory predictions" });
    }
  });

  // Get critical inventory items
  app.get("/api/inventory/critical", async (req, res) => {
    try {
      const criticalItems = await inventoryService.getCriticalItems();
      res.json(criticalItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch critical items" });
    }
  });

  // Get prediction for specific item
  app.get("/api/inventory/:itemId/prediction", async (req, res) => {
    try {
      const prediction = await inventoryService.getInventoryPrediction(
        Number(req.params.itemId)
      );
      if (!prediction) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(prediction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prediction" });
    }
  });

  // Update inventory item
  app.patch("/api/inventory/:itemId", async (req, res) => {
    try {
      const { name, minThreshold } = req.body;
      const item = await inventoryService.updateItem(Number(req.params.itemId), {
        name,
        minThreshold,
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  // === TRUST SCORE ROUTES ===

  // Get trust score report for a customer
  app.get("/api/trust-score/:customerId/report", async (req, res) => {
    try {
      const report = await trustScoreService.getTrustScoreReport(
        Number(req.params.customerId)
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trust score report" });
    }
  });

  // Update trust score for a customer
  app.post("/api/trust-score/:customerId/update", async (req, res) => {
    try {
      const customer = await trustScoreService.updateCustomerTrustScore(
        Number(req.params.customerId)
      );
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update trust score" });
    }
  });

  // Update all trust scores (batch operation)
  app.post("/api/trust-score/update-all", async (req, res) => {
    try {
      const updated = await trustScoreService.updateAllTrustScores();
      res.json({ success: true, updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to update all trust scores" });
    }
  });

  // === EXPENSE ROUTES ===

  // Add an expense
  app.post("/api/expenses/add", async (req, res) => {
    try {
      const { category, amount, description, date } = req.body;
      const expense = await expenseService.addExpense({
        category,
        amount,
        description,
        date: parseRequestDate(date),
        invoiceNumber,
        paymentMethod,
      });
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to add expense" });
    }
  });

  // Get all expenses
  app.get("/api/expenses/all", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const expenses = await expenseService.getAllExpenses(limit);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Get expenses by date range
  app.get("/api/expenses/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const start = parseRequestDate(startDate);
      const end = parseRequestDate(endDate);
      if (!start || !end) return res.status(400).json({ message: "Invalid date format" });

      const expenses = await expenseService.getExpensesByDateRange(
        start,
        end
      );
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Get expenses by category
  app.get("/api/expenses/category/:category", async (req, res) => {
    try {
      const expenses = await expenseService.getExpensesByCategory(req.params.category);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Delete an expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const success = await expenseService.deleteExpense(Number(req.params.id));
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Get daily expense summary
  app.get("/api/expenses/summary/daily", async (req, res) => {
    try {
      const date = req.query.date ? parseRequestDate(req.query.date) ?? new Date() : new Date();
      const summary = await expenseService.getDailySummary(date);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily summary" });
    }
  });

  // Get monthly expense summary
  app.get("/api/expenses/summary/monthly", async (req, res) => {
    try {
      const { year, month } = req.query;
      if (!year || !month) {
        return res.status(400).json({ message: "year and month are required" });
      }

      const summary = await expenseService.getMonthlySummary(
        Number(year),
        Number(month)
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly summary" });
    }
  });

  // Get yearly expense summary
  app.get("/api/expenses/summary/yearly", async (req, res) => {
    try {
      const { year } = req.query;
      if (!year) {
        return res.status(400).json({ message: "year is required" });
      }

      const summary = await expenseService.getYearlySummary(Number(year));
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch yearly summary" });
    }
  });

  // Get profit/loss analysis
  app.get("/api/expenses/analysis", async (req, res) => {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const analysis = await expenseService.getProfitAnalysis(months);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profit analysis" });
    }
  });

  // === USER MANAGEMENT ROUTES ===

  // Create new user
  app.post("/api/users/create", async (req, res) => {
    try {
      const { username, email, role } = req.body;
      const user = await userManagementService.createUser({ username, email, role });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get all users
  app.get("/api/users/all", async (req, res) => {
    try {
      const users = await userManagementService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await userManagementService.getUserById(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user by username
  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const user = await userManagementService.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user role
  app.patch("/api/users/:id/role", async (req, res) => {
    try {
      const { role } = req.body;
      const user = await userManagementService.updateUserRole(Number(req.params.id), role);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Deactivate user
  app.post("/api/users/:id/deactivate", async (req, res) => {
    try {
      const success = await userManagementService.deactivateUser(Number(req.params.id));
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Activate user
  app.post("/api/users/:id/activate", async (req, res) => {
    try {
      const success = await userManagementService.activateUser(Number(req.params.id));
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate user" });
    }
  });

  // Get user activity logs
  app.get("/api/users/:id/activity-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const logs = await userManagementService.getUserActivityLogs(
        Number(req.params.id),
        limit
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Get module activity logs
  app.get("/api/activity-logs/module/:module", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const logs = await userManagementService.getModuleActivityLogs(
        req.params.module,
        limit
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch module logs" });
    }
  });

  // Get audit trail
  app.get("/api/audit-trail", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const trail = await userManagementService.getAuditTrail(limit);
      res.json(trail);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // === SUPPLIER MANAGEMENT ROUTES ===

  // Add supplier
  app.post("/api/suppliers/add", async (req, res) => {
    try {
      const { name, phone, email, address, paymentTerms } = req.body;
      const supplier = await supplierService.addSupplier({
        name,
        phone,
        email,
        address,
        paymentTerms,
      });
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to add supplier" });
    }
  });

  // Get all suppliers
  app.get("/api/suppliers/all", async (req, res) => {
    try {
      const suppliers = await supplierService.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Get supplier by ID
  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const supplier = await supplierService.getSupplierById(Number(req.params.id));
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  // Record supplier transaction
  app.post("/api/suppliers/:id/transaction", async (req, res) => {
    try {
      const { type, amount, description, invoiceNumber, dueDate } = req.body;
      const result = await supplierService.recordTransaction({
        supplierId: Number(req.params.id),
        type,
        amount,
        description,
        invoiceNumber,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to record transaction" });
    }
  });

  // Get supplier transactions
  app.get("/api/suppliers/:id/transactions", async (req, res) => {
    try {
      const transactions = await supplierService.getSupplierTransactions(
        Number(req.params.id)
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get pending payments
  app.get("/api/suppliers/payments/pending", async (req, res) => {
    try {
      const payments = await supplierService.getPendingPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending payments" });
    }
  });

  // Get supplier summary
  app.get("/api/suppliers/:id/summary", async (req, res) => {
    try {
      const summary = await supplierService.getSupplierSummary(Number(req.params.id));
      if (!summary) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier summary" });
    }
  });

  // Get all suppliers summary
  app.get("/api/suppliers/summary/all", async (req, res) => {
    try {
      const summaries = await supplierService.getAllSuppliersSummary();
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers summary" });
    }
  });

  // Update supplier
  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const { name, phone, email, address, paymentTerms } = req.body;
      const supplier = await supplierService.updateSupplier(Number(req.params.id), {
        name,
        phone,
        email,
        address,
        paymentTerms,
      });
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  // Deactivate supplier
  app.post("/api/suppliers/:id/deactivate", async (req, res) => {
    try {
      const success = await supplierService.deactivateSupplier(Number(req.params.id));
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate supplier" });
    }
  });

  // === REPORT GENERATION ROUTES ===

  // Generate sales report
  app.get("/api/reports/sales", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const report = await reportService.generateSalesReport(
        parseRequestDate(startDate) as Date,
        parseRequestDate(endDate) as Date
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate sales report" });
    }
  });

  // Generate customer report
  app.get("/api/reports/customers", async (req, res) => {
    try {
      const report = await reportService.generateCustomerReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate customer report" });
    }
  });

  // Generate expense report
  app.get("/api/reports/expenses", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const report = await reportService.generateExpenseReport(
        parseRequestDate(startDate) as Date,
        parseRequestDate(endDate) as Date
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate expense report" });
    }
  });

  // Generate financial report (comprehensive)
  app.get("/api/reports/financial", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const report = await reportService.generateFinancialReport(
        parseRequestDate(startDate) as Date,
        parseRequestDate(endDate) as Date
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate financial report" });
    }
  });

  // Generate borrowing (credit) report
  app.get("/api/reports/borrowings", async (req, res) => {
    try {
      const report = await reportService.generateBorrowingReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate borrowing report" });
    }
  });

  // Export report as JSON (for client to convert to PDF/Excel)
  app.post("/api/reports/export", async (req, res) => {
    try {
      const { reportType, data } = req.body;

      // Set headers for file download
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="report-${reportType}-${Date.now()}.json"`
      );

      res.json({
        type: reportType,
        generatedAt: new Date(),
        data,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  // Daily Summary - Get today's summary
  app.get("/api/daily-summary/today", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const mobileNo = req.user!.mobileNo;
      const summary = await dailySummaryService.generateDailySummary(new Date(), mobileNo);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate daily summary" });
    }
  });

  // Daily Summary - Get summary for specific date
  app.get("/api/daily-summary/:date", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const date = parseRequestDate(req.params.date);
      if (!date) return res.status(400).json({ message: "Invalid date format" });
      const mobileNo = req.user!.mobileNo;
      const summary = await dailySummaryService.generateDailySummary(date, mobileNo);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate daily summary" });
    }
  });

  // Daily Summary - Send summary to phone
  app.post("/api/daily-summary/send", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      const mobileNo = req.user!.mobileNo;
      const summary = await dailySummaryService.generateDailySummary(new Date(), mobileNo);
      const success = await dailySummaryService.sendDailySummary(
        phoneNumber,
        summary
      );
      res.json({
        success,
        message: success ? "Summary sent successfully" : "Failed to send summary",
        summary,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send daily summary" });
    }
  });

  // Daily Summary - Schedule recurring daily summary
  app.post("/api/daily-summary/schedule", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { phoneNumber, hour = 20, minute = 0 } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const result = await dailySummaryService.scheduleDailySummary(
        phoneNumber,
        parseInt(hour),
        parseInt(minute)
      );

      res.json({
        success: true,
        message: "Daily summary scheduled successfully",
        scheduling: result,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule daily summary" });
    }
  });

  // Daily Summary - Get weekly summary
  app.get("/api/daily-summary/weekly", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const mobileNo = req.user!.mobileNo;
      const weeklySummary = await dailySummaryService.getWeeklySummary(mobileNo);
      res.json(weeklySummary);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate weekly summary" });
    }
  });

  // === UPI PAYMENT ROUTES ===

  // Webhook endpoint - Receive payment notifications from payment provider (Razorpay, PayU, etc.)
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const { customerId, amount, transactionId, reference, upiId, payerName, paymentDate } = req.body;

      // Validate webhook payload
      if (!customerId || !amount || !transactionId) {
        return res.status(400).json({ message: "Missing required payment fields" });
      }

      const payment = await paymentService.recordUPIPayment({
        customerId: Number(customerId),
        amount: Number(amount),
        transactionId,
        reference,
        upiId,
        payerName,
        paymentDate: parseRequestDate(paymentDate),
      });

      res.json(payment);
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: error.message || "Failed to process payment" });
    }
  });

  // Manual UPI payment recording (for testing/admin)
  app.post("/api/payments/record", async (req, res) => {
    try {
      const { customerId, amount, transactionId, reference, upiId, payerName, paymentDate } = req.body;

      const payment = await paymentService.recordUPIPayment({
        customerId: Number(customerId),
        amount: Number(amount),
        transactionId,
        reference,
        upiId,
        payerName,
        paymentDate: parseRequestDate(paymentDate),
      });

      res.json(payment);
    } catch (error: any) {
      console.error("Payment recording error:", error);
      res.status(400).json({ message: error.message || "Failed to record payment" });
    }
  });

  // Get all payments for a customer
  app.get("/api/payments/customer/:customerId", async (req, res) => {
    try {
      const payments = await paymentService.getCustomerPayments(Number(req.params.customerId));
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer payments" });
    }
  });

  // Get all payments (admin only)
  app.get("/api/payments/all", async (req, res) => {
    try {
      const payments = await paymentService.getAllPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Get payment by transaction ID
  app.get("/api/payments/:transactionId", async (req, res) => {
    try {
      const payment = await paymentService.getPaymentByTransactionId(req.params.transactionId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  // Get payment summary for a date range
  app.get("/api/payments/summary/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const summary = await paymentService.getPaymentsSummary(
        parseRequestDate(startDate) as Date,
        parseRequestDate(endDate) as Date
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment summary" });
    }
  });

  // Update payment status (for handling failed/refunded payments)
  app.patch("/api/payments/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!["SUCCESS", "PENDING", "FAILED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const payment = await paymentService.updatePaymentStatus(Number(req.params.id), status);
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // === PAYMENT SETTINGS ROUTES ===

  // Get owner's payment settings
  app.get("/api/payment-settings", async (req, res) => {
    try {
      const settings = await db.query.paymentSettings.findFirst();
      if (!settings) {
        return res.json({
          id: null,
          enableUpi: true,
          enableBankTransfer: false,
          enableCard: false,
          enableCash: true,
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  // Get public payment settings (for customers to see available payment methods)
  app.get("/api/payment-settings/public", async (req, res) => {
    try {
      const settings = await db.query.paymentSettings.findFirst();
      if (!settings) {
        return res.json({
          enableUpi: true,
          enableBankTransfer: false,
          enableCard: false,
          enableCash: true,
          ownerUpiId: null,
          ownerPhoneNumber: null,
          bankName: null,
          qrCodeUrl: null,
        });
      }
      // Only return public information, not API keys or secrets
      res.json({
        enableUpi: settings.enableUpi,
        enableBankTransfer: settings.enableBankTransfer,
        enableCard: settings.enableCard,
        enableCash: settings.enableCash,
        ownerUpiId: settings.ownerUpiId,
        ownerPhoneNumber: settings.ownerPhoneNumber,
        bankName: settings.bankName,
        qrCodeUrl: settings.qrCodeUrl,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  // Save/update owner's payment settings
  app.post("/api/payment-settings", async (req, res) => {
    try {
      const {
        ownerUpiId,
        ownerUpiName,
        ownerPhoneNumber,
        bankName,
        bankAccountNumber,
        bankIfsc,
        qrCodeUrl,
        razorpayApiKey,
        razorpayWebhookSecret,
        enableUpi,
        enableBankTransfer,
        enableCard,
        enableCash,
      } = req.body;

      // Check if settings already exist
      const existingSettings = await db.query.paymentSettings.findFirst();

      if (existingSettings) {
        // Update existing settings
        const updated = await db
          .update(paymentSettings)
          .set({
            ownerUpiId: ownerUpiId || existingSettings.ownerUpiId,
            ownerUpiName: ownerUpiName || existingSettings.ownerUpiName,
            ownerPhoneNumber: ownerPhoneNumber || existingSettings.ownerPhoneNumber,
            bankName: bankName || existingSettings.bankName,
            bankAccountNumber: bankAccountNumber || existingSettings.bankAccountNumber,
            bankIfsc: bankIfsc || existingSettings.bankIfsc,
            qrCodeUrl: qrCodeUrl || existingSettings.qrCodeUrl,
            razorpayApiKey: razorpayApiKey || existingSettings.razorpayApiKey,
            razorpayWebhookSecret: razorpayWebhookSecret || existingSettings.razorpayWebhookSecret,
            enableUpi: enableUpi !== undefined ? enableUpi : existingSettings.enableUpi,
            enableBankTransfer: enableBankTransfer !== undefined ? enableBankTransfer : existingSettings.enableBankTransfer,
            enableCard: enableCard !== undefined ? enableCard : existingSettings.enableCard,
            enableCash: enableCash !== undefined ? enableCash : existingSettings.enableCash,
            updatedAt: new Date(),
          })
          .where(eq(paymentSettings.id, existingSettings.id))
          .returning();

        res.json({
          success: true,
          message: "Payment settings updated",
          settings: updated[0],
        });
      } else {
        // Create new settings
        const created = await db
          .insert(paymentSettings)
          .values({
            ownerUpiId,
            ownerUpiName,
            ownerPhoneNumber,
            bankName,
            bankAccountNumber,
            bankIfsc,
            qrCodeUrl,
            razorpayApiKey,
            razorpayWebhookSecret,
            enableUpi: enableUpi !== undefined ? enableUpi : true,
            enableBankTransfer: enableBankTransfer !== undefined ? enableBankTransfer : false,
            enableCard: enableCard !== undefined ? enableCard : false,
            enableCash: enableCash !== undefined ? enableCash : true,
          })
          .returning();

        res.status(201).json({
          success: true,
          message: "Payment settings created",
          settings: created[0],
        });
      }
    } catch (error: any) {
      console.error("Payment settings error:", error);
      res.status(500).json({ message: error?.message || "Failed to save payment settings" });
    }
  });

  return httpServer;
}
