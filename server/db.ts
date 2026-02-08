import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Ideally we'd throw if DATABASE_URL is missing, but for this mock-data phase
// we'll allow it to be undefined and just not use the db connection if so.
// However, the tool create_postgresql_database_tool will set it.

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. The application will run in memory-only mode.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
