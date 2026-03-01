import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/kontaktujte-nas"],
        disallow: [
          "/api/",
          "/sign-in",
          "/sign-up",
          "/overview",
          "/chapter",
          "/district",
          "/body",
          "/pokladnice",
          "/leaderboard",
          "/teams",
          "/team",
          "/profile",
          "/player",
        ],
      },
    ],
    sitemap: `${siteUrl.origin}/sitemap.xml`,
    host: siteUrl.origin,
  };
}
