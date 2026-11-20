"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Result } from "@/lib/actions";

export function Submit({ children, className = "btn" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} aria-busy={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

/** A form wired to a server action that returns { ok } or { error }. Resets on success. */
export function ActionForm({
  action, children, className = "form", resetOnOk = true,
}: {
  action: (prev: Result, f: FormData) => Promise<Result>;
  children: React.ReactNode;
  className?: string;
  resetOnOk?: boolean;
}) {
  const [state, run] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok && resetOnOk) ref.current?.reset(); }, [state, resetOnOk]);
  return (
    <form ref={ref} action={run} className={className}>
      {children}
      {state?.error && <p className="msg err" role="alert">{state.error}</p>}
      {state?.ok && <p className="msg ok" role="status">{state.ok}</p>}
    </form>
  );
}
