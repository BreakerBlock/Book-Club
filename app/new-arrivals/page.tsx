import Link from "next/link";
import { PageHead } from "@/components/ui";
import { PHOTOS } from "@/lib/demo";
import { desc, gte } from "drizzle-orm";
import { db, books as booksT } from "@/lib/db";
import { Cover } from "@/components/Cover";
import { money, ago } from "@/lib/format";

export const metadata = { title: "New arrivals" };
export const dynamic = "force-dynamic";

export default async function NewArrivals() {
  const since = new Date(Date.now() - 45 * 864e5);
  const books = await db.query.books.findMany({ where: gte(booksT.arrivedAt, since), orderBy: desc(booksT.arrivedAt), with: { prizes: true } });
  return (
    <>
      <PageHead image={PHOTOS.bookTable} title="New in the store" sub="Everything that’s landed on our shelves in the last six weeks.">
        <Link className="btn light" href="/inventory">Browse full inventory</Link>
      </PageHead>
      {books.length === 0 && <p className="soft">Nothing new in the last six weeks — check back soon.</p>}
      <div className="grid">
        {books.map((b) => (
          <article key={b.id} className="card book">
            <Cover title={b.title} author={b.author} url={b.coverUrl} />
            <div>
              <div className="row" style={{ gap: 6 }}>
                <span className="pill">{b.genre}</span>
                {b.prizes[0] && <span className="pill hot">{b.prizes[0].name} {b.prizes[0].category.toLowerCase()}</span>}
              </div>
              <h3 style={{ marginTop: 8 }}>{b.title}</h3>
              <div className="soft small">{b.author} · arrived {ago(b.arrivedAt)}</div>
              {b.description && <p className="small" style={{ marginTop: 8 }}>{b.description.length > 160 ? b.description.slice(0, 157) + "…" : b.description}</p>}
              <div className="row small"><b>{money(b.price)}</b><span className={b.stock <= 2 ? "low" : "soft"}>{b.stock === 0 ? "Sold out" : `${b.stock} on the shelf`}</span></div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
