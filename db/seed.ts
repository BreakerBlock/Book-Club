/**
 * Sample data so the site looks alive in a demo.
 * Run once:  npm run db:seed      (wipes existing club data first!)
 * Members, pitches, logs, events and photos are invented; book titles and prize results are real.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as S from "../lib/schema";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
const db = drizzle(pool, { schema: S });
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

/** A simple illustrated placeholder photo as an SVG data URI (replace with real photos via the staff desk). */
function scene(seed: number, label: string) {
  const c = ["#1f3d3b", "#7a2e3a", "#3d4a7a", "#8a5a1f", "#2e5a3a"][seed % 5];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${c}"/><rect y="200" width="400" height="100" fill="#000" opacity=".25"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${20 + i * 26}" y="${60 + ((i * 37 + seed * 11) % 50)}" width="20" height="${140 - ((i * 37 + seed * 11) % 50)}" rx="2" fill="#fff" opacity="${0.15 + ((i + seed) % 4) * 0.12}"/>`).join("")}<circle cx="${90 + seed * 40}" cy="230" r="26" fill="#f5d7b8"/><circle cx="${210 + seed * 15}" cy="236" r="24" fill="#e7b98f"/><circle cx="${310 - seed * 10}" cy="232" r="25" fill="#c88b62"/><text x="20" y="285" font-family="Georgia" font-size="16" fill="#fff">${label}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

async function main() {
  for (const t of [S.rsvps, S.eventPhotos, S.events, S.votes, S.pitches, S.readingLogs, S.availability, S.prizes, S.books, S.members]) await db.delete(t);

  const books = await db.insert(S.books).values(BOOKS.map(([title, author, genre, price, stock, ago, shelf]) => (
    { title, author, genre, price, stock, shelf, arrivedAt: daysAgo(ago), description: `${title} by ${author}. Ask the staff for their take — it's one of our ${genre.toLowerCase()} favourites.` }))).returning();
  const byTitle = new Map(books.map((b) => [b.title, b]));
  await db.insert(S.prizes).values(PRIZES.map(([t, name, year, category]) => ({ bookId: byTitle.get(t)!.id, name, year, category })));

  const members = await db.insert(S.members).values(MEMBERS.map((name) =>
    ({ name, email: name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com" }))).returning();

  // Availability: weekends are popular, so a clear "best date" emerges.
  for (const m of members) {
    for (let d = 1; d <= 40; d++) {
      const dow = new Date(Date.now() + d * day).getUTCDay();
      const p = dow === 6 ? 0.75 : dow === 0 ? 0.55 : 0.18;
      if (Math.random() < p) await db.insert(S.availability).values({ memberId: m.id, day: dateOnly(d) });
    }
  }

  // Reading logs with taste clusters so suggestions are meaningful.
  const tastes = [["Literary Fiction", "Historical Fiction"], ["Science Fiction", "Fantasy"], ["Mystery", "Literary Fiction"], ["Non-fiction", "Memoir"]];
  for (const [i, m] of members.entries()) {
    const likes = tastes[i % tastes.length];
    const pool = books.filter((b) => likes.includes(b.genre)).sort(() => Math.random() - 0.5).slice(0, 4);
    const other = books.filter((b) => !likes.includes(b.genre)).sort(() => Math.random() - 0.5).slice(0, 1);
    for (const [j, b] of [...pool, ...other].entries()) {
      const fav = likes.includes(b.genre);
      const status = j === 0 ? "READING" : j === 4 ? "WANT" : "FINISHED";
      const rating = status === "FINISHED" ? (fav ? 4 + Math.round(Math.random()) : 2 + Math.round(Math.random())) : null;
      await db.insert(S.readingLogs).values({
          memberId: m.id, bookId: b.id, bookTitle: b.title, bookAuthor: b.author, genre: b.genre, status, rating,
          review: rating && Math.random() < 0.6 ? pick(REVIEWS) : null,
          createdAt: daysAgo(5 + Math.random() * 40), updatedAt: daysAgo(Math.random() * 28),
      });
    }
  }

  // Pitches + votes
  const pitches = [
    ["The Covenant of Water", "Abraham Verghese", "Literary Fiction", "Three generations in Kerala, medicine, and a family secret about drowning. It's long, but it's the kind of book that gives a club two whole sessions of talk."],
    ["Project Hail Mary", "Andy Weir", "Science Fiction", "Proper science, a lot of humour, and a friendship I didn't see coming. A good palate cleanser after our last heavy read."],
    ["Piranesi", "Susanna Clarke", "Fantasy", "Short, strange and gorgeous. Everyone will come away with a different theory about the House — perfect for a debate."],
    ["The Emperor of All Maladies", "Siddhartha Mukherjee", "Non-fiction", "We haven't done non-fiction in months. This reads like a thriller and half of us have someone it touches."],
  ];
  for (const [k, [title, author, genre, reason]] of pitches.entries()) {
    const [p] = await db.insert(S.pitches).values({ title, author, genre, reason, memberId: members[k * 2].id, createdAt: daysAgo(2 + k * 3) }).returning();
    for (const m of members) if (Math.random() < 0.75 - k * 0.12) await db.insert(S.votes).values({ pitchId: p.id, memberId: m.id, value: Math.random() < 0.88 ? 1 : -1 });
  }
  await db.insert(S.pitches).values({ title: "Tomb of Sand", author: "Geetanjali Shree", genre: "Literary Fiction", status: "SELECTED", memberId: members[1].id, createdAt: daysAgo(25), reason: "An 80-year-old woman decides to cross the border and the prose does somersaults. Our first translated pick!" });

  // Events & sessions
  const at = (offsetDays: number, hour: number) => { const d = new Date(Date.now() + offsetDays * day); d.setUTCHours(hour - 6, 30, 0, 0); return d; };
  const upcoming = [
    { title: "Club night: Tomb of Sand, part one", kind: "SESSION" as const, startsAt: at(6, 18), capacity: 14, description: "Chapters 1–3. Chai and biscuits on us. Bring your favourite line." },
    { title: "Silent reading hour", kind: "SESSION" as const, startsAt: at(10, 10), capacity: 20, description: "Phones away, bring any book. We read together for an hour, then talk for twenty minutes." },
    { title: "Translation workshop", kind: "SESSION" as const, startsAt: at(17, 17), capacity: 10, description: "A hands-on hour on translating a short Hindi passage into English — no experience needed." },
    { title: "Author reading & signing", kind: "EVENT" as const, startsAt: at(21, 18), capacity: null, description: "A local debut novelist reads from her new book, followed by Q&A and signing." },
  ];
  const created = await db.insert(S.events).values(upcoming).returning();
  for (const ev of created.slice(0, 3)) for (const m of members) {
    const r = Math.random();
    if (r < 0.5) await db.insert(S.rsvps).values({ eventId: ev.id, memberId: m.id, status: "GOING" });
    else if (r < 0.7) await db.insert(S.rsvps).values({ eventId: ev.id, memberId: m.id, status: "INTERESTED" });
  }

  const past = [
    { title: "Monsoon poetry evening", kind: "EVENT" as const, startsAt: at(-12, 18), description: "Readings in Hindi, Urdu and English by the window." },
    { title: "Club night: Klara and the Sun", kind: "SESSION" as const, startsAt: at(-26, 18), capacity: 14, description: "Our last club read — the debate about Klara went well past closing time." },
    { title: "Kids' story hour", kind: "EVENT" as const, startsAt: at(-40, 11), description: "Picture books, puppets and a very enthusiastic crowd." },
  ];
  for (const [i, e] of past.entries()) {
    const [ev] = await db.insert(S.events).values(e).returning();
    await db.insert(S.eventPhotos).values(Array.from({ length: 4 }, (_, k) => ({ eventId: ev.id, url: scene(i + k, e.title), caption: k === 0 ? "Sample photo — replace from the staff desk" : "" })));
    await db.insert(S.rsvps).values(members.slice(0, 6 + i).map((m) => ({ eventId: ev.id, memberId: m.id, status: "GOING" as const })));
  }

  console.log(`Seeded ${books.length} books, ${members.length} members, ${created.length + past.length} events.`);
}

main().finally(() => pool.end());
