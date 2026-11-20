import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./lib/dburl";

try { process.loadEnvFile(".env"); } catch { /* optional */ }

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl(true)! },
});
