"use client";
import { useState } from "react";

export default function ShareButton({ title, path }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${path || window.location.pathname}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: title || "OM SPACE property", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (error?.name !== "AbortError") console.error(error);
    }
  };

  return (
    <button type="button" className="os-iconbtn" onClick={share} aria-label="Share this property">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
