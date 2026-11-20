/** Applies pending SQL migrations from db/migrations. Runs automatically before every Vercel build. */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.warn("No DATABASE_URL — skipping migrations.");
  process.exit(0);
}
const pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
migrate(drizzle(pool), { migrationsFolder: "db/migrations" })
  .then(() => console.log("Database is up to date."))
  .finally(() => pool.end());
