"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <h1>Something slipped off the shelf</h1>
      <p className="soft">If you were voting or RSVPing, make sure you&rsquo;ve joined the club, then try again.</p>
      <button className="btn" onClick={reset}>Try again</button>
    </div>
  );
}
