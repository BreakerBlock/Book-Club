import type { Metadata } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import Link from "next/link";
import "./globals.css";
import { currentMember, isAdmin } from "@/lib/session";
import { leave } from "@/lib/actions";
import { initials } from "@/lib/format";
import { storeName } from "@/lib/settings";
import { DEMO } from "@/lib/mode";

export async function generateMetadata(): Promise<Metadata> {
  const name = await storeName();
  return { title: { default: `${name} · Book Club`, template: `%s · ${name}` }, description: `Book club, events and shelves at ${name}.` };
}

const NAV = [
  ["/availability", "Availability"],
  ["/pitches", "Pitches"],
  ["/sessions", "Sessions"],
  ["/reading", "Reading log"],
  ["/for-you", "For you"],
  ["/trending", "Trending & prizes"],
  ["/new-arrivals", "New in"],
  ["/inventory", "Inventory"],
  ["/events", "Events"],
] as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [me, admin, STORE_NAME] = await Promise.all([currentMember(), isAdmin(), storeName()]);
  return (
    <html lang="en">
      <body>
        <header className="top">
          <div className="top-row">
            <Link href="/" className="brand">
              <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden><path d="M4 7c4-2 8-2 12 1v18c-4-3-8-3-12-1zM28 7c-4-2-8-2-12 1v18c4-3 8-3 12-1z" fill="currentColor" opacity=".9"/></svg>
              <span>{STORE_NAME}</span>
            </Link>
            <div className="who">
              {admin && <Link className="pill staff" href="/admin">Staff</Link>}
              {DEMO && me ? (
                <span className="me">
                  <span className="avatar" title={me.name}>{initials(me.name)}</span>
                  <span className="hide-sm">{me.name}</span>
                </span>
              ) : me ? (
                <form action={leave} className="me">
                  <span className="avatar" title={me.name}>{initials(me.name)}</span>
                  <span className="hide-sm">{me.name.split(" ")[0]}</span>
                  <button className="link small">Sign out</button>
                </form>
              ) : (
                <Link className="btn small" href="/join">Join the club</Link>
              )}
            </div>
          </div>
          <nav className="nav" aria-label="Sections">
            {NAV.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <span>{STORE_NAME} · Book club &amp; shop floor</span>
          <Link href={admin ? "/admin" : "/admin/login"}>{admin ? "Staff desk" : "Staff login"}</Link>
        </footer>
      </body>
    </html>
  );
}
