import { db } from "../db";
import { payments, borrowings, customers } from "../../shared/schema";
import { eq, and, lte, gte } from "drizzle-orm";

interface UPIPaymentData {
  customerId: number;
  amount: number;
  transactionId: string;
  reference?: string;
  upiId?: string;
  payerName?: string;
  paymentDate?: Date;
}

/**
 * Payment Service
 * Handles UPI and online payment processing
 * Auto-links payments to borrowings and updates status
 */
class PaymentService {
  /**
   * Record a UPI payment and auto-update borrowings
   */
  async recordUPIPayment(paymentData: UPIPaymentData): Promise<any> {
    try {
      // Check if transaction already exists (prevent duplicates)
      const existingPayment = await db.query.payments.findFirst({
        where: (field, { eq }) => eq(field.transactionId, paymentData.transactionId),
      });

      if (existingPayment) {
        throw new Error("Payment already recorded with this transaction ID");
      }

      // Verify customer exists
      const customer = await db.query.customers.findFirst({
        where: (field, { eq }) => eq(field.id, paymentData.customerId),
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      // Find the oldest overdue or pending borrowing for this customer
      const borrowing = await db.query.borrowings.findFirst({
        where: (field, { eq }) => eq(field.customerId, paymentData.customerId),
        orderBy: (field) => field.dueDate,
      });

      let borrowingId = borrowing?.id;
      let remainingAmount = paymentData.amount;

      // Record the payment
      // Ensure mobileNo is present (tenant identifier). Try to get from customer record.
      const mobileNo = customer?.mobileNo ?? process.env.DEFAULT_MOBILE_NO ?? "0";

      const payment = await db.insert(payments).values({
        mobileNo,
        customerId: paymentData.customerId,
        borrowingId: borrowingId,
        amount: paymentData.amount.toString(),
        paymentMethod: "UPI",
        transactionId: paymentData.transactionId,
        reference: paymentData.reference,
        upiId: paymentData.upiId,
        payerName: paymentData.payerName,
        paymentDate: paymentData.paymentDate || new Date(),
        status: "SUCCESS",
      }).returning();

      // If payment is linked to a borrowing, try to update its status
      if (borrowingId && borrowing) {
        const borrowingAmount = Number(borrowing.amount);

        // If payment amount >= borrowing amount, mark as PAID
        if (remainingAmount >= borrowingAmount) {
          await db
            .update(borrowings)
            .set({ status: "PAID" })
            .where(eq(borrowings.id, borrowingId));

          remainingAmount -= borrowingAmount;
        }
      }

      // Update customer's borrowedAmount
      const currentBorrowed = Number(customer.borrowedAmount);
      const newBorrowed = Math.max(0, currentBorrowed - paymentData.amount);

      await db
        .update(customers)
        .set({ borrowedAmount: newBorrowed.toString() })
        .where(eq(customers.id, paymentData.customerId));

      // Send WhatsApp notification about payment confirmation
      await this.sendPaymentConfirmationMessage(customer.name, customer.phone, paymentData.amount);

      return {
        success: true,
        payment: payment[0],
        message: `Payment of ₹${paymentData.amount} recorded successfully`,
      };
    } catch (error) {
      console.error("Error recording UPI payment:", error);
      throw error;
    }
  }

  /**
   * GET all payments for a customer
   */
  async getCustomerPayments(customerId: number): Promise<any[]> {
    try {
      return await db.query.payments.findMany({
        where: (field, { eq }) => eq(field.customerId, customerId),
      });
    } catch (error) {
      console.error("Error fetching customer payments:", error);
      throw error;
    }
  }

  /**
   * GET all payments (for admin)
   */
  async getAllPayments(): Promise<any[]> {
    try {
      return await db.query.payments.findMany();
    } catch (error) {
      console.error("Error fetching all payments:", error);
      throw error;
    }
  }

  /**
   * GET payment by transaction ID
   */
  async getPaymentByTransactionId(transactionId: string): Promise<any> {
    try {
      return await db.query.payments.findFirst({
        where: (field, { eq }) => eq(field.transactionId, transactionId),
      });
    } catch (error) {
      console.error("Error fetching payment:", error);
      throw error;
    }
  }

  /**
   * Update payment status (for handling failed/refunded payments)
   */
  async updatePaymentStatus(paymentId: number, status: "SUCCESS" | "PENDING" | "FAILED"): Promise<any> {
    try {
      const result = await db
        .update(payments)
        .set({ status, updatedAt: new Date() })
        .where(eq(payments.id, paymentId))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  }

  /**
   * GET payment summary for a date range
   */
  async getPaymentsSummary(startDate: Date, endDate: Date): Promise<any> {
    try {
      const paymentsList = await db.query.payments.findMany();

      const filteredPayments = paymentsList.filter(
        (p) => new Date(p.paymentDate!) >= startDate && new Date(p.paymentDate!) <= endDate
      );

      const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const successfulPayments = filteredPayments.filter((p) => p.status === "SUCCESS").length;
      const failedPayments = filteredPayments.filter((p) => p.status === "FAILED").length;

      return {
        period: { startDate, endDate },
        totalPayments: filteredPayments.length,
        totalAmount,
        successfulPayments,
        failedPayments,
        averageAmount: totalAmount / (filteredPayments.length || 1),
        payments: filteredPayments,
      };
    } catch (error) {
      console.error("Error getting payment summary:", error);
      throw error;
    }
  }

  /**
   * Send WhatsApp payment confirmation
   */
  private async sendPaymentConfirmationMessage(
    customerName: string,
    phoneNumber: string,
    amount: number
  ): Promise<void> {
    try {
      // Import notificationService dynamically to avoid circular dependency
      const { notificationService } = await import("./notificationService");

      const message = `Dear ${customerName}, we have received your payment of ₹${amount} via UPI. Thank you for your prompt payment. Your balance has been updated.`;

      await notificationService.sendWhatsAppMessage(phoneNumber, message);
    } catch (error) {
      console.error("Error sending payment confirmation:", error);
      // Don't throw - payment was successful, just notification failed
    }
  }
}

export const paymentService = new PaymentService();
