import { ActionForm, Submit } from "@/components/ActionForm";
import { join } from "@/lib/actions";
import { storeName } from "@/lib/settings";

export const metadata = { title: "Join the club" };

export default async function Join({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const STORE_NAME = await storeName();
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <h1>Join the {STORE_NAME} club</h1>
      <p className="soft">Use the same email each time and you&rsquo;ll pick up where you left off on any device.</p>
      <ActionForm action={join} className="form card" resetOnOk={false}>
        <input type="hidden" name="next" value={safeNext} />
        <label>Your name<input name="name" required autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        {process.env.CLUB_JOIN_CODE && <label>Club code <span className="soft small">(ask at the counter)</span><input name="code" required /></label>}
        <Submit>Join</Submit>
      </ActionForm>
    </div>
  );
}
