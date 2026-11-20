/** Applies pending SQL migrations from db/migrations. Runs automatically before every Vercel build. */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { databaseUrl, sslFor } from "../lib/dburl";

try { process.loadEnvFile(".env"); } catch { /* no local .env — fine on Vercel */ }

const url = databaseUrl(true);
if (!url) {
  console.warn("No database connection string found — skipping migrations. Connect a Postgres database in Vercel → Storage.");
  process.exit(0);
}
const pool = new Pool({ connectionString: url, ssl: sslFor(url) });
migrate(drizzle(pool), { migrationsFolder: "db/migrations" })
  .then(() => console.log("Database is up to date."))
  .catch((e) => { console.error("Migration failed:", e); process.exitCode = 1; })
  .finally(() => pool.end());
