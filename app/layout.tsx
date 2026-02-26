import type { Metadata } from "next";
import { Cinzel_Decorative, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-brand",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ui",
});

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
      <body className={`${cinzelDecorative.variable} ${ibmPlexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
