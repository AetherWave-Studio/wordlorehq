import { ImageResponse } from "next/og";
import { channel } from "@/lib/channel";

export const runtime = "edge";
export const alt = `${channel.name} - ${channel.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: channel.palette.background,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Top mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: channel.palette.accent,
            opacity: 0.85,
            fontSize: 22,
            letterSpacing: "0.4em",
            fontStyle: "italic",
            marginBottom: 40,
          }}
        >
          <span style={{ display: "block", width: 60, height: 1, background: channel.palette.accent, opacity: 0.5 }} />
          <span>{channel.wordmark.split("").join(" ")}</span>
          <span style={{ display: "block", width: 60, height: 1, background: channel.palette.accent, opacity: 0.5 }} />
        </div>

        {/* Hero wordmark */}
        <div
          style={{
            color: channel.palette.accent,
            fontSize: 180,
            fontWeight: 700,
            letterSpacing: "0.02em",
            lineHeight: 1,
            display: "flex",
          }}
        >
          {channel.wordmark}
        </div>

        {/* Diamond ornament */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 50,
          }}
        >
          <span style={{ display: "block", width: 120, height: 1, background: channel.palette.accent, opacity: 0.6 }} />
          <span
            style={{
              display: "block",
              width: 14,
              height: 14,
              background: channel.palette.accent,
              transform: "rotate(45deg)",
            }}
          />
          <span style={{ display: "block", width: 120, height: 1, background: channel.palette.accent, opacity: 0.6 }} />
        </div>

        {/* Tagline */}
        <div
          style={{
            color: channel.palette.surface,
            fontSize: 48,
            fontStyle: "italic",
            marginTop: 36,
            display: "flex",
          }}
        >
          Every word has a story.
        </div>

        {/* Bottom cadence */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            color: channel.palette.secondary,
            fontSize: 16,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          New stories every Mon · Tue · Thu · Fri
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
