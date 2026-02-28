import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Přihlášení",
  alternates: {
    canonical: "/sign-in",
  },
  robots: NO_INDEX_ROBOTS,
};

export default function SignInLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
