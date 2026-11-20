import { ActionForm, Submit } from "@/components/ActionForm";
import { adminLogin, adminSetup } from "@/lib/actions";
import { redirect } from "next/navigation";
import { staffPasswordMode } from "@/lib/settings";
import { DEMO } from "@/lib/mode";

export const metadata = { title: "Staff login" };
export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  if (DEMO) redirect("/admin");
  const mode = await staffPasswordMode();
  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      {mode === "unset" ? (
        <>
          <h1>Set the staff password</h1>
          <p className="soft">First time here. Choose the password staff will use to manage books, events and photos. Only the first person to do this sets it.</p>
          <ActionForm action={adminSetup} className="form card" resetOnOk={false}>
            <label>New password<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
            <label>Type it again<input name="confirm" type="password" required minLength={8} autoComplete="new-password" /></label>
            <Submit>Set password</Submit>
          </ActionForm>
        </>
      ) : (
        <>
          <h1>Staff login</h1>
          <ActionForm action={adminLogin} className="form card" resetOnOk={false}>
            <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
            <Submit>Sign in</Submit>
          </ActionForm>
        </>
      )}
    </div>
  );
}
