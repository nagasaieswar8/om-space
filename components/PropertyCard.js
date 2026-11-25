"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCompare } from "@/lib/CompareContext";
import { getImageSrc, PLACEHOLDER_IMG, priceLabel } from "@/lib/constants";

export function displayPrice(prop) {
  return priceLabel(prop?.price || prop?.min_price);
}

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const AreaIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 21V9h12" />
  </svg>
);

export default function PropertyCard({ prop, view = "grid", index = 0 }) {
  const { data: session } = useSession();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!prop) return null;

  const isCustomer = session?.user?.role === "customer";
  const inCompare = isInCompare(prop);
  const price = displayPrice(prop);
  const image = getImageSrc(prop);
  const location = [prop.locality || prop.location, prop.city || "Vijayawada"].filter(Boolean).join(", ");
  const type = prop.type || "Property";
  const beds = Number(prop.bedrooms ?? prop.beds) || 0;
  const baths = Number(prop.bathrooms ?? prop.baths) || 0;
  const area = prop.area ? `${prop.area}${prop.area_unit ? ` ${prop.area_unit}` : ""}` : "Area on request";
  const isSold = prop.status && prop.status !== "available";
  const href = `/property/${prop.id || prop._id}`;

  const toggleSave = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!session) {
      alert("Please sign in to save properties");
      return;
    }
    if (!isCustomer) return;

    setSaving(true);
    try {
      if (saved) {
        const res = await fetch(`/api/saved-properties?propertyId=${encodeURIComponent(prop.id || prop._id)}`, { method: "DELETE" });
        if (res.ok) setSaved(false);
      } else {
        const res = await fetch("/api/saved-properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId: String(prop.id || prop._id) }),
        });
        if (res.ok || res.status === 409) setSaved(true);
        else if (res.status === 401) alert("Please sign in to save properties");
      }
    } catch {
      alert("Could not update your saved properties right now");
    } finally {
      setSaving(false);
    }
  };

  const toggleCompare = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (inCompare) removeFromCompare(prop);
    else addToCompare(prop);
  };

  return (
    <article
      className={`os-prop ${view === "list" ? "os-prop--list" : ""}`}
      style={{ transitionDelay: `${Math.min(index, 6) * 55}ms` }}
    >
      <div className="os-prop__media">
        <Link href={href} aria-label={`View ${prop.title}`}>
          <img
            className="os-prop__img"
            src={image}
            alt={prop.title || "Property"}
            loading="lazy"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
          />
        </Link>
        <span className="os-prop__shade" aria-hidden="true" />
        <span className="os-prop__type">{type}</span>
        {isCustomer && (
          <button
            className={`os-prop__fav ${saved ? "is-saved" : ""}`}
            onClick={toggleSave}
            disabled={saving}
            aria-label={saved ? "Remove from saved properties" : "Save property"}
            aria-pressed={saved}
          >
            <HeartIcon filled={saved} />
          </button>
        )}
        {isSold && (
          <span className="os-prop__status os-prop__status--sold">
            {String(prop.status).replace(/^\w/, (c) => c.toUpperCase())}
          </span>
        )}
        {!isSold && prop.featured && (
          <span className="os-prop__status">Featured</span>
        )}
      </div>

      <div className="os-prop__body">
        <div className="os-prop__price">{price}</div>
        <Link href={href} className="os-prop__title">{prop.title || "Untitled property"}</Link>
        <div className="os-prop__loc">
          <PinIcon />
          {location}
        </div>

        <div className="os-prop__specs">
          {beds > 0 && <span>{beds} Bedrooms</span>}
          {baths > 0 && <span>{baths} Bathrooms</span>}
          <span><AreaIcon /> {area}</span>
        </div>

        <div className="os-prop__foot">
          {session ? (
            <button
              className={`os-prop__compare ${inCompare ? "is-on" : ""}`}
              onClick={toggleCompare}
              aria-pressed={inCompare}
            >
              {inCompare ? "Added to compare" : "Compare"}
            </button>
          ) : (
            <span className="os-prop__compare" style={{ border: 0, padding: 0 }}>
              {prop.seller_company || prop.seller_name || "OM SPACE"}
            </span>
          )}
          <Link href={href} className="os-prop__view">
            View details
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
