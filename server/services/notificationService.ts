import { db } from "../db";
import { borrowings, customers, notificationsLog } from "../../shared/schema";
import { eq, and, gte, isNull } from "drizzle-orm";

// WhatsApp-only Notification Service
class NotificationService {
  /**
   * Send WhatsApp message
   * Currently logs to console - integrate with Twilio, AWS SNS, or MessageBird
   */
  async sendWhatsAppMessage(
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // TODO: Integrate with WhatsApp provider (Twilio, MessageBird, etc.)
      console.log(`[WhatsApp] Sending to ${phoneNumber}: ${message}`);
      const messageId = `whatsapp_${Date.now()}`;
      return { success: true, messageId };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send receipt via WhatsApp after a sale
   */
  async sendSaleReceipt(
    saleId: number,
    customerId?: number,
    invoiceId?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get customer details if available
      let customer = undefined;
      if (customerId) {
        customer = await db.query.customers.findFirst({
          where: (field, { eq }) => eq(field.id, customerId),
        });
      }

      if (!customer) {
        return { success: false, error: "Customer not found" };
      }

      // Get invoice if available
      let invoice;
      if (invoiceId) {
        invoice = await db.query.invoices.findFirst({
          where: (field, { eq }) => eq(field.id, invoiceId),
        });
      }

      const receiptMessage = `
Thank you for your purchase!
Your receipt has been generated.
Amount: ₹${invoice?.amount || "N/A"}
Invoice: ${invoice?.invoiceNumber || "N/A"}

If you have any questions, please contact us.
      `.trim();

      const result = await this.sendWhatsAppMessage(
        customer.phone,
        receiptMessage
      );

      if (result.success) {
        await this.logNotification(
          0,
          customerId,
          "WHATSAPP",
          "SENT",
          receiptMessage
        );
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Helper to log notifications
   */
  private async logNotification(
    borrowingId: number,
    customerId: number,
    type: "WHATSAPP",
    status: "SENT" | "FAILED" | "PENDING",
    message: string
  ) {
    try {
      await db.insert(notificationsLog).values({
        borrowingId,
        customerId,
        type,
        status,
        message,
        sentAt: status === "SENT" ? new Date() : undefined,
      });
    } catch (error) {
      console.error("Failed to log notification:", error);
    }
  }

  /**
   * Get overdue borrowings and send WhatsApp reminders
   */
  async sendOverdueReminders() {
    const today = new Date();

    // Find all overdue borrowings
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
          // Only send if reminder hasn't been sent today
          isNull(
            db
              .select({ id: notificationsLog.id })
              .from(notificationsLog)
              .where(
                and(
                  eq(notificationsLog.borrowingId, borrowings.id),
                  gte(
                    notificationsLog.createdAt,
                    new Date(today.getTime() - 24 * 60 * 60 * 1000)
                  )
                )
              )
              .limit(1)
          )
        )
      );

    for (const { borrowing, customer } of overdueBorrowings) {
      const message = `Hello ${customer.name}, you have an overdue payment of ₹${borrowing.amount}. Please pay at your earliest convenience.`;

      await this.sendReminderNotification(
        borrowing.id,
        customer.id,
        "WHATSAPP",
        customer.phone,
        message
      );
    }
  }

  /**
   * Send due date reminders via WhatsApp
   */
  async sendUpcomingDueReminders() {
    const today = new Date();
    const reminderDaysBefore = 1; // Default: send reminder 1 day before due date

    // Get all pending borrowings due within the next N days
    const reminderDate = new Date(today.getTime() + reminderDaysBefore * 24 * 60 * 60 * 1000);

    const upcomingBorrowings = await db
      .select({
        borrowing: borrowings,
        customer: customers,
      })
      .from(borrowings)
      .innerJoin(customers, eq(borrowings.customerId, customers.id))
      .where(
        and(
          eq(borrowings.status, "PENDING"),
          gte(borrowings.dueDate, today),
          gte(reminderDate, borrowings.dueDate)
        )
      );

    for (const { borrowing, customer } of upcomingBorrowings) {
      const dueDate = new Date(borrowing.dueDate!).toLocaleDateString();
      const message = `Reminder: Payment of ₹${borrowing.amount} is due on ${dueDate}. Please arrange payment.`;

      await this.sendReminderNotification(
        borrowing.id,
        customer.id,
        "WHATSAPP",
        customer.phone,
        message
      );
    }
  }

  /**
   * Log and send a WhatsApp notification
   */
  private async sendReminderNotification(
    borrowingId: number,
    customerId: number,
    type: "WHATSAPP",
    recipient: string,
    message: string
  ) {
    try {
      const result = await this.sendWhatsAppMessage(recipient, message);

      // Log the notification
      await db.insert(notificationsLog).values({
        borrowingId,
        customerId,
        type,
        status: result.success ? "SENT" : "FAILED",
        message,
        sentAt: result.success ? new Date() : undefined,
      });

      return result;
    } catch (error) {
      console.error(`Failed to send WhatsApp notification:`, error);
      return { success: false, error: String(error) };
    }
  }
}

export const notificationService = new NotificationService();

