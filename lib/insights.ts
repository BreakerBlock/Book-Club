import "server-only";
import { gt, gte } from "drizzle-orm";
import { db, books, readingLogs, pitches } from "./db";

const norm = (s: string) => s.trim().toLowerCase();

type BookWithPrizes = Awaited<ReturnType<typeof loadBooks>>[number];
const loadBooks = () => db.query.books.findMany({ where: gt(books.stock, 0), with: { prizes: true } });

export type Suggestion = { book: BookWithPrizes; score: number; reasons: string[] };

/**
 * Recommends in-store books for a member from three signals:
 *  - "Readers like you": members who rated the same books 4★+ also loved these
 *  - Genres and authors the member rates highly
 *  - Prize winners as a tie-breaker
 * Without a member (or with an empty log) it falls back to club-wide favourites.
 */
export async function suggestFor(memberId: string | null, limit = 8): Promise<Suggestion[]> {
  const [stock, logs] = await Promise.all([
    loadBooks(),
    db.select({ memberId: readingLogs.memberId, bookTitle: readingLogs.bookTitle, bookAuthor: readingLogs.bookAuthor, genre: readingLogs.genre, rating: readingLogs.rating }).from(readingLogs),
  ]);

  const mine = memberId ? logs.filter((l) => l.memberId === memberId) : [];
  const readTitles = new Set(mine.map((l) => norm(l.bookTitle)));

  // Taste profile: genres/authors weighted by rating (unrated reads count as 3★).
  const genreW = new Map<string, number>();
  const authorW = new Map<string, number>();
  for (const l of mine) {
    const w = (l.rating ?? 3) - 2; // 1★ → -1 … 5★ → +3
    if (l.genre) genreW.set(norm(l.genre), (genreW.get(norm(l.genre)) ?? 0) + w);
    authorW.set(norm(l.bookAuthor), (authorW.get(norm(l.bookAuthor)) ?? 0) + w);
  }

  // Collaborative: members who loved something I loved → what else they loved.
  const myLoved = new Set(mine.filter((l) => (l.rating ?? 0) >= 4).map((l) => norm(l.bookTitle)));
  const twins = new Map<string, string>(); // memberId → a title we both loved
  for (const l of logs) if (l.memberId !== memberId && (l.rating ?? 0) >= 4 && myLoved.has(norm(l.bookTitle))) twins.set(l.memberId, l.bookTitle);
  const coLoved = new Map<string, { n: number; via: string }>();
  for (const l of logs) {
    const via = twins.get(l.memberId);
    if (via && (l.rating ?? 0) >= 4 && !readTitles.has(norm(l.bookTitle))) {
      const k = norm(l.bookTitle);
      coLoved.set(k, { n: (coLoved.get(k)?.n ?? 0) + 1, via });
    }
  }

  const clubLove = new Map<string, number>();
  for (const l of logs) if ((l.rating ?? 0) >= 4) clubLove.set(norm(l.bookTitle), (clubLove.get(norm(l.bookTitle)) ?? 0) + 1);

  const out: Suggestion[] = [];
  for (const book of stock) {
    const t = norm(book.title);
    if (readTitles.has(t)) continue;
    const reasons: string[] = [];
    let score = 0;
    const co = coLoved.get(t);
    if (co) { score += 4 * co.n; reasons.push(`Readers who loved ${co.via} loved this`); }
    const gw = genreW.get(norm(book.genre)) ?? 0;
    if (gw > 0) { score += Math.min(gw, 6); reasons.push(`You rate ${book.genre} highly`); }
    const aw = authorW.get(norm(book.author)) ?? 0;
    if (aw > 0) { score += 3 + aw; reasons.push(`More from ${book.author}`); }
    const cl = clubLove.get(t) ?? 0;
    if (cl) { score += cl * (mine.length ? 0.5 : 2); if (!mine.length) reasons.push(`${cl} club member${cl > 1 ? "s" : ""} rated it 4★+`); }
    if (book.prizes.length) { score += 1; if (reasons.length < 2) reasons.push(`${book.prizes[0].name} ${book.prizes[0].category.toLowerCase()}`); }
    if (score > 0) out.push({ book, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Trending = reading activity in the last 30 days, weighted by rating, plus net pitch votes on matching titles. */
export async function trending(limit = 10) {
  const since = new Date(Date.now() - 30 * 864e5);
  const [logs, recentPitches] = await Promise.all([
    db.select().from(readingLogs).where(gte(readingLogs.updatedAt, since)),
    db.query.pitches.findMany({ where: gte(pitches.createdAt, since), with: { votes: true } }),
  ]);
  const m = new Map<string, { title: string; author: string; score: number; readers: number; ratings: number[]; votes: number }>();
  const get = (title: string, author: string) => {
    const k = norm(title);
    if (!m.has(k)) m.set(k, { title, author, score: 0, readers: 0, ratings: [], votes: 0 });
    return m.get(k)!;
  };
  for (const l of logs) {
    const e = get(l.bookTitle, l.bookAuthor);
    e.readers += 1;
    e.score += l.status === "WANT" ? 1 : 2;
    if (l.rating) { e.ratings.push(l.rating); e.score += l.rating - 3; }
  }
  for (const p of recentPitches) {
    const net = p.votes.reduce((s, v) => s + v.value, 0);
    if (net > 0) { const e = get(p.title, p.author); e.votes += net; e.score += net; }
  }
  return [...m.values()]
    .map((e) => ({ ...e, avg: e.ratings.length ? e.ratings.reduce((a, b) => a + b, 0) / e.ratings.length : null }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
