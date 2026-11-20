import Link from "next/link";
import { and, asc, count, desc, eq, gte } from "drizzle-orm";
import { db, pitches, events, books, availability, members as membersT, readingLogs } from "@/lib/db";
import { currentMember } from "@/lib/session";
import { trending } from "@/lib/insights";
import { Cover } from "@/components/Cover";
import { Stars } from "@/components/ui";
import { dateTime, TZ } from "@/lib/format";
import { storeName } from "@/lib/settings";
import { PHOTOS } from "@/lib/demo";

export const dynamic = "force-dynamic";

const dDay = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: TZ });
const dMon = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: TZ });

export default async function Home() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const STORE_NAME = await storeName();
  const [me, pick, open, upcoming, arrivals, hot, bestDay, [{ members }], [{ reading }], covers] = await Promise.all([
    currentMember(),
    db.query.pitches.findFirst({ where: eq(pitches.status, "SELECTED"), orderBy: desc(pitches.createdAt), with: { member: true } }),
    db.query.pitches.findMany({ where: eq(pitches.status, "OPEN"), with: { votes: true } }),
    db.query.events.findMany({ where: gte(events.startsAt, now), orderBy: asc(events.startsAt), limit: 3, with: { rsvps: true } }),
    db.query.books.findMany({ orderBy: desc(books.arrivedAt), limit: 10 }),
    trending(6),
    db.select({ day: availability.day, n: count() }).from(availability).where(gte(availability.day, today))
      .groupBy(availability.day).orderBy(desc(count()), asc(availability.day)).limit(1),
    db.select({ members: count() }).from(membersT),
    db.select({ reading: count() }).from(readingLogs).where(eq(readingLogs.status, "READING")),
    db.select({ title: books.title, coverUrl: books.coverUrl }).from(books),
  ]);
  const coverOf = new Map(covers.map((c) => [c.title.toLowerCase(), c.coverUrl]));
  const leading = open.map((p) => ({ ...p, score: p.votes.reduce((s, v) => s + v.value, 0) })).sort((a, b) => b.score - a.score)[0];
  const nextSession = upcoming.find((e) => e.kind === "SESSION");
  const pickCover = pick ? (pick.coverUrl ?? coverOf.get(pick.title.toLowerCase())) : null;

  return (
    <>
      <div className="hero" style={{ backgroundImage: `url(${PHOTOS.shelves})` }}>
        <div className="hero-in">
          {pick ? (
            <div className="pick">
              <Cover title={pick.title} author={pick.author} url={pickCover} size="xl" />
              <div>
                <div className="eyebrow">This month the club is reading</div>
                <h1>{pick.title}</h1>
                <p>by {pick.author} · pitched by {pick.member.name}</p>
                {nextSession && <p>Next meet: <b style={{ color: "#fff" }}>{dateTime(nextSession.startsAt)}</b></p>}
                <div className="row" style={{ marginTop: 18 }}>
                  <Link className="btn" href="/sessions">RSVP for the next session</Link>
                  <Link className="btn light" href="/pitches">Pitch the next book</Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="pick">
              <div>
                <div className="eyebrow">Welcome to</div>
                <h1>{STORE_NAME} Book Club</h1>
                <p>Pitch the next read, vote, find a date that suits everyone, and keep a log of what you&rsquo;re reading.</p>
                {!me && <Link className="btn" href="/join">Join the club</Link>}
              </div>
            </div>
          )}
          <div className="tiles">
            <Link className="tile" href="/sessions">
              <span>Next session</span>
              <b>{nextSession ? `${nextSession.rsvps.filter((r) => r.status === "GOING").length} going` : "—"}</b>
              <span>{nextSession ? nextSession.title : "None scheduled"}</span>
            </Link>
            <Link className="tile" href="/availability">
              <span>Best upcoming date</span>
              <b>{bestDay[0] ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(bestDay[0].day + "T00:00:00Z")) : "—"}</b>
              <span>{bestDay[0] ? `${bestDay[0].n} of ${members} members free` : "Mark your free days"}</span>
            </Link>
            <Link className="tile" href="/pitches">
              <span>Leading pitch</span>
              <b>{leading ? `+${leading.score}` : "—"}</b>
              <span>{leading ? leading.title : "Be the first to pitch"}</span>
            </Link>
            <Link className="tile" href="/reading">
              <span>Reading right now</span>
              <b>{reading}</b>
              <span>across {members} members</span>
            </Link>
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <section>
          <div className="head"><h2>Coming up at the shop</h2><Link className="link" href="/events">All events</Link></div>
          <div className="grid fit">
            {upcoming.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="card ev lift">
                <div className="ev-img" style={e.imageUrl ? { backgroundImage: `url(${e.imageUrl})` } : undefined}>
                  <div className="when date-badge"><b>{dDay.format(e.startsAt)}</b><span>{dMon.format(e.startsAt)}</span></div>
                </div>
                <div className="ev-body">
                  <span className={`pill ${e.kind === "SESSION" ? "hot" : ""}`} style={{ alignSelf: "flex-start" }}>{e.kind === "SESSION" ? "Club session" : "Store event"}</span>
                  <h3>{e.title}</h3>
                  <span className="soft small">{dateTime(e.startsAt)} · {e.rsvps.filter((r) => r.status === "GOING").length} going</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
              <div className="card book lift" key={t.title} style={{ alignItems: "center" }}>
                <span className="rank">{i + 1}</span>
                <Cover title={t.title} author={t.author} url={coverOf.get(t.title.toLowerCase())} size="sm" />
                <div>
                  <b>{t.title}</b>
                  <div className="soft small">{t.author}</div>
                  <div className="row small" style={{ gap: 8 }}><span>{t.readers} reader{t.readers === 1 ? "" : "s"}</span><Stars n={t.avg} /></div>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="soft">Log what you&rsquo;re reading and this fills up.</p>}
      </section>
    </>
  );
}
