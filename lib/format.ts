export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Lantern Lane Books";
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "INR";
export const TZ = process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Kolkata";

export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 }).format(n);

export const dateLong = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(d);

export const dateTime = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(d);

export const ago = (d: Date) => {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const dd = Math.round(h / 24); if (dd < 30) return `${dd}d ago`;
  return dateLong(d);
};

/** "YYYY-MM-DD" for a Date stored as @db.Date (UTC midnight). */
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

/** Stable colour per string, for generated book covers and avatars. */
const PALETTE = ["#7a2e3a", "#2f5d62", "#3d4a7a", "#8a5a1f", "#4f3a63", "#2e5a3a", "#6b3f2a", "#1f4e6e"];
export const hue = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};
