import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cinzel_Decorative } from "next/font/google";
import { CookieConsentDialog } from "@/components/cookie-consent-dialog";
import { SiteFooter } from "@/components/site-footer";
import { UmamiAnalytics } from "@/components/umami-analytics";
import { ViewportHeightSync } from "@/components/viewport-height-sync";
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/seo";
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-brand",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/logo/praha-tr.png",
        width: 1200,
        height: 1200,
        alt: "PRAHA 112",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/logo/praha-tr.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const cspNonce = requestHeaders.get("x-nonce") ?? undefined;

  return (
    <html lang="cs">
      <body className={`${cinzelDecorative.variable} antialiased`}>
        <ViewportHeightSync />
        <div className="flex flex-col" style={{ minHeight: "var(--app-min-height)" }}>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <SiteFooter />
          <CookieConsentDialog />
          <UmamiAnalytics nonce={cspNonce} />
        </div>
      </body>
    </html>
  );
}
