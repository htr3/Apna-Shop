import {
  customers, borrowings, sales,
  type Customer, type InsertCustomer,
  type Borrowing, type InsertBorrowing,
  type Sale, type InsertSale,
  type DashboardStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte } from "drizzle-orm"

export interface IStorage {
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer>;

  // Borrowings
  getBorrowings(): Promise<(Borrowing & { customerName: string })[]>;
  createBorrowing(borrowing: InsertBorrowing): Promise<Borrowing>;
  updateBorrowingStatus(id: number, status: "PAID" | "PENDING" | "OVERDUE"): Promise<Borrowing>;

  // Sales
  getSales(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer>;
  private borrowings: Map<number, Borrowing>;
  private sales: Map<number, Sale>;
  private currentId: { customers: number; borrowings: number; sales: number };

  constructor() {
    this.customers = new Map();
    this.borrowings = new Map();
    this.sales = new Map();
    this.currentId = { customers: 1, borrowings: 1, sales: 1 };
    
    this.seedData();
  }

  private seedData() {
    // Seed Customers
    const initialCustomers: InsertCustomer[] = [
      { name: "Rahul Sharma", phone: "9876543210", trustScore: 85, totalPurchase: "15000", borrowedAmount: "2000", isRisky: false },
      { name: "Anita Desai", phone: "9876543211", trustScore: 45, totalPurchase: "5000", borrowedAmount: "4500", isRisky: true },
      { name: "Vikram Singh", phone: "9876543212", trustScore: 95, totalPurchase: "25000", borrowedAmount: "0", isRisky: false },
      { name: "Priya Patel", phone: "9876543213", trustScore: 30, totalPurchase: "2000", borrowedAmount: "1500", isRisky: true },
      { name: "Amit Kumar", phone: "9876543214", trustScore: 75, totalPurchase: "12000", borrowedAmount: "500", isRisky: false },
    ];

    initialCustomers.forEach(c => this.createCustomer(c));

    // Seed Sales (Last 30 days)
    const today = new Date();
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - Math.floor(Math.random() * 30));
      this.createSale({
        amount: (Math.floor(Math.random() * 500) + 100).toString(),
        date: date,
        paymentMethod: Math.random() > 0.3 ? "CASH" : "ONLINE",
        customerId: Math.floor(Math.random() * 5) + 1
      });
    }

    // Seed Borrowings
    this.createBorrowing({
      customerId: 1,
      amount: "2000",
      date: new Date(today.getTime() - 86400000 * 5), // 5 days ago
      dueDate: new Date(today.getTime() + 86400000 * 10), // in 10 days
      status: "PENDING",
      notes: "Monthly ration"
    });

    this.createBorrowing({
      customerId: 2,
      amount: "4500",
      date: new Date(today.getTime() - 86400000 * 20),
      dueDate: new Date(today.getTime() - 86400000 * 5), // Overdue by 5 days
      status: "OVERDUE",
      notes: "Promised next week"
    });
    
    this.createBorrowing({
      customerId: 4,
      amount: "1500",
      date: new Date(today.getTime() - 86400000 * 2),
      dueDate: new Date(today.getTime() + 86400000 * 15),
      status: "PENDING",
      notes: ""
    });
  }

  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentId.customers++;
    const customer: Customer = {
      id,
      userId: 1,
      name: insertCustomer.name,
      phone: insertCustomer.phone,
      trustScore: insertCustomer.trustScore ?? 100,
      totalPurchase: insertCustomer.totalPurchase ?? "0",
      borrowedAmount: insertCustomer.borrowedAmount ?? "0",
      isRisky: insertCustomer.isRisky ?? false,
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer> {
    const existing = this.customers.get(id);
    if (!existing) throw new Error("Customer not found");
    const updated: Customer = {
      id: existing.id,
      userId: existing.userId,
      name: updates.name ?? existing.name,
      phone: updates.phone ?? existing.phone,
      trustScore: updates.trustScore ?? existing.trustScore,
      totalPurchase: updates.totalPurchase ?? existing.totalPurchase,
      borrowedAmount: updates.borrowedAmount ?? existing.borrowedAmount,
      isRisky: updates.isRisky ?? existing.isRisky,
    };
    this.customers.set(id, updated);
    return updated;
  }

  async getBorrowings(): Promise<(Borrowing & { customerName: string })[]> {
    return Array.from(this.borrowings.values()).map(b => {
      const customer = this.customers.get(b.customerId);
      return { ...b, customerName: customer ? customer.name : "Unknown" };
    });
  }

  async createBorrowing(insertBorrowing: InsertBorrowing): Promise<Borrowing> {
    const id = this.currentId.borrowings++;
    const borrowing: Borrowing = {
      id,
      customerId: insertBorrowing.customerId,
      amount: insertBorrowing.amount,
      date: insertBorrowing.date || null,
      dueDate: insertBorrowing.dueDate || null,
      status: insertBorrowing.status || "PENDING",
      notes: insertBorrowing.notes || null,
    };
    this.borrowings.set(id, borrowing);
    return borrowing;
  }
  async updateBorrowingStatus(id: number, status: "PAID" | "PENDING" | "OVERDUE"): Promise<Borrowing> {
    const existing = this.borrowings.get(id);
    if (!existing) throw new Error("Borrowing not found");
    const updated = { ...existing, status };
    this.borrowings.set(id, updated);
    return updated;
  }

  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values()).sort((a, b) => 
      (b.date?.getTime() || 0) - (a.date?.getTime() || 0)
    );
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentId.sales++;
    const sale: Sale = {
      id,
      userId: 1,
      amount: insertSale.amount,
      paidAmount: insertSale.paidAmount ?? "0",
      pendingAmount: insertSale.pendingAmount ?? "0",
      date: insertSale.date ?? null,
      paymentMethod: insertSale.paymentMethod ?? "CASH",
      customerId: insertSale.customerId ?? null,
    };
    this.sales.set(id, sale);
    return sale;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const salesList = Array.from(this.sales.values());
    const borrowingsList = Array.from(this.borrowings.values());
    const customersList = Array.from(this.customers.values());

    const todaySales = salesList
      .filter(s => s.date && s.date >= startOfDay)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const monthSales = salesList
      .filter(s => s.date && s.date >= startOfMonth)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Pending Udhaar = borrowings (PENDING/OVERDUE) + pending amounts from sales
    const borrowingsPending = borrowingsList
      .filter(b => b.status === "PENDING" || b.status === "OVERDUE")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const salesPendingTotal = salesList
      .reduce((acc, curr) => acc + Number(curr.pendingAmount || 0), 0);

    const pendingUdhaar = borrowingsPending + salesPendingTotal;

    const trustableCount = customersList.filter(c => (c.trustScore || 0) >= 70).length;
    const riskyCount = customersList.filter(c => (c.trustScore || 0) < 40).length;

    return {
      todaySales,
      monthSales,
      pendingUdhaar,
      trustableCount,
      riskyCount
    };
  }
}

// Database-backed storage using Drizzle ORM
export class DbStorage implements IStorage {
  async getCustomers(): Promise<Customer[]> {
    return await db.query.customers.findMany();
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return await db.query.customers.findFirst({
      where: (field, { eq }) => eq(field.id, id),
    });
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      const result = await db.insert(customers).values({
        ...customer,
        userId: 1, // Default user ID for single-user app
      }).returning();
      return result[0];
    } catch (error: any) {
      if (error.code === "23505") {
        // Unique constraint violation
        throw new Error("This phone number is already registered");
      }
      throw error;
    }
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer> {
    const result = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    if (!result[0]) throw new Error("Customer not found");
    return result[0];
  }

  async getBorrowings(): Promise<(Borrowing & { customerName: string })[]> {
    const borrowingList = await db.query.borrowings.findMany();
    const customerMap = new Map<number, string>();

    for (const b of borrowingList) {
      if (!customerMap.has(b.customerId)) {
        const customer = await db.query.customers.findFirst({
          where: (field, { eq }) => eq(field.id, b.customerId),
        });
        customerMap.set(b.customerId, customer?.name || "Unknown");
      }
    }

    return borrowingList.map((b) => ({
      ...b,
      customerName: customerMap.get(b.customerId) || "Unknown",
    }));
  }

  async createBorrowing(borrowing: InsertBorrowing): Promise<Borrowing> {
    try {
      const result = await db.insert(borrowings).values(borrowing).returning();
      return result[0];
    } catch (error: any) {
      if (error.code === "23503") {
        // Foreign key constraint violation
        throw new Error("Customer not found");
      }
      throw error;
    }
  }

  async updateBorrowingStatus(
    id: number,
    status: "PAID" | "PENDING" | "OVERDUE"
  ): Promise<Borrowing> {
    const result = await db
      .update(borrowings)
      .set({ status })
      .where(eq(borrowings.id, id))
      .returning();
    if (!result[0]) throw new Error("Borrowing not found");
    return result[0];
  }

  async getSales(): Promise<Sale[]> {
    const salesList = await db.query.sales.findMany();
    return salesList.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    try {
      const result = await db.insert(sales).values({
        ...sale,
        userId: 1,
        date: sale.date || null,
      }).returning();
      const newSale = result[0];

      // If sale has a customerId, update customer's totalPurchase, borrowedAmount, and trust score
      if (newSale.customerId != null) {
        const customerId = newSale.customerId;
        const customer = await db.query.customers.findFirst({
          where: (field, { eq }) => eq(field.id, customerId),
        });

        if (customer) {
          const currentPurchase = Number(customer.totalPurchase);
          const totalSaleAmount = Number(newSale.amount);
          const newPurchase = currentPurchase + totalSaleAmount;

          // Update totalPurchase with full amount
          let updateData: any = { totalPurchase: newPurchase.toString() };

          // Add pending amount to borrowedAmount
          const pendingAmount = Number(newSale.pendingAmount || 0);
          if (pendingAmount > 0) {
            const currentBorrowed = Number(customer.borrowedAmount);
            const newBorrowed = currentBorrowed + pendingAmount;
            updateData.borrowedAmount = newBorrowed.toString();
          }

          // Update customer's total purchase and borrowed amount (if there's pending)
          await db
            .update(customers)
            .set(updateData)
            .where(eq(customers.id, newSale.customerId));

          // Import trustScoreService dynamically to avoid circular dependency
          try {
            const { trustScoreService } = await import("./services/trustScoreService");
            await trustScoreService.updateCustomerTrustScore(customerId);
          } catch (error) {
            console.error("Failed to update trust score:", error);
          }

          // Automatically create invoice and send receipt
          try {
            const { invoiceService } = await import("./services/invoiceService");
            const invoice = await invoiceService.createInvoice({
              saleId: newSale.id,
              customerId,
              amount: Number(newSale.amount),
            });

            const { notificationService } = await import("./services/notificationService");
            await notificationService.sendSaleReceipt(
              newSale.id,
              customerId,
              invoice.id
            );
          } catch (error) {
            console.error("Failed to create invoice or send receipt:", error);
          }
        }
      }

      return newSale;
    } catch (error: any) {
      if (error.code === "23503") {
        // Foreign key constraint violation
        throw new Error("Customer not found");
      }
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const salesList = await db.query.sales.findMany();
    const borrowingList = await db.query.borrowings.findMany();
    const customerList = await db.query.customers.findMany();

    const todaySales = salesList
      .filter((s) => s.date && s.date >= startOfDay)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const monthSales = salesList
      .filter((s) => s.date && s.date >= startOfMonth)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Pending Udhaar = borrowings (PENDING/OVERDUE) + pending amounts from sales
    const borrowingsPending = borrowingList
      .filter((b) => b.status === "PENDING" || b.status === "OVERDUE")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const salesPendingTotal = salesList
      .reduce((acc, curr) => acc + Number(curr.pendingAmount || 0), 0);

    const pendingUdhaar = borrowingsPending + salesPendingTotal;

    const trustableCount = customerList.filter((c) => (c.trustScore || 0) >= 70).length;
    const riskyCount = customerList.filter((c) => (c.trustScore || 0) < 40).length;

    return {
      todaySales,
      monthSales,
      pendingUdhaar,
      trustableCount,
      riskyCount,
    };
  }
}

// Use database storage when configured, otherwise fall back to in-memory storage.
export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
