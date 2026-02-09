# WhatsApp Reminders & Automated Invoicing - Implementation Guide

## Overview
This document outlines the two features implemented in Shopkeeper Insights:
1. **WhatsApp Payment Reminders** - Automatic WhatsApp payment reminders for pending "Udhaar" (credit)
2. **Automated Invoicing** - Automatic invoice generation and receipt sending via WhatsApp after sales

---

## Feature 1: WhatsApp Payment Reminders 📱

### How It Works

The system automatically sends WhatsApp messages to customers with pending credit at two key moments:

#### 1. **Overdue Payment Reminders** (Every 60 minutes)
- **Trigger**: When a borrowing reaches its due date and payment is overdue
- **Frequency**: Checks every hour
- **Message**: "Hello [Customer Name], you have an overdue payment of ₹[Amount]. Please pay at your earliest convenience."

#### 2. **Upcoming Due Reminders** (Daily at 8 AM)
- **Trigger**: When a borrowing is due within the next 1 day (default)
- **Frequency**: Once daily at 8 AM
- **Message**: "Reminder: Payment of ₹[Amount] is due on [Date]. Please arrange payment."

### Configuration per Customer

Each customer has notification settings:

| Setting | Default | Purpose |
|---------|---------|---------|
| `whatsappEnabled` | `true` | Enable/disable WhatsApp reminders |
| `reminderDaysBefore` | `1` | Send reminder N days before due date |

### API Endpoints for Reminders

```
POST /api/notifications/send-overdue-reminders
- Manually trigger overdue reminders
- Response: { success: true, message: "Overdue reminders sent" }

POST /api/notifications/send-upcoming-reminders
- Manually trigger upcoming due reminders
- Response: { success: true, message: "Upcoming reminders sent" }

GET /api/notifications/settings/:customerId
- Get notification settings for a customer
- Response: { customerId, whatsappEnabled, reminderDaysBefore, ... }

POST /api/notifications/settings
- Update notification settings for a customer
- Body: { customerId, whatsappEnabled?, reminderDaysBefore? }
- Response: { success: true, message: "Notification settings updated" }

GET /api/notifications/logs/:customerId
- View complete notification history for a customer
- Response: Array of sent notifications with timestamps
```

### Implementation Details

**File**: `server/services/notificationService.ts`

Key methods:
- `sendWhatsAppMessage()` - Sends WhatsApp messages (mock implementation - integrate with Twilio/AWS SNS)
- `sendOverdueReminders()` - Sends overdue payment reminders
- `sendUpcomingDueReminders()` - Sends upcoming due reminders

**Database**: Uses `notificationsLog` table to track all sent WhatsApp messages
- Prevents duplicate reminders within 24 hours
- Records success/failure status
- Stores message content for audit trail

---

## Feature 2: Automated Invoicing 📄

### How It Works

When a sale is recorded with a customer, the system automatically:
1. **Creates an invoice** - Generates a unique invoice document
2. **Sends a WhatsApp receipt** - Automatically sends the receipt via WhatsApp

### Invoice Details

**Invoice Number Format**: `INV-YYYYMMDD-XXXX`
- Example: `INV-20250208-1234`

**Invoice Contains**:
- Customer name and phone number
- Invoice number and date
- Sale amount (total, paid, and pending breakdown)
- Payment method (CASH, ONLINE, CREDIT)

### WhatsApp Receipt

After a sale is created, a receipt message is automatically sent via WhatsApp:

```
Thank you for your purchase!
Your receipt has been generated.
Amount: ₹[Total Amount]
Invoice: [Invoice Number]

If you have any questions, please contact us.
```

### API Endpoints for Invoicing

```
POST /api/invoices/create
- Create a new invoice manually
- Body: { saleId, customerId, items?, amount }
- Response: Invoice object with ID and details

GET /api/invoices/:id
- Get a specific invoice

GET /api/invoices/sale/:saleId
- Get all invoices for a sale

GET /api/invoices/customer/:customerId
- Get all invoices for a customer

PATCH /api/invoices/:id/status
- Update invoice status (PENDING, SENT, CANCELLED)
- Body: { status: "SENT" }

POST /api/receipts/send
- Manually send a WhatsApp receipt
- Body: { saleId, customerId, invoiceId }
- Response: { success: bool }
```

### Implementation Details

**Files**:
- `server/services/invoiceService.ts` - Invoice generation and storage
- `server/storage.ts` - Modified `createSale()` method to auto-create invoices

**Automatic Process Flow**:
```
Sale Created with Customer
    ↓
Update Customer Metrics (totalPurchase, borrowedAmount)
    ↓
Recalculate Trust Score
    ↓
Create Invoice
    ↓
Send WhatsApp Receipt
```

---

## Automatic Job Scheduler ⏰

**File**: `server/services/schedulerService.ts`

The scheduler runs background jobs to automatically send WhatsApp reminders:

### Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `sendOverdueReminders` | Every 60 minutes | Send overdue payment reminders via WhatsApp |
| `sendUpcomingDueReminders` | Daily at 8 AM | Send upcoming due date reminders via WhatsApp |

### Usage

The scheduler is automatically started when the server boots up in `server/index.ts`:

```typescript
import { schedulerService } from "./services/schedulerService";

// Server automatically starts all jobs
schedulerService.startAll();
```

### Console Output Examples

```
[20:35:45] [WhatsApp] Sending to 9876543210: Hello Rahul Sharma, you have an overdue payment of ₹2000. Please pay at your earliest convenience.

[08:00:00] [2025-02-08T08:00:00.000Z] Running upcoming due reminders job...
[08:00:02] [2025-02-08T08:00:02.123Z] Upcoming due reminders job completed
```

---

## Integrating with Real WhatsApp Provider

Currently, all WhatsApp messages are logged to console (mock implementation). To send real messages, integrate with a WhatsApp provider:

### Option 1: Twilio (Recommended)
- Sign up at https://www.twilio.com/
- Update `sendWhatsAppMessage()` in `server/services/notificationService.ts`

### Option 2: MessageBird
- Sign up at https://messagebird.com/
- Integration similar to Twilio

### Option 3: AWS SNS
- Use AWS SNS for WhatsApp messaging
- Update provider credentials in environment variables

**Update Location**: `server/services/notificationService.ts`, method `sendWhatsAppMessage()`

---

## Testing the Features

### Test 1: Create a Sale with Automatic Invoice & Receipt

```bash
POST /api/sales/create
{
  "amount": "500",
  "paidAmount": "300",
  "pendingAmount": "200",
  "paymentMethod": "CASH",
  "customerId": 1
}
```

**Results**:
- ✅ Sale created
- ✅ Customer totals updated
- ✅ Trust score recalculated
- ✅ Invoice auto-generated
- ✅ WhatsApp receipt sent (check console logs)

### Test 2: View Invoice

```bash
GET /api/invoices/customer/1
```

### Test 3: Configure WhatsApp Reminders

```bash
POST /api/notifications/settings
{
  "customerId": 1,
  "whatsappEnabled": true,
  "reminderDaysBefore": 2
}
```

### Test 4: Manually Trigger Reminders

```bash
POST /api/notifications/send-overdue-reminders
POST /api/notifications/send-upcoming-reminders
```

Check server console logs for WhatsApp messages.

### Test 5: View Notification History

```bash
GET /api/notifications/logs/1
```

---

## Summary of Changes

### Files Modified:

1. **`server/services/notificationService.ts`**
   - Removed SMS and Email methods
   - WhatsApp-only implementation
   - Simplified reminder logic

2. **`server/services/invoiceService.ts`**
   - Fixed where clause syntax error

3. **`server/storage.ts`**
   - Auto-create invoices on sale
   - Auto-send WhatsApp receipts on sale

4. **`server/index.ts`**
   - Initialize scheduler on startup

5. **`server/routes.ts`**
   - Simplified notification settings endpoint
   - Only accepts whatsappEnabled and reminderDaysBefore

### Files Created:

1. **`server/services/schedulerService.ts`**
   - Background job scheduler
   - Runs reminder jobs automatically

---

## Key Features

✅ **Automatic WhatsApp Reminders**
- Overdue payments every 60 minutes
- Upcoming due dates daily at 8 AM

✅ **Automatic Invoice Generation**
- On every sale with customer
- Unique invoice numbers

✅ **Automatic WhatsApp Receipts**
- Sent immediately after sale
- Includes invoice number and amount

✅ **Notification Audit Trail**
- All messages logged to database
- Success/failure tracking
- Message history per customer

✅ **Simple Configuration**
- Per-customer settings
- Easy to enable/disable
- Configurable reminder days

---

## Environment Variables

No additional environment variables needed. The system logs messages to console by default.

When integrating with a real WhatsApp provider, you'll need:
- `TWILIO_ACCOUNT_SID` (for Twilio)
- `TWILIO_AUTH_TOKEN` (for Twilio)
- `TWILIO_WHATSAPP_NUMBER` (for Twilio)

Or equivalent for your chosen provider.

---

## Feature 3: Automatic UPI Payment Processing 💳

### How It Works

When a customer pays via UPI online:
1. **Payment provider** (Razorpay, PayU, etc.) sends webhook notification
2. **App receives payment** via webhook endpoint
3. **Payment is automatically recorded** in the database
4. **Customer's borrowing status** is updated automatically
5. **Payment confirmation** is sent to customer via WhatsApp

### Payment Flow

```
Customer pays ₹500 via UPI
        ↓
Payment Provider (Razorpay/PayU)
        ↓
App Webhook: /api/payments/webhook
        ↓
Record Payment in Database
        ↓
Match to Borrowing/Udhaar
        ↓
Update Borrowing Status (PAID)
        ↓
Reduce Customer's borrowedAmount
        ↓
Send WhatsApp Confirmation
```

### Configuration

To integrate with a payment provider:

**1. Razorpay (Recommended for India)**
- Sign up at https://razorpay.com/
- Get API Key and Secret
- Set webhook URL to: `https://yourapp.com/api/payments/webhook`
- Update `paymentService.ts` to verify webhook signature

**2. PayU**
- Sign up at https://www.payu.in/
- Configure callback URL for payment notifications
- Integrate in `paymentService.ts`

**3. PhonePe/Google Pay Business**
- Use their respective APIs
- Configure server URL in webhook settings

### API Endpoints for Payments

```
POST /api/payments/webhook
- Receive payment notifications from payment provider
- Body: { customerId, amount, transactionId, reference, upiId, payerName, paymentDate }
- Auto-triggered by payment provider (not manual)

POST /api/payments/record
- Manually record a UPI payment (for testing/admin)
- Body: { customerId, amount, transactionId, reference?, upiId?, payerName?, paymentDate? }

GET /api/payments/customer/:customerId
- Get all payments for a customer

GET /api/payments/all
- Get all payments (admin view)

GET /api/payments/:transactionId
- Get specific payment by transaction ID

GET /api/payments/summary/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
- Get payment summary for a date range
- Response: { totalPayments, totalAmount, successfulPayments, failedPayments, ... }

PATCH /api/payments/:id/status
- Update payment status (for refunds/failures)
- Body: { status: "SUCCESS" | "PENDING" | "FAILED" }
```

### What Happens Automatically

When a payment is received:

1. **Payment Recorded** - Stored in `payments` table with:
   - Customer ID
   - Amount
   - Transaction ID (unique)
   - Payment status: SUCCESS
   - UPI details (UPI ID, payer name)

2. **Borrowing Updated** - Linked borrowing status changed to PAID

3. **Customer Balance Updated**:
   - `borrowedAmount` reduced by payment amount
   - `trustScore` automatically recalculated

4. **Notification Sent** - WhatsApp confirmation to customer:
   ```
   "Dear [Name], we have received your payment of ₹[Amount]
   via UPI. Thank you for your prompt payment. Your balance
   has been updated."
   ```

### Database Schema

**Payments Table**:
```sql
- id (primary key)
- customerId (links to customer)
- borrowingId (optional - links to specific borrowing)
- amount (payment amount)
- paymentMethod (UPI, BANK_TRANSFER, CARD, CASH)
- transactionId (unique - from payment provider)
- status (SUCCESS, PENDING, FAILED)
- reference (payment reference/order ID)
- upiId (customer's UPI ID)
- payerName (who paid)
- paymentDate (when payment was made)
- createdAt / updatedAt (timestamps)
```

### Example Webhook Payload (Razorpay)

```json
{
  "customerId": 1,
  "amount": 500.50,
  "transactionId": "pay_1A2B3C4D5E6F",
  "reference": "ORD123456",
  "upiId": "customer@upi",
  "payerName": "Rahul Sharma",
  "paymentDate": "2025-02-08T15:30:00Z"
}
```

### Manual Payment Recording (for testing)

```bash
POST /api/payments/record
{
  "customerId": 1,
  "amount": 500,
  "transactionId": "test_txn_001",
  "payerName": "Rahul Sharma",
  "upiId": "rahul@upi"
}
```

### Features

✅ **Automatic Payment Processing**
- Receives payments from customer's UPI account
- No manual entry needed

✅ **Auto-Linked to Borrowings**
- Payments automatically matched to pending borrowings
- Status updated to PAID

✅ **Customer Balance Update**
- borrowedAmount reduced automatically
- Trust score recalculated

✅ **Payment Tracking**
- All payments logged with transaction ID
- Prevents duplicate payments
- Tracks failed/refunded payments

✅ **Reconciliation**
- Payment summary by date range
- Success/failure statistics
- Payment history per customer

✅ **WhatsApp Notification**
- Customer gets confirmation message
- Includes payment amount and reference

### Implementation Files

**Files Modified:**
1. `shared/schema.ts` - Added payments table
2. `server/routes.ts` - Added payment endpoints
3. `server/index.ts` - Already initialized

**Files Created:**
1. `server/services/paymentService.ts` - Payment processing logic

---

## Notes & Limitations

- All WhatsApp messages currently logged to console (mock implementation)
- Reminders check for duplicates within 24 hours
- Scheduler runs on local time - consider timezone handling for production
- Invoice URLs stored as base64 HTML - use cloud storage for production
- SMS and Email methods completely removed per requirements
- Payment webhook verification depends on integration with actual payment provider
- Transaction ID uniqueness prevents duplicate payment processing
- Auto-linkage tries to match payment to oldest borrowing - can be customized

