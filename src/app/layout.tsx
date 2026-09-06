import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import { channel, paletteVars } from "@/lib/channel";
import "./globals.css";

/*
 * next/font requires literal calls, so these three declarations cannot be read
 * from the config. They must match channel.config.json's `fonts` - display,
 * displayItalic, body - and docs/NEW-CHANNEL.md lists this as a required edit
 * when forking the repo for another channel.
 */

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif-italic",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteTitle = `${channel.name} - ${channel.tagline}`;
const platforms = (Object.keys(channel.socials) as (keyof typeof channel.socials)[])
  .filter((p) => channel.socials[p])
  .map((p) => p[0].toUpperCase() + p.slice(1));

export const metadata: Metadata = {
  metadataBase: new URL(channel.site.url),
  title: siteTitle,
  description: `${channel.site.description} On ${platforms.join(", ")}. New episodes every ${channel.cadence.publishDays.join(", ")}.`,
  openGraph: {
    title: siteTitle,
    description: channel.site.description,
    url: channel.site.url,
    siteName: channel.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: channel.site.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        {/* Palette from channel.config.json. globals.css maps these to Tailwind tokens. */}
        <style>{`:root { ${paletteVars()} }`}</style>
      </head>
      <body className="min-h-full flex flex-col bg-background text-surface">
        {children}
      </body>
    </html>
  );
}
