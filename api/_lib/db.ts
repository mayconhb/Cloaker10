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
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
export { pool };
