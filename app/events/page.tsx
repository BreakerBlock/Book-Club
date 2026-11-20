import Link from "next/link";
import { asc, desc, gte, lt } from "drizzle-orm";
import { db, events, eventPhotos } from "@/lib/db";
import { dateTime } from "@/lib/format";

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
      <div className="head">
        <div><h1>Events at the store</h1><p>Launches, readings, club nights — and the photos from the ones you missed.</p></div>
        <Link className="btn ghost small" href="/sessions">RSVP to what&rsquo;s next</Link>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2>Coming up</h2>
          <div className="grid">
            {upcoming.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="card" style={{ textDecoration: "none" }}>
                <span className="pill">{dateTime(e.startsAt)}</span>
                <h3 style={{ marginTop: 10 }}>{e.title}</h3>
                <div className="soft small">{e.location}</div>
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
            <Link key={e.id} href={`/events/${e.id}`} className="card" style={{ textDecoration: "none" }}>
              {e.photos[0]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className="ev-thumb" src={e.photos[0].url} alt="" loading="lazy" />
                : <div className="ev-thumb" />}
              <h3>{e.title}</h3>
              <div className="soft small">{dateTime(e.startsAt)} · {e.photos.length} photo{e.photos.length === 1 ? "" : "s"}</div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
