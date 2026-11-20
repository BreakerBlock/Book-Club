/**
 * Real book covers from Open Library (free, no key). Looked up by title + author.
 * Runs at build time for any book without a cover, and when staff add a book.
 * If nothing is found the site falls back to a typeset jacket.
 */
import { eq, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as S from "./schema";

export async function findCover(title: string, author: string): Promise<string | null> {
  try {
    const q = new URLSearchParams({ title, author, limit: "5", fields: "cover_i" });
    const res = await fetch(`https://openlibrary.org/search.json?${q}`, {
      headers: { "User-Agent": "BookstoreClub/1.0 (book club website)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { docs?: { cover_i?: number }[] };
    const id = data.docs?.find((d) => d.cover_i)?.cover_i;
    return id ? `https://covers.openlibrary.org/b/id/${id}-L.jpg` : null;
  } catch {
    return null;
  }
}

export async function fillMissingCovers(db: NodePgDatabase<typeof S>) {
  const missing = await db.select({ id: S.books.id, title: S.books.title, author: S.books.author })
    .from(S.books).where(isNull(S.books.coverUrl));
  let found = 0;
  for (let i = 0; i < missing.length; i += 5) {
    await Promise.all(missing.slice(i, i + 5).map(async (b) => {
      const url = await findCover(b.title, b.author);
      if (url) { found++; await db.update(S.books).set({ coverUrl: url }).where(eq(S.books.id, b.id)); }
    }));
  }
  const pitchesMissing = await db.select({ id: S.pitches.id, title: S.pitches.title, author: S.pitches.author })
    .from(S.pitches).where(isNull(S.pitches.coverUrl));
  for (let i = 0; i < pitchesMissing.length; i += 5) {
    await Promise.all(pitchesMissing.slice(i, i + 5).map(async (p) => {
      const url = await findCover(p.title, p.author);
      if (url) { found++; await db.update(S.pitches).set({ coverUrl: url }).where(eq(S.pitches.id, p.id)); }
    }));
  }
  return { checked: missing.length + pitchesMissing.length, found };
}
