/**
 * Put this channel's rendered episodes on its media host, and record what is
 * there.
 *
 *   node scripts/sync-media.mjs --upload    # push local MP4s to R2 (weekly)
 *   node scripts/sync-media.mjs --import    # have AetherWave pull them (once)
 *   node scripts/sync-media.mjs --manifest  # only refresh the manifest
 *
 * Episodes used to be committed to this repo and shipped inside every
 * deployment: 184 MB of MP4 growing ~21 MB a week, re-uploaded as build output
 * on every deploy, which is what put this account against its host's build
 * quota. They live in object storage now and the repo carries a manifest of
 * filenames in their place.
 *
 * --upload is the one the weekly render uses: it asks AetherWave for a
 * presigned PUT per file and uploads straight to R2, so no R2 credential ever
 * touches the render box. --import is for files already reachable on the public
 * web, which is how the existing archive was moved without uploading it twice.
 *
 * Environment:
 *   AETHERWAVE_API_KEY   an agent key for the account whose R2 this is
 *   AETHERWAVE_API_BASE  defaults to https://aetherwavestudio.com
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const API_BASE = process.env.AETHERWAVE_API_BASE || "https://aetherwavestudio.com";
const API_KEY = process.env.AETHERWAVE_API_KEY;
if (!API_KEY) {
  console.error("Missing AETHERWAVE_API_KEY");
  process.exit(1);
}

const ROOT = path.join(import.meta.dirname, "..");
const EPISODE_DIR = path.join(ROOT, "public", "episodes");
const MANIFEST = path.join(ROOT, "src", "lib", "wordlore-content", "media-manifest.json");

const config = JSON.parse(await readFile(path.join(ROOT, "channel.config.json"), "utf-8"));
const CHANNEL = config.id;
const SITE = config.site.url.replace(/\/$/, "");

const mode = process.argv.find((a) => ["--upload", "--import", "--manifest"].includes(a));
if (!mode) {
  console.error("Specify one of --upload | --import | --manifest");
  process.exit(1);
}

const api = async (route, init) => {
  const res = await fetch(`${API_BASE}${route}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-AW-Key": API_KEY, ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({ error: "non-JSON response" }));
  if (!res.ok) throw new Error(`${route} ${res.status}: ${body.error || JSON.stringify(body)}`);
  return body;
};

/**
 * Local episode media, if this checkout still has any.
 *
 * Both the video and its thumbnail: the platforms that let you set a cover
 * (YouTube thumbnailUrl, Instagram coverImageUrl) need the image at a public
 * URL, so it has to travel the same path as the MP4. Thumbnail props files are
 * excluded - only the deliverables ship.
 */
async function localEpisodes() {
  try {
    return (await readdir(EPISODE_DIR))
      .filter((f) => /\.(mp4|jpg)$/.test(f) && !f.includes("-props"))
      .sort();
  } catch {
    return [];
  }
}

if (mode === "--import") {
  const files = await localEpisodes();
  if (!files.length) {
    console.error(`No MP4s in ${EPISODE_DIR} to import.`);
    process.exit(1);
  }
  console.log(`Importing ${files.length} files from ${SITE}/episodes/ ...`);
  // Batched: the server fetches each source itself, and a hundred sequential
  // downloads in one request is a long time to hold a connection open.
  const BATCH = 8;
  for (let i = 0; i < files.length; i += BATCH) {
    const slice = files.slice(i, i + BATCH);
    const out = await api("/api/channel/media/import", {
      method: "POST",
      body: JSON.stringify({
        channel: CHANNEL,
        files: slice.map((name) => ({ name, sourceUrl: `${SITE}/episodes/${name}` })),
      }),
    });
    for (const r of out.results) {
      const detail = r.error ? ` - ${r.error}` : r.bytes ? ` (${(r.bytes / 1048576).toFixed(1)} MB)` : "";
      console.log(`  ${r.status.padEnd(8)} ${r.name}${detail}`);
    }
  }
}

if (mode === "--upload") {
  const files = await localEpisodes();
  if (!files.length) {
    console.error(`No MP4s in ${EPISODE_DIR} to upload.`);
    process.exit(1);
  }
  console.log(`Uploading ${files.length} files to R2 ...`);
  for (const name of files) {
    const { uploadUrl, contentType } = await api("/api/channel/media/upload-url", {
      method: "POST",
      body: JSON.stringify({ channel: CHANNEL, name }),
    });
    const body = await readFile(path.join(EPISODE_DIR, name));
    // The content type must match the one the URL was signed for, or R2
    // rejects it as a 403 that says nothing about why.
    const put = await fetch(uploadUrl, { method: "PUT", body, headers: { "Content-Type": contentType } });
    if (!put.ok) throw new Error(`PUT ${name} failed: ${put.status} ${await put.text()}`);
    const { size } = await stat(path.join(EPISODE_DIR, name));
    console.log(`  uploaded ${name} (${(size / 1048576).toFixed(1)} MB)`);
  }
}

// Always finish by recording what the host actually holds - asked of the host,
// not assumed from what was just sent. The manifest is the deployment's only
// evidence that a remotely hosted episode exists, so a hopeful one is worse
// than none.
const listing = await api(`/api/channel/media?channel=${encodeURIComponent(CHANNEL)}`);
const manifest = {
  _comment:
    "Episodes held by this channel's media host. Written by scripts/sync-media.mjs; " +
    "read by reconcileRenders as evidence that a remotely hosted episode exists. " +
    "Do not hand-edit - regenerate it.",
  baseUrl: listing.baseUrl,
  updated: new Date().toISOString().slice(0, 10),
  files: listing.files.map((f) => f.name).sort(),
};
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
const videos = manifest.files.filter((f) => f.endsWith(".mp4")).length;
const thumbs = manifest.files.filter((f) => f.endsWith(".jpg")).length;
console.log(
  `\nManifest: ${videos} episodes + ${thumbs} thumbnails, ` +
    `${(listing.bytes / 1048576).toFixed(0)} MB at ${listing.baseUrl}`,
);
