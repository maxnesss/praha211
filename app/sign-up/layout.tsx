import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Registrace",
  alternates: {
    canonical: "/sign-up",
  },
  robots: NO_INDEX_ROBOTS,
};

export default function SignUpLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
