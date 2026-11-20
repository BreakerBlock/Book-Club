"use client";

import { useState } from "react";

const PALETTE = ["#7a2e3a", "#24504a", "#3d4a7a", "#8a5a1f", "#4f3a63", "#2e5a3a", "#6b3f2a", "#1f4e6e"];
const hue = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PALETTE[h % PALETTE.length]; };

/** Book cover: the real cover if we have one, otherwise (or if it fails to load) a typeset jacket. */
export function Cover({ title, author, url, size = "md" }: { title: string; author: string; url?: string | null; size?: "sm" | "md" | "lg" | "xl" }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <span className={`cover cover-${size}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Cover of ${title}`} loading="lazy" onError={() => setBroken(true)}
          onLoad={(e) => { if (e.currentTarget.naturalWidth < 20) setBroken(true); }} />
      </span>
    );
  }
  return (
    <span className={`cover cover-${size} cover-gen`} style={{ background: hue(title + author) }} role="img" aria-label={`Cover of ${title}`}>
      <span className="cover-title">{title}</span>
      <span className="cover-author">{author}</span>
    </span>
  );
}
