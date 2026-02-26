"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="rounded-md border border-orange-300/60 bg-orange-400/20 px-3 py-1.5 text-sm font-medium text-orange-50 transition-colors hover:bg-orange-400/30"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Odhlásit se
    </button>
  );
}
