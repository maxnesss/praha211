import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Praha211",
  description: "Praha211 web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
