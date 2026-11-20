import Link from "next/link";
import { and, asc, count, desc, eq, gte } from "drizzle-orm";
import { db, pitches, events, books, availability, members as membersT, readingLogs } from "@/lib/db";
import { currentMember } from "@/lib/session";
import { trending } from "@/lib/insights";
import { Cover } from "@/components/Cover";
import { STORE_NAME, dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const [me, pick, topPitch, nextSession, arrivals, hot, bestDay, [{ members }], [{ reading }]] = await Promise.all([
    currentMember(),
    db.query.pitches.findFirst({ where: eq(pitches.status, "SELECTED"), orderBy: desc(pitches.createdAt), with: { member: true } }),
    db.query.pitches.findMany({ where: eq(pitches.status, "OPEN"), with: { votes: true } }),
    db.query.events.findFirst({ where: and(eq(events.kind, "SESSION"), gte(events.startsAt, now)), orderBy: asc(events.startsAt), with: { rsvps: true } }),
    db.query.books.findMany({ orderBy: desc(books.arrivedAt), limit: 8 }),
    trending(5),
    db.select({ day: availability.day, n: count() }).from(availability).where(gte(availability.day, today))
      .groupBy(availability.day).orderBy(desc(count()), asc(availability.day)).limit(1),
    db.select({ members: count() }).from(membersT),
    db.select({ reading: count() }).from(readingLogs).where(eq(readingLogs.status, "READING")),
  ]);
  const leading = topPitch
    .map((p) => ({ ...p, score: p.votes.reduce((s, v) => s + v.value, 0) }))
    .sort((a, b) => b.score - a.score)[0];

  return (
    <>
      <div className="hero">
        <div className="hero-pick">
          {pick ? (
            <>
              <Cover title={pick.title} author={pick.author} size="lg" />
              <div>
                <p className="soft small">This month the club is reading</p>
                <h1 style={{ color: "#fff" }}>{pick.title}</h1>
                <p>by {pick.author}</p>
                <p className="soft small">Pitched by {pick.member.name}</p>
                {nextSession && <p className="small">Next meet: <b>{dateTime(nextSession.startsAt)}</b></p>}
              </div>
            </>
          ) : (
            <div>
              <p className="soft small">Welcome to</p>
              <h1 style={{ color: "#fff" }}>{STORE_NAME} Book Club</h1>
              <p>Pitch the next read, vote, find a date that suits everyone, and keep a log of what you&rsquo;re reading.</p>
              {!me && <Link className="btn" href="/join">Join the club</Link>}
            </div>
          )}
        </div>
        <div className="tiles">
          <Link className="tile" href="/sessions">
            <span>Next session</span>
            <b>{nextSession ? `${nextSession.rsvps.filter((r) => r.status === "GOING").length} going` : "—"}</b>
            <span>{nextSession ? nextSession.title : "None scheduled"}</span>
          </Link>
          <Link className="tile" href="/availability">
            <span>Best upcoming date</span>
            <b>{bestDay[0] ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(bestDay[0].day + "T00:00:00Z")) : "—"}</b>
            <span>{bestDay[0] ? `${bestDay[0].n} of ${members} free` : "Mark your free days"}</span>
          </Link>
          <Link className="tile" href="/pitches">
            <span>Leading pitch</span>
            <b>{leading ? `+${leading.score}` : "—"}</b>
            <span>{leading ? leading.title : "Be the first to pitch"}</span>
          </Link>
          <Link className="tile" href="/reading">
            <span>Reading right now</span>
            <b>{reading}</b>
            <span>{members} members</span>
          </Link>
        </div>
      </div>

      <section>
        <div className="head"><h2>New on the shelves</h2><Link className="link" href="/new-arrivals">All new arrivals</Link></div>
        <div className="shelf">
          {arrivals.map((b) => (
            <Link className="item" key={b.id} href={`/inventory?q=${encodeURIComponent(b.title)}`}>
              <Cover title={b.title} author={b.author} url={b.coverUrl} />
              <b>{b.title}</b><span>{b.author}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="head"><h2>Trending in the club</h2><Link className="link" href="/trending">Trending &amp; prizes</Link></div>
        {hot.length ? (
          <div className="grid">
            {hot.map((t, i) => (
              <div className="card row" key={t.title} style={{ flexWrap: "nowrap" }}>
                <span className="rank">{i + 1}</span>
                <div><b>{t.title}</b><div className="soft small">{t.author} · {t.readers} reader{t.readers === 1 ? "" : "s"}</div></div>
              </div>
            ))}
          </div>
        ) : <p className="soft">Log what you&rsquo;re reading and this fills up.</p>}
      </section>
    </>
  );
}
