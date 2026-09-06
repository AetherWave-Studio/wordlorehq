import type { MetadataRoute } from "next";
import { channel } from "@/lib/channel";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: channel.site.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
