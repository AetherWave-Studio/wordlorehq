"use client";

import { useState } from "react";

export function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable; let user select manually
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-[family-name:var(--font-sans)] text-xs uppercase px-3 py-1 rounded border border-[#C9A961]/40 text-[#F4E8D0]/75 hover:text-[#0F1A2E] hover:bg-[#C9A961] hover:border-[#C9A961] transition"
      style={{ letterSpacing: "0.15em" }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
