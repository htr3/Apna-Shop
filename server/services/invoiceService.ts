import { db } from "../db";
import { invoices, sales, customers } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  saleId: number;
  customerId?: number;
  items?: InvoiceItem[];
  amount: number;
}

class InvoiceService {
  /**
   * Generate invoice number (format: INV-YYYYMMDD-XXXX)
   */
  private generateInvoiceNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `INV-${dateStr}-${randomStr}`;
  }

  /**
   * Create HTML invoice for display/PDF conversion
   */
  private createInvoiceHTML(
    invoiceNumber: string,
    saleDate: Date,
    amount: number,
    customer?: { name: string; phone: string },
    items?: InvoiceItem[]
  ): string {
    const date = saleDate.toLocaleDateString();
    const itemsHTML =
      items?.length
        ? items
            .map(
              (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(
              item.quantity * item.price
            ).toFixed(2)}</td>
      </tr>
    `
            )
            .join("")
        : `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;" colspan="4">Sale Amount: ₹${amount}</td>
      </tr>`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .invoice-header { text-align: center; margin-bottom: 30px; }
        .invoice-number { font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #333; }
        td { padding: 8px; }
        .total-row { font-weight: bold; font-size: 16px; text-align: right; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="invoice-number">${invoiceNumber}</div>
        <div>Date: ${date}</div>
      </div>

      ${
        customer
          ? `
      <div style="margin-bottom: 20px;">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${customer.name}</p>
        <p><strong>Phone:</strong> ${customer.phone}</p>
      </div>
      `
          : ""
      }

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 20px;">
        <div class="total-row">Total Amount: ₹${parseFloat(amount.toString()).toFixed(2)}</div>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>This is an automatically generated invoice.</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Create and save an invoice
   */
  async createInvoice(data: InvoiceData): Promise<any> {
    try {
      const invoiceNumber = this.generateInvoiceNumber();

      // Get sale and customer details
      const sale = await db.query.sales.findFirst({
        where: (field, { eq }) => eq(field.id, data.saleId),
      });

      if (!sale) {
        throw new Error("Sale not found");
      }

      const customer = data.customerId
        ? await db.query.customers.findFirst({
            where: (field, { eq }) => eq(field.id, data.customerId),
          })
        : undefined;

      // Generate invoice HTML
      const invoiceHTML = this.createInvoiceHTML(
        invoiceNumber,
        new Date(sale.date as any),
        parseFloat(data.amount.toString()),
        customer
          ? { name: customer.name, phone: customer.phone }
          : undefined,
        data.items
      );

      // In a real app, convert to PDF and store in cloud storage
      // For now, we'll store the HTML and create a data URL
      const dataUrl = `data:text/html;base64,${Buffer.from(invoiceHTML).toString("base64")}`;

      // Save invoice to database
      const invoice = await db
        .insert(invoices)
        .values({
          saleId: data.saleId,
          customerId: data.customerId,
          invoiceNumber,
          amount: data.amount,
          items: data.items ? JSON.stringify(data.items) : null,
          status: "PENDING",
          invoiceUrl: dataUrl,
        })
        .returning();

      return invoice[0];
    } catch (error) {
      console.error("Failed to create invoice:", error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: number): Promise<any> {
    try {
      return await db.query.invoices.findFirst({
        where: (field, { eq }) => eq(field.id, invoiceId),
      });
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      throw error;
    }
  }

  /**
   * Get invoices for a sale
   */
  async getInvoicesBySaleId(saleId: number): Promise<any[]> {
    try {
      return await db.query.invoices.findMany({
        where: (field, { eq }) => eq(field.saleId, saleId),
      });
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      throw error;
    }
  }

  /**
   * Get all invoices for a customer
   */
  async getInvoicesByCustomer(customerId: number): Promise<any[]> {
    try {
      return await db.query.invoices.findMany({
        where: (field, { eq }) => eq(field.customerId, customerId),
      });
    } catch (error) {
      console.error("Failed to fetch customer invoices:", error);
      throw error;
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    invoiceId: number,
    status: "PENDING" | "SENT" | "CANCELLED"
  ): Promise<any> {
    try {
      const result = await db
        .update(invoices)
        .set({ status })
        .where(eq(invoices.id, invoiceId))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to update invoice:", error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
