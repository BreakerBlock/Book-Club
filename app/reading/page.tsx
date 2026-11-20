import { asc, count, desc, eq, isNotNull } from "drizzle-orm";
import { PHOTOS } from "@/lib/demo";
import { db, readingLogs, books as booksT } from "@/lib/db";
import { currentMember } from "@/lib/session";
import { logReading, deleteLog } from "@/lib/actions";
import { ActionForm, Submit } from "@/components/ActionForm";
import { Cover } from "@/components/Cover";
import { Stars, JoinPrompt, PageHead } from "@/components/ui";
import { ago, initials } from "@/lib/format";

export const metadata = { title: "Reading log & reviews" };
export const dynamic = "force-dynamic";

const LABEL = { WANT: "wants to read", READING: "is reading", FINISHED: "finished" } as const;

export default async function Reading({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "all" } = await searchParams;
  const me = await currentMember();
  const where =
    tab === "reviews" ? isNotNull(readingLogs.review) :
    tab === "mine" && me ? eq(readingLogs.memberId, me.id) :
    tab === "now" ? eq(readingLogs.status, "READING") : undefined;
  const [feed, books, [{ nowCount }]] = await Promise.all([
    db.query.readingLogs.findMany({ where, orderBy: desc(readingLogs.updatedAt), limit: 60, with: { member: { columns: { name: true } }, book: { columns: { coverUrl: true } } } }),
    db.select({ id: booksT.id, title: booksT.title, author: booksT.author }).from(booksT).orderBy(asc(booksT.title)),
    db.select({ nowCount: count() }).from(readingLogs).where(eq(readingLogs.status, "READING")),
  ]);
  const tabs = [["all", "Everything"], ["now", `Reading now (${nowCount})`], ["reviews", "Reviews"], ...(me ? [["mine", "My shelf"]] : [])];

  return (
    <>
      <PageHead image={PHOTOS.armchair} title="What the club is reading" sub="Log what you’re on, what you finished and what you thought. Ratings power everyone’s suggestions." />
      <div className="split">
        <section>
          <div className="row" style={{ marginBottom: 8 }}>
            {tabs.map(([k, l]) => <a key={k} href={`/reading?tab=${k}`} className={`btn small ${tab === k ? "quiet" : "ghost"}`}>{l}</a>)}
          </div>
          {feed.length === 0 && <p className="soft">Nothing here yet.</p>}
          {feed.map((l) => (
            <article key={l.id} className="feed-item">
              <Cover title={l.bookTitle} author={l.bookAuthor} url={l.book?.coverUrl} size="sm" />
              <div>
                <div className="row small" style={{ gap: 8 }}>
                  <span className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{initials(l.member.name)}</span>
                  <span><b>{l.member.name}</b> {LABEL[l.status]}</span>
                  <span className="soft">{ago(l.updatedAt)}</span>
                </div>
                <h3 style={{ margin: "6px 0 2px" }}>{l.bookTitle}</h3>
                <div className="row small"><span className="soft">{l.bookAuthor}{l.genre ? ` · ${l.genre}` : ""}</span><Stars n={l.rating} /></div>
                {l.review && <blockquote>{l.review}</blockquote>}
                {me?.id === l.memberId && <form action={deleteLog.bind(null, l.id)} className="inline"><button className="link small">Remove</button></form>}
              </div>
            </article>
          ))}
        </section>

        <aside>
          {me ? (
            <section className="card">
              <h2>Log a book</h2>
              <ActionForm action={logReading}>
                <label>From our shelves<select name="bookId" defaultValue=""><option value="">— not from the store —</option>{books.map((b) => <option key={b.id} value={b.id}>{b.title} — {b.author}</option>)}</select></label>
                <p className="soft small" style={{ margin: 0 }}>Not from the store? Type it in:</p>
                <div className="two">
                  <label>Title<input name="title" /></label>
                  <label>Author<input name="author" /></label>
                </div>
                <div className="two">
                  <label>Status<select name="status" defaultValue="READING"><option value="READING">Reading</option><option value="FINISHED">Finished</option><option value="WANT">Want to read</option></select></label>
                  <label>Rating<select name="rating" defaultValue=""><option value="">No rating</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select></label>
                </div>
                <label>Genre <span className="soft small">(if not from the store)</span><input name="genre" /></label>
                <label>Review<textarea name="review" placeholder="Optional — what stayed with you?" /></label>
                <Submit>Save to my log</Submit>
              </ActionForm>
            </section>
          ) : <JoinPrompt what="log your reading and post reviews" next="/reading" />}
        </aside>
      </div>
    </>
  );
}
