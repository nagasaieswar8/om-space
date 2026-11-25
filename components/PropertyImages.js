"use client";
// components/PropertyImages.js
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { PLACEHOLDER_IMG } from "@/lib/constants";

function normalize(url) {
  if (!url) return null;
  if (url.startsWith("http")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=1400&q=90`;
  }
  return url;
}

export default function PropertyImages({ mainImg, title, type, status, featured, images = [] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const normalized = [normalize(mainImg), ...images.map(normalize)].filter(Boolean);
  const gallery = normalized.length > 0 ? [...new Set(normalized)] : [PLACEHOLDER_IMG];
  const slides = gallery.map((src) => ({ src }));
  const thumbs = gallery.slice(1, 5);
  const hiddenCount = gallery.length - 5;
  const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : "";

  const openAt = (position) => {
    setIndex(position);
    setOpen(true);
  };

  return (
    <>
      <div className="os-gallery">
        <div className="os-gallery__main" onClick={() => openAt(0)}>
          <img src={gallery[0]} alt={title || "Property"} onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }} />
          <div className="os-gallery__badges">
            {type && <span className="os-badge os-badge--gold">{type}</span>}
            {statusLabel && (
              <span className={`os-badge ${status === "available" ? "os-badge--green" : "os-badge--red"}`}>{statusLabel}</span>
            )}
            {featured && <span className="os-badge os-badge--gold">Featured</span>}
          </div>
          <span className="os-gallery__count">{gallery.length} photo{gallery.length > 1 ? "s" : ""}</span>
        </div>

        {thumbs.length > 0 && (
          <div className="os-gallery__thumbs">
            {thumbs.map((src, position) => (
              <div key={src} style={{ position: "relative" }} onClick={() => openAt(position + 1)}>
                <img
                  src={src}
                  alt={`${title || "Property"} photo ${position + 2}`}
                  loading="lazy"
                  onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }}
                />
                {position === 3 && hiddenCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(10, 27, 22, .58)",
                      color: "var(--os-cream)",
                      fontSize: 13,
                      letterSpacing: ".04em",
                    }}
                  >
                    +{hiddenCount} more
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Zoom, Thumbnails]}
        zoom={{ maxZoomPixelRatio: 4, zoomInMultiplier: 2, scrollToZoom: true }}
        thumbnails={{ position: "bottom", width: 80, height: 60, gap: 8 }}
        styles={{ container: { backgroundColor: "rgba(8, 20, 16, 0.97)" } }}
        carousel={{ finite: false }}
        on={{ view: ({ index: nextIndex }) => setIndex(nextIndex) }}
      />
    </>
  );
}
