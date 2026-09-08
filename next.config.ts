import type { NextConfig } from "next";
import { channel } from "./src/lib/channel";

/**
 * Legacy episode URLs, served from wherever the episodes now live.
 *
 * Episodes used to sit in `public/episodes/` and ship inside every deployment.
 * They live in object storage now, but URLs already handed out do not change:
 * a week's posts are scheduled days ahead of publishing and carry the media URL
 * they were scheduled with, so anything already on the books still points here.
 *
 * This is a `fallback` rewrite, which matters twice over. Fallback runs AFTER
 * the filesystem, so a file still present in `public/` wins and a freshly
 * rendered episode works before it has been uploaded. And a rewrite proxies
 * rather than redirecting - the bytes come back from this origin - so it does
 * not matter whether the platform fetching the video follows a 308.
 */
const mediaBase = channel.media?.baseUrl?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!mediaBase) return [];
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [{ source: "/episodes/:file", destination: `${mediaBase}/:file` }],
    };
  },
};

export default nextConfig;
