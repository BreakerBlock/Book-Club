/**
 * Finds the Postgres connection string whatever name Vercel gave it.
 * Vercel's Neon integration may add a custom prefix (e.g. STORAGE_DATABASE_URL),
 * so we accept DATABASE_URL, POSTGRES_URL, or any *_DATABASE_URL / *_POSTGRES_URL.
 */
export function databaseUrl(unpooled = false): string | undefined {
  const env = process.env;
  const exact = unpooled
    ? ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL"]
    : ["DATABASE_URL", "POSTGRES_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];
  for (const k of exact) if (env[k]) return env[k];
  const suffixes = unpooled
    ? ["_DATABASE_URL_UNPOOLED", "_POSTGRES_URL_NON_POOLING", "_DATABASE_URL", "_POSTGRES_URL"]
    : ["_DATABASE_URL", "_POSTGRES_URL", "_DATABASE_URL_UNPOOLED", "_POSTGRES_URL_NON_POOLING"];
  for (const s of suffixes) {
    const k = Object.keys(env).find((key) => key.endsWith(s) && env[key]?.startsWith("postgres"));
    if (k) return env[k];
  }
  return undefined;
}

export const sslFor = (url?: string) =>
  url && !/localhost|127\.0\.0\.1/.test(url) ? { rejectUnauthorized: false } : undefined;
