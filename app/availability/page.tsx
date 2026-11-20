import Link from "next/link";
import { and, count, gte, lte } from "drizzle-orm";
import { db, availability, members as membersT } from "@/lib/db";
import { currentMember } from "@/lib/session";
import { toggleDay } from "@/lib/actions";
import { JoinPrompt } from "@/components/Cover";
import { initials } from "@/lib/format";

export const metadata = { title: "Availability" };
export const dynamic = "force-dynamic";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fmtMonth = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const fmtDay = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });

export default async function Availability({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const todayIso = new Date().toISOString().slice(0, 10);
  const [y, mo] = (m && /^\d{4}-\d{2}$/.test(m) ? m : todayIso.slice(0, 7)).split("-").map(Number);
  const first = new Date(Date.UTC(y, mo - 1, 1));
  const last = new Date(Date.UTC(y, mo, 0));
  const prev = new Date(Date.UTC(y, mo - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7);

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [me, rows, [{ total }]] = await Promise.all([
    currentMember(),
    db.query.availability.findMany({
      where: and(gte(availability.day, iso(first)), lte(availability.day, iso(last))),
      with: { member: { columns: { id: true, name: true } } },
    }),
    db.select({ total: count() }).from(membersT),
  ]);

  const byDay = new Map<string, { id: string; name: string }[]>();
  for (const r of rows) {
    const k = r.day;
    byDay.set(k, [...(byDay.get(k) ?? []), r.member]);
  }
  const max = Math.max(1, ...[...byDay.values()].map((v) => v.length));
  const best = [...byDay.entries()]
    .filter(([d]) => d >= todayIso)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, 3);
  const bestSet = new Set(best.filter(([, v]) => v.length === best[0]?.[1].length).map(([d]) => d));

  const lead = (first.getUTCDay() + 6) % 7; // Monday-first
  const days = Array.from({ length: last.getUTCDate() }, (_, i) => new Date(Date.UTC(y, mo - 1, i + 1)).toISOString().slice(0, 10));
  const mineCount = me ? days.filter((d) => byDay.get(d)?.some((x) => x.id === me.id)).length : 0;

  return (
    <>
      <div className="head">
        <div>
          <h1>When can everyone meet?</h1>
          <p>Tap the days you&rsquo;re free. The darker the day, the more members can make it — the ringed day has the most.</p>
        </div>
      </div>

      <div className="split">
        <section className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <Link className="btn ghost small" href={`?m=${prev}`} aria-label="Previous month">←</Link>
            <h2 style={{ margin: 0 }}>{fmtMonth.format(first)}</h2>
            <Link className="btn ghost small" href={`?m=${next}`} aria-label="Next month">→</Link>
          </div>
          <div className="cal">
            {DOW.map((d) => <div key={d} className="dow">{d}</div>)}
            {Array.from({ length: lead }, (_, i) => <div key={"p" + i} className="day pad" />)}
            {days.map((d) => {
              const who = byDay.get(d) ?? [];
              const mine = !!me && who.some((x) => x.id === me.id);
              const past = d < todayIso;
              const frac = who.length / max;
              const cls = ["day", mine && "mine", past && "past", bestSet.has(d) && "best", frac > 0.8 && "high"].filter(Boolean).join(" ");
              return (
                <form key={d} className={cls} action={me && !past ? toggleDay.bind(null, d) : undefined}>
                  <button disabled={!me || past} title={who.map((x) => x.name).join(", ") || "Nobody yet"} aria-label={`${d}: ${who.length} free${mine ? ", including you" : ""}`} aria-pressed={mine}>
                    <span className="heat" style={{ height: `${frac * 100}%` }} />
                    <span className="n">{Number(d.slice(8))}</span>
                    <span className="cnt">{who.length || ""}</span>
                  </button>
                </form>
              );
            })}
          </div>
          <div className="legend">
            <span><i style={{ background: "var(--shelf)" }} />More members free</span>
            <span><i style={{ border: "2px solid var(--accent)" }} />Your days</span>
            <span><i style={{ boxShadow: "0 0 0 3px var(--accent)" }} />Best date</span>
          </div>
        </section>

        <aside className="stack">
          {!me && <JoinPrompt what="mark the days you're free" next="/availability" />}
          {me && <div className="card prompt"><b>You&rsquo;ve marked {mineCount} day{mineCount === 1 ? "" : "s"}</b> this month. Tap a day again to unmark it.</div>}
          <div className="card">
            <h3>Best dates coming up</h3>
            {best.length === 0 && <p className="soft">No one has marked a date in this month yet.</p>}
            {best.map(([d, who]) => (
              <div key={d} style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <b>{fmtDay.format(new Date(d + "T00:00:00Z"))}</b>
                  <span className="pill">{who.length} of {total}</span>
                </div>
                <div className="bar"><i style={{ width: `${(who.length / Math.max(total, 1)) * 100}%` }} /></div>
                <div className="row" style={{ marginTop: 8, gap: 4 }}>
                  {who.map((x) => <span key={x.id} className="avatar" title={x.name} style={{ width: 26, height: 26, fontSize: 11 }}>{initials(x.name)}</span>)}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
