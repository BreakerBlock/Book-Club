import { redirect } from "next/navigation";
import Link from "next/link";
import { asc, count, desc, eq, lte, sum } from "drizzle-orm";
import { db, books, events, members as membersT } from "@/lib/db";
import { isAdmin } from "@/lib/session";
import { ActionForm, Submit } from "@/components/ActionForm";
import { saveBook, saveEvent, addPhotos, addPrize, adminLogout, deleteEvent, saveShop, changeStaffPassword, loadDemoData } from "@/lib/actions";
import { storeName } from "@/lib/settings";
import { dateTime } from "@/lib/format";

export const metadata = { title: "Staff desk" };
export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { edit } = await searchParams;
  const [name, book, bookList, eventList, [{ members }], [{ stock }], [{ low }]] = await Promise.all([
    storeName(),
    edit ? db.query.books.findFirst({ where: eq(books.id, edit) }) : null,
    db.select({ id: books.id, title: books.title, author: books.author }).from(books).orderBy(asc(books.title)),
    db.query.events.findMany({ orderBy: desc(events.startsAt), with: { rsvps: { columns: { id: true } }, photos: { columns: { id: true } } } }),
    db.select({ members: count() }).from(membersT),
    db.select({ stock: sum(books.stock).mapWith(Number) }).from(books),
    db.select({ low: count() }).from(books).where(lte(books.stock, 2)),
  ]);

  return (
    <>
      <div className="head">
        <div><h1>Staff desk</h1><p>{members} members · {stock ?? 0} books in stock · {low} titles running low</p></div>
        <form action={adminLogout}><button className="btn ghost small">Sign out of staff</button></form>
      </div>

      <section className="card" style={{ marginBottom: 28 }}>
        <h2>Shop settings</h2>
        <div className="grid">
          <ActionForm action={saveShop} resetOnOk={false}>
            <label>Shop name<input name="storeName" defaultValue={name} required /></label>
            <Submit>Save name</Submit>
          </ActionForm>
          {!process.env.ADMIN_PASSWORD && (
            <ActionForm action={changeStaffPassword}>
              <label>New staff password<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
              <Submit>Change password</Submit>
            </ActionForm>
          )}
          <ActionForm action={loadDemoData}>
            <label>Demo data <span className="soft small">— replaces ALL books, members, events and logs with samples</span>
              <input name="confirm" placeholder="Type LOAD DEMO" autoComplete="off" required /></label>
            <Submit className="btn quiet">Load demo data</Submit>
          </ActionForm>
        </div>
      </section>

      <div className="split">
        <section className="card" id="book">
          <h2>{book ? `Edit “${book.title}”` : "Add a book"}</h2>
          <ActionForm action={saveBook} resetOnOk={!book}>
            {book && <input type="hidden" name="id" value={book.id} />}
            <div className="two">
              <label>Title<input name="title" required defaultValue={book?.title} /></label>
              <label>Author<input name="author" required defaultValue={book?.author} /></label>
            </div>
            <div className="two">
              <label>Genre<input name="genre" list="genres" defaultValue={book?.genre ?? "Fiction"} /></label>
              <label>ISBN<input name="isbn" defaultValue={book?.isbn ?? ""} /></label>
            </div>
            <div className="two">
              <label>Price<input name="price" type="number" step="1" min="0" defaultValue={book?.price ?? ""} /></label>
              <label>Copies in stock<input name="stock" type="number" min="0" defaultValue={book?.stock ?? 1} /></label>
            </div>
            <div className="two">
              <label>Shelf / section<input name="shelf" defaultValue={book?.shelf ?? ""} placeholder="e.g. Front table" /></label>
              <label>Cover image URL<input name="coverUrl" type="url" defaultValue={book?.coverUrl ?? ""} placeholder="optional" /></label>
            </div>
            <label>Blurb<textarea name="description" defaultValue={book?.description} /></label>
            <datalist id="genres">{["Fiction", "Literary Fiction", "Mystery", "Fantasy", "Science Fiction", "Romance", "History", "Biography", "Memoir", "Non-fiction", "Poetry", "Young Adult", "Children"].map((g) => <option key={g} value={g} />)}</datalist>
            <div className="row"><Submit>{book ? "Save changes" : "Add to inventory"}</Submit>{book && <Link className="link" href="/admin">Cancel</Link>}</div>
          </ActionForm>
        </section>

        <div className="stack">
          <section className="card">
            <h2>Schedule an event or session</h2>
            <ActionForm action={saveEvent}>
              <label>Type<select name="kind"><option value="SESSION">Club session (members RSVP)</option><option value="EVENT">Store event</option></select></label>
              <label>Title<input name="title" required /></label>
              <div className="two">
                <label>Date &amp; time<input name="startsAt" type="datetime-local" required /></label>
                <label>Seats<input name="capacity" type="number" min="1" placeholder="no limit" /></label>
              </div>
              <label>Where<input name="location" placeholder="In store" /></label>
              <label>Details<textarea name="description" /></label>
              <Submit>Save</Submit>
            </ActionForm>
          </section>

          <section className="card">
            <h2>Add event photos</h2>
            <ActionForm action={addPhotos}>
              <label>Event<select name="eventId" required>{eventList.map((e) => <option key={e.id} value={e.id}>{e.title} — {dateTime(e.startsAt)}</option>)}</select></label>
              <label>Photos<input name="files" type="file" accept="image/*" multiple /></label>
              <label>…or an image link<input name="url" type="url" placeholder="https://" /></label>
              <label>Caption<input name="caption" /></label>
              <Submit>Upload</Submit>
            </ActionForm>
          </section>

          <section className="card">
            <h2>Record a book prize</h2>
            <ActionForm action={addPrize}>
              <label>Book<select name="bookId" required>{bookList.map((b) => <option key={b.id} value={b.id}>{b.title} — {b.author}</option>)}</select></label>
              <div className="two">
                <label>Prize<input name="name" required placeholder="e.g. Booker Prize" /></label>
                <label>Year<input name="year" type="number" required defaultValue={new Date().getFullYear()} /></label>
              </div>
              <label>Result<select name="category"><option>Winner</option><option>Shortlist</option><option>Longlist</option></select></label>
              <Submit>Save prize</Submit>
            </ActionForm>
          </section>
        </div>
      </div>

      <section>
        <h2>All events</h2>
        <div className="scroll">
          <table className="stack-t">
            <thead><tr><th>When</th><th>Title</th><th>Type</th><th className="num">RSVPs</th><th className="num">Photos</th><th></th></tr></thead>
            <tbody>
              {eventList.map((e) => (
                <tr key={e.id}>
                  <td data-l="When">{dateTime(e.startsAt)}</td>
                  <td data-l="Title"><Link className="link" href={`/events/${e.id}`}>{e.title}</Link></td>
                  <td data-l="Type">{e.kind === "SESSION" ? "Session" : "Event"}</td>
                  <td data-l="RSVPs" className="num">{e.rsvps.length}</td>
                  <td data-l="Photos" className="num">{e.photos.length}</td>
                  <td><form action={deleteEvent.bind(null, e.id)} className="inline"><button className="link small">Delete</button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
