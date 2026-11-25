"use client";
// app/listings/page.js
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard, { displayPrice } from "@/components/PropertyCard";
import PropertySkeleton from "@/components/PropertySkeleton";
import { getImageSrc, PLACEHOLDER_IMG } from "@/lib/constants";

const PROPERTY_TYPES = [
  { value: "", label: "All types" },
  { value: "Residential Apartment", label: "Residential Apartment" },
  { value: "Builder Floor", label: "Builder Floor" },
  { value: "Farm House", label: "Farm House" },
  { value: "Serviced Apartments", label: "Serviced Apartments" },
  { value: "Independent House/Villa", label: "Independent House/Villa" },
  { value: "Residential Land", label: "Residential Land" },
  { value: "Commercial Office Space", label: "Commercial Office Space" },
  { value: "Shop/Showroom", label: "Shop/Showroom" },
  { value: "Other", label: "Other" },
];

const BHK_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4 BHK" },
  { value: "5+", label: "5+ BHK" },
];

const SORT_OPTIONS = [
  { label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Price: low to high", sortBy: "price", sortOrder: "asc" },
  { label: "Price: high to low", sortBy: "price", sortOrder: "desc" },
];

const initialListing = (params) => {
  const raw = params.get("listing") || params.get("listing_type");
  if (raw === "Buy" || raw === "P") return "Buy";
  if (raw === "Rent" || raw === "R") return "Rent";
  return "";
};

// ── Google Map ───────────────────────────────────────────────────────────
function MapView({ properties, apiKey }) {
  const [selected, setSelected] = useState(null);
  const VIJAYAWADA = { lat: 16.5062, lng: 80.648 };

  const validProps = (properties || []).filter(
    (p) => p.latitude && p.longitude && !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude))
  );

  return (
    <APIProvider apiKey={apiKey}>
      <Map defaultCenter={VIJAYAWADA} defaultZoom={12} style={{ width: "100%", height: "100%" }} gestureHandling="greedy">
        {validProps.map((p) => (
          <Marker
            key={p.id || p._id}
            position={{ lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) }}
            onClick={() => setSelected(p)}
          />
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: parseFloat(selected.latitude), lng: parseFloat(selected.longitude) }}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ maxWidth: 230, padding: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <img
                src={getImageSrc(selected) || PLACEHOLDER_IMG}
                alt={selected.title || "Property"}
                style={{ width: "100%", height: 108, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
              />
              <div style={{ fontWeight: 700, fontSize: 14, color: "#123D32", marginBottom: 2 }}>{displayPrice(selected)}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#10251F", marginBottom: 3 }}>{selected.title || "Property"}</div>
              <div style={{ fontSize: 11, color: "#858B87", marginBottom: 8 }}>
                {[selected.locality || selected.location, "Vijayawada"].filter(Boolean).join(", ")}
              </div>
              <a
                href={`/property/${selected.id || selected._id}`}
                style={{
                  display: "block",
                  background: "#123D32",
                  color: "#F7F4EC",
                  textAlign: "center",
                  padding: "7px 0",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  textDecoration: "none",
                }}
              >
                View details
              </a>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}

// ── Main Page Content ─────────────────────────────────────────────────────────
function ListingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState("grid");
  const [showMap, setShowMap] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    type: searchParams.get("type") || "",
    listing: initialListing(searchParams),
    bedrooms: searchParams.get("bedrooms") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    status: searchParams.get("status") || "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchInput, setSearchInput] = useState(filters.search);
  const [priceDraft, setPriceDraft] = useState(filters.maxPrice);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const params = new URLSearchParams();
    const query = { ...filters };
    if (query.listing === "Buy") query.listing = "P";
    if (query.listing === "Rent") query.listing = "R";
    Object.entries(query).forEach(([key, value]) => { if (value) params.set(key, value); });
    params.set("page", String(currentPage));
    params.set("limit", "20");

    try {
      const res = await fetch(`/api/properties?${params}`);
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setProperties(data.properties || []);
      setPagination(data.pagination || { total: 0, pages: 1 });

      const hasCriteria = filters.search || filters.type || filters.listing || filters.maxPrice;
      if (hasCriteria) {
        try {
          const entry = {
            search: filters.search,
            type: filters.type,
            listing: filters.listing,
            maxPrice: filters.maxPrice,
            at: Date.now(),
          };
          const prior = JSON.parse(localStorage.getItem("os-recent-searches") || "[]");
          const withoutDuplicate = prior.filter(
            (item) => !(item.search === entry.search && item.type === entry.type && item.listing === entry.listing && item.maxPrice === entry.maxPrice)
          );
          localStorage.setItem("os-recent-searches", JSON.stringify([entry, ...withoutDuplicate].slice(0, 6)));
        } catch {}
      }
    } catch (err) {
      console.error(err);
      setProperties([]);
      setPagination({ total: 0, pages: 1 });
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => (current.search === searchInput ? current : { ...current, search: searchInput }));
    }, 450);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.type) params.set("type", filters.type);
    if (filters.listing) params.set("listing", filters.listing);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.status) params.set("status", filters.status);
    if (currentPage > 1) params.set("page", String(currentPage));
    router.replace(`/listings${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }, [filters, currentPage, router]);

  const setFilter = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value };
      if (key === "type" && (value === "Residential Land" || value === "Farm House")) next.bedrooms = "";
      return next;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setSearchInput("");
    setPriceDraft("");
    setFilters({
      search: "", type: "", listing: "", bedrooms: "", maxPrice: "", status: "",
      sortBy: "createdAt", sortOrder: "desc",
    });
  };

  const changePage = (page) => {
    setCurrentPage(page);
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeFilterCount = ["type", "listing", "bedrooms", "maxPrice", "status"].filter((key) => filters[key]).length
    + (filters.search ? 1 : 0);

  const pageNumbers = useMemo(() => {
    const pages = Math.max(1, pagination.pages || 1);
    const windowSize = Math.min(5, pages);
    const start = Math.max(1, Math.min(currentPage - 2, pages - windowSize + 1));
    return Array.from({ length: windowSize }, (_, index) => start + index);
  }, [pagination.pages, currentPage]);

  const applyMap = (next) => {
    setShowMap(next);
    setFiltersOpen(false);
  };

  const filterPanel = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div style={{ fontFamily: "var(--os-serif)", fontSize: 24 }}>Refine search</div>
        <button className="os-filters__close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="os-filters__group">
        <div className="os-filters__title">Property type</div>
        {PROPERTY_TYPES.map(({ value, label }) => (
          <label className="os-radio" key={value || "all"}>
            <input type="radio" name="type" checked={filters.type === value} onChange={() => setFilter("type", value)} />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {filters.type !== "Residential Land" && filters.type !== "Farm House" && (
        <div className="os-filters__group">
          <div className="os-filters__title">Bedrooms</div>
          {BHK_OPTIONS.map(({ value, label }) => (
            <label className="os-radio" key={value || "any"}>
              <input type="radio" name="bedrooms" checked={filters.bedrooms === value} onChange={() => setFilter("bedrooms", value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      )}

      <div className="os-filters__group">
        <div className="os-filters__title">Listing type</div>
        {[["", "Buy & rent"], ["Buy", "Buy"], ["Rent", "Rent"]].map(([value, label]) => (
          <label className="os-radio" key={value || "all"}>
            <input type="radio" name="listing" checked={filters.listing === value} onChange={() => setFilter("listing", value)} />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="os-filters__group">
        <div className="os-filters__title">Maximum budget</div>
        <input
          className="os-input"
          type="number"
          min="0"
          placeholder="e.g. 10000000"
          value={priceDraft}
          onChange={(e) => setPriceDraft(e.target.value)}
          onBlur={() => setFilter("maxPrice", priceDraft)}
          onKeyDown={(e) => e.key === "Enter" && setFilter("maxPrice", priceDraft)}
        />
      </div>

      <div className="os-filters__group">
        <div className="os-filters__title">Status</div>
        {[["", "All listings"], ["available", "Available"], ["sold", "Sold"]].map(([value, label]) => (
          <label className="os-radio" key={value || "all"}>
            <input type="radio" name="status" checked={filters.status === value} onChange={() => setFilter("status", value)} />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="os-btn os-btn--ghost os-btn--block" onClick={clearFilters}>Clear all filters</button>
        <button className="os-btn os-btn--gold os-filters__apply" onClick={() => setFiltersOpen(false)}>
          Show {pagination.total} {pagination.total === 1 ? "property" : "properties"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <Navbar />

      <section className="os-page-hero">
        <div className="os-container os-page-hero__inner">
          <div className="os-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <b>Properties</b>
          </div>
          <span className="os-eyebrow">Vijayawada property search</span>
          <h1>
            Homes for every <span className="os-italic">chapter</span>.
          </h1>
          <p className="os-lead">
            Search by locality, property type and budget. Every listing connects you directly to the
            agency that manages it.
          </p>

          <form
            className="os-list-search"
            onSubmit={(event) => {
              event.preventDefault();
              setFilter("search", searchInput);
              document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <label className="os-list-search__field">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--os-grey)" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Locality, project or landmark"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search locality"
              />
            </label>
            <label className="os-list-search__field">
              <select value={filters.type} onChange={(e) => setFilter("type", e.target.value)} aria-label="Property type">
                {PROPERTY_TYPES.map(({ value, label }) => (
                  <option key={value || "all"} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="os-list-search__field">
              <select value={filters.listing} onChange={(e) => setFilter("listing", e.target.value)} aria-label="Listing type">
                <option value="">Buy & rent</option>
                <option value="Buy">Buy</option>
                <option value="Rent">Rent</option>
              </select>
            </label>
            <label className="os-list-search__field">
              <select
                value={priceDraft}
                onChange={(e) => { setPriceDraft(e.target.value); setFilter("maxPrice", e.target.value); }}
                aria-label="Maximum budget"
              >
                <option value="">Any budget</option>
                <option value="5000000">Under ₹50 L</option>
                <option value="10000000">Under ₹1 Cr</option>
                <option value="30000000">Under ₹3 Cr</option>
                <option value="50000000">Under ₹5 Cr</option>
              </select>
            </label>
            <button type="submit" className="os-btn os-btn--gold">
              Search
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      <div className="os-container os-discovery" id="results">
        {!showMap && (
          <aside className={`os-filters ${filtersOpen ? "is-open" : ""}`} aria-label="Filters">
            {filterPanel}
          </aside>
        )}

        <div style={{ minWidth: 0 }}>
          <div className="os-results-bar">
            <h2>
              {pagination.total} {pagination.total === 1 ? "property" : "properties"}
              <small>{filters.search ? `for “${filters.search}”` : "in Vijayawada"}</small>
            </h2>

            <div className="os-results-tools">
              <button
                className="os-btn os-btn--ghost os-btn--sm os-filter-toggle"
                onClick={() => setFiltersOpen(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
                </svg>
                Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
              </button>

              <div className="os-sort">
                <span>Sort</span>
                <select
                  value={`${filters.sortBy}|${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split("|");
                    setFilters((current) => ({ ...current, sortBy, sortOrder }));
                    setCurrentPage(1);
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.label} value={`${option.sortBy}|${option.sortOrder}`}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="os-viewtoggle" role="group" aria-label="View">
                <button className={view === "grid" ? "is-on" : ""} onClick={() => setView("grid")} aria-label="Grid view">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button className={view === "list" ? "is-on" : ""} onClick={() => setView("list")} aria-label="List view">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>

              <button
                className={`os-btn os-btn--sm ${showMap ? "os-btn--gold" : "os-btn--ghost"}`}
                onClick={() => applyMap(!showMap)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                {showMap ? "Hide map" : "Map view"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className={view === "list" ? "os-stack" : "os-grid"}>
              <PropertySkeleton count={4} view={view} />
            </div>
          ) : loadError ? (
            <div className="os-empty">
              <h3>We could not load these listings</h3>
              <p>The property service did not respond. Please try again in a moment.</p>
              <button className="os-btn" onClick={fetchProperties}>Try again</button>
            </div>
          ) : properties.length === 0 ? (
            <div className="os-empty">
              <h3>No properties match those filters</h3>
              <p>Try widening the budget, choosing another locality, or clearing the filters.</p>
              <button className="os-btn" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : view === "list" ? (
            <div className="os-stack">
              {properties.map((property, index) => (
                <PropertyCard key={property.id || property._id} prop={property} view="list" index={index} />
              ))}
            </div>
          ) : (
            <div className="os-grid">
              {properties.map((property, index) => (
                <PropertyCard key={property.id || property._id} prop={property} view="grid" index={index} />
              ))}
            </div>
          )}

          {pagination.pages > 1 && !loading && !loadError && (
            <div className="os-pagination">
              <button onClick={() => changePage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="Previous page">
                ‹
              </button>
              {pageNumbers.map((page) => (
                <button key={page} className={currentPage === page ? "is-on" : ""} onClick={() => changePage(page)}>
                  {page}
                </button>
              ))}
              <button onClick={() => changePage(Math.min(pagination.pages, currentPage + 1))} disabled={currentPage === pagination.pages} aria-label="Next page">
                ›
              </button>
            </div>
          )}
        </div>

        {showMap && (
          <div className="os-mapwrap">
            {mapsKey ? (
              <MapView properties={properties} apiKey={mapsKey} />
            ) : (
              <div className="os-mapwrap__fallback">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--os-gold)" strokeWidth="1.4">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <b style={{ fontFamily: "var(--os-serif)", fontSize: 22, color: "var(--os-ink)", fontWeight: 500 }}>
                  Map view is almost ready
                </b>
                <p style={{ fontSize: 12, maxWidth: 280, lineHeight: 1.7 }}>
                  Add a Google Maps browser key as <code>NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> in your
                  environment file to show listings on the map.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--os-cream)" }}>
          <div className="os-skeleton" style={{ width: 220, height: 16 }} />
        </div>
      }
    >
      <ListingsPageContent />
    </Suspense>
  );
}
