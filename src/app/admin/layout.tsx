import Link from "next/link";
import type { ReactNode } from "react";
import { channel } from "@/lib/channel";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/drafts", label: "Drafts" },
  { href: "/admin/render", label: "Render Queue" },
  { href: "/admin/publish", label: "Publish" },
  { href: "/admin/pipeline", label: "Word Pipeline" },
  { href: "/admin/history", label: "History" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-surface">
      <header className="border-b border-accent/20 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <span
              className="font-[family-name:var(--font-serif)] font-bold text-accent text-xl"
              style={{ letterSpacing: "0.05em" }}
            >
              {channel.wordmark}
            </span>
            <span
              className="font-[family-name:var(--font-sans)] text-secondary text-xs uppercase"
              style={{ letterSpacing: "0.25em" }}
            >
              Admin
            </span>
          </Link>
          <Link
            href="/"
            className="font-[family-name:var(--font-sans)] text-xs uppercase text-surface/60 hover:text-accent"
            style={{ letterSpacing: "0.2em" }}
          >
            View site
          </Link>
        </div>
        <nav className="max-w-6xl mx-auto px-6 pb-3 flex gap-6 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-[family-name:var(--font-sans)] text-sm text-surface/75 hover:text-accent whitespace-nowrap pb-1 border-b border-transparent hover:border-accent/40 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
