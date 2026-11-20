/** `npm run db:seed` — loads demo data (WIPES club data first). Same as the staff desk button. */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as S from "../lib/schema";
import { databaseUrl, sslFor } from "../lib/dburl";
import { loadDemo } from "../lib/demo";

try { process.loadEnvFile(".env"); } catch { /* optional */ }
const url = databaseUrl(true);
if (!url) throw new Error("No database connection string found (DATABASE_URL).");
const pool = new Pool({ connectionString: url, ssl: sslFor(url) });
loadDemo(drizzle(pool, { schema: S }))
  .then((n) => console.log(`Seeded ${n.books} books, ${n.members} members, ${n.events} events.`))
  .finally(() => pool.end());
