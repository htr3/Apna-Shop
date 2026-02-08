import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

const { Pool } = pg;

// Ideally we'd throw if DATABASE_URL is missing, but for this mock-data phase
// we'll allow it to be undefined and just not use the db connection if so.
// However, the tool create_postgresql_database_tool will set it.

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. The application will run in memory-only mode.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Seed default users (Owner + Staff)
export async function seedUsers() {
  try {
    if (!process.env.DATABASE_URL) {
      console.log("Skipping user seeding: DATABASE_URL not set");
      return;
    }

    // Check if owner already exists
    const existingOwner = await db.query.users.findFirst({
      where: (field, { eq }) => eq(field.username, "owner"),
    });

    if (existingOwner) {
      console.log("Default users already seeded");
      return;
    }

    // Create default owner
    await db.insert(schema.users).values({
      username: "owner",
      password: "owner123", // In production, use proper hashing
      email: "owner@shopkeeper.local",
      role: "OWNER",
      isActive: true,
    });

    // Create default staff users
    await db.insert(schema.users).values([
      {
        username: "staff1",
        password: "staff123",
        email: "staff1@shopkeeper.local",
        role: "STAFF",
        isActive: true,
      },
      {
        username: "staff2",
        password: "staff123",
        email: "staff2@shopkeeper.local",
        role: "STAFF",
        isActive: true,
      },
    ]);

    console.log("✓ Default users seeded (owner, staff1, staff2)");
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique constraint, already exists
      console.log("Users already exist, skipping seed");
    } else {
      console.error("Error seeding users:", error);
    }
  }
}
