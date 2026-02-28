import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktujte tým PRAHA 112 s dotazem, nápadem nebo hlášením problému.",
  alternates: {
    canonical: "/kontaktujte-nas",
  },
  openGraph: {
    title: "Kontakt | PRAHA 112",
    description: "Kontaktujte tým PRAHA 112 s dotazem, nápadem nebo hlášením problému.",
    url: "/kontaktujte-nas",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
