/** Applies pending SQL migrations from db/migrations. Runs automatically before every Vercel build. */
import { drizzle } from "drizzle-orm/node-postgres";
import { like } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { databaseUrl, sslFor } from "../lib/dburl";
import * as S from "../lib/schema";
import { loadDemo } from "../lib/demo";
import { fillMissingCovers } from "../lib/covers";
import { DEMO } from "../lib/mode";

try { process.loadEnvFile(".env"); } catch { /* no local .env — fine on Vercel */ }

const url = databaseUrl(true);
if (!url) {
  console.warn("No database connection string found — skipping migrations. Connect a Postgres database in Vercel → Storage.");
  process.exit(0);
}
const pool = new Pool({ connectionString: url, ssl: sslFor(url) });
const db = drizzle(pool, { schema: S });
migrate(db, { migrationsFolder: "db/migrations" })
  .then(async () => {
    console.log("Database is up to date.");
    // Reload demo data if the database is empty, or still has the first demo set (drawn placeholder photos).
    const oldDemo = await db.query.eventPhotos.findFirst({ where: like(S.eventPhotos.url, "data:image/svg%") });
    if (DEMO && (oldDemo || !(await db.query.books.findFirst()))) {
      const n = await loadDemo(db);
      console.log(`Demo mode: loaded ${n.books} books, ${n.members} members, ${n.events} events.`);
    }
    const c = await fillMissingCovers(db);
    if (c.checked) console.log(`Book covers: found ${c.found} of ${c.checked} on Open Library.`);
  })
  .catch((e) => { console.error("Migration failed:", e); process.exitCode = 1; })
  .finally(() => pool.end());
