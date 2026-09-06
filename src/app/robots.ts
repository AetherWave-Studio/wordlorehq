import type { MetadataRoute } from "next";
import { channel } from "@/lib/channel";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${channel.site.url}/sitemap.xml`,
  };
}
