
import crypto from "crypto";

type OtpPurpose = "LOGIN" | "RESET";

type OtpRecord = {
  otp: string;
  expiresAt: number;
  attempts: number;
  requestCount: number;
  requestWindowStart: number;
};

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

class OtpService {
  private records = new Map<string, OtpRecord>();

  getExpiresInSeconds(): number {
    return Math.floor(OTP_TTL_MS / 1000);
  }

  requestOtp(identifier: string, purpose: OtpPurpose): {
    ok: boolean;
    otp?: string;
    expiresInMs?: number;
    retryAfterMs?: number;
  } {
    const now = Date.now();
    const key = this.getKey(identifier, purpose);
    const existing = this.records.get(key);

    if (existing) {
      const withinWindow = now - existing.requestWindowStart < REQUEST_WINDOW_MS;
      if (withinWindow) {
        if (existing.requestCount >= MAX_REQUESTS_PER_WINDOW) {
          const retryAfterMs = REQUEST_WINDOW_MS - (now - existing.requestWindowStart);
          return { ok: false, retryAfterMs };
        }
        existing.requestCount += 1;
      } else {
        existing.requestWindowStart = now;
        existing.requestCount = 1;
      }
    }

    const otp = this.generateOtp();
    const record: OtpRecord = {
      otp,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      requestCount: existing?.requestCount ?? 1,
      requestWindowStart: existing?.requestWindowStart ?? now,
    };

    this.records.set(key, record);
    return { ok: true, otp, expiresInMs: OTP_TTL_MS };
  }

  verifyOtp(identifier: string, purpose: OtpPurpose, otp: string): {
    ok: boolean;
    reason?: "EXPIRED" | "INVALID" | "LOCKED";
  } {
    const now = Date.now();
    const key = this.getKey(identifier, purpose);
    const record = this.records.get(key);

    if (!record) {
      return { ok: false, reason: "EXPIRED" };
    }

    if (now > record.expiresAt) {
      this.records.delete(key);
      return { ok: false, reason: "EXPIRED" };
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      return { ok: false, reason: "LOCKED" };
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      this.records.set(key, record);
      return { ok: false, reason: record.attempts >= MAX_VERIFY_ATTEMPTS ? "LOCKED" : "INVALID" };
    }

    this.records.delete(key);
    return { ok: true };
  }

  private getKey(identifier: string, purpose: OtpPurpose): string {
    return `${purpose}:${identifier}`;
  }

  private generateOtp(): string {
    return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  }
}

export const otpService = new OtpService();

