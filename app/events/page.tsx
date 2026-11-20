import Link from "next/link";
import { PageHead } from "@/components/ui";
import { PHOTOS } from "@/lib/demo";
import { asc, desc, gte, lt } from "drizzle-orm";
import { db, events, eventPhotos } from "@/lib/db";
import { dateTime, TZ } from "@/lib/format";

const dDay = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: TZ });
const dMon = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: TZ });

export const metadata = { title: "Events & photos" };
export const dynamic = "force-dynamic";

export default async function Events() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.query.events.findMany({ where: gte(events.startsAt, now), orderBy: asc(events.startsAt), limit: 6 }),
    db.query.events.findMany({ where: lt(events.startsAt, now), orderBy: desc(events.startsAt), with: { photos: { orderBy: asc(eventPhotos.createdAt), columns: { url: true } } } }),
  ]);
  return (
    <>
      <PageHead image={PHOTOS.circle} title="Events at the store" sub="Launches, readings, club nights — and the photos from the ones you missed.">
        <Link className="btn" href="/sessions">RSVP to what’s next</Link>
      </PageHead>

      {upcoming.length > 0 && (
        <section>
          <h2>Coming up</h2>
          <div className="grid fit">
            {upcoming.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="card ev lift">
                <div className="ev-img" style={e.imageUrl ? { backgroundImage: `url(${e.imageUrl})` } : undefined}>
                  <div className="when date-badge"><b>{dDay.format(e.startsAt)}</b><span>{dMon.format(e.startsAt)}</span></div>
                </div>
                <div className="ev-body">
                  <span className={`pill ${e.kind === "SESSION" ? "hot" : ""}`} style={{ alignSelf: "flex-start" }}>{e.kind === "SESSION" ? "Club session" : "Store event"}</span>
                  <h3>{e.title}</h3>
                  <span className="soft small">{dateTime(e.startsAt)} · {e.location}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Past events</h2>
        {past.length === 0 && <p className="soft">No past events yet.</p>}
        <div className="grid">
          {past.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} className="card ev lift">
              <div className="ev-img" style={(e.imageUrl ?? e.photos[0]?.url) ? { backgroundImage: `url(${e.imageUrl ?? e.photos[0].url})` } : undefined}>
                {e.photos.length > 0 && <span className="when pill gold">{e.photos.length} photo{e.photos.length === 1 ? "" : "s"}</span>}
              </div>
              <div className="ev-body">
                <h3>{e.title}</h3>
                <span className="soft small">{dateTime(e.startsAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
