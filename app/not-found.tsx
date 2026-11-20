import Link from "next/link";
export default function NotFound() {
  return <div style={{ textAlign: "center", padding: "60px 0" }}><h1>That page is out on loan</h1><p className="soft">We couldn&rsquo;t find it.</p><Link className="btn" href="/">Back to the front desk</Link></div>;
}
