import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRAHA 112",
  description: "Webová aplikace PRAHA 112",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className="antialiased">{children}</body>
    </html>
  );
}
