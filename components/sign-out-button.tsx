"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Odhlásit se
    </button>
  );
}
