# Bookstore Book Club

A website for an independent bookstore and its reading club. Built with Next.js 16, Drizzle ORM and Postgres, ready to deploy on Vercel from GitHub.

## What it does

| # | Feature | Page | Who uses it |
|---|---------|------|-------------|
| 1 | **Availability calendar** – members tap the days they're free; the calendar shades each day by how many can come and rings the best date | `/availability` | Members |
| 2 | **Book pitches & voting** – members pitch a book with a short case, everyone votes ▲/▼, staff crown the club pick | `/pitches` | Members, staff |
| 3 | **New arrivals** – everything that landed in the last six weeks | `/new-arrivals` | Everyone |
| 4 | **Inventory** – searchable, filterable stock list; staff adjust stock with +/−, edit and remove titles | `/inventory` | Everyone, staff |
| 5 | **Events & photos** – upcoming and past events, each with a photo gallery | `/events`, `/events/[id]` | Everyone, staff |
| 6 | **Prizes & trending** – award shelf (Booker, JCB, Pulitzer…) and what the club is reading most this month | `/trending` | Everyone |
| 7 | **Suggestions** – personal picks from what you've read and rated, what members with similar taste loved, and what's in stock | `/for-you` | Members |
| 8 | **Session RSVP** – "I'm going" (respects seat limits) or "Interested" for each session | `/sessions` | Members |
| 9 | **Reading log & reviews** – log reading / finished / want-to-read with stars and a review; club-wide feed | `/reading` | Members |

Staff run everything from **`/admin`** (link in the footer): add/edit books, schedule events and sessions, upload photos, record prizes.

### How suggestions work
`lib/insights.ts` scores every in-stock book the member hasn't read:
- **Readers like you** (+4 each): members who rated a book you rated 4★+ also rated this 4★+
- **Your genres** (up to +6): genres weighted by your ratings (5★ counts +3, 1★ counts −1)
- **Your authors** (+3 or more): authors you've rated well
- **Club love / prizes**: light tie-breakers

Each pick shows the reason it was chosen. New members with no log see club favourites.

**Trending** = reading activity in the last 30 days (started/finished/want), adjusted by star ratings, plus net pitch votes.

## Sign-in model
- **Members** join with name + email (no password). A signed cookie keeps them in for a year. Set `CLUB_JOIN_CODE` so only people who got the code at the counter can join.
- **Staff**: the first time anyone opens `/admin/login`, it asks them to choose the staff password (stored hashed in the database). After that it's a normal login. Change it any time under *Shop settings* on the staff desk. Setting an `ADMIN_PASSWORD` env var overrides this.

Anyone who knows a member's email *and* the club code could sign in as them — if that matters, add email magic-link login (e.g. Auth.js + Resend) later.

---

## Deploy (GitHub + Vercel)

1. Import this GitHub repo in Vercel (*Add New → Project*).
2. *Storage → Create → Neon (Postgres)* and connect it to the project. Any variable prefix works — the app finds the connection string itself.
3. Deploy (or *Redeploy* if it was already deployed). Each build creates/updates the database tables first; the build log shows **"Database is up to date."**
4. **Straight away**, open `https://<your-site>/admin/login` and choose the staff password — the first person to open that page sets it.
5. On the staff desk → *Shop settings*: set the shop's name, and (for a demo) type `LOAD DEMO` to load 30 books, 10 members, events, pitches and reviews. ⚠ Loading demo data replaces all club data — don't use it once the shop is live.

Optional:
- *Storage → Blob* → connect, for direct photo uploads (otherwise staff paste image links).
- Environment variables: `CLUB_JOIN_CODE`, `NEXT_PUBLIC_CURRENCY` (default `INR`), `NEXT_PUBLIC_TIMEZONE` (default `Asia/Kolkata`) with matching `EVENT_UTC_OFFSET` (default `+05:30`), `SESSION_SECRET` (otherwise derived from the database credentials).

Demo members, reviews and event photos are invented samples; book titles and prize results are real.

## Local development
```bash
cp .env.example .env          # point DATABASE_URL at any Postgres
npm install
npm run db:migrate
npm run db:seed               # optional demo data (wipes club data)
npm run dev                   # http://localhost:3000
```

Changing the schema (`lib/schema.ts`): run `npm run db:generate` to create a new SQL migration in `db/migrations`, commit it, and the next deploy applies it. `npm run db:studio` opens a table browser.

## Project map
```
app/                  pages (one folder per section) + layout, styles
  admin/              staff desk + login
components/           Cover (generated book jackets), ActionForm, RsvpBlock
lib/schema.ts         database tables
lib/actions.ts        every write: join, vote, RSVP, log, inventory, events, photos…
lib/insights.ts       suggestions + trending
lib/session.ts        member / staff cookies
db/migrations/        SQL migrations (applied on deploy)
db/seed.ts            demo data
```

## Customising for the shop
- Name, currency, timezone: env vars above.
- Colours and fonts: the variables at the top of `app/globals.css`.
- Book covers: paste a cover image URL when adding a book; otherwise a typeset jacket is generated in a stable colour.
