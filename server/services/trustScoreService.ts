import { db } from "../db";
import { customers, borrowings, sales } from "../../shared/schema";
import { eq, and, gte } from "drizzle-orm";

class TrustScoreService {
  /**
   * Calculate trust score based on multiple factors
   * Factors: payment history, borrowing frequency, total purchases, payment delays
   */
  async calculateTrustScore(customerId: number): Promise<{
    score: number;
    breakdown: any;
    riskLevel: "low" | "medium" | "high";
  }> {
    try {
      const customer = await db.query.customers.findFirst({
        where: (field, { eq }) => eq(field.id, customerId),
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      let score = 100; // Start with perfect score
      const breakdown: any = {};

      // Factor 1: Payment history (40% weight)
      const allBorrowings = await db.query.borrowings.findMany({
        where: (field, { eq }) => eq(field.customerId, customerId),
      });

      if (allBorrowings.length > 0) {
        const paidBorrowings = allBorrowings.filter((b) => b.status === "PAID").length;
        const paymentRate = paidBorrowings / allBorrowings.length;
        const paymentScore = paymentRate * 40;
        breakdown.paymentHistory = {
          weight: 40,
          score: Math.round(paymentScore),
          paid: paidBorrowings,
          total: allBorrowings.length,
        };
        score -= 40 - paymentScore;
      }

      // Factor 2: Overdue borrowings penalty (20% weight)
      const now = new Date();
      const overdueBorrowings = allBorrowings.filter(
        (b) => b.status === "OVERDUE" && new Date(b.dueDate as any) < now
      );

      const overduePenalty = Math.min(overdueBorrowings.length * 10, 20);
      breakdown.overdueStatus = {
        weight: 20,
        penalty: overduePenalty,
        overdueCount: overdueBorrowings.length,
      };
      score -= overduePenalty;

      // Factor 3: Total purchase volume (20% weight)
      const totalPurchased = parseFloat(customer.totalPurchase?.toString() ?? "0");
      let purchaseScore = 0;

      if (totalPurchased > 50000) {
        purchaseScore = 20; // Loyal customer
      } else if (totalPurchased > 10000) {
        purchaseScore = 15;
      } else if (totalPurchased > 5000) {
        purchaseScore = 10;
      } else if (totalPurchased > 0) {
        purchaseScore = 5;
      }

      breakdown.purchaseVolume = {
        weight: 20,
        score: purchaseScore,
        totalPurchase: totalPurchased,
      };
      score = score - 20 + purchaseScore;

      // Factor 4: Borrowing frequency (10% weight)
      let borrowingFrequencyScore = 10;

      if (allBorrowings.length > 10) {
        borrowingFrequencyScore = 5; // Frequent borrower = risky
      } else if (allBorrowings.length > 5) {
        borrowingFrequencyScore = 7;
      }

      breakdown.borrowingFrequency = {
        weight: 10,
        score: borrowingFrequencyScore,
        totalBorrowings: allBorrowings.length,
      };
      score = score - 10 + borrowingFrequencyScore;

      // Factor 5: Time since last purchase (10% weight)
      const lastSale = await db.query.sales.findFirst({
        where: (field, { eq }) => eq(field.customerId, customerId),
      });

      let recencyScore = 10;
      if (lastSale) {
        const daysSinceLastPurchase = Math.floor(
          (now.getTime() - new Date(lastSale.date as any).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastPurchase < 7) {
          recencyScore = 10; // Very recent
        } else if (daysSinceLastPurchase < 30) {
          recencyScore = 8;
        } else if (daysSinceLastPurchase < 90) {
          recencyScore = 5;
        } else {
          recencyScore = 2; // Inactive customer
        }
      } else {
        recencyScore = 3; // No purchases yet
      }

      breakdown.recency = {
        weight: 10,
        score: recencyScore,
        daysSinceLastPurchase: lastSale
          ? Math.floor(
              (now.getTime() - new Date(lastSale.date as any).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      };
      score = score - 10 + recencyScore;

      // Ensure score is between 0 and 100
      const finalScore = Math.max(0, Math.min(100, Math.round(score)));

      // Determine risk level
      let riskLevel: "low" | "medium" | "high" = "low";
      if (finalScore < 40) {
        riskLevel = "high";
      } else if (finalScore < 70) {
        riskLevel = "medium";
      }

      return {
        score: finalScore,
        breakdown,
        riskLevel,
      };
    } catch (error) {
      console.error("Failed to calculate trust score:", error);
      throw error;
    }
  }

  /**
   * Update customer's trust score in database
   */
  async updateCustomerTrustScore(customerId: number): Promise<any> {
    try {
      const { score, riskLevel } = await this.calculateTrustScore(customerId);

      const result = await db
        .update(customers)
        .set({
          trustScore: score,
          isRisky: riskLevel === "high",
        })
        .where(eq(customers.id, customerId))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to update customer trust score:", error);
      throw error;
    }
  }

  /**
   * Get detailed trust score report for a customer
   */
  async getTrustScoreReport(customerId: number): Promise<any> {
    try {
      const { score, breakdown, riskLevel } = await this.calculateTrustScore(customerId);
      const customer = await db.query.customers.findFirst({
        where: (field, { eq }) => eq(field.id, customerId),
      });

      return {
        customer: {
          id: customer?.id,
          name: customer?.name,
          phone: customer?.phone,
        },
        trustScore: score,
        riskLevel,
        breakdown,
        recommendation:
          riskLevel === "high"
            ? "Avoid giving credit. Request cash payment."
            : riskLevel === "medium"
            ? "Give limited credit. Monitor closely."
            : "Trustworthy customer. Can give credit.",
      };
    } catch (error) {
      console.error("Failed to get trust score report:", error);
      throw error;
    }
  }

  /**
   * Update all customers' trust scores
   */
  async updateAllTrustScores(): Promise<number> {
    try {
      const allCustomers = await db.query.customers.findMany();
      let updated = 0;

      for (const customer of allCustomers) {
        await this.updateCustomerTrustScore(customer.id);
        updated++;
      }

      return updated;
    } catch (error) {
      console.error("Failed to update all trust scores:", error);
      return 0;
    }
  }
}

export const trustScoreService = new TrustScoreService();
