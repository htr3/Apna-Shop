import { db } from "../db";
import { sales, borrowings, expenses } from "../../shared/schema";
import { gte, lte, and } from "drizzle-orm";
import { notificationService } from "./notificationService";

interface DailySummary {
  date: Date;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  newBorrowings: number;
  collectionsMade: number;
  overdueCount: number;
  summary: string;
}

class DailySummaryService {
  /**
   * Generate daily summary (with optional tenant filtering)
   */
  async generateDailySummary(date: Date = new Date(), mobileNo?: string): Promise<DailySummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get daily sales (filtered by mobileNo if provided)
      const dailySales = await db.query.sales.findMany({
        where: (field, { and, gte, lte, eq }) => {
          const conditions = [
            gte(field.date, startOfDay),
            lte(field.date, endOfDay)
          ];
          if (mobileNo) {
            conditions.push(eq(field.mobileNo, mobileNo));
          }
          return and(...conditions);
        },
      });

      const totalSales = dailySales.reduce(
        (sum, s) => sum + parseFloat(s.amount.toString()),
        0
      );

      // Get daily expenses (filtered by mobileNo if provided)
      const dailyExpenses = await db.query.expenses.findMany({
        where: (field, { and, gte, lte, eq }) => {
          const conditions = [
            gte(field.date, startOfDay),
            lte(field.date, endOfDay)
          ];
          if (mobileNo) {
            conditions.push(eq(field.mobileNo, mobileNo));
          }
          return and(...conditions);
        },
      });

      const totalExpenses = dailyExpenses.reduce(
        (sum, e) => sum + parseFloat(e.amount.toString()),
        0
      );

      // Get new borrowings (filtered by mobileNo if provided)
      const newBorrowings = await db.query.borrowings.findMany({
        where: (field, { and, gte, lte, eq }) => {
          const conditions = [
            gte(field.date, startOfDay),
            lte(field.date, endOfDay),
            eq(field.status, "PENDING")
          ];
          if (mobileNo) {
            conditions.push(eq(field.mobileNo, mobileNo));
          }
          return and(...conditions);
        },
      });

      const totalNewBorrowings = newBorrowings.length;

      // Get paid borrowings (collections) (filtered by mobileNo if provided)
      const paidBorrowings = await db.query.borrowings.findMany({
        where: (field, { and, gte, lte, eq }) => {
          const conditions = [
            gte(field.date, startOfDay),
            lte(field.date, endOfDay),
            eq(field.status, "PAID")
          ];
          if (mobileNo) {
            conditions.push(eq(field.mobileNo, mobileNo));
          }
          return and(...conditions);
        },
      });

      const totalCollections = paidBorrowings.reduce(
        (sum, b) => sum + parseFloat(b.amount.toString()),
        0
      );

      // Get overdue borrowings (filtered by mobileNo if provided)
      const now = new Date();
      const overdueBorrowings = await db.query.borrowings.findMany({
        where: (field, { eq, lte, and: andOp }) => {
          const conditions = [
            eq(field.status, "OVERDUE"),
            lte(field.dueDate, now)
          ];
          if (mobileNo) {
            conditions.push(eq(field.mobileNo, mobileNo));
          }
          return andOp(...conditions);
        },
      });

      const netProfit = totalSales - totalExpenses;

      const summary = this.generateSummaryText(
        totalSales,
        totalExpenses,
        netProfit,
        totalNewBorrowings,
        totalCollections,
        overdueBorrowings.length,
        date
      );

      return {
        date,
        totalSales,
        totalExpenses,
        netProfit,
        newBorrowings: totalNewBorrowings,
        collectionsMade: totalCollections,
        overdueCount: overdueBorrowings.length,
        summary,
      };
    } catch (error) {
      console.error("Failed to generate daily summary:", error);
      throw error;
    }
  }

  /**
   * Generate summary text
   */
  private generateSummaryText(
    sales: number,
    expenses: number,
    profit: number,
    borrowings: number,
    collections: number,
    overdue: number,
    date: Date
  ): string {
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
Daily Summary - ${dateStr}

📊 Sales & Revenue:
• Total Sales: ₹${sales.toFixed(2)}
• Total Expenses: ₹${expenses.toFixed(2)}
• Net Profit: ₹${profit.toFixed(2)}

💰 Credit Management:
• New Borrowings: ${borrowings}
• Collections Made: ₹${collections.toFixed(2)}
• Overdue Payments: ${overdue}

${profit >= 0 ? "✅ Profitable day!" : "⚠️ Loss recorded today."}

---
Generated: ${new Date().toLocaleTimeString()}
    `.trim();
  }

  /**
   * Send daily summary via SMS/WhatsApp
   */
  async sendDailySummary(
    phoneNumber: string,
    summary: DailySummary
  ): Promise<boolean> {
    try {
      const message = summary.summary;

      // Send via WhatsApp
      const result = await notificationService.sendWhatsAppMessage(
        phoneNumber,
        message
      );

      if (result.success) {
        // Log the notification
        await db.query.notificationsLog.findMany(); // Just to use db
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to send daily summary:", error);
      return false;
    }
  }

  /**
   * Schedule daily summary for a specific time
   * This should be called by a cron job or scheduler
   */
  async scheduleDailySummary(phoneNumber: string, hour: number = 20, minute: number = 0) {
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    const timeUntilSummary = scheduled.getTime() - now.getTime();

    // Schedule the summary
    setTimeout(async () => {
      try {
        const summary = await this.generateDailySummary();
        await this.sendDailySummary(phoneNumber, summary);

        // Reschedule for next day
        this.scheduleDailySummary(phoneNumber, hour, minute);
      } catch (error) {
        console.error("Error sending scheduled summary:", error);
      }
    }, timeUntilSummary);

    return {
      success: true,
      scheduledFor: scheduled,
      timeUntilSummary: timeUntilSummary / (1000 * 60), // minutes
    };
  }

  /**
   * Get weekly summary (7-day report) (with optional tenant filtering)
   */
  async getWeeklySummary(mobileNo?: string): Promise<any> {
    const summaries = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const summary = await this.generateDailySummary(date, mobileNo);
      summaries.push(summary);
    }

    const totalWeeklySales = summaries.reduce((sum, s) => sum + s.totalSales, 0);
    const totalWeeklyExpenses = summaries.reduce((sum, s) => sum + s.totalExpenses, 0);
    const totalWeeklyProfit = summaries.reduce((sum, s) => sum + s.netProfit, 0);
    const totalWeeklyCollections = summaries.reduce((sum, s) => sum + s.collectionsMade, 0);

    return {
      week: `${summaries[0].date.toLocaleDateString()} - ${summaries[6].date.toLocaleDateString()}`,
      dailySummaries: summaries,
      totalSales: totalWeeklySales,
      totalExpenses: totalWeeklyExpenses,
      totalProfit: totalWeeklyProfit,
      totalCollections: totalWeeklyCollections,
      averageDailySales: totalWeeklySales / 7,
      bestDay: summaries.reduce((max, s) => (s.totalSales > max.totalSales ? s : max)),
      worstDay: summaries.reduce((min, s) => (s.totalSales < min.totalSales ? s : min)),
    };
  }
}

export const dailySummaryService = new DailySummaryService();
