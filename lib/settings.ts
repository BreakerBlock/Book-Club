import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { db, settings } from "./db";

export async function getSetting(key: string) {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

/** Store name: staff desk setting → NEXT_PUBLIC_STORE_NAME → placeholder. Cached per request. */
export const storeName = cache(async () =>
  (await getSetting("store_name").catch(() => null)) || process.env.NEXT_PUBLIC_STORE_NAME || "Lantern Lane Books");

/* Staff password: ADMIN_PASSWORD env var wins; otherwise a hash set once at /admin/login. */

export async function staffPasswordMode(): Promise<"env" | "stored" | "unset"> {
  if (process.env.ADMIN_PASSWORD) return "env";
  return (await getSetting("admin_hash")) ? "stored" : "unset";
}

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
}

export async function checkStaffPassword(pw: string) {
  if (process.env.ADMIN_PASSWORD) {
    const a = Buffer.from(pw), b = Buffer.from(process.env.ADMIN_PASSWORD);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const stored = await getSetting("admin_hash");
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const got = scryptSync(pw, salt, 32);
  return timingSafeEqual(got, Buffer.from(hash, "hex"));
}
