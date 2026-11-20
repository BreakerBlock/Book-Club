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

/** Page title band with an optional photo behind it. */
export function PageHead({ title, sub, image, children }: { title: string; sub?: string; image?: string; children?: React.ReactNode }) {
  return (
    <header className={`pagehead ${image ? "has-img" : ""}`} style={image ? { backgroundImage: `url(${image})` } : undefined}>
      <div className="pagehead-in">
        <div>
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {children && <div className="row">{children}</div>}
      </div>
    </header>
  );
}
