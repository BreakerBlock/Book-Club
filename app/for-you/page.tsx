import { count, eq } from "drizzle-orm";
import { PHOTOS } from "@/lib/demo";
import { db, readingLogs } from "@/lib/db";
import { currentMember } from "@/lib/session";
import { suggestFor } from "@/lib/insights";
import { Cover } from "@/components/Cover";
import { JoinPrompt, PageHead } from "@/components/ui";
import { money } from "@/lib/format";

export const metadata = { title: "Suggested for you" };
export const dynamic = "force-dynamic";

export default async function ForYou() {
  const me = await currentMember();
  const [picks, logged] = await Promise.all([
    suggestFor(me?.id ?? null, 12),
    me ? db.select({ n: count() }).from(readingLogs).where(eq(readingLogs.memberId, me.id)).then((r) => r[0].n) : 0,
  ]);
  const personal = !!me && logged > 0;
  return (
    <>
      <PageHead image={PHOTOS.couch}
        title={personal ? `Picked for ${me!.name.split(" ")[0]}` : "Club favourites to start with"}
        sub={personal
          ? "Based on what you’ve read and rated, what members with similar taste loved, and what’s on our shelves right now."
          : "Log a few books you’ve read and these turn into personal picks — matched on genres, authors and readers with taste like yours."}>
        {me && <a className="btn" href="/reading">Log a book</a>}
      </PageHead>
      {!me && <div style={{ marginBottom: 18 }}><JoinPrompt what="get suggestions based on your reading" next="/for-you" /></div>}
      {picks.length === 0 && <p className="soft">No suggestions yet — once members rate a few books, picks appear here.</p>}
      <div className="grid">
        {picks.map(({ book, reasons }) => (
          <article key={book.id} className="card book">
            <Cover title={book.title} author={book.author} url={book.coverUrl} />
            <div>
              <span className="pill">{book.genre}</span>
              <h3 style={{ marginTop: 8 }}>{book.title}</h3>
              <div className="soft small">{book.author} · {money(book.price)}{book.shelf ? ` · ${book.shelf}` : ""}</div>
              <ul className="small" style={{ paddingLeft: 18, margin: "8px 0 0" }}>
                {reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
