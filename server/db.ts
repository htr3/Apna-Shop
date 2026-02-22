import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";

const { Pool } = pg;

// Use Supabase PostgreSQL via DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required. Set it to your Supabase PostgreSQL connection string.");
}

console.log("Connecting to Supabase PostgreSQL via DATABASE_URL...");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  // Add connection timeout settings
  connectionTimeoutMillis: 10000,  // 10 second timeout to connect
  idleTimeoutMillis: 30000,        // 30 second idle timeout
  max: 10,                          // Maximum pool size
});

// Add error handlers to pool
pool.on('error', (err) => {
  console.error('Unexpected connection pool error:', err);
});

pool.on('connect', () => {
  console.log('Connection pool connected successfully');
});

export { pool };
export const db = drizzle(pool, { schema: { ...schema } });

// Seed default users (Owner only) with timeout
export async function seedUsers() {
  try {
    const isDbConfigured = process.env.DATABASE_URL || process.env.CLOUD_SQL_CONNECTION_NAME;
    if (!isDbConfigured) {
      console.log("Skipping user seeding: No database configured.");
      return;
    }

    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database seed operation timed out after 10 seconds")), 10000)
    );

    const seedPromise = (async () => {
      // Check if owner already exists
      const existingOwner = await db.query.users.findFirst({
        where: eq(schema.users.username, "owner"),
      });

      if (existingOwner) {
        console.log("Default users already seeded");
        return;
      }

      // Create default owner with mobileNo (required)
      await db.insert(schema.users).values({
        mobileNo: "9999999999",  // ✨ CHANGED: Use mobileNo as identifier
        username: "owner",
        password: "owner123", // In production, use proper hashing
        email: "owner@shopkeeper.local",
        role: "OWNER",
        isActive: true,
      });

      console.log("✓ Default owner user seeded");
    })();

    await Promise.race([seedPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique constraint, already exists
      console.log("User already exists, skipping seed");
    } else if (error.message?.includes("timed out")) {
      console.warn("Database seed timed out, continuing with startup anyway...");
      // Don't crash on timeout, let server start anyway
    } else {
      console.error("Error seeding users:", error.message || error);
      // Don't crash on database errors either, server can start
    }
  }
}
