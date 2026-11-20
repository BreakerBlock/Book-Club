import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { databaseUrl, sslFor } from "./dburl";

const g = globalThis as unknown as { pool?: Pool };
const url = databaseUrl();
const pool = g.pool ?? new Pool({ connectionString: url, max: 5, ssl: sslFor(url) });
if (process.env.NODE_ENV !== "production") g.pool = pool;

export const db = drizzle(pool, { schema });
export * from "./schema";
