"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

type ProfileSessionProviderProps = {
  session: Session;
  children: ReactNode;
};

export function ProfileSessionProvider({ session, children }: ProfileSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
