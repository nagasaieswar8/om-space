"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export default function SaveButton({ propertyId }) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  if (!propertyId || (session && session.user?.role !== "customer")) return null;

  const handleSave = async () => {
    if (!session) {
      alert("Please login to save properties");
      return;
    }
    if (session.user?.role !== "customer") return;

    setLoading(true);
    try {
      if (saved) {
        const res = await fetch(`/api/saved-properties?propertyId=${String(propertyId)}`, { method: "DELETE" });
        if (res.ok) {
          setSaved(false);
        } else {
          alert("Failed to unsave property");
        }
      } else {
        const res = await fetch("/api/saved-properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId: String(propertyId) }),
        });

        if (res.ok) {
          setSaved(true);
          alert("Property saved successfully!");
        } else if (res.status === 401) {
          alert("Please login to save properties");
        } else if (res.status === 409) {
          alert("Already saved!");
          setSaved(true);
        } else {
          const errorData = await res.json();
          alert(`Failed to save: ${errorData.error || "Unknown error"}`);
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`os-iconbtn ${saved ? "is-on" : ""}`}
      onClick={handleSave}
      disabled={loading}
      aria-pressed={saved}
    >
      <HeartIcon filled={saved} />
      {loading ? "Saving…" : saved ? "Saved" : "Save"}
    </button>
  );
}
