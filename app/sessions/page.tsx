import Link from "next/link";
import { PageHead } from "@/components/ui";
import { PHOTOS } from "@/lib/demo";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { db, events } from "@/lib/db";
import { currentMember } from "@/lib/session";
import { RsvpBlock } from "@/components/RsvpButtons";
import { dateTime, TZ } from "@/lib/format";

export const metadata = { title: "Sessions & RSVP" };
export const dynamic = "force-dynamic";

const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: TZ });
const mon = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: TZ });

export default async function Sessions() {
  const now = new Date();
  const [me, upcoming, past] = await Promise.all([
    currentMember(),
    db.query.events.findMany({ where: gte(events.startsAt, now), orderBy: asc(events.startsAt), with: { rsvps: { with: { member: { columns: { name: true } } } } } }),
    db.query.events.findMany({ where: and(eq(events.kind, "SESSION"), lt(events.startsAt, now)), orderBy: desc(events.startsAt), limit: 6, with: { rsvps: { columns: { status: true } } } }),
  ]);
  const myCount = me ? upcoming.filter((e) => e.rsvps.some((r) => r.memberId === me.id)).length : 0;

  return (
    <>
      <PageHead image={PHOTOS.holding} title="Sessions & RSVP" sub="Say you’re going to save a seat, or mark “interested” so we know which sessions to run more of.">
        {me && <span className="pill gold">You’re on {myCount} upcoming</span>}
      </PageHead>

      <div className="stack">
        {upcoming.length === 0 && <p className="soft">Nothing scheduled yet — check back soon.</p>}
        {upcoming.map((e) => (
          <article key={e.id} className="card session">
            <div className="ev-img" style={e.imageUrl ? { backgroundImage: `url(${e.imageUrl})` } : undefined}>
              <div className="when date-badge"><b>{day.format(e.startsAt)}</b><span>{mon.format(e.startsAt)}</span></div>
            </div>
            <div className="ev-body">
              <div className="row" style={{ gap: 6 }}>
                <span className={`pill ${e.kind === "SESSION" ? "hot" : ""}`}>{e.kind === "SESSION" ? "Club session" : "Store event"}</span>
                <span className="soft small">{dateTime(e.startsAt)} · {e.location}</span>
              </div>
              <h3><Link href={`/events/${e.id}`} style={{ textDecoration: "none" }}>{e.title}</Link></h3>
              {e.description && <p className="small">{e.description}</p>}
              <RsvpBlock eventId={e.id} rsvps={e.rsvps} capacity={e.capacity} meId={me?.id} past={false} />
            </div>
          </article>
        ))}
      </div>

      {past.length > 0 && (
        <section>
          <h2>Past sessions</h2>
          <div className="grid">
            {past.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="card ev lift">
                <div className="ev-img" style={e.imageUrl ? { backgroundImage: `url(${e.imageUrl})` } : undefined} />
                <div className="ev-body">
                  <b>{e.title}</b>
                  <span className="soft small">{dateTime(e.startsAt)} · {e.rsvps.filter((r) => r.status === "GOING").length} attended</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
