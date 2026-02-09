import { db } from "../db";
import { inventory, inventoryTransactions } from "../../shared/schema";
import { eq, lte, gte } from "drizzle-orm";

export interface InventoryPrediction {
  itemId: number;
  itemName: string;
  currentStock: number;
  avgDailySales: number;
  daysUntilStockout: number;
  predictedRunoutDate: Date;
  recommendedRestockAmount: number;
  urgency: "normal" | "warning" | "critical";
}

class InventoryService {
  /**
   * Add inventory item
   */
  async addInventoryItem(data: {
    name: string;
    sku?: string;
    quantity: number;
    minThreshold?: number;
  }): Promise<any> {
    try {
      const result = await db
        .insert(inventory)
        .values({
          name: data.name,
          sku: data.sku,
          quantity: data.quantity,
          minThreshold: data.minThreshold || 10,
          avgDailySales: "0",
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to add inventory item:", error);
      throw error;
    }
  }

  /**
   * Record inventory transaction (sale, restock, adjustment)
   */
  async recordTransaction(data: {
    itemId: number;
    type: "SALE" | "RESTOCK" | "ADJUSTMENT" | "LOSS";
    quantity: number;
    notes?: string;
  }): Promise<any> {
    try {
      // Record transaction
      await db.insert(inventoryTransactions).values({
        itemId: data.itemId,
        type: data.type,
        quantity: data.quantity,
        notes: data.notes,
      });

      // Update inventory quantity
      const item = await db.query.inventory.findFirst({
        where: (field, { eq }) => eq(field.id, data.itemId),
      });

      if (!item) {
        throw new Error("Inventory item not found");
      }

      let newQuantity = item.quantity;
      if (data.type === "SALE") {
        newQuantity -= data.quantity;
      } else if (data.type === "RESTOCK") {
        newQuantity += data.quantity;
      } else if (data.type === "ADJUSTMENT") {
        newQuantity = data.quantity;
      } else if (data.type === "LOSS") {
        newQuantity -= data.quantity;
      }

      const updated = await db
        .update(inventory)
        .set({
          quantity: Math.max(0, newQuantity),
          updatedAt: new Date(),
          ...(data.type === "RESTOCK" && { lastRestockDate: new Date() }),
        })
        .where((field) => field.id === data.itemId)
        .returning();

      return updated[0];
    } catch (error) {
      console.error("Failed to record transaction:", error);
      throw error;
    }
  }

  /**
   * Calculate average daily sales for an item
   */
  private async calculateAvgDailySales(itemId: number): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      );

      const transactions = await db.query.inventoryTransactions.findMany({
        where: (field, { and, eq, gte, lte }) =>
          and(
            eq(field.itemId, itemId),
            eq(field.type, "SALE"),
            gte(field.createdAt, thirtyDaysAgo)
          ),
      });

      const totalSales = transactions.reduce(
        (sum, t) => sum + t.quantity,
        0
      );

      // Average over 30 days
      return totalSales / 30;
    } catch (error) {
      console.error("Failed to calculate avg daily sales:", error);
      return 0;
    }
  }

  /**
   * Get inventory prediction for an item
   */
  async getInventoryPrediction(itemId: number): Promise<InventoryPrediction | null> {
    try {
      const item = await db.query.inventory.findFirst({
        where: (field, { eq }) => eq(field.id, itemId),
      });

      if (!item) {
        return null;
      }

      // Calculate average daily sales
      const avgDailySales = await this.calculateAvgDailySales(itemId);

      // Update avg daily sales in database
      await db
        .update(inventory)
        .set({ avgDailySales: avgDailySales.toString() })
        .where((field) => field.id === itemId);

      // Calculate days until stockout
      const daysUntilStockout =
        avgDailySales > 0
          ? Math.floor(item.quantity / avgDailySales)
          : 999;

      // Calculate predicted runout date
      const predictedRunoutDate = new Date(
        Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000
      );

      // Determine urgency
      let urgency: "normal" | "warning" | "critical" = "normal";
      if (item.quantity <= item.minThreshold) {
        urgency = "critical";
      } else if (daysUntilStockout <= 7) {
        urgency = "warning";
      }

      const recommendedRestockAmount = Math.ceil(avgDailySales * 30); // 30 days of stock

      return {
        itemId: item.id,
        itemName: item.name,
        currentStock: item.quantity,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        daysUntilStockout,
        predictedRunoutDate,
        recommendedRestockAmount,
        urgency,
      };
    } catch (error) {
      console.error("Failed to get inventory prediction:", error);
      return null;
    }
  }

  /**
   * Get all inventory predictions
   */
  async getAllInventoryPredictions(): Promise<InventoryPrediction[]> {
    try {
      const items = await db.query.inventory.findMany();
      const predictions: InventoryPrediction[] = [];

      for (const item of items) {
        const prediction = await this.getInventoryPrediction(item.id);
        if (prediction) {
          predictions.push(prediction);
        }
      }

      return predictions.sort((a, b) => {
        // Sort by urgency (critical > warning > normal)
        const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        // Then by days until stockout
        return a.daysUntilStockout - b.daysUntilStockout;
      });
    } catch (error) {
      console.error("Failed to get all inventory predictions:", error);
      return [];
    }
  }

  /**
   * Get critical inventory items (low stock)
   */
  async getCriticalItems(): Promise<InventoryPrediction[]> {
    const allPredictions = await this.getAllInventoryPredictions();
    return allPredictions.filter((p) => p.urgency === "critical");
  }

  /**
   * Get all inventory items
   */
  async getAllItems(): Promise<any[]> {
    try {
      return await db.query.inventory.findMany();
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
      return [];
    }
  }

  /**
   * Update item details
   */
  async updateItem(
    itemId: number,
    data: { name?: string; minThreshold?: number }
  ): Promise<any> {
    try {
      const result = await db
        .update(inventory)
        .set({
          ...(data.name && { name: data.name }),
          ...(data.minThreshold !== undefined && { minThreshold: data.minThreshold }),
          updatedAt: new Date(),
        })
        .where((field) => field.id === itemId)
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to update inventory item:", error);
      throw error;
    }
  }
}

export const inventoryService = new InventoryService();
