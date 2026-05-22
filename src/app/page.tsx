import Link from "next/link";

const SOCIALS = [
  {
    name: "YouTube",
    href: "https://www.youtube.com/@wordlorehq",
    label: "Watch on YouTube",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.017 3.017 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@wordlorehq",
    label: "Follow on TikTok",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.34a8.16 8.16 0 0 0 4.77 1.52V6.4a4.85 4.85 0 0 1-1.84-.71z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/wordlorehq",
    label: "Follow on Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/wordlorehq",
    label: "Follow on Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Threads",
    href: "https://www.threads.com/@wordlorehq",
    label: "Follow on Threads",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.36 11.21c-.09-.04-.18-.08-.27-.12-.15-2.86-1.71-4.5-4.34-4.52h-.04c-1.57 0-2.88.67-3.69 1.89l1.45.99c.6-.91 1.55-1.1 2.24-1.1h.03c.86 0 1.5.25 1.91.74.3.36.5.85.59 1.48-.7-.12-1.45-.16-2.26-.11-2.27.13-3.73 1.45-3.63 3.29.05.93.51 1.74 1.31 2.27.67.44 1.54.66 2.44.61 1.19-.06 2.13-.51 2.78-1.34.49-.62.81-1.43.95-2.45.59.36.93.83 1.06 1.46.23 1.07-.22 2.46-1.04 3.32-.72.75-1.59 1.34-3.06 1.35-1.63-.01-2.87-.54-3.68-1.56-.76-.96-1.16-2.35-1.17-4.13.01-1.78.41-3.17 1.17-4.13.81-1.02 2.04-1.54 3.68-1.56 1.65.01 2.91.54 3.74 1.58.41.51.71 1.15.91 1.92l1.71-.46c-.23-.94-.61-1.75-1.13-2.41-1.18-1.49-2.91-2.25-5.13-2.27h-.01c-2.22.01-3.92.78-5.05 2.27C5.34 8.57 4.76 10.29 4.75 12.41v.01c.01 2.12.59 3.84 1.72 5.13 1.13 1.49 2.83 2.26 5.05 2.27h.01c1.97-.01 3.36-.53 4.5-1.7 1.5-1.54 1.45-3.47 1.45-3.55-.01-1.65-.95-2.86-2.12-3.36zm-4.5 3.27c-1 .06-2.03-.39-2.08-1.36-.04-.72.51-1.52 2.14-1.61.19-.01.37-.02.55-.02.59 0 1.14.06 1.64.17-.18 2.32-1.27 2.77-2.25 2.82z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-16">
      {/* subtle parchment grain overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #F4E8D0 0%, transparent 50%), radial-gradient(circle at 80% 80%, #C9A961 0%, transparent 50%)",
        }}
      />

      {/* Top brand mark */}
      <header className="mb-12 text-center">
        <p
          className="font-[family-name:var(--font-serif-italic)] italic text-[#C9A961]/80 text-xs sm:text-sm"
          style={{ letterSpacing: "0.4em" }}
        >
          W O R D L O R E
        </p>
        <Flourish />
      </header>

      {/* Hero wordmark */}
      <h1
        className="font-[family-name:var(--font-serif)] font-bold text-[#C9A961] text-center leading-none"
        style={{
          fontSize: "clamp(3.5rem, 14vw, 9rem)",
          letterSpacing: "0.02em",
        }}
      >
        WORDLORE
      </h1>

      <div className="my-8">
        <DiamondOrnament />
      </div>

      {/* Tagline */}
      <p
        className="font-[family-name:var(--font-serif-italic)] italic text-[#F4E8D0] text-center"
        style={{ fontSize: "clamp(1.25rem, 2.6vw, 2rem)" }}
      >
        Every word has a story.
      </p>

      {/* Description */}
      <p
        className="font-[family-name:var(--font-sans)] text-[#F4E8D0]/75 text-center max-w-xl mt-10 leading-relaxed px-2"
        style={{ fontSize: "clamp(0.95rem, 1.2vw, 1.05rem)" }}
      >
        Short-form etymology, told properly. We dig up where the everyday words
        you use actually came from - the demon-haunted, the holy, the absurd.
        The English you speak is haunted. We just point at the ghosts.
      </p>

      {/* Primary CTA */}
      <Link
        href="https://www.youtube.com/@wordlorehq"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#C9A961] px-7 py-3.5 text-[#0F1A2E] font-[family-name:var(--font-sans)] font-semibold text-sm uppercase transition hover:bg-[#dcc080] focus:outline-none focus:ring-2 focus:ring-[#C9A961] focus:ring-offset-2 focus:ring-offset-[#0F1A2E]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.017 3.017 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        Watch on YouTube
      </Link>

      {/* Cadence */}
      <p
        className="mt-12 font-[family-name:var(--font-sans)] text-[#7A8B6F] text-center uppercase"
        style={{ fontSize: "0.7rem", letterSpacing: "0.25em" }}
      >
        New stories every Mon &middot; Tue &middot; Thu &middot; Fri
      </p>

      {/* Social row */}
      <nav
        className="mt-16 flex items-center gap-5"
        aria-label="Social platforms"
      >
        {SOCIALS.map((s) => (
          <Link
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#C9A961]/30 text-[#F4E8D0]/70 transition hover:text-[#C9A961] hover:border-[#C9A961] focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
          >
            <span className="w-5 h-5 inline-block">{s.icon}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <footer className="mt-20 text-center font-[family-name:var(--font-sans)] text-[#F4E8D0]/45 text-xs px-4">
        <p>
          Press, sponsorships, and general inquiries:{" "}
          <Link
            href="mailto:info@wordlorehq.com"
            className="text-[#C9A961]/70 hover:text-[#C9A961] underline-offset-2 hover:underline"
          >
            info@wordlorehq.com
          </Link>
        </p>
        <p className="mt-3 text-[#F4E8D0]/30">
          &copy; {new Date().getFullYear()} Wordlore. All etymologies sourced
          from public scholarship.
        </p>
      </footer>
    </main>
  );
}

function Flourish() {
  return (
    <div className="flex items-center justify-center gap-2 mt-2" aria-hidden="true">
      <span className="block h-px w-12 bg-[#C9A961]/40" />
      <span className="block w-1.5 h-1.5 rotate-45 bg-[#C9A961]/60" />
      <span className="block h-px w-12 bg-[#C9A961]/40" />
    </div>
  );
}

function DiamondOrnament() {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden="true">
      <span className="block h-px w-20 bg-[#C9A961]/50" />
      <span className="block w-2.5 h-2.5 rotate-45 bg-[#C9A961]" />
      <span className="block h-px w-20 bg-[#C9A961]/50" />
    </div>
  );
}
