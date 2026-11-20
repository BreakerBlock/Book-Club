import Link from "next/link";
import { PageHead } from "@/components/ui";
import { PHOTOS } from "@/lib/demo";
import { and, asc, count, desc, eq, gt, ilike, or, sum, type SQL } from "drizzle-orm";
import { db, books as booksT } from "@/lib/db";
import { isAdmin } from "@/lib/session";
import { adjustStock, deleteBook } from "@/lib/actions";
import { Cover } from "@/components/Cover";
import { money } from "@/lib/format";

export const metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

const SORTS: Record<string, SQL> = {
  title: asc(booksT.title), author: asc(booksT.author), new: desc(booksT.arrivedAt), stock: asc(booksT.stock), price: asc(booksT.price),
};

export default async function Inventory({ searchParams }: { searchParams: Promise<{ q?: string; genre?: string; sort?: string; instock?: string }> }) {
  const { q = "", genre = "", sort = "title", instock } = await searchParams;
  const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const where = and(
    q ? or(ilike(booksT.title, like), ilike(booksT.author, like), ilike(booksT.isbn, like)) : undefined,
    genre ? eq(booksT.genre, genre) : undefined,
    instock ? gt(booksT.stock, 0) : undefined,
  );
  const [admin, books, genres, [totals]] = await Promise.all([
    isAdmin(),
    db.select().from(booksT).where(where).orderBy(SORTS[sort] ?? SORTS.title).limit(300),
    db.selectDistinct({ genre: booksT.genre }).from(booksT).orderBy(asc(booksT.genre)),
    db.select({ titles: count(), copies: sum(booksT.stock).mapWith(Number) }).from(booksT),
  ]);

  return (
    <>
      <PageHead image={PHOTOS.stack} title="Store inventory" sub={`${totals.titles} titles · ${totals.copies ?? 0} copies on the shelves. Search by title, author or ISBN.`}>
        {admin && <Link className="btn" href="/admin#book">Add a book</Link>}
      </PageHead>

      <form className="card row" style={{ marginBottom: 18 }}>
        <input name="q" defaultValue={q} placeholder="Search title, author, ISBN" aria-label="Search" style={{ flex: "2 1 220px", width: "auto" }} />
        <select name="genre" defaultValue={genre} aria-label="Genre" style={{ flex: "1 1 150px", width: "auto" }}>
          <option value="">All genres</option>
          {genres.map((g) => <option key={g.genre}>{g.genre}</option>)}
        </select>
        <select name="sort" defaultValue={sort} aria-label="Sort" style={{ flex: "1 1 150px", width: "auto" }}>
          <option value="title">Title A–Z</option><option value="author">Author A–Z</option><option value="new">Newest</option><option value="stock">Lowest stock</option><option value="price">Price</option>
        </select>
        <label className="row" style={{ fontWeight: 400 }}><input type="checkbox" name="instock" value="1" defaultChecked={!!instock} style={{ width: 20, minHeight: 20 }} /> In stock only</label>
        <button className="btn small">Filter</button>
      </form>

      <div className="card table-card scroll">
        <table className="stack-t">
          <thead><tr><th></th><th>Title</th><th>Author</th><th>Genre</th><th>Shelf</th><th className="num">Price</th><th className="num">Stock</th>{admin && <th></th>}</tr></thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td data-l=""><Cover title={b.title} author={b.author} url={b.coverUrl} size="sm" /></td>
                <td data-l="Title"><b>{b.title}</b>{b.isbn && <div className="soft small">{b.isbn}</div>}</td>
                <td data-l="Author">{b.author}</td>
                <td data-l="Genre">{b.genre}</td>
                <td data-l="Shelf">{b.shelf ?? "—"}</td>
                <td data-l="Price" className="num">{money(b.price)}</td>
                <td data-l="Stock" className={`num ${b.stock <= 2 ? "low" : ""}`}>{b.stock === 0 ? "Sold out" : b.stock}</td>
                {admin && (
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                      <form className="inline" action={adjustStock.bind(null, b.id, -1)}><button className="btn ghost small" aria-label="One fewer">−</button></form>
                      <form className="inline" action={adjustStock.bind(null, b.id, 1)}><button className="btn ghost small" aria-label="One more">+</button></form>
                      <Link className="link small" href={`/admin?edit=${b.id}#book`}>Edit</Link>
                      <form className="inline" action={deleteBook.bind(null, b.id)}><button className="link small">Remove</button></form>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {books.length === 0 && <p className="soft">No books match that search.</p>}
    </>
  );
}
