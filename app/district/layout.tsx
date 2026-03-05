import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Městská část",
  robots: NO_INDEX_ROBOTS,
};

export default function DistrictLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
