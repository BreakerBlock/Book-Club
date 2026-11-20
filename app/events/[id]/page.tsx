import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, events, eventPhotos } from "@/lib/db";
import { currentMember, isAdmin } from "@/lib/session";
import { RsvpBlock } from "@/components/RsvpButtons";
import { ActionForm, Submit } from "@/components/ActionForm";
import { addPhotos } from "@/lib/actions";
import { dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, admin, e] = await Promise.all([
    currentMember(),
    isAdmin(),
    db.query.events.findFirst({ where: eq(events.id, id), with: { photos: { orderBy: asc(eventPhotos.createdAt) }, rsvps: { with: { member: { columns: { name: true } } } } } }),
  ]);
  if (!e) notFound();
  const past = e.startsAt < new Date();
  return (
    <>
      <Link className="link small" href="/events">← All events</Link>
      <div className="head" style={{ marginTop: 12 }}>
        <div>
          <span className={`pill ${e.kind === "SESSION" ? "hot" : ""}`}>{e.kind === "SESSION" ? "Club session" : "Store event"}</span>
          <h1 style={{ marginTop: 10 }}>{e.title}</h1>
          <p>{dateTime(e.startsAt)} · {e.location}</p>
        </div>
      </div>
      <div className="split">
        <div>
          {e.description && <p style={{ whiteSpace: "pre-line" }}>{e.description}</p>}
          <h2 style={{ marginTop: 24 }}>Photos</h2>
          {e.photos.length === 0 && <p className="soft">{past ? "No photos yet." : "Photos go up after the event."}</p>}
          <div className="gallery">
            {e.photos.map((p) => (
              <figure key={p.id}>
                <a href={p.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption || e.title} loading="lazy" />
                </a>
                {p.caption && <figcaption>{p.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
        <aside className="stack">
          <div className="card"><h3>{past ? "Who came" : "RSVP"}</h3><RsvpBlock eventId={e.id} rsvps={e.rsvps} capacity={e.capacity} meId={me?.id} past={past} /></div>
          {admin && (
            <div className="card">
              <h3>Add photos</h3>
              <ActionForm action={addPhotos}>
                <input type="hidden" name="eventId" value={e.id} />
                <label>Photos<input name="files" type="file" accept="image/*" multiple /></label>
                <label>…or an image link<input name="url" type="url" placeholder="https://" /></label>
                <label>Caption<input name="caption" /></label>
                <Submit>Upload</Submit>
              </ActionForm>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
