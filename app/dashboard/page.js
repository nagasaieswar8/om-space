"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Brand from "@/components/Brand";
import PropertyCard from "@/components/PropertyCard";
import PropertySkeleton from "@/components/PropertySkeleton";
import Counter from "@/components/Counter";
import { useCompare } from "@/lib/CompareContext";
import { priceLabel } from "@/lib/constants";
import { roleHome } from "@/lib/roles";

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "saved", label: "Saved properties" },
  { id: "compare", label: "Comparisons" },
  { id: "searches", label: "Recent searches" },
  { id: "inquiries", label: "My enquiries" },
  { id: "assistant", label: "AI assistant" },
  { id: "profile", label: "Profile" },
];

const NAV_ICONS = {
  overview: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  saved: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  compare: <><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></>,
  searches: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  inquiries: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  assistant: <><path d="M12 2v4" /><rect x="4" y="6" width="16" height="12" rx="3" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></>,
};

function NavIcon({ id }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {NAV_ICONS[id]}
    </svg>
  );
}

function budgetLabel(value) {
  const number = parseFloat(value);
  if (!number) return "Any budget";
  if (number >= 10000000) return `Under ₹${(number / 10000000).toFixed(1)} Cr`;
  if (number >= 100000) return `Under ₹${(number / 100000).toFixed(0)} L`;
  return `Under ₹${number.toLocaleString()}`;
}

function searchHref(entry) {
  const params = new URLSearchParams();
  if (entry.search) params.set("search", entry.search);
  if (entry.type) params.set("type", entry.type);
  if (entry.listing) params.set("listing", entry.listing);
  if (entry.maxPrice) params.set("maxPrice", entry.maxPrice);
  return `/listings${params.toString() ? `?${params.toString()}` : ""}`;
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const [active, setActive] = useState("overview");
  const [savedProperties, setSavedProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "customer") {
      router.replace(roleHome(session?.user?.role));
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/saved-properties")
      .then((res) => res.json())
      .then((data) => setSavedProperties(data.properties || []))
      .catch(() => setSavedProperties([]));

    fetch(`/api/inquiries?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setInquiries(data.inquiries || []))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false));

    try {
      setRecentSearches(JSON.parse(localStorage.getItem("os-recent-searches") || "[]"));
    } catch {
      setRecentSearches([]);
    }
  }, [session?.user?.id]);

  const firstName = useMemo(() => session?.user?.name?.split(" ")[0] || "there", [session?.user?.name]);

  const clearSearches = () => {
    try {
      localStorage.removeItem("os-recent-searches");
    } catch {}
    setRecentSearches([]);
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <>
        <Navbar />
        <div className="os-portal">
          <aside className="os-portal__side">
            <div className="os-portal__brand"><Brand /></div>
          </aside>
          <main className="os-portal__main">
            <div className="os-skeleton" style={{ width: 260, height: 40, marginBottom: 30 }} />
            <div className="os-stats">
              {[0, 1, 2, 3].map((item) => (
                <div className="os-skeleton" key={item} style={{ height: 110, borderRadius: 18 }} />
              ))}
            </div>
            <div className="os-grid">
              <PropertySkeleton count={3} />
            </div>
          </main>
        </div>
      </>
    );
  }

  if (!session || session.user?.role !== "customer") return null;

  const initials = (session.user?.name || "OS")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const stats = [
    { label: "Saved properties", value: savedProperties.length },
    { label: "In comparison", value: compareList.length },
    { label: "Enquiries sent", value: inquiries.length },
    { label: "Recent searches", value: recentSearches.length },
  ];

  const openAssistant = () => window.dispatchEvent(new Event("os-open-chat"));

  return (
    <>
      <Navbar />
      <div className="os-portal">
        <aside className="os-portal__side">
          <div className="os-portal__brand">
            <Brand />
          </div>
          <div className="os-portal__user">
            <div className="os-portal__avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <b>{session.user?.name}</b>
              <span>Customer</span>
            </div>
          </div>

          <nav className="os-portal__nav" aria-label="Customer portal">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={active === item.id ? "is-on" : ""}
                onClick={() => setActive(item.id)}
                aria-label={item.label}
                title={item.label}
              >
                <NavIcon id={item.id} />
                <span>{item.label}</span>
                {item.id === "saved" && savedProperties.length > 0 && <small>{savedProperties.length}</small>}
                {item.id === "compare" && compareList.length > 0 && <small>{compareList.length}</small>}
                {item.id === "inquiries" && inquiries.length > 0 && <small>{inquiries.length}</small>}
              </button>
            ))}
          </nav>

          <div className="os-portal__bottom">
            <Link href="/listings" className="os-btn os-btn--gold os-btn--sm os-btn--block">Browse properties</Link>
            <Link href="/help" className="os-btn os-btn--outline-light os-btn--sm os-btn--block" style={{ marginTop: 8 }}>
              Help centre
            </Link>
          </div>
        </aside>

        <main className="os-portal__main">
          <div className="os-portal__top">
            <div>
              <span className="os-eyebrow">Customer portal</span>
              <h1>Good to see you, {firstName}.</h1>
              <p>Your saved homes, conversations and searches — all in one calm place.</p>
            </div>
            {active !== "saved" && (
              <button className="os-btn os-btn--gold" onClick={() => setActive("saved")}>
                View saved homes
              </button>
            )}
          </div>

          {active === "overview" && (
            <>
              <div className="os-stats">
                {stats.map((stat) => (
                  <div className="os-stat" key={stat.label}>
                    <b><Counter value={stat.value} /></b>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              <div className="os-panel">
                <div className="os-section-head" style={{ alignItems: "flex-end", marginBottom: 18 }}>
                  <div>
                    <div className="os-panel__eyebrow">Continue browsing</div>
                    <h2 className="os-panel__title" style={{ marginBottom: 0 }}>Your saved properties</h2>
                  </div>
                  <button className="os-textlink" onClick={() => setActive("saved")}>View all</button>
                </div>
                {savedProperties.length === 0 ? (
                  <div className="os-empty" style={{ background: "var(--os-cream)", padding: "36px 20px" }}>
                    <h3>Nothing saved yet</h3>
                    <p>Tap the heart on any listing to keep it here for later.</p>
                    <Link href="/listings" className="os-btn os-btn--sm">Explore properties</Link>
                  </div>
                ) : (
                  <div className="os-grid">
                    {savedProperties.slice(0, 3).map((property, index) => (
                      <PropertyCard key={property.id || property._id} prop={property} index={index} />
                    ))}
                  </div>
                )}
              </div>

              <div className="os-panel">
                <div className="os-panel__eyebrow">Recent activity</div>
                <h2 className="os-panel__title">Latest enquiries</h2>
                {inquiries.length === 0 ? (
                  <p className="os-hint">No enquiries yet. Open any property and send a message to the agency.</p>
                ) : (
                  inquiries.slice(0, 3).map((inquiry) => (
                    <div key={inquiry.id} className="os-inquiry" style={{ marginBottom: 10 }}>
                      <div>
                        <b style={{ fontSize: 13 }}>{inquiry.property?.title || "Property enquiry"}</b>
                        <span className="os-hint" style={{ display: "block", marginTop: 4 }}>{inquiry.message}</span>
                      </div>
                      <span className={`os-badge ${inquiry.status === "resolved" ? "os-badge--green" : "os-badge--gold"}`}>
                        {inquiry.status || "open"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {active === "saved" && (
            <div>
              <div className="os-results-bar">
                <h2>{savedProperties.length} saved <small>property{savedProperties.length === 1 ? "" : "s"}</small></h2>
              </div>
              {savedProperties.length === 0 ? (
                <div className="os-empty">
                  <h3>No saved properties yet</h3>
                  <p>Use the heart icon on any listing to build your shortlist.</p>
                  <Link href="/listings" className="os-btn os-btn--gold">Explore properties</Link>
                </div>
              ) : (
                <div className="os-grid">
                  {savedProperties.map((property, index) => (
                    <PropertyCard key={property.id || property._id} prop={property} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}

          {active === "compare" && (
            <div>
              <div className="os-results-bar">
                <h2>{compareList.length} in <small>comparison</small></h2>
                <div className="os-results-tools">
                  {compareList.length > 0 && (
                    <button className="os-btn os-btn--ghost os-btn--sm" onClick={clearCompare}>Clear comparison</button>
                  )}
                  <Link href="/compare" className={`os-btn os-btn--gold os-btn--sm ${compareList.length ? "" : "os-btn--ghost"}`}>
                    Open comparison
                  </Link>
                </div>
              </div>
              {compareList.length === 0 ? (
                <div className="os-empty">
                  <h3>Nothing to compare yet</h3>
                  <p>Add up to four properties from the listings page to compare price, size and location side by side.</p>
                  <Link href="/listings" className="os-btn">Browse properties</Link>
                </div>
              ) : (
                <div className="os-stack">
                  {compareList.map((property) => (
                    <div className="os-inquiry" key={property.id || property._id}>
                      <div style={{ minWidth: 0 }}>
                        <b style={{ fontSize: 14 }}>{property.title}</b>
                        <span className="os-hint" style={{ display: "block", marginTop: 3 }}>
                          {property.locality || property.location || "Vijayawada"} · {property.type || "Property"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <b style={{ fontFamily: "var(--os-serif)", color: "var(--os-forest)", fontSize: 18 }}>
                          {property.price ? priceLabel(property.price) : "On request"}
                        </b>
                        <button className="os-tablebtn" onClick={() => removeFromCompare(property)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {active === "searches" && (
            <div>
              <div className="os-results-bar">
                <h2>Recent <small>searches</small></h2>
                {recentSearches.length > 0 && (
                  <button className="os-btn os-btn--ghost os-btn--sm" onClick={clearSearches}>Clear history</button>
                )}
              </div>
              {recentSearches.length === 0 ? (
                <div className="os-empty">
                  <h3>No recent searches</h3>
                  <p>Your filter combinations will appear here so you can pick them up again.</p>
                  <Link href="/listings" className="os-btn">Start searching</Link>
                </div>
              ) : (
                <div className="os-stack">
                  {recentSearches.map((entry) => (
                    <Link
                      key={`${entry.at}-${entry.search}-${entry.type}`}
                      href={searchHref(entry)}
                      className="os-inquiry"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span style={{ color: "var(--os-gold)" }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </span>
                        <div>
                          <b style={{ fontSize: 13 }}>{entry.search || "All localities"}</b>
                          <span className="os-hint" style={{ display: "block", marginTop: 3 }}>
                            {[entry.type || "All types", entry.listing || "Buy & rent", budgetLabel(entry.maxPrice)].join(" · ")}
                          </span>
                        </div>
                      </div>
                      <span className="os-textlink">Search again</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {active === "inquiries" && (
            <div>
              <div className="os-results-bar">
                <h2>{inquiries.length} <small>enquir{inquiries.length === 1 ? "y" : "ies"}</small></h2>
              </div>
              {inquiries.length === 0 ? (
                <div className="os-empty">
                  <h3>No enquiries yet</h3>
                  <p>When you contact an agency, the conversation appears here.</p>
                  <Link href="/listings" className="os-btn">Find a property</Link>
                </div>
              ) : (
                <div className="os-stack">
                  {inquiries.map((inquiry) => (
                    <div className="os-panel" key={inquiry.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                        <div>
                          <div className="os-panel__eyebrow">Enquiry</div>
                          <h3 style={{ fontFamily: "var(--os-serif)", fontSize: 22 }}>
                            {inquiry.property?.title || "Property enquiry"}
                          </h3>
                          <p className="os-hint" style={{ marginTop: 3 }}>
                            {inquiry.property?.locality || inquiry.property?.location || "Vijayawada"}
                          </p>
                        </div>
                        <span className={`os-badge ${inquiry.status === "resolved" ? "os-badge--green" : "os-badge--gold"}`}>
                          {inquiry.status || "open"}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--os-grey)", margin: "14px 0", lineHeight: 1.7 }}>
                        {inquiry.message}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <span className="os-hint">Sent on {new Date(inquiry.createdAt).toLocaleDateString()}</span>
                        <Link href={`/contact-requests?inquiry=${inquiry.id}`} className="os-btn os-btn--ghost os-btn--sm">
                          View conversation
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {active === "assistant" && (
            <div className="os-panel os-panel--dark">
              <span className="os-eyebrow">AI property assistant</span>
              <h2 className="os-h2" style={{ marginTop: 14 }}>
                Ask anything about <span className="os-italic">Vijayawada</span>.
              </h2>
              <p style={{ fontSize: 13, lineHeight: 1.8, marginTop: 14, maxWidth: 560 }}>
                The OM SPACE assistant can explain localities, suggest budget ranges and point you to
                the right listings. It uses the platform&apos;s own property data.
              </p>
              <div className="os-amenities" style={{ marginTop: 22 }}>
                {["Show 2 BHK flats in Tadepalli", "Best localities under ₹1 Cr", "How do I contact an agency?"].map((prompt) => (
                  <span className="os-amenity" key={prompt} style={{ background: "rgba(247,244,236,.08)", borderColor: "rgba(247,244,236,.18)", color: "var(--os-cream)" }}>
                    {prompt}
                  </span>
                ))}
              </div>
              <button className="os-btn os-btn--gold" style={{ marginTop: 24 }} onClick={openAssistant}>
                Open the assistant
              </button>
            </div>
          )}

          {active === "profile" && (
            <div style={{ maxWidth: 640 }}>
              <div className="os-panel">
                <div className="os-panel__eyebrow">Account</div>
                <h2 className="os-panel__title">Profile information</h2>
                <div className="os-form-grid">
                  <label className="os-field">
                    <span>Full name</span>
                    <input className="os-input" value={session.user?.name || ""} disabled />
                  </label>
                  <label className="os-field">
                    <span>Email address</span>
                    <input className="os-input" value={session.user?.email || ""} disabled />
                  </label>
                  <label className="os-field">
                    <span>Account type</span>
                    <input className="os-input" value="Customer" disabled />
                  </label>
                </div>
                <p className="os-hint" style={{ marginTop: 16 }}>
                  Profile details are managed with your account. Contact support to make a change.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
