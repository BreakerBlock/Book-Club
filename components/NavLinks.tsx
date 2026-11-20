"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: readonly (readonly [string, string])[] }) {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Sections">
      {items.map(([href, label]) => {
        const on = path === href || path.startsWith(href + "/");
        return <Link key={href} href={href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>{label}</Link>;
      })}
    </nav>
  );
}
