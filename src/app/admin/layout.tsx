import Link from "next/link";
import type { ReactNode } from "react";

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
    <div className="min-h-screen bg-[#0F1A2E] text-[#F4E8D0]">
      <header className="border-b border-[#C9A961]/20 bg-[#0F1A2E]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <span
              className="font-[family-name:var(--font-serif)] font-bold text-[#C9A961] text-xl"
              style={{ letterSpacing: "0.05em" }}
            >
              WORDLORE
            </span>
            <span
              className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase"
              style={{ letterSpacing: "0.25em" }}
            >
              Admin
            </span>
          </Link>
          <Link
            href="/"
            className="font-[family-name:var(--font-sans)] text-xs uppercase text-[#F4E8D0]/60 hover:text-[#C9A961]"
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
              className="font-[family-name:var(--font-sans)] text-sm text-[#F4E8D0]/75 hover:text-[#C9A961] whitespace-nowrap pb-1 border-b border-transparent hover:border-[#C9A961]/40 transition"
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
