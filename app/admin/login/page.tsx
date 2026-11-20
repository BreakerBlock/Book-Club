import { ActionForm, Submit } from "@/components/ActionForm";
import { adminLogin } from "@/lib/actions";

export const metadata = { title: "Staff login" };

export default function AdminLogin() {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Staff login</h1>
      <ActionForm action={adminLogin} className="form card" resetOnOk={false}>
        <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
        <Submit>Sign in</Submit>
      </ActionForm>
    </div>
  );
}
