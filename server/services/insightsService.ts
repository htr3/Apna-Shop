import { db } from "../db";
import { sales, customers, borrowings } from "../../shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface BusinessInsight {
  type: "sales_trend" | "risk_alert" | "opportunity" | "collection_status";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  recommendation?: string;
  data?: any;
}

class InsightsService {
  /**
   * Get sales trend insights
   */
  private async getSalesTrendInsights(): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      // Get this week's sales
      const thisWeekSales = await db
        .select()
        .from(sales)
        .where(
          and(
            gte(sales.date, thisWeekStart),
            lte(sales.date, now)
          )
        );

      // Get last week's sales
      const lastWeekSales = await db
        .select()
        .from(sales)
        .where(
          and(
            gte(sales.date, lastWeekStart),
            lte(sales.date, lastWeekEnd)
          )
        );

      const thisWeekTotal = thisWeekSales.reduce(
        (sum, s) => sum + parseFloat(s.amount.toString()),
        0
      );
      const lastWeekTotal = lastWeekSales.reduce(
        (sum, s) => sum + parseFloat(s.amount.toString()),
        0
      );

      if (lastWeekTotal > 0) {
        const percentChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;

        if (percentChange < -15) {
          insights.push({
            type: "sales_trend",
            severity: "warning",
            title: "Sales Decline Detected",
            description: `Sales dropped ${Math.abs(percentChange).toFixed(1)}% this week compared to last week.`,
            recommendation: "Consider promotional activities or review product pricing.",
            data: {
              thisWeek: thisWeekTotal,
              lastWeek: lastWeekTotal,
              percentChange,
            },
          });
        } else if (percentChange > 20) {
          insights.push({
            type: "sales_trend",
            severity: "info",
            title: "Strong Sales Growth",
            description: `Sales increased ${percentChange.toFixed(1)}% this week - great performance!`,
            data: {
              thisWeek: thisWeekTotal,
              lastWeek: lastWeekTotal,
              percentChange,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error calculating sales trends:", error);
    }

    return insights;
  }

  /**
   * Get risk alerts based on customer behavior
   */
  private async getRiskAlerts(): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];

    try {
      // Find risky customers
      const riskyCustomers = await db
        .select()
        .from(customers)
        .where(eq(customers.isRisky, true));

      if (riskyCustomers.length > 0) {
        insights.push({
          type: "risk_alert",
          severity: "warning",
          title: `${riskyCustomers.length} Risky Customers Identified`,
          description: `You have ${riskyCustomers.length} customer(s) with low trust scores. Exercise caution with credit.`,
          recommendation: "Review their payment history and consider reducing credit limits.",
          data: {
            count: riskyCustomers.length,
            customers: riskyCustomers.map((c) => ({
              id: c.id,
              name: c.name,
              trustScore: c.trustScore,
            })),
          },
        });
      }

      // Find customers with high borrowed amounts
      const highBorrowersRaw = await db
        .select()
        .from(customers)
        .where(gte(customers.borrowedAmount, "5000")); // > 5000 rupees

      if (highBorrowersRaw.length > 0) {
        insights.push({
          type: "risk_alert",
          severity: "critical",
          title: "High Outstanding Credit",
          description: `${highBorrowersRaw.length} customer(s) have outstanding credit exceeding ₹5000.`,
          recommendation: "Follow up with these customers for immediate payment.",
          data: {
            count: highBorrowersRaw.length,
            totalOutstanding: highBorrowersRaw.reduce(
              (sum, c) => sum + parseFloat(c.borrowedAmount.toString()),
              0
            ),
          },
        });
      }
    } catch (error) {
      console.error("Error calculating risk alerts:", error);
    }

    return insights;
  }

  /**
   * Get collection opportunities
   */
  private async getCollectionOpportunities(): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];

    try {
      // Find overdue borrowings
      const now = new Date();
      const overdueBorrowings = await db
        .select({
          borrowing: borrowings,
          customer: customers,
        })
        .from(borrowings)
        .innerJoin(customers, eq(borrowings.customerId, customers.id))
        .where(
          and(
            eq(borrowings.status, "OVERDUE"),
            lte(borrowings.dueDate, now)
          )
        );

      if (overdueBorrowings.length > 0) {
        const totalOverdue = overdueBorrowings.reduce(
          (sum, b) => sum + parseFloat(b.borrowing.amount.toString()),
          0
        );

        insights.push({
          type: "collection_status",
          severity: "critical",
          title: `₹${totalOverdue.toFixed(2)} Overdue Collections`,
          description: `You have ${overdueBorrowings.length} overdue payment(s) totaling ₹${totalOverdue.toFixed(2)}.`,
          recommendation: "Send reminders or follow up directly with customers.",
          data: {
            count: overdueBorrowings.length,
            totalOverdue,
            customers: overdueBorrowings.map((b) => ({
              name: b.customer.name,
              amount: b.borrowing.amount,
              daysOverdue: Math.floor(
                (now.getTime() - new Date(b.borrowing.dueDate as any).getTime()) /
                  (1000 * 60 * 60 * 24)
              ),
            })),
          },
        });
      }
    } catch (error) {
      console.error("Error calculating collection opportunities:", error);
    }

    return insights;
  }

  /**
   * Get customer opportunities
   */
  private async getCustomerOpportunities(): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];

    try {
      // Find loyal, trustworthy customers (high trust score, consistent purchases)
      const trustworthyCustomersRaw = await db
        .select()
        .from(customers)
        .where(gte(customers.trustScore, 80));

      if (trustworthyCustomersRaw.length > 0) {
        insights.push({
          type: "opportunity",
          severity: "info",
          title: `${trustworthyCustomersRaw.length} Trusted Customers`,
          description: `You have ${trustworthyCustomersRaw.length} loyal customers with excellent trust scores (80+).`,
          recommendation: "Consider offering them special discounts or loyalty rewards.",
        });
      }
    } catch (error) {
      console.error("Error calculating opportunities:", error);
    }

    return insights;
  }

  /**
   * Get all business insights
   */
  async getAllInsights(): Promise<BusinessInsight[]> {
    const allInsights: BusinessInsight[] = [];

    // Collect insights from all categories
    const [trendInsights, riskAlerts, collectionOps, customerOps] =
      await Promise.all([
        this.getSalesTrendInsights(),
        this.getRiskAlerts(),
        this.getCollectionOpportunities(),
        this.getCustomerOpportunities(),
      ]);

    allInsights.push(...trendInsights, ...riskAlerts, ...collectionOps, ...customerOps);

    // Sort by severity (critical > warning > info)
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    allInsights.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    return allInsights;
  }

  /**
   * Get critical alerts only
   */
  async getCriticalAlerts(): Promise<BusinessInsight[]> {
    const allInsights = await this.getAllInsights();
    return allInsights.filter((i) => i.severity === "critical");
  }
}

export const insightsService = new InsightsService();
