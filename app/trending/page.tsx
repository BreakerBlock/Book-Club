import { asc, desc } from "drizzle-orm";
import { db, prizes as prizesT } from "@/lib/db";
import { trending } from "@/lib/insights";
import { Cover, Stars } from "@/components/Cover";
import { money } from "@/lib/format";

export const metadata = { title: "Trending & prizes" };
export const dynamic = "force-dynamic";

export default async function Trending() {
  const [hot, prizes] = await Promise.all([
    trending(10),
    db.query.prizes.findMany({ orderBy: [desc(prizesT.year), asc(prizesT.name)], with: { book: true } }),
  ]);
  const top = hot[0]?.score ?? 1;
  const byPrize = new Map<string, typeof prizes>();
  for (const p of prizes) byPrize.set(p.name, [...(byPrize.get(p.name) ?? []), p]);

  return (
    <>
      <div className="head">
        <div><h1>Trending &amp; prize winners</h1><p>Trending is what club members started, finished, rated and voted for in the last 30 days.</p></div>
      </div>
      <div className="split">
        <section className="card">
          <h2>Trending in the club</h2>
          {hot.length === 0 && <p className="soft">Not enough reading activity yet.</p>}
          {hot.map((t, i) => (
            <div key={t.title} className="row" style={{ flexWrap: "nowrap", padding: "12px 0", borderTop: i ? "1px solid var(--line)" : 0 }}>
              <span className="rank">{i + 1}</span>
              <Cover title={t.title} author={t.author} size="sm" />
              <div style={{ flex: 1 }}>
                <b>{t.title}</b>
                <div className="soft small">{t.author}</div>
                <div className="row small" style={{ gap: 8 }}>
                  <span>{t.readers} reader{t.readers === 1 ? "" : "s"}</span>
                  {t.avg && <Stars n={t.avg} />}
                  {t.votes > 0 && <span className="soft">+{t.votes} pitch votes</span>}
                </div>
                <div className="bar"><i style={{ width: `${(t.score / top) * 100}%` }} /></div>
              </div>
            </div>
          ))}
        </section>

        <section className="stack">
          <h2>Award shelf</h2>
          {prizes.length === 0 && <p className="soft">Staff can record prize winners from the staff desk.</p>}
          {[...byPrize.entries()].map(([name, list]) => (
            <div key={name} className="card">
              <h3>{name}</h3>
              {list.map((p) => (
                <div key={p.id} className="book" style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                  <Cover title={p.book.title} author={p.book.author} url={p.book.coverUrl} size="sm" />
                  <div>
                    <span className={`pill ${p.category === "Winner" ? "hot" : ""}`}>{p.year} {p.category.toLowerCase()}</span>
                    <div style={{ marginTop: 4 }}><b>{p.book.title}</b></div>
                    <div className="soft small">{p.book.author} · {money(p.book.price)} · {p.book.stock ? `${p.book.stock} in stock` : "sold out"}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
