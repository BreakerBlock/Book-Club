import { desc, eq, ne } from "drizzle-orm";
import { db, pitches as pitchesT } from "@/lib/db";
import { currentMember, isAdmin } from "@/lib/session";
import { createPitch, vote, setPitchStatus, deletePitch } from "@/lib/actions";
import { ActionForm, Submit } from "@/components/ActionForm";
import { Cover, JoinPrompt } from "@/components/Cover";
import { ago } from "@/lib/format";

export const metadata = { title: "Book pitches" };
export const dynamic = "force-dynamic";

export default async function Pitches({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const [me, admin, pitches] = await Promise.all([
    currentMember(),
    isAdmin(),
    db.query.pitches.findMany({
      where: show === "past" ? ne(pitchesT.status, "OPEN") : eq(pitchesT.status, "OPEN"),
      with: { member: true, votes: true },
      orderBy: desc(pitchesT.createdAt),
    }),
  ]);
  const ranked = pitches
    .map((p) => ({ ...p, score: p.votes.reduce((s, v) => s + v.value, 0), up: p.votes.filter((v) => v.value > 0).length, mine: p.votes.find((v) => v.memberId === me?.id)?.value ?? 0 }))
    .sort((a, b) => (show === "past" ? 0 : b.score - a.score));

  return (
    <>
      <div className="head">
        <div>
          <h1>Pitch the next book</h1>
          <p>Make your case in a few lines, then vote on everyone else&rsquo;s. The store picks the club read from the top of the board.</p>
        </div>
        <div className="row">
          <a className={`btn small ${show === "past" ? "ghost" : "quiet"}`} href="/pitches">Open pitches</a>
          <a className={`btn small ${show === "past" ? "quiet" : "ghost"}`} href="/pitches?show=past">Picked &amp; past</a>
        </div>
      </div>

      <div className="split">
        <div className="stack">
          {ranked.length === 0 && <p className="soft">No pitches here yet.</p>}
          {ranked.map((p, i) => (
            <article key={p.id} className={`card pitch ${p.status === "SELECTED" ? "selected" : ""}`}>
              <div className="votes">
                {me && p.status === "OPEN" ? (
                  <>
                    <form action={vote.bind(null, p.id, 1)}><button className={p.mine > 0 ? "on" : ""} aria-label="Vote up" aria-pressed={p.mine > 0}>▲</button></form>
                    <b>{p.score}</b>
                    <form action={vote.bind(null, p.id, -1)}><button className={p.mine < 0 ? "on" : ""} aria-label="Vote down" aria-pressed={p.mine < 0}>▼</button></form>
                  </>
                ) : <b>{p.score}</b>}
                <span className="soft small">votes</span>
              </div>
              <div>
                <div className="book">
                  <Cover title={p.title} author={p.author} size="sm" />
                  <div>
                    <div className="row" style={{ gap: 6 }}>
                      {show !== "past" && i === 0 && p.score > 0 && <span className="pill hot">Leading</span>}
                      {p.status === "SELECTED" && <span className="pill hot">Club pick</span>}
                      {p.genre && <span className="pill">{p.genre}</span>}
                    </div>
                    <h3 style={{ marginTop: 6 }}>{p.title}</h3>
                    <div className="soft small">{p.author} · pitched by {p.member.name} · {ago(p.createdAt)} · {p.up} up</div>
                  </div>
                </div>
                <p style={{ marginTop: 12, whiteSpace: "pre-line" }}>{p.reason}</p>
                <div className="row small">
                  {admin && p.status !== "SELECTED" && <form className="inline" action={setPitchStatus.bind(null, p.id, "SELECTED")}><button className="btn small">Make club pick</button></form>}
                  {admin && p.status !== "OPEN" && <form className="inline" action={setPitchStatus.bind(null, p.id, "OPEN")}><button className="link">Reopen</button></form>}
                  {admin && p.status === "OPEN" && <form className="inline" action={setPitchStatus.bind(null, p.id, "ARCHIVED")}><button className="link">Archive</button></form>}
                  {(admin || p.memberId === me?.id) && <form className="inline" action={deletePitch.bind(null, p.id)}><button className="link">Delete</button></form>}
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside>
          {me ? (
            <section className="card">
              <h2>Your pitch</h2>
              <ActionForm action={createPitch}>
                <label>Book title<input name="title" required /></label>
                <div className="two">
                  <label>Author<input name="author" required /></label>
                  <label>Genre<input name="genre" placeholder="optional" /></label>
                </div>
                <label>Why should we read it?<textarea name="reason" required minLength={20} placeholder="What hooked you, and what would we talk about?" /></label>
                <Submit>Post pitch</Submit>
              </ActionForm>
            </section>
          ) : <JoinPrompt what="pitch a book and vote" next="/pitches" />}
        </aside>
      </div>
    </>
  );
}
