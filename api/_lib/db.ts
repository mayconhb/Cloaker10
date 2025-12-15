import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or POSTGRES_URL must be set.",
  );
}

const pool = new Pool({ 
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

export const db = drizzle(pool, { schema });
export { pool };
