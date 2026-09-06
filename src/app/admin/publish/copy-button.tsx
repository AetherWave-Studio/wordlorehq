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
      className="font-[family-name:var(--font-sans)] text-xs uppercase px-3 py-1 rounded border border-accent/40 text-surface/75 hover:text-background hover:bg-accent hover:border-accent transition"
      style={{ letterSpacing: "0.15em" }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
