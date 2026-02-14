import {
  customers, borrowings, sales, products,
  type Customer, type InsertCustomer,
  type Borrowing, type InsertBorrowing,
  type Sale, type InsertSale,
  type Product, type InsertProduct,
  type DashboardStats
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, gte, like } from "drizzle-orm"

export interface IStorage {
  // Customers
  getCustomers(mobileNo?: string): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer, mobileNo?: string): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer>;

  // Borrowings
  getBorrowings(mobileNo?: string): Promise<(Borrowing & { customerName: string })[]>;
  createBorrowing(borrowing: InsertBorrowing, mobileNo?: string): Promise<Borrowing>;
  updateBorrowingStatus(id: number, status: "PAID" | "PENDING" | "OVERDUE"): Promise<Borrowing>;
  updateBorrowingAmount(id: number, amount: string, mobileNo?: string): Promise<Borrowing | null>;

  // Sales
  getSales(mobileNo?: string): Promise<Sale[]>;
  createSale(sale: InsertSale, mobileNo?: string): Promise<Sale>;
  updateSale(id: number, updates: Partial<InsertSale>, mobileNo?: string): Promise<Sale | null>;
  deleteSale(id: number, mobileNo?: string): Promise<boolean>;

  // Products
  getProducts(mobileNo?: string): Promise<Product[]>;
  createProduct(product: InsertProduct, mobileNo?: string): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | null>;
  deleteProduct(id: number): Promise<boolean>;

  // Stats
  getDashboardStats(mobileNo?: string): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer>;
  private borrowings: Map<number, Borrowing>;
  private sales: Map<number, Sale>;
  private products: Map<number, Product>;
  private currentId: { customers: number; borrowings: number; sales: number; products: number };

  constructor() {
    this.customers = new Map();
    this.borrowings = new Map();
    this.sales = new Map();
    this.products = new Map();
    this.currentId = { customers: 1, borrowings: 1, sales: 1, products: 1 };

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

    // Seed Products
    const initialProducts: InsertProduct[] = [
      { name: "Tea (Cup)", price: "10", category: "Beverages", description: "Hot tea" },
      { name: "Coffee (Cup)", price: "20", category: "Beverages", description: "Black coffee" },
      { name: "Samosa", price: "5", category: "Snacks", description: "Fried samosa" },
      { name: "Biscuits Pack", price: "30", category: "Snacks", description: "Cookie biscuits" },
      { name: "Milk (250ml)", price: "15", category: "Beverages", description: "Fresh milk" },
    ];

    initialProducts.forEach(p => this.createProduct(p));

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

  async getCustomers(mobileNo?: string): Promise<Customer[]> {
    if (mobileNo) {
      return Array.from(this.customers.values()).filter(c => c.mobileNo === mobileNo);
    }
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer, mobileNo: string = "0"): Promise<Customer> {
    const id = this.currentId.customers++;
    const customer: Customer = {
      id,
      mobileNo,
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
      mobileNo: existing.mobileNo,
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

  async getBorrowings(mobileNo?: string): Promise<(Borrowing & { customerName: string })[]> {
    const list = Array.from(this.borrowings.values());
    const filtered = mobileNo ? list.filter(b => b.mobileNo === mobileNo) : list;
    const customerMap = new Map<number, string>();
    for (const b of filtered) {
      if (!customerMap.has(b.customerId)) {
        const customer = this.customers.get(b.customerId);
        customerMap.set(b.customerId, customer?.name || "Unknown");
      }
    }
    return filtered.map(b => ({
      ...b,
      customerName: customerMap.get(b.customerId) || "Unknown",
    }));
  }

  async createBorrowing(borrowing: InsertBorrowing, mobileNo: string = "0"): Promise<Borrowing> {
    const id = this.currentId.borrowings++;
    const record: Borrowing = {
      id,
      mobileNo,
      customerId: borrowing.customerId,
      amount: borrowing.amount,
      date: borrowing.date || new Date(),
      dueDate: borrowing.dueDate ?? null,
      status: borrowing.status || "PENDING",
      notes: borrowing.notes ?? null,
    };
    this.borrowings.set(id, record);
    return record;
  }
  async updateBorrowingStatus(id: number, status: "PAID" | "PENDING" | "OVERDUE"): Promise<Borrowing> {
    const existing = this.borrowings.get(id);
    if (!existing) throw new Error("Borrowing not found");
    const updated = { ...existing, status };
    this.borrowings.set(id, updated);
    return updated;
  }

  async updateBorrowingAmount(id: number, amount: string, mobileNo?: string): Promise<Borrowing | null> {
    const existing = this.borrowings.get(id);
    if (!existing) return null;

    // Check ownership if mobileNo provided
    if (mobileNo && existing.mobileNo !== mobileNo) return null;

    const oldAmount = Number(existing.amount);
    const newAmount = Number(amount);
    const difference = newAmount - oldAmount;

    // Update borrowing amount
    const updated = { ...existing, amount };
    this.borrowings.set(id, updated);

    // Update customer's borrowedAmount
    if (existing.customerId) {
      const customer = Array.from(this.customers.values()).find(c => c.id === existing.customerId);
      if (customer) {
        const currentBorrowed = Number(customer.borrowedAmount);
        const newBorrowed = Math.max(0, currentBorrowed + difference);
        const updatedCustomer = { ...customer, borrowedAmount: newBorrowed.toString() };
        this.customers.set(customer.id, updatedCustomer);
      }
    }

    return updated;
  }

  async getSales(mobileNo?: string): Promise<Sale[]> {
    const list = Array.from(this.sales.values());
    const filtered = mobileNo ? list.filter(s => s.mobileNo === mobileNo) : list;
    return filtered.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }

  async createSale(insertSale: InsertSale, mobileNo: string = "0"): Promise<Sale> {
    const id = this.currentId.sales++;
    const sale: Sale = {
      id,
      mobileNo,
      userId: 1,
      amount: insertSale.amount,
      paidAmount: insertSale.paidAmount || "0",
      pendingAmount: insertSale.pendingAmount || "0",
      date: insertSale.date || new Date(),
      paymentMethod: insertSale.paymentMethod || "CASH",
      customerId: insertSale.customerId ?? null,
    };
    this.sales.set(id, sale);

    // ✨ Auto-create borrowing record if sale has pending amount (udhari)
    const pendingAmount = Number(insertSale.pendingAmount || 0);
    if (pendingAmount > 0 && sale.customerId) {
      const borrowingId = this.currentId.borrowings++;
      const borrowing: Borrowing = {
        id: borrowingId,
        mobileNo,
        customerId: sale.customerId,
        amount: pendingAmount.toString(),
        date: sale.date,
        dueDate: null,
        status: "PENDING",
        notes: `Auto-created from Sale #${sale.id}`,
      };
      this.borrowings.set(borrowingId, borrowing);
    }

    return sale;
  }

  async updateSale(id: number, updates: Partial<InsertSale>, mobileNo?: string): Promise<Sale | null> {
    const existing = this.sales.get(id);
    if (!existing) return null;

    // Check ownership
    if (mobileNo && existing.mobileNo !== mobileNo) return null;

    const updated: Sale = {
      ...existing,
      ...updates,
    };
    this.sales.set(id, updated);

    // ✨ Sync pending amount changes to Udhari tab
    const oldPendingAmount = Number(existing.pendingAmount || 0);
    const newPendingAmount = Number(updates.pendingAmount ?? (existing.pendingAmount || 0));

    if (existing.customerId) {
      // If pending amount increased, create or update borrowing record
      if (newPendingAmount > oldPendingAmount) {
        const difference = newPendingAmount - oldPendingAmount;

        // Try to find existing auto-created borrowing for this sale
        const existingBorrowing = Array.from(this.borrowings.values()).find(
          b => b.notes?.includes(`Sale #${id}`) && b.customerId === existing.customerId
        );

        if (existingBorrowing) {
          // Update existing borrowing amount
          const updatedBorrowing: Borrowing = {
            ...existingBorrowing,
            amount: newPendingAmount.toString(),
          };
          this.borrowings.set(existingBorrowing.id, updatedBorrowing);
        } else {
          // Create new borrowing record for the difference
          const borrowingId = this.currentId.borrowings++;
          const borrowing: Borrowing = {
            id: borrowingId,
            mobileNo: existing.mobileNo,
            customerId: existing.customerId,
            amount: difference.toString(),
            date: existing.date,
            dueDate: null,
            status: "PENDING",
            notes: `Auto-created from Sale #${id} (Updated)`,
          };
          this.borrowings.set(borrowingId, borrowing);
        }
      } else if (newPendingAmount < oldPendingAmount) {
        // If pending amount decreased, update the borrowing record
        const existingBorrowing = Array.from(this.borrowings.values()).find(
          b => b.notes?.includes(`Sale #${id}`) && b.customerId === existing.customerId
        );

        if (existingBorrowing) {
          if (newPendingAmount === 0) {
            // Remove borrowing record if pending is now 0
            this.borrowings.delete(existingBorrowing.id);
          } else {
            // Update borrowing amount
            const updatedBorrowing: Borrowing = {
              ...existingBorrowing,
              amount: newPendingAmount.toString(),
            };
            this.borrowings.set(existingBorrowing.id, updatedBorrowing);
          }
        }
      }
    }

    return updated;
  }

  async deleteSale(id: number, mobileNo?: string): Promise<boolean> {
    const sale = this.sales.get(id);
    if (!sale) return false;

    // Check ownership
    if (mobileNo && sale.mobileNo !== mobileNo) return false;

    return this.sales.delete(id);
  }

  async getProducts(mobileNo?: string): Promise<Product[]> {
    const list = Array.from(this.products.values()).filter(p => p.isActive !== false);
    return mobileNo ? list.filter(p => p.mobileNo === mobileNo) : list;
  }

  async createProduct(product: InsertProduct, mobileNo: string = "0"): Promise<Product> {
    const id = this.currentId.products++;
    const record: Product = {
      id,
      mobileNo,
      userId: 1,
      name: product.name,
      price: product.price,
      quantity: product.quantity ?? 0,
      unit: product.unit ?? null,
      category: product.category ?? null,
      description: product.description ?? null,
      isActive: product.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(id, record);
    return record;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | null> {
    const existing = this.products.get(id);
    if (!existing) return null;

    const updated: Product = {
      ...existing,
      ...product,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getDashboardStats(mobileNo?: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const salesList = Array.from(this.sales.values());
    const borrowingsList = Array.from(this.borrowings.values());
    const customersList = Array.from(this.customers.values());

    const filteredSales = mobileNo ? salesList.filter(s => s.mobileNo === mobileNo) : salesList;
    const filteredBorrowings = mobileNo ? borrowingsList.filter(b => b.mobileNo === mobileNo) : borrowingsList;
    const filteredCustomers = mobileNo ? customersList.filter(c => c.mobileNo === mobileNo) : customersList;

    const todaySales = filteredSales
      .filter(s => s.date && s.date >= startOfDay)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const monthSales = filteredSales
      .filter(s => s.date && s.date >= startOfMonth)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const borrowingsPending = filteredBorrowings
      .filter(b => b.status === "PENDING" || b.status === "OVERDUE")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const salesPendingTotal = filteredSales
      .reduce((acc, curr) => acc + Number(curr.pendingAmount || 0), 0);

    const pendingUdhaar = borrowingsPending + salesPendingTotal;

    const trustableCount = filteredCustomers.filter(c => (c.trustScore || 0) >= 70).length;
    const riskyCount = filteredCustomers.filter(c => (c.trustScore || 0) < 40).length;

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
  async getCustomers(mobileNo?: string): Promise<Customer[]> {
    if (mobileNo) {
      return await db.query.customers.findMany({
        where: (field, { eq }) => eq(field.mobileNo, mobileNo),
      });
    }
    // Fallback: return all (for backward compatibility)
    return await db.query.customers.findMany();
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return await db.query.customers.findFirst({
      where: (field, { eq }) => eq(field.id, id),
    });
  }

  async createCustomer(customer: InsertCustomer, mobileNo: string = "0"): Promise<Customer> {
    try {
      const result = await db.insert(customers).values({
        ...customer,
        mobileNo: mobileNo,  // ✨ CHANGED: Use mobileNo instead of shopkeeperId
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

  async getBorrowings(mobileNo?: string): Promise<(Borrowing & { customerName: string })[]> {
    const borrowingList = await db.query.borrowings.findMany({
      where: mobileNo ? (field, { eq }) => eq(field.mobileNo, mobileNo) : undefined,
    });
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

  async createBorrowing(borrowing: InsertBorrowing, mobileNo: string = "0"): Promise<Borrowing> {
    try {
      const result = await db.insert(borrowings).values({
        ...borrowing,
        mobileNo: mobileNo,  // ✨ CHANGED: Use mobileNo instead of shopkeeperId
      }).returning();
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

  async updateBorrowingAmount(id: number, amount: string, mobileNo?: string): Promise<Borrowing | null> {
    try {
      // Get existing borrowing
      const existingBorrowing = await db.query.borrowings.findFirst({
        where: (field, { eq }) => eq(field.id, id),
      });

      if (!existingBorrowing) return null;

      // Check ownership if mobileNo provided
      if (mobileNo && existingBorrowing.mobileNo !== mobileNo) return null;

      const oldAmount = Number(existingBorrowing.amount);
      const newAmount = Number(amount);
      const difference = newAmount - oldAmount;

      // Update borrowing amount
      const result = await db.update(borrowings)
        .set({ amount })
        .where(eq(borrowings.id, id))
        .returning();

      if (result[0]) {
        // Update customer's borrowedAmount
        if (existingBorrowing.customerId) {
          const customer = await db.query.customers.findFirst({
            where: (field, { eq }) => eq(field.id, existingBorrowing.customerId),
          });

          if (customer) {
            const currentBorrowed = Number(customer.borrowedAmount);
            const newBorrowed = Math.max(0, currentBorrowed + difference);
            await db.update(customers)
              .set({ borrowedAmount: newBorrowed.toString() })
              .where(eq(customers.id, existingBorrowing.customerId));
          }
        }
      }

      return result[0] || null;
    } catch (error: any) {
      console.error("Error updating borrowing amount:", error);
      throw error;
    }
  }

  async getSales(mobileNo?: string): Promise<(Sale & { customerName?: string })[]> {
    const salesList = await db.query.sales.findMany({
      where: mobileNo ? (field, { eq }) => eq(field.mobileNo, mobileNo) : undefined,
    });

    const salesWithInfo = await Promise.all(
      salesList.map(async (sale: any) => {
        let customerName = "Walk-in";

        if (sale.customerId) {
          try {
            const customer = await db.query.customers.findFirst({
              where: (c: any, { eq }: any) => eq(c.id, sale.customerId),
            });
            if (customer) {
              customerName = customer.name || "Unknown Customer";
            }
          } catch {
            // Customer not found, keep default
          }
        }

        return {
          ...sale,
          customerName,
        };
      })
    );

    return salesWithInfo.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }

  async createSale(sale: InsertSale, mobileNo: string = "0"): Promise<Sale> {
    try {
      const result = await db.insert(sales).values({
        ...sale,
        mobileNo: mobileNo,
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

          // ✨ Auto-create borrowing record if sale has pending amount (udhari)
          if (pendingAmount > 0) {
            try {
              await db.insert(borrowings).values({
                customerId: customerId,
                amount: pendingAmount.toString(),
                date: newSale.date || new Date(),
                dueDate: null,
                status: "PENDING",
                notes: `Auto-created from Sale #${newSale.id}`,
                mobileNo: mobileNo,
              });
            } catch (error) {
              console.error("Failed to create automatic borrowing record:", error);
            }
          }

          // Import trustScoreService dynamically to avoid circular dependency
          try {
            const { trustScoreService } = await import("./services/trustScoreService.js");
            await trustScoreService.updateCustomerTrustScore(customerId);
          } catch (error) {
            console.error("Failed to update trust score:", error);
          }

          // Automatically create invoice and send receipt
          try {
            const { invoiceService } = await import("./services/invoiceService.js");
            const invoice = await invoiceService.createInvoice({
              saleId: newSale.id,
              customerId,
              amount: Number(newSale.amount),
            });

            const { notificationService } = await import("./services/notificationService.js");
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

  async updateSale(id: number, updates: Partial<InsertSale>, mobileNo?: string): Promise<Sale | null> {
    try {
      // Check ownership if mobileNo provided
      if (mobileNo) {
        const existing = await db.query.sales.findFirst({
          where: (field, { eq }) => eq(field.id, id),
        });

        if (!existing || existing.mobileNo !== mobileNo) {
          return null;
        }
      }

      // Get existing sale before update
      const existingSale = await db.query.sales.findFirst({
        where: (field, { eq }) => eq(field.id, id),
      });

      if (!existingSale) return null;

      const result = await db
        .update(sales)
        .set(updates)
        .where(eq(sales.id, id))
        .returning();

      const updatedSale = result[0];

      // ✨ Sync pending amount changes to Udhari tab
      if (updatedSale && existingSale.customerId) {
        const oldPendingAmount = Number(existingSale.pendingAmount || 0);
        const newPendingAmount = Number(updates.pendingAmount ?? (existingSale.pendingAmount || 0));
        const customerId = existingSale.customerId;

        if (newPendingAmount > oldPendingAmount) {
          // Pending amount increased - update or create borrowing
          const difference = newPendingAmount - oldPendingAmount;

          // Find existing auto-created borrowing for this sale
          const existingBorrowing = await db.query.borrowings.findFirst({
            where: (field, { and, eq, like }) => and(
              eq(field.customerId, customerId),
              like(field.notes, `%Sale #${id}%`)
            ),
          });

          if (existingBorrowing) {
            // Update existing borrowing amount
            await db.update(borrowings)
              .set({ amount: newPendingAmount.toString() })
              .where(eq(borrowings.id, existingBorrowing.id));
          } else {
            // Create new borrowing record for the added amount
            await db.insert(borrowings).values({
              customerId: customerId,
              amount: difference.toString(),
              date: existingSale.date || new Date(),
              dueDate: null,
              status: "PENDING",
              notes: `Auto-created from Sale #${id} (Updated)`,
              mobileNo: mobileNo || existingSale.mobileNo,
            });
          }

          // Update customer's borrowedAmount
          const customer = await db.query.customers.findFirst({
            where: (field, { eq }) => eq(field.id, customerId),
          });

          if (customer) {
            const currentBorrowed = Number(customer.borrowedAmount);
            const newBorrowed = currentBorrowed + difference;
            await db.update(customers)
              .set({ borrowedAmount: newBorrowed.toString() })
              .where(eq(customers.id, customerId));
          }
        } else if (newPendingAmount < oldPendingAmount) {
          // Pending amount decreased - update or remove borrowing
          const difference = oldPendingAmount - newPendingAmount;

          const existingBorrowing = await db.query.borrowings.findFirst({
            where: (field, { and, eq, like }) => and(
              eq(field.customerId, customerId),
              like(field.notes, `%Sale #${id}%`)
            ),
          });

          if (existingBorrowing) {
            if (newPendingAmount === 0) {
              // Delete borrowing if pending is now 0
              await db.delete(borrowings).where(eq(borrowings.id, existingBorrowing.id));
            } else {
              // Update borrowing amount
              await db.update(borrowings)
                .set({ amount: newPendingAmount.toString() })
                .where(eq(borrowings.id, existingBorrowing.id));
            }
          }

          // Update customer's borrowedAmount
          const customer = await db.query.customers.findFirst({
            where: (field, { eq }) => eq(field.id, customerId),
          });

          if (customer) {
            const currentBorrowed = Number(customer.borrowedAmount);
            const newBorrowed = Math.max(0, currentBorrowed - difference);
            await db.update(customers)
              .set({ borrowedAmount: newBorrowed.toString() })
              .where(eq(customers.id, customerId));
          }
        }
      }

      return updatedSale || null;
    } catch (error: any) {
      console.error("Error updating sale:", error);
      throw error;
    }
  }

  async deleteSale(id: number, mobileNo?: string): Promise<boolean> {
    try {
      // Check ownership if mobileNo provided
      if (mobileNo) {
        const existing = await db.query.sales.findFirst({
          where: (field, { eq }) => eq(field.id, id),
        });

        if (!existing || existing.mobileNo !== mobileNo) {
          return false;
        }
      }

      const result = await db.delete(sales)
        .where(eq(sales.id, id))
        .returning();

      return result.length > 0;
    } catch (error: any) {
      console.error("Error deleting sale:", error);
      throw error;
    }
  }

  async getProducts(mobileNo?: string): Promise<Product[]> {
    return await db.query.products.findMany({
      where: mobileNo
        ? (field, { eq, and }) => and(eq(field.isActive, true), eq(field.mobileNo, mobileNo))
        : (field, { eq }) => eq(field.isActive, true),
    });
  }

  async createProduct(product: InsertProduct, mobileNo: string = "0"): Promise<Product> {
    try {
      const result = await db.insert(products).values({
        ...product,
        mobileNo: mobileNo,  // ✨ CHANGED: Use mobileNo instead of shopkeeperId
        userId: 1,
      }).returning();
      return result[0];
    } catch (error: any) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | null> {
    try {
      const result = await db.update(products)
        .set({
          ...product,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();
      return result[0] || null;
    } catch (error: any) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const result = await db.delete(products)
        .where(eq(products.id, id))
        .returning();
      return result.length > 0;
    } catch (error: any) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  async getDashboardStats(mobileNo?: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const salesList = await db.query.sales.findMany({
      where: mobileNo ? (field, { eq }) => eq(field.mobileNo, mobileNo) : undefined,
    });
    const borrowingList = await db.query.borrowings.findMany({
      where: mobileNo ? (field, { eq }) => eq(field.mobileNo, mobileNo) : undefined,
    });
    const customerList = await db.query.customers.findMany({
      where: mobileNo ? (field, { eq }) => eq(field.mobileNo, mobileNo) : undefined,
    });

    const todaySales = salesList
      .filter((s) => s.date && s.date >= startOfDay)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const monthSales = salesList
      .filter((s) => s.date && s.date >= startOfMonth)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

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
