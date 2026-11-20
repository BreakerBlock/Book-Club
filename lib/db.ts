import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const g = globalThis as unknown as { pool?: Pool };
const url = process.env.DATABASE_URL;
const pool = g.pool ?? new Pool({
  connectionString: url,
  max: 5,
  ssl: url && !/localhost|127\.0\.0\.1/.test(url) ? { rejectUnauthorized: false } : undefined,
});
if (process.env.NODE_ENV !== "production") g.pool = pool;

export const db = drizzle(pool, { schema });
export * from "./schema";
