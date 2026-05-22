import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://wordlorehq.com"),
  title: "Wordlore - Every word has a story.",
  description:
    "Short-form etymology videos for YouTube, TikTok, Instagram, Facebook, and Threads. New stories every Monday, Tuesday, Thursday, Friday.",
  openGraph: {
    title: "Wordlore - Every word has a story.",
    description:
      "Short-form etymology videos. The English you speak is haunted.",
    url: "https://wordlorehq.com",
    siteName: "Wordlore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wordlore - Every word has a story.",
    description:
      "Short-form etymology videos. The English you speak is haunted.",
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
      <body className="min-h-full flex flex-col bg-[#0F1A2E] text-[#F4E8D0]">
        {children}
      </body>
    </html>
  );
}
