import type { Metadata } from "next";
import { Cinzel_Decorative } from "next/font/google";
import { CookieConsentDialog } from "@/components/cookie-consent-dialog";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-brand",
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
      <body className={`${cinzelDecorative.variable} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <CookieConsentDialog />
        </div>
      </body>
    </html>
  );
}
