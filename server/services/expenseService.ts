import { db } from "../db";
import { expenses, sales } from "../../shared/schema";
import { gte, lte, and } from "drizzle-orm";

export interface ExpenseSummary {
  period: string;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  expenseBreakdown: {
    [category: string]: number;
  };
}

class ExpenseService {
  /**
   * Add an expense
   */
  async addExpense(data: {
    category: string;
    amount: number;
    description?: string;
    date?: Date;
    invoiceNumber?: string;
    paymentMethod?: string;
    mobileNo?: string;
  }): Promise<any> {
    try {
      const mobileNo = data.mobileNo ?? process.env.DEFAULT_MOBILE_NO ?? "0";
      const result = await db
        .insert(expenses)
        .values({
          mobileNo,
          category: data.category,
          amount: data.amount.toString(),
          description: data.description,
          date: data.date || new Date(),
          invoiceNumber: data.invoiceNumber,
          paymentMethod: data.paymentMethod || "CASH",
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to add expense:", error);
      throw error;
    }
  }

  /**
   * Get all expenses
   */
  async getAllExpenses(limit?: number): Promise<any[]> {
    try {
      let query = db.query.expenses.findMany();

      if (limit) {
        // Note: Drizzle doesn't support limit on findMany, so we'll fetch all and slice
        const allExpenses = await db.query.expenses.findMany();
        return allExpenses.slice(0, limit);
      }

      return await db.query.expenses.findMany();
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      throw error;
    }
  }

  /**
   * Get expenses for a date range
   */
  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      return await db.query.expenses.findMany({
        where: (field, { and, gte, lte }) =>
          and(
            gte(field.date, startDate),
            lte(field.date, endDate)
          ),
      });
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      return [];
    }
  }

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(category: string): Promise<any[]> {
    try {
      return await db.query.expenses.findMany({
        where: (field, { eq }) => eq(field.category, category),
      });
    } catch (error) {
      console.error("Failed to fetch expenses by category:", error);
      return [];
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(expenses)
        .where((field) => field.id === expenseId)
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Failed to delete expense:", error);
      return false;
    }
  }

  /**
   * Get daily expense summary
   */
  async getDailySummary(date: Date): Promise<ExpenseSummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getExpenseSummaryForRange(startOfDay, endOfDay, "Daily");
  }

  /**
   * Get monthly expense summary
   */
  async getMonthlySummary(year: number, month: number): Promise<ExpenseSummary> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return this.getExpenseSummaryForRange(
      startOfMonth,
      endOfMonth,
      `${year}-${String(month).padStart(2, "0")}`
    );
  }

  /**
   * Get yearly expense summary
   */
  async getYearlySummary(year: number): Promise<ExpenseSummary> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    return this.getExpenseSummaryForRange(
      startOfYear,
      endOfYear,
      String(year)
    );
  }

  /**
   * Get expense summary for a date range
   */
  private async getExpenseSummaryForRange(
    startDate: Date,
    endDate: Date,
    period: string
  ): Promise<ExpenseSummary> {
    try {
      // Get sales for the period
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

      // Get expenses for the period
      const expenseData = await this.getExpensesByDateRange(startDate, endDate);

      // Aggregate expenses by category
      const expenseBreakdown: { [key: string]: number } = {};
      let totalExpenses = 0;

      expenseData.forEach((exp) => {
        const amount = parseFloat(exp.amount.toString());
        expenseBreakdown[exp.category] = (expenseBreakdown[exp.category] || 0) + amount;
        totalExpenses += amount;
      });

      const netProfit = totalSales - totalExpenses;

      return {
        period,
        totalSales,
        totalExpenses,
        netProfit,
        expenseBreakdown,
      };
    } catch (error) {
      console.error("Failed to calculate expense summary:", error);
      return {
        period,
        totalSales: 0,
        totalExpenses: 0,
        netProfit: 0,
        expenseBreakdown: {},
      };
    }
  }

  /**
   * Get profit/loss analysis for multiple periods
   */
  async getProfitAnalysis(months: number = 6): Promise<ExpenseSummary[]> {
    const analysis: ExpenseSummary[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const summary = await this.getMonthlySummary(date.getFullYear(), date.getMonth() + 1);
      analysis.push(summary);
    }

    return analysis;
  }
}

export const expenseService = new ExpenseService();
