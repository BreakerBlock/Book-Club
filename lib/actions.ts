"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, members, availability, pitches, votes, books, events, eventPhotos, rsvps, prizes, readingLogs } from "./db";
import { setMember, clearMember, requireMember, setAdmin, clearAdmin, requireAdmin, currentMember, isAdmin } from "./session";
import { checkStaffPassword, hashPassword, setSetting, staffPasswordMode } from "./settings";
import { loadDemo } from "./demo";
import { findCover, fillMissingCovers } from "./covers";

export type Result = { ok?: string; error?: string } | null;

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const int = (f: FormData, k: string) => {
  const n = parseInt(String(f.get(k) ?? ""), 10);
  return Number.isFinite(n) ? n : null;
};
const fail = (e: unknown): Result => ({ error: e instanceof Error ? e.message : "Something went wrong." });
const refresh = (...paths: string[]) => paths.forEach((p) => revalidatePath(p));

/* ---------- Membership ---------- */

export async function join(_: Result, f: FormData): Promise<Result> {
  const name = str(f, "name", 80);
  const email = str(f, "email", 120).toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Add your name and a valid email." };
  const need = process.env.CLUB_JOIN_CODE;
  if (need && str(f, "code", 80) !== need) return { error: "That club code isn't right — ask at the counter." };
  const [m] = await db.insert(members).values({ name, email })
    .onConflictDoUpdate({ target: members.email, set: { name } }).returning();
  await setMember(m.id);
  const next = str(f, "next");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function leave() {
  await clearMember();
  redirect("/");
}

export async function adminLogin(_: Result, f: FormData): Promise<Result> {
  if (!(await checkStaffPassword(str(f, "password")))) return { error: "Wrong password." };
  await setAdmin();
  redirect("/admin");
}

/** First run only: when no staff password exists yet, the first person here chooses it. */
export async function adminSetup(_: Result, f: FormData): Promise<Result> {
  if ((await staffPasswordMode()) !== "unset") return { error: "A staff password is already set — sign in instead." };
  const pw = str(f, "password", 200);
  if (pw.length < 8) return { error: "Use at least 8 characters." };
  if (pw !== str(f, "confirm", 200)) return { error: "The two passwords don't match." };
  await setSetting("admin_hash", hashPassword(pw));
  await setAdmin();
  redirect("/admin");
}

export async function changeStaffPassword(_: Result, f: FormData): Promise<Result> {
  try {
    await requireAdmin();
    if (process.env.ADMIN_PASSWORD) return { error: "The password is set by ADMIN_PASSWORD in Vercel — change it there." };
    const pw = str(f, "password", 200);
    if (pw.length < 8) return { error: "Use at least 8 characters." };
    await setSetting("admin_hash", hashPassword(pw));
    return { ok: "Staff password changed." };
  } catch (e) { return fail(e); }
}

export async function saveShop(_: Result, f: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const name = str(f, "storeName", 80);
    if (!name) return { error: "Give the shop a name." };
    await setSetting("store_name", name);
    revalidatePath("/", "layout");
    return { ok: "Shop name saved." };
  } catch (e) { return fail(e); }
}

export async function loadDemoData(_: Result, f: FormData): Promise<Result> {
  try {
    await requireAdmin();
    if (str(f, "confirm").toUpperCase() !== "LOAD DEMO") return { error: "Type LOAD DEMO to confirm — this replaces all club data." };
    const n = await loadDemo(db);
    await fillMissingCovers(db);
    revalidatePath("/", "layout");
    return { ok: `Loaded ${n.books} books, ${n.members} members and ${n.events} events.` };
  } catch (e) { return fail(e); }
}

export async function adminLogout() {
  await clearAdmin();
  redirect("/");
}

/* ---------- 1. Availability ---------- */

export async function toggleDay(day: string) {
  const m = await requireMember();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  const removed = await db.delete(availability)
    .where(and(eq(availability.memberId, m.id), eq(availability.day, day))).returning({ id: availability.id });
  if (!removed.length) await db.insert(availability).values({ memberId: m.id, day }).onConflictDoNothing();
  refresh("/availability", "/");
}

/* ---------- 2. Pitches & voting ---------- */

export async function createPitch(_: Result, f: FormData): Promise<Result> {
  try {
    const m = await requireMember();
    const title = str(f, "title", 160), author = str(f, "author", 120), reason = str(f, "reason", 1200);
    if (!title || !author || reason.length < 20) return { error: "Add a title, author and at least a couple of sentences on why." };
    await db.insert(pitches).values({ title, author, reason, genre: str(f, "genre", 40), memberId: m.id, coverUrl: await findCover(title, author) });
    refresh("/pitches");
    return { ok: "Pitch posted — now get people voting." };
  } catch (e) { return fail(e); }
}

export async function vote(pitchId: string, value: 1 | -1) {
  const m = await requireMember();
  const where = and(eq(votes.pitchId, pitchId), eq(votes.memberId, m.id));
  const prev = await db.query.votes.findFirst({ where });
  if (prev?.value === value) await db.delete(votes).where(where);
  else await db.insert(votes).values({ pitchId, memberId: m.id, value })
    .onConflictDoUpdate({ target: [votes.pitchId, votes.memberId], set: { value } });
  refresh("/pitches", "/");
}

export async function setPitchStatus(pitchId: string, status: "OPEN" | "SELECTED" | "ARCHIVED") {
  await requireAdmin();
  await db.update(pitches).set({ status }).where(eq(pitches.id, pitchId));
  refresh("/pitches", "/");
}

export async function deletePitch(pitchId: string) {
  const [m, admin] = await Promise.all([currentMember(), isAdmin()]);
  const p = await db.query.pitches.findFirst({ where: eq(pitches.id, pitchId) });
  if (!p) return;
  if (p.memberId !== m?.id && !admin) throw new Error("Not yours to delete.");
  await db.delete(pitches).where(eq(pitches.id, pitchId));
  refresh("/pitches");
}

/* ---------- 3 & 4. Books / inventory ---------- */

export async function saveBook(_: Result, f: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const id = str(f, "id");
    const cover = str(f, "coverUrl", 500);
    const data = {
      title: str(f, "title", 200), author: str(f, "author", 120), genre: str(f, "genre", 40) || "Fiction",
      isbn: str(f, "isbn", 20) || null, description: str(f, "description", 2000),
      price: Number(str(f, "price")) || 0, stock: Math.max(0, int(f, "stock") ?? 0), shelf: str(f, "shelf", 40) || null,
      coverUrl: /^https:\/\//.test(cover) ? cover : null,
    };
    if (!data.title || !data.author) return { error: "Title and author are required." };
    if (!data.coverUrl) data.coverUrl = await findCover(data.title, data.author);
    if (id) await db.update(books).set(data).where(eq(books.id, id));
    else await db.insert(books).values(data);
    refresh("/inventory", "/new-arrivals", "/");
    return { ok: id ? "Book updated." : "Book added to inventory." };
  } catch (e) { return fail(e); }
}

export async function adjustStock(bookId: string, delta: number) {
  await requireAdmin();
  await db.update(books).set({ stock: sql`greatest(0, ${books.stock} + ${delta})` }).where(eq(books.id, bookId));
  refresh("/inventory");
}

export async function deleteBook(bookId: string) {
  await requireAdmin();
  await db.delete(books).where(eq(books.id, bookId));
  refresh("/inventory", "/new-arrivals");
}

/* ---------- 5 & 8. Events, photos, RSVP ---------- */

export async function saveEvent(_: Result, f: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const when = str(f, "startsAt"); // "YYYY-MM-DDTHH:mm" in the store's local time
    const startsAt = new Date(when + (when.length === 16 ? ":00" : "") + (process.env.EVENT_UTC_OFFSET || "+05:30"));
    if (!str(f, "title") || isNaN(startsAt.getTime())) return { error: "Add a title and a date/time." };
    await db.insert(events).values({
      title: str(f, "title", 160), description: str(f, "description", 3000),
      kind: str(f, "kind") === "SESSION" ? "SESSION" : "EVENT",
      startsAt, location: str(f, "location", 120) || "In store", capacity: int(f, "capacity"),
      imageUrl: /^https:\/\//.test(str(f, "imageUrl")) ? str(f, "imageUrl", 500) : null,
    });
    refresh("/events", "/sessions", "/", "/admin");
    return { ok: "Saved." };
  } catch (e) { return fail(e); }
}

export async function deleteEvent(eventId: string) {
  await requireAdmin();
  await db.delete(events).where(eq(events.id, eventId));
  refresh("/events", "/sessions", "/admin");
}

export async function addPhotos(_: Result, f: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const eventId = str(f, "eventId");
    const caption = str(f, "caption", 200);
    const urls: string[] = [];
    const files = f.getAll("files").filter((x): x is File => x instanceof File && x.size > 0);
    if (files.length) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: "Photo upload needs Vercel Blob connected (BLOB_READ_WRITE_TOKEN). You can paste an image link instead." };
      for (const file of files.slice(0, 12)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 4 * 1024 * 1024) return { error: `${file.name} is over 4 MB — resize it and try again.` };
        const blob = await put(`events/${eventId}/${file.name}`, file, { access: "public", addRandomSuffix: true });
        urls.push(blob.url);
      }
    }
    const pasted = str(f, "url", 500);
    if (/^https:\/\//.test(pasted)) urls.push(pasted);
    if (!urls.length) return { error: "Choose photos or paste an https image link." };
    await db.insert(eventPhotos).values(urls.map((url) => ({ url, caption, eventId })));
    await db.update(events).set({ imageUrl: urls[0] }).where(and(eq(events.id, eventId), isNull(events.imageUrl)));
    refresh(`/events/${eventId}`, "/events");
    return { ok: `${urls.length} photo${urls.length > 1 ? "s" : ""} added.` };
  } catch (e) { return fail(e); }
}

export async function rsvp(eventId: string, status: "GOING" | "INTERESTED") {
  const m = await requireMember();
  const where = and(eq(rsvps.eventId, eventId), eq(rsvps.memberId, m.id));
  const prev = await db.query.rsvps.findFirst({ where });
  if (prev?.status === status) {
    await db.delete(rsvps).where(where);
  } else {
    if (status === "GOING") {
      const ev = await db.query.events.findFirst({ where: eq(events.id, eventId) });
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(rsvps).where(and(eq(rsvps.eventId, eventId), eq(rsvps.status, "GOING")));
      if (ev?.capacity && n >= ev.capacity) return; // full — the button is disabled in the UI too
    }
    await db.insert(rsvps).values({ eventId, memberId: m.id, status })
      .onConflictDoUpdate({ target: [rsvps.eventId, rsvps.memberId], set: { status } });
  }
  refresh("/sessions", `/events/${eventId}`, "/");
}

/* ---------- 6. Prizes ---------- */

export async function addPrize(_: Result, f: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const bookId = str(f, "bookId"), name = str(f, "name", 120), year = int(f, "year");
    if (!bookId || !name || !year) return { error: "Pick a book, prize name and year." };
    await db.insert(prizes).values({ bookId, name, year, category: str(f, "category", 40) || "Winner" });
    refresh("/trending", "/new-arrivals");
    return { ok: "Prize recorded." };
  } catch (e) { return fail(e); }
}

/* ---------- 9. Reading log & reviews ---------- */

export async function logReading(_: Result, f: FormData): Promise<Result> {
  try {
    const m = await requireMember();
    const bookId = str(f, "bookId") || null;
    let title = str(f, "title", 200), author = str(f, "author", 120), genre = str(f, "genre", 40);
    if (bookId) {
      const b = await db.query.books.findFirst({ where: eq(books.id, bookId) });
      if (b) { title = b.title; author = b.author; genre = b.genre; }
    }
    if (!title) return { error: "Pick a book from the store or type a title." };
    const s = str(f, "status");
    const status = (["WANT", "READING", "FINISHED"].includes(s) ? s : "READING") as "WANT" | "READING" | "FINISHED";
    const r = int(f, "rating");
    const data = {
      bookTitle: title, bookAuthor: author || "Unknown", genre, status,
      rating: r && r >= 1 && r <= 5 ? r : null, review: str(f, "review", 4000) || null, bookId, updatedAt: new Date(),
    };
    const existing = await db.query.readingLogs.findFirst({
      where: and(eq(readingLogs.memberId, m.id), sql`lower(${readingLogs.bookTitle}) = lower(${title})`),
    });
    if (existing) await db.update(readingLogs).set(data).where(eq(readingLogs.id, existing.id));
    else await db.insert(readingLogs).values({ ...data, memberId: m.id });
    refresh("/reading", "/for-you", "/trending", "/");
    return { ok: existing ? "Updated your log." : "Logged. Happy reading!" };
  } catch (e) { return fail(e); }
}

export async function deleteLog(id: string) {
  const m = await requireMember();
  await db.delete(readingLogs).where(and(eq(readingLogs.id, id), eq(readingLogs.memberId, m.id)));
  refresh("/reading");
}
