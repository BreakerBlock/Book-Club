import "server-only";
import { cookies } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db, members } from "./db";
import { databaseUrl } from "./dburl";

// SESSION_SECRET if set; otherwise derived from the database password, which is already secret.
const SECRET = process.env.SESSION_SECRET
  || createHash("sha256").update("bookclub-session:" + (databaseUrl() ?? "dev-only")).digest("base64url");
const MEMBER = "bc_member";
const ADMIN = "bc_admin";
const YEAR = 60 * 60 * 24 * 365;

function sign(v: string) {
  return v + "." + createHmac("sha256", SECRET).update(v).digest("base64url");
}
function unsign(s?: string) {
  if (!s) return null;
  const i = s.lastIndexOf(".");
  if (i < 0) return null;
  const v = s.slice(0, i);
  const a = Buffer.from(sign(v));
  const b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b) ? v : null;
}

const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: YEAR };

export async function setMember(id: string) {
  (await cookies()).set(MEMBER, sign(id), opts);
}
export async function clearMember() {
  (await cookies()).delete(MEMBER);
}
export async function currentMember() {
  const id = unsign((await cookies()).get(MEMBER)?.value);
  if (!id) return null;
  return (await db.query.members.findFirst({ where: eq(members.id, id) })) ?? null;
}
export async function requireMember() {
  const m = await currentMember();
  if (!m) throw new Error("Please join the club first.");
  return m;
}

export async function setAdmin() {
  (await cookies()).set(ADMIN, sign("admin"), { ...opts, maxAge: 60 * 60 * 12 });
}
export async function clearAdmin() {
  (await cookies()).delete(ADMIN);
}
export async function isAdmin() {
  return unsign((await cookies()).get(ADMIN)?.value) === "admin";
}
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Staff only.");
}
