// Builds a WhatsApp "click to chat" deep link with a prefilled payment-reminder
// message. Uses https://wa.me which works on both mobile (app) and desktop (web),
// requiring no paid API.

const DEFAULT_COUNTRY_CODE = "91"; // India

/** Normalizes a phone number to digits with a country code for wa.me. */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // Strip a leading 0 (common in local formats)
  digits = digits.replace(/^0+/, "");
  // 10-digit local number -> prefix default country code
  if (digits.length === 10) digits = DEFAULT_COUNTRY_CODE + digits;
  return digits;
}

export interface ReminderOptions {
  customerName: string;
  amount: number;
  shopName?: string;
  upiId?: string | null;
  dueDate?: string | null;
}

/** Builds the reminder message text. */
export function buildReminderMessage(opts: ReminderOptions): string {
  const shop = opts.shopName || localStorage.getItem("shopOwner") || "our shop";
  const amount = `₹${opts.amount.toLocaleString("en-IN")}`;
  const lines = [
    `Namaste ${opts.customerName},`,
    "",
    `This is a friendly payment reminder from ${shop}.`,
    `Your pending balance (udhaar) is ${amount}.`,
  ];
  if (opts.dueDate) {
    const due = new Date(opts.dueDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    lines.push(`Due date: ${due}.`);
  }
  if (opts.upiId) {
    lines.push("", `You can pay via UPI to: ${opts.upiId}`);
  }
  lines.push("", "Thank you! 🙏");
  return lines.join("\n");
}

/**
 * Opens WhatsApp with a prefilled reminder. Returns false if the phone number
 * is missing/invalid so the caller can show a helpful message.
 */
export function sendWhatsAppReminder(phone: string | null | undefined, opts: ReminderOptions): boolean {
  const normalized = normalizePhone(phone);
  const text = encodeURIComponent(buildReminderMessage(opts));
  // With a valid number, open a direct chat; otherwise open WhatsApp with just
  // the prefilled text so the shopkeeper can pick the contact manually.
  const url = normalized
    ? `https://wa.me/${normalized}?text=${text}`
    : `https://wa.me/?text=${text}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return !!normalized;
}
