export default function PropertySkeleton({ count = 3, view = "grid" }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          className="os-skeleton-card"
          key={i}
          style={view === "list" ? { display: "flex", gap: 0 } : undefined}
          aria-hidden="true"
        >
          <div className="os-skeleton" style={{ height: view === "list" ? 180 : 220, width: view === "list" ? "34%" : "100%", borderRadius: view === "list" ? "18px 0 0 18px" : 0 }} />
          <div className="os-skeleton-card__body" style={{ flex: 1 }}>
            <div className="os-skeleton" />
            <div className="os-skeleton" />
            <div className="os-skeleton" />
            <div className="os-skeleton" style={{ height: 34, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </>
  );
}
