import { hue } from "@/lib/format";

/** Book cover: the real cover if we have one, otherwise a typeset jacket in a stable colour. */
export function Cover({ title, author, url, size = "md" }: { title: string; author: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`cover cover-${size}`} src={url} alt={`Cover of ${title}`} loading="lazy" />;
  }
  return (
    <div className={`cover cover-${size} cover-gen`} style={{ background: hue(title + author) }} aria-label={`Cover of ${title}`}>
      <span className="cover-title">{title}</span>
      <span className="cover-author">{author}</span>
    </div>
  );
}

export function Stars({ n }: { n: number | null | undefined }) {
  if (!n) return null;
  const r = Math.round(n);
  return <span className="stars" aria-label={`${n.toFixed(1)} out of 5`}>{"★".repeat(r)}<span className="dim">{"★".repeat(5 - r)}</span></span>;
}

export function JoinPrompt({ what, next }: { what: string; next: string }) {
  return (
    <div className="card prompt">
      <p><a className="link" href={`/join?next=${encodeURIComponent(next)}`}>Join the club</a> to {what}.</p>
    </div>
  );
}
