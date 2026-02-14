import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";

const { Pool } = pg;

let pool: pg.Pool;

if (process.env.DATABASE_URL) {
  // Production: Supabase or other PostgreSQL via connection string (Vercel/local)
  console.log("Connecting to PostgreSQL via DATABASE_URL...");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
} else if (process.env.NODE_ENV === 'production' && process.env.CLOUD_SQL_CONNECTION_NAME) {
  // Fallback: Google Cloud Run with Cloud SQL
  console.log("Connecting to Google Cloud SQL via Unix socket...");
  pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
  });
} else {
  console.warn("No database configuration found. Application might not work correctly without a database.");
  // Create a dummy pool to avoid crashing on startup. Operations will fail at runtime.
  pool = new Pool();
}

export { pool };
export const db = drizzle(pool, { schema });

// Seed default users (Owner only)
export async function seedUsers() {
  try {
    const isDbConfigured = process.env.DATABASE_URL || process.env.CLOUD_SQL_CONNECTION_NAME;
    if (!isDbConfigured) {
      console.log("Skipping user seeding: No database configured.");
      return;
    }

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
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique constraint, already exists
      console.log("User already exists, skipping seed");
    } else {
      console.error("Error seeding users:", error);
    }
  }
}
