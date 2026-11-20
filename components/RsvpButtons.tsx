import { rsvp } from "@/lib/actions";
import { initials } from "@/lib/format";

type R = { status: "GOING" | "INTERESTED"; memberId: string; member: { name: string } };

export function RsvpBlock({ eventId, rsvps, capacity, meId, past }: { eventId: string; rsvps: R[]; capacity: number | null; meId?: string; past: boolean }) {
  const going = rsvps.filter((r) => r.status === "GOING");
  const interested = rsvps.filter((r) => r.status === "INTERESTED");
  const mine = rsvps.find((r) => r.memberId === meId)?.status;
  const full = !!capacity && going.length >= capacity && mine !== "GOING";
  return (
    <div className="stack">
      <div className="row small">
        <b>{going.length} going</b>
        {capacity && <span className="soft">· {Math.max(0, capacity - going.length)} of {capacity} seats left</span>}
        <span className="soft">· {interested.length} interested</span>
      </div>
      {capacity && <div className="bar"><i style={{ width: `${Math.min(100, (going.length / capacity) * 100)}%` }} /></div>}
      {going.length > 0 && (
        <div className="row" style={{ gap: 4 }}>
          {going.map((r) => <span key={r.memberId} className="avatar" title={r.member.name} style={{ width: 28, height: 28, fontSize: 11 }}>{initials(r.member.name)}</span>)}
        </div>
      )}
      {!past && meId && (
        <div className="row">
          <form className="inline" action={rsvp.bind(null, eventId, "GOING")}>
            <button className={`btn small ${mine === "GOING" ? "" : "ghost"}`} disabled={full} aria-pressed={mine === "GOING"}>{full ? "Full" : mine === "GOING" ? "✓ Going" : "I'm going"}</button>
          </form>
          <form className="inline" action={rsvp.bind(null, eventId, "INTERESTED")}>
            <button className={`btn small ${mine === "INTERESTED" ? "quiet" : "ghost"}`} aria-pressed={mine === "INTERESTED"}>{mine === "INTERESTED" ? "✓ Interested" : "Interested"}</button>
          </form>
        </div>
      )}
      {!past && !meId && <a className="link small" href={`/join?next=/sessions`}>Join the club to RSVP</a>}
    </div>
  );
}
