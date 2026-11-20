/**
 * Demo data so the site looks alive when showing it to the shop.
 * Used by the staff desk's "Load demo data" button and by `npm run db:seed`.
 * WIPES all club data first. Members, pitches, logs, events and photos are invented;
 * book titles and prize results are real.
 */
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as S from "./schema";

type DB = NodePgDatabase<typeof S>;
const day = 864e5;
const daysAgo = (n: number) => new Date(Date.now() - n * day);
const dateOnly = (offset: number) => new Date(Date.now() + offset * day).toISOString().slice(0, 10);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const BOOKS: [string, string, string, number, number, number, string][] = [
  // title, author, genre, price, stock, arrived days ago, shelf
  ["Orbital", "Samantha Harvey", "Literary Fiction", 499, 6, 12, "Front table"],
  ["Prophet Song", "Paul Lynch", "Literary Fiction", 599, 4, 60, "Prize shelf"],
  ["The Bee Sting", "Paul Murray", "Literary Fiction", 699, 3, 90, "Prize shelf"],
  ["Tomb of Sand", "Geetanjali Shree", "Literary Fiction", 599, 5, 120, "Indian writing"],
  ["Fire Bird", "Perumal Murugan", "Literary Fiction", 499, 2, 40, "Indian writing"],
  ["Demon Copperhead", "Barbara Kingsolver", "Literary Fiction", 799, 3, 150, "Prize shelf"],
  ["Brotherless Night", "V. V. Ganeshananthan", "Literary Fiction", 650, 2, 30, "Prize shelf"],
  ["Network Effect", "Martha Wells", "Science Fiction", 550, 4, 200, "SFF"],
  ["Project Hail Mary", "Andy Weir", "Science Fiction", 599, 7, 18, "SFF"],
  ["The Left Hand of Darkness", "Ursula K. Le Guin", "Science Fiction", 450, 3, 300, "SFF"],
  ["A Wizard of Earthsea", "Ursula K. Le Guin", "Fantasy", 399, 4, 8, "SFF"],
  ["Piranesi", "Susanna Clarke", "Fantasy", 499, 5, 25, "SFF"],
  ["The Ministry for the Future", "Kim Stanley Robinson", "Science Fiction", 699, 1, 5, "SFF"],
  ["The God of Small Things", "Arundhati Roy", "Literary Fiction", 450, 6, 400, "Indian writing"],
  ["A Suitable Boy", "Vikram Seth", "Literary Fiction", 999, 2, 380, "Indian writing"],
  ["Sea of Poppies", "Amitav Ghosh", "Historical Fiction", 550, 3, 10, "Indian writing"],
  ["The Hungry Tide", "Amitav Ghosh", "Literary Fiction", 499, 2, 260, "Indian writing"],
  ["Wolf Hall", "Hilary Mantel", "Historical Fiction", 650, 3, 220, "Fiction A–Z"],
  ["The Thursday Murder Club", "Richard Osman", "Mystery", 399, 8, 14, "Crime"],
  ["The Secret History", "Donna Tartt", "Mystery", 550, 4, 180, "Crime"],
  ["The Devotion of Suspect X", "Keigo Higashino", "Mystery", 399, 5, 3, "Crime"],
  ["Sapiens", "Yuval Noah Harari", "Non-fiction", 599, 9, 300, "Ideas"],
  ["The Emperor of All Maladies", "Siddhartha Mukherjee", "Non-fiction", 699, 2, 20, "Ideas"],
  ["Braiding Sweetgrass", "Robin Wall Kimmerer", "Non-fiction", 650, 3, 7, "Ideas"],
  ["Educated", "Tara Westover", "Memoir", 499, 4, 160, "Memoir"],
  ["Crying in H Mart", "Michelle Zauner", "Memoir", 550, 3, 35, "Memoir"],
  ["Tomorrow, and Tomorrow, and Tomorrow", "Gabrielle Zevin", "Literary Fiction", 599, 6, 2, "Front table"],
  ["Pachinko", "Min Jin Lee", "Historical Fiction", 599, 3, 140, "Fiction A–Z"],
  ["Klara and the Sun", "Kazuo Ishiguro", "Literary Fiction", 550, 0, 110, "Fiction A–Z"],
  ["Never Let Me Go", "Kazuo Ishiguro", "Literary Fiction", 450, 4, 21, "Fiction A–Z"],
];

const PRIZES: [string, string, number, string][] = [
  ["Orbital", "Booker Prize", 2024, "Winner"],
  ["Prophet Song", "Booker Prize", 2023, "Winner"],
  ["The Bee Sting", "Booker Prize", 2023, "Shortlist"],
  ["Tomb of Sand", "International Booker Prize", 2022, "Winner"],
  ["Fire Bird", "JCB Prize for Literature", 2023, "Winner"],
  ["Demon Copperhead", "Pulitzer Prize for Fiction", 2023, "Winner"],
  ["Brotherless Night", "Women's Prize for Fiction", 2024, "Winner"],
  ["Network Effect", "Hugo Award for Best Novel", 2021, "Winner"],
  ["Wolf Hall", "Booker Prize", 2009, "Winner"],
];

const MEMBERS = ["Aanya Kapoor", "Rohan Mehta", "Meera Iyer", "Kabir Sethi", "Ishita Rao", "Dev Malhotra", "Sana Qureshi", "Arjun Nair", "Priya Menon", "Vikram Joshi"];

const REVIEWS = [
  "Couldn't put it down. The last fifty pages wrecked me in the best way.",
  "Slow start, but the payoff is worth it. Perfect for a club discussion.",
  "Beautiful sentences. I kept stopping to reread paragraphs.",
  "Not for me — but I can see why people love it.",
  "The ending split our WhatsApp group in half. Great pick for debate.",
  "Gave this to my mother right after finishing it.",
];

/** Free-to-use Unsplash photos (unsplash.com/license) for demo events. Replace with the shop's own from the staff desk. */
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;
export const PHOTOS = {
  circle: u("1763896081109-ed6bf56ae955"),     // hands holding open books around a table
  browsing: u("1764173039117-e1ef87b26ec4"),   // two women looking at a book in a library
  shelves: u("1758796629109-4f38e9374f45"),    // bookshelves in a store
  tableTalk: u("1460518451285-97b6aa326961"),  // two people reading and writing at a table
  picking: u("1513475382585-d06e58bcb0e0"),    // picking a book from the shelf
  bookTable: u("1495446815901-a7297e633e8d"),  // books laid out on a table
  couch: u("1758876201359-1d04e01f572f"),      // woman reading on a couch, smiling
  armchair: u("1675179181234-aa537607528b"),   // woman reading in a chair
  coffee: u("1588666309990-d68f08e3d4a6"),     // open book, coffee and flowers
  glasses: u("1537495329792-41ae41ad3bf0"),    // glasses on a pile of books
  stack: u("1769963061311-293a72e5cffd"),      // stack of books, shelves behind
  holding: u("1506880018603-83d5b814b5a6"),    // hands holding a book
  openBooks: u("1457369804613-52c61a468e7d"),  // open books spread out
};

export async function loadDemo(db: DB) {
  for (const t of [S.rsvps, S.eventPhotos, S.events, S.votes, S.pitches, S.readingLogs, S.availability, S.prizes, S.books, S.members]) await db.delete(t);

  const books = await db.insert(S.books).values(BOOKS.map(([title, author, genre, price, stock, ago, shelf]) => (
    { title, author, genre, price, stock, shelf, arrivedAt: daysAgo(ago), description: `${title} by ${author}. Ask the staff for their take — it's one of our ${genre.toLowerCase()} favourites.` }))).returning();
  const byTitle = new Map(books.map((b) => [b.title, b]));
  await db.insert(S.prizes).values(PRIZES.map(([t, name, year, category]) => ({ bookId: byTitle.get(t)!.id, name, year, category })));

  const members = await db.insert(S.members).values([
    // The shared demo-mode account goes first so it gets reading history, votes and RSVPs too.
    { name: "Guest Reader", email: "guest@demo.local" },
    ...MEMBERS.map((name) => ({ name, email: name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com" })),
  ]).returning();

  // Availability: weekends are popular, so a clear "best date" emerges.
  const avail: (typeof S.availability.$inferInsert)[] = [];
  for (const m of members) {
    for (let d = 1; d <= 40; d++) {
      const dow = new Date(Date.now() + d * day).getUTCDay();
      const p = dow === 6 ? 0.75 : dow === 0 ? 0.55 : 0.18;
      if (Math.random() < p) avail.push({ memberId: m.id, day: dateOnly(d) });
    }
  }
  if (avail.length) await db.insert(S.availability).values(avail);

  // Reading logs with taste clusters so suggestions are meaningful.
  const logs: (typeof S.readingLogs.$inferInsert)[] = [];
  const tastes = [["Literary Fiction", "Historical Fiction"], ["Science Fiction", "Fantasy"], ["Mystery", "Literary Fiction"], ["Non-fiction", "Memoir"]];
  for (const [i, m] of members.entries()) {
    const likes = tastes[i % tastes.length];
    const pool = books.filter((b) => likes.includes(b.genre)).sort(() => Math.random() - 0.5).slice(0, 4);
    const other = books.filter((b) => !likes.includes(b.genre)).sort(() => Math.random() - 0.5).slice(0, 1);
    for (const [j, b] of [...pool, ...other].entries()) {
      const fav = likes.includes(b.genre);
      const status = j === 0 ? "READING" : j === 4 ? "WANT" : "FINISHED";
      const rating = status === "FINISHED" ? (fav ? 4 + Math.round(Math.random()) : 2 + Math.round(Math.random())) : null;
      logs.push({
          memberId: m.id, bookId: b.id, bookTitle: b.title, bookAuthor: b.author, genre: b.genre, status, rating,
          review: rating && Math.random() < 0.6 ? pick(REVIEWS) : null,
          createdAt: daysAgo(5 + Math.random() * 40), updatedAt: daysAgo(Math.random() * 28),
      });
    }
  }
  await db.insert(S.readingLogs).values(logs);

  // Pitches + votes
  const pitches = [
    ["The Covenant of Water", "Abraham Verghese", "Literary Fiction", "Three generations in Kerala, medicine, and a family secret about drowning. It's long, but it's the kind of book that gives a club two whole sessions of talk."],
    ["Project Hail Mary", "Andy Weir", "Science Fiction", "Proper science, a lot of humour, and a friendship I didn't see coming. A good palate cleanser after our last heavy read."],
    ["Piranesi", "Susanna Clarke", "Fantasy", "Short, strange and gorgeous. Everyone will come away with a different theory about the House — perfect for a debate."],
    ["The Emperor of All Maladies", "Siddhartha Mukherjee", "Non-fiction", "We haven't done non-fiction in months. This reads like a thriller and half of us have someone it touches."],
  ];
  for (const [k, [title, author, genre, reason]] of pitches.entries()) {
    const [p] = await db.insert(S.pitches).values({ title, author, genre, reason, memberId: members[k * 2 + 1].id, createdAt: daysAgo(2 + k * 3) }).returning();
    const vs = members.filter(() => Math.random() < 0.75 - k * 0.12).map((m) => ({ pitchId: p.id, memberId: m.id, value: Math.random() < 0.88 ? 1 : -1 }));
    if (vs.length) await db.insert(S.votes).values(vs);
  }
  await db.insert(S.pitches).values({ title: "Tomb of Sand", author: "Geetanjali Shree", genre: "Literary Fiction", status: "SELECTED", memberId: members[2].id, createdAt: daysAgo(25), reason: "An 80-year-old woman decides to cross the border and the prose does somersaults. Our first translated pick!" });

  // Events & sessions
  const at = (offsetDays: number, hour: number) => { const d = new Date(Date.now() + offsetDays * day); d.setUTCHours(hour - 6, 30, 0, 0); return d; };
  const upcoming = [
    { title: "Club night: Tomb of Sand, part one", kind: "SESSION" as const, imageUrl: PHOTOS.circle, startsAt: at(6, 18), capacity: 14, description: "Chapters 1–3. Chai and biscuits on us. Bring your favourite line." },
    { title: "Silent reading hour", kind: "SESSION" as const, imageUrl: PHOTOS.armchair, startsAt: at(10, 10), capacity: 20, description: "Phones away, bring any book. We read together for an hour, then talk for twenty minutes." },
    { title: "Translation workshop", kind: "SESSION" as const, imageUrl: PHOTOS.tableTalk, startsAt: at(17, 17), capacity: 10, description: "A hands-on hour on translating a short Hindi passage into English — no experience needed." },
    { title: "Author reading & signing", kind: "EVENT" as const, imageUrl: PHOTOS.browsing, startsAt: at(21, 18), capacity: null, description: "A local debut novelist reads from her new book, followed by Q&A and signing." },
  ];
  const created = await db.insert(S.events).values(upcoming).returning();
  const rs: (typeof S.rsvps.$inferInsert)[] = [];
  for (const ev of created.slice(0, 3)) for (const m of members) {
    const r = Math.random();
    if (r < 0.5) rs.push({ eventId: ev.id, memberId: m.id, status: "GOING" });
    else if (r < 0.7) rs.push({ eventId: ev.id, memberId: m.id, status: "INTERESTED" });
  }
  if (rs.length) await db.insert(S.rsvps).values(rs);

  const GALLERIES: [string, string][][] = [
    [[PHOTOS.coffee, "Chai, poems and rain on the window"], [PHOTOS.glasses, "Readers' picks on the poetry table"], [PHOTOS.couch, "A quiet corner between readings"], [PHOTOS.stack, ""]],
    [[PHOTOS.openBooks, "Annotated copies everywhere"], [PHOTOS.circle, "The great Klara debate"], [PHOTOS.tableTalk, "Notes for next month"], [PHOTOS.holding, ""]],
    [[PHOTOS.picking, "Choosing tonight's story"], [PHOTOS.bookTable, "The picture-book table"], [PHOTOS.armchair, "Story time"], [PHOTOS.shelves, ""]],
  ];
  const past = [
    { title: "Monsoon poetry evening", kind: "EVENT" as const, imageUrl: PHOTOS.coffee, startsAt: at(-12, 18), description: "Readings in Hindi, Urdu and English by the window." },
    { title: "Club night: Klara and the Sun", kind: "SESSION" as const, imageUrl: PHOTOS.openBooks, startsAt: at(-26, 18), capacity: 14, description: "Our last club read — the debate about Klara went well past closing time." },
    { title: "Kids' story hour", kind: "EVENT" as const, imageUrl: PHOTOS.picking, startsAt: at(-40, 11), description: "Picture books, puppets and a very enthusiastic crowd." },
  ];
  for (const [i, e] of past.entries()) {
    const [ev] = await db.insert(S.events).values(e).returning();
    await db.insert(S.eventPhotos).values(GALLERIES[i].map(([url, caption]) => ({ eventId: ev.id, url, caption })));
    await db.insert(S.rsvps).values(members.slice(0, 6 + i).map((m) => ({ eventId: ev.id, memberId: m.id, status: "GOING" as const })));
  }

  return { books: books.length, members: members.length, events: created.length + past.length };
}
