import { db } from "../db";
import { suppliers, supplierTransactions } from "../../shared/schema";
import { eq, lte, gte, or, and } from "drizzle-orm";

export interface SupplierSummary {
  supplierId: number;
  supplierName: string;
  totalOwed: number;
  totalPurchased: number;
  pendingTransactions: number;
  overdueTransactions: number;
  paymentTerms?: string;
}

class SupplierService {
  /**
   * Add a new supplier
   */
  async addSupplier(data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    paymentTerms?: string;
  }): Promise<any> {
    try {
      const result = await db
        .insert(suppliers)
        .values({
          mobileNo: process.env.DEFAULT_MOBILE_NO ?? "0",
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          paymentTerms: data.paymentTerms,
          totalOwed: "0",
          totalPurchased: "0",
          isActive: true,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to add supplier:", error);
      throw error;
    }
  }

  /**
   * Get all suppliers
   */
  async getAllSuppliers(): Promise<any[]> {
    try {
      return await db.query.suppliers.findMany();
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      return [];
    }
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(supplierId: number): Promise<any> {
    try {
      return await db.query.suppliers.findFirst({
        where: (field, { eq }) => eq(field.id, supplierId),
      });
    } catch (error) {
      console.error("Failed to fetch supplier:", error);
      return null;
    }
  }

  /**
   * Record a supplier transaction (purchase, payment, return)
   */
  async recordTransaction(data: {
    supplierId: number;
    type: "PURCHASE" | "PAYMENT" | "RETURN" | "ADJUSTMENT";
    amount: number;
    description?: string;
    invoiceNumber?: string;
    dueDate?: Date;
  }): Promise<any> {
    try {
      const supplier = await this.getSupplierById(data.supplierId);
      if (!supplier) {
        throw new Error("Supplier not found");
      }

      // Record transaction
      const mobileNo = supplier?.mobileNo ?? process.env.DEFAULT_MOBILE_NO ?? "0";
      await db.insert(supplierTransactions).values({
        mobileNo,
        supplierId: data.supplierId,
        type: data.type,
        amount: data.amount.toString(),
        description: data.description,
        invoiceNumber: data.invoiceNumber,
        dueDate: data.dueDate,
        status: data.type === "PAYMENT" ? "PAID" : "PENDING",
      });

      // Update supplier's total owed
      let newOwed = parseFloat(supplier.totalOwed.toString());
      let newPurchased = parseFloat(supplier.totalPurchased.toString());

      if (data.type === "PURCHASE") {
        newOwed += data.amount;
        newPurchased += data.amount;
      } else if (data.type === "PAYMENT") {
        newOwed = Math.max(0, newOwed - data.amount);
      } else if (data.type === "RETURN") {
        newOwed = Math.max(0, newOwed - data.amount);
      } else if (data.type === "ADJUSTMENT") {
        newOwed = data.amount; // Set to exact amount
      }

      const updated = await db
        .update(suppliers)
        .set({
          totalOwed: newOwed.toString(),
          totalPurchased: newPurchased.toString(),
          updatedAt: new Date(),
        })
        .where(eq(suppliers.id, data.supplierId))
        .returning();

      return updated[0];
    } catch (error) {
      console.error("Failed to record transaction:", error);
      throw error;
    }
  }

  /**
   * Get transactions for a supplier
   */
  async getSupplierTransactions(supplierId: number): Promise<any[]> {
    try {
      return await db.query.supplierTransactions.findMany({
        where: (field, { eq }) => eq(field.supplierId, supplierId),
      });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      return [];
    }
  }

  /**
   * Get pending payments (unpaid and overdue)
   */
  async getPendingPayments(): Promise<any[]> {
    try {
      const now = new Date();

      return await db.query.supplierTransactions.findMany({
        where: (field, { or, eq, and, lte }) =>
          or(
            and(
              eq(field.status, "PENDING"),
              lte(field.dueDate, now)
            ),
            eq(field.status, "OVERDUE")
          ),
      });
    } catch (error) {
      console.error("Failed to fetch pending payments:", error);
      return [];
    }
  }

  /**
   * Get supplier summary (for reporting)
   */
  async getSupplierSummary(supplierId: number): Promise<SupplierSummary | null> {
    try {
      const supplier = await this.getSupplierById(supplierId);
      if (!supplier) {
        return null;
      }

      const transactions = await this.getSupplierTransactions(supplierId);
      const now = new Date();

      const pendingCount = transactions.filter(
        (t) => t.status === "PENDING"
      ).length;
      const overdueCount = transactions.filter(
        (t) => t.status === "OVERDUE" || (t.status === "PENDING" && new Date(t.dueDate as any) < now)
      ).length;

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        totalOwed: parseFloat(supplier.totalOwed.toString()),
        totalPurchased: parseFloat(supplier.totalPurchased.toString()),
        pendingTransactions: pendingCount,
        overdueTransactions: overdueCount,
        paymentTerms: supplier.paymentTerms,
      };
    } catch (error) {
      console.error("Failed to get supplier summary:", error);
      return null;
    }
  }

  /**
   * Get all suppliers summary
   */
  async getAllSuppliersSummary(): Promise<SupplierSummary[]> {
    try {
      const allSuppliers = await this.getAllSuppliers();
      const summaries: SupplierSummary[] = [];

      for (const supplier of allSuppliers) {
        const summary = await this.getSupplierSummary(supplier.id);
        if (summary) {
          summaries.push(summary);
        }
      }

      return summaries;
    } catch (error) {
      console.error("Failed to fetch all suppliers summary:", error);
      return [];
    }
  }

  /**
   * Update supplier details
   */
  async updateSupplier(
    supplierId: number,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      paymentTerms?: string;
    }
  ): Promise<any> {
    try {
      const result = await db
        .update(suppliers)
        .set({
          ...(data.name && { name: data.name }),
          ...(data.phone && { phone: data.phone }),
          ...(data.email && { email: data.email }),
          ...(data.address && { address: data.address }),
          ...(data.paymentTerms && { paymentTerms: data.paymentTerms }),
          updatedAt: new Date(),
        })
        .where(eq(suppliers.id, supplierId))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to update supplier:", error);
      throw error;
    }
  }

  /**
   * Deactivate supplier
   */
  async deactivateSupplier(supplierId: number): Promise<boolean> {
    try {
      const result = await db
        .update(suppliers)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(suppliers.id, supplierId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Failed to deactivate supplier:", error);
      return false;
    }
  }
}

export const supplierService = new SupplierService();
