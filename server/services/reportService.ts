import { db } from "../db";
import { sales, customers, expenses, borrowings } from "../../shared/schema";
import { gte, lte, and } from "drizzle-orm";

class ReportService {
  /**
   * Generate sales report for a date range
   */
  async generateSalesReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const salesData = await db.query.sales.findMany({
        where: (field, { and, gte, lte }) =>
          and(
            gte(field.date, startDate),
            lte(field.date, endDate)
          ),
      });

      const totalSales = salesData.reduce(
        (sum, s) => sum + parseFloat(s.amount.toString()),
        0
      );

      const paymentBreakdown = {
        cash: salesData
          .filter((s) => s.paymentMethod === "CASH")
          .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0),
        online: salesData
          .filter((s) => s.paymentMethod === "ONLINE")
          .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0),
        credit: salesData
          .filter((s) => s.paymentMethod === "CREDIT")
          .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0),
      };

      return {
        reportType: "Sales Report",
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        totalTransactions: salesData.length,
        totalSales,
        paymentBreakdown,
        data: salesData,
      };
    } catch (error) {
      console.error("Failed to generate sales report:", error);
      throw error;
    }
  }

  /**
   * Generate customer report
   */
  async generateCustomerReport(): Promise<any> {
    try {
      const customersData = await db.query.customers.findMany();

      const trustScoreDistribution = {
        excellent: customersData.filter((c) => c.trustScore >= 80).length,
        good: customersData.filter(
          (c) => c.trustScore >= 60 && c.trustScore < 80
        ).length,
        fair: customersData.filter(
          (c) => c.trustScore >= 40 && c.trustScore < 60
        ).length,
        poor: customersData.filter((c) => c.trustScore < 40).length,
      };

      const totalBorrowed = customersData.reduce(
        (sum, c) => sum + parseFloat(c.borrowedAmount.toString()),
        0
      );

      const totalPurchased = customersData.reduce(
        (sum, c) => sum + parseFloat(c.totalPurchase.toString()),
        0
      );

      return {
        reportType: "Customer Report",
        totalCustomers: customersData.length,
        trustScoreDistribution,
        riskyCustomers: customersData.filter((c) => c.isRisky).length,
        totalBorrowed,
        totalPurchased,
        averageOrderValue: customersData.length > 0 ? totalPurchased / customersData.length : 0,
        data: customersData,
      };
    } catch (error) {
      console.error("Failed to generate customer report:", error);
      throw error;
    }
  }

  /**
   * Generate expense report for a date range
   */
  async generateExpenseReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const expensesData = await db.query.expenses.findMany({
        where: (field, { and, gte, lte }) =>
          and(
            gte(field.date, startDate),
            lte(field.date, endDate)
          ),
      });

      const totalExpenses = expensesData.reduce(
        (sum, e) => sum + parseFloat(e.amount.toString()),
        0
      );

      const categoryBreakdown: Record<string, number> = {};
      expensesData.forEach((exp) => {
        categoryBreakdown[exp.category] =
          (categoryBreakdown[exp.category] || 0) +
          parseFloat(exp.amount.toString());
      });

      return {
        reportType: "Expense Report",
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        totalExpenses,
        categoryBreakdown,
        data: expensesData,
      };
    } catch (error) {
      console.error("Failed to generate expense report:", error);
      throw error;
    }
  }

  /**
   * Generate comprehensive financial report
   */
  async generateFinancialReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const salesData = await db.query.sales.findMany({
        where: (field, { and, gte, lte }) =>
          and(
            gte(field.date, startDate),
            lte(field.date, endDate)
          ),
      });

      const expensesData = await db.query.expenses.findMany({
        where: (field, { and, gte, lte }) =>
          and(
            gte(field.date, startDate),
            lte(field.date, endDate)
          ),
      });

      const totalSales = salesData.reduce(
        (sum, s) => sum + parseFloat(s.amount.toString()),
        0
      );

      const totalExpenses = expensesData.reduce(
        (sum, e) => sum + parseFloat(e.amount.toString()),
        0
      );

      const netProfit = totalSales - totalExpenses;
      const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

      return {
        reportType: "Financial Report",
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        totalRevenue: totalSales,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        breakdown: {
          sales: totalSales,
          expenses: totalExpenses,
        },
      };
    } catch (error) {
      console.error("Failed to generate financial report:", error);
      throw error;
    }
  }

  /**
   * Generate borrowing (credit) report
   */
  async generateBorrowingReport(): Promise<any> {
    try {
      const borrowingsData = await db.query.borrowings.findMany();

      const statusSummary = {
        paid: borrowingsData.filter((b) => b.status === "PAID").length,
        pending: borrowingsData.filter((b) => b.status === "PENDING").length,
        overdue: borrowingsData.filter((b) => b.status === "OVERDUE").length,
      };

      const totalBorrowed = borrowingsData.reduce(
        (sum, b) => sum + parseFloat(b.amount.toString()),
        0
      );

      const totalPaid = borrowingsData
        .filter((b) => b.status === "PAID")
        .reduce((sum, b) => sum + parseFloat(b.amount.toString()), 0);

      const totalOutstanding = totalBorrowed - totalPaid;

      return {
        reportType: "Borrowing Report",
        totalBorrowings: borrowingsData.length,
        statusSummary,
        totalBorrowed,
        totalPaid,
        totalOutstanding,
        data: borrowingsData,
      };
    } catch (error) {
      console.error("Failed to generate borrowing report:", error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
