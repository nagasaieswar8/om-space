"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Brand from "@/components/Brand";
import Counter from "@/components/Counter";
import { getImageSrc, PLACEHOLDER_IMG, priceLabel } from "@/lib/constants";
import { roleHome } from "@/lib/roles";

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "listings", label: "My listings" },
  { id: "inquiries", label: "Enquiries" },
  { id: "profile", label: "Agency profile" },
];

const NAV_ICONS = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  listings: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  inquiries: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></>,
};

function NavIcon({ id }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {NAV_ICONS[id]}
    </svg>
  );
}

function displayPrice(prop) {
  return priceLabel(prop.price);
}

export default function AgencyDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [active, setActive] = useState("overview");
  const [listings, setListings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/agency-login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "agency" && session?.user?.role !== "admin") {
      router.replace(roleHome(session?.user?.role));
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/properties?mine=true")
      .then((res) => res.json())
      .then((data) => setListings(data.properties || []))
      .catch(() => setListings([]));

    fetch("/api/inquiries")
      .then((res) => res.json())
      .then((data) => setInquiries(data.inquiries || []))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const stats = useMemo(() => ({
    total: listings.length,
    active: listings.filter((property) => !property.status || property.status === "available").length,
    sold: listings.filter((property) => property.status && property.status !== "available").length,
    inquiries: inquiries.length,
  }), [listings, inquiries]);

  const byType = useMemo(() => {
    const counts = {};
    listings.forEach((property) => {
      const key = property.type || "Other";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [listings]);

  const maxType = Math.max(1, ...byType.map(([, count]) => count));

  const localities = useMemo(
    () => new Set(listings.map((property) => property.locality || property.location).filter(Boolean)).size,
    [listings]
  );

  const agencyName = useMemo(() => {
    const names = listings.map((property) => property.seller_company || property.seller_name).filter(Boolean);
    if (names.length === 0) return session?.user?.name || "Your agency";
    const counts = names.reduce((acc, name) => ({ ...acc, [name]: (acc[name] || 0) + 1 }), {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [listings, session?.user?.name]);

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
            <div className="os-skeleton" style={{ height: 320, borderRadius: 20 }} />
          </main>
        </div>
      </>
    );
  }

  if (!session) return null;

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      if (res.ok) {
        setListings((current) => current.filter((property) => (property.id || property._id) !== id));
        alert("Property deleted successfully");
      } else {
        alert("Failed to delete property");
      }
    } catch {
      alert("Error deleting property");
    }
  };

  const initials = (session.user?.name || "OS")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
              <span>Agency</span>
            </div>
          </div>

          <nav className="os-portal__nav" aria-label="Agency portal">
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
                {item.id === "listings" && listings.length > 0 && <small>{listings.length}</small>}
                {item.id === "inquiries" && inquiries.length > 0 && <small>{inquiries.length}</small>}
              </button>
            ))}
          </nav>

          <div className="os-portal__bottom">
            <Link href="/property/add" className="os-btn os-btn--gold os-btn--sm os-btn--block">Add a property</Link>
            <Link href="/listings" className="os-btn os-btn--outline-light os-btn--sm os-btn--block" style={{ marginTop: 8 }}>
              View public site
            </Link>
          </div>
        </aside>

        <main className="os-portal__main">
          <div className="os-portal__top">
            <div>
              <span className="os-eyebrow">Agency portal</span>
              <h1>{active === "overview" ? `Welcome back, ${session.user?.name?.split(" ")[0] || "there"}.` : "Manage your presence."}</h1>
              <p>Listings, enquiries and the numbers behind your agency on OM SPACE.</p>
            </div>
            <Link href="/property/add" className="os-btn os-btn--gold">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add property
            </Link>
          </div>

          {active === "overview" && (
            <>
              <div className="os-stats">
                {[
                  { label: "Total listings", value: stats.total },
                  { label: "Active listings", value: stats.active },
                  { label: "Closed / sold", value: stats.sold },
                  { label: "Enquiries received", value: stats.inquiries },
                ].map((stat) => (
                  <div className="os-stat" key={stat.label}>
                    <b><Counter value={stat.value} /></b>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
                <div className="os-panel">
                  <div className="os-panel__eyebrow">Listing performance</div>
                  <h2 className="os-panel__title">Portfolio by property type</h2>
                  {byType.length === 0 ? (
                    <p className="os-hint">Publish your first listing to see the breakdown here.</p>
                  ) : (
                    <div className="os-bars">
                      {byType.map(([type, count]) => (
                        <div key={type}>
                          <div className="os-bar__head">
                            <b>{type}</b>
                            <span>{count} listing{count === 1 ? "" : "s"}</span>
                          </div>
                          <div className="os-bar__track">
                            <div className="os-bar__fill" style={{ width: `${Math.round((count / maxType) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="os-agencycard__meta" style={{ justifyContent: "flex-start", gap: 34, marginTop: 22 }}>
                    <div>
                      <b>{localities}</b>
                      <span>Localities</span>
                    </div>
                    <div>
                      <b>{stats.active}</b>
                      <span>Available now</span>
                    </div>
                  </div>
                </div>

                <div className="os-panel">
                  <div className="os-panel__eyebrow">Inbox</div>
                  <h2 className="os-panel__title">Latest enquiries</h2>
                  {inquiries.length === 0 ? (
                    <div className="os-empty" style={{ background: "var(--os-cream)", padding: "34px 18px" }}>
                      <h3 style={{ fontSize: 22 }}>No enquiries yet</h3>
                      <p style={{ marginBottom: 0 }}>New customer messages will appear here.</p>
                    </div>
                  ) : (
                    inquiries.slice(0, 3).map((inquiry) => (
                      <div key={inquiry.id} style={{ padding: "13px 0", borderBottom: "1px solid var(--os-line)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <b style={{ fontSize: 12.5 }}>{inquiry.user?.name || "Customer"}</b>
                          <span className={`os-badge ${inquiry.status === "resolved" ? "os-badge--green" : "os-badge--gold"}`}>
                            {inquiry.status || "open"}
                          </span>
                        </div>
                        <p className="os-hint" style={{ marginTop: 4 }}>
                          {inquiry.property?.title || "Property"} · {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                  {inquiries.length > 0 && (
                    <button className="os-btn os-btn--ghost os-btn--sm" style={{ marginTop: 16 }} onClick={() => setActive("inquiries")}>
                      Open the inbox
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {active === "listings" && (
            <div>
              <div className="os-results-bar">
                <h2>{listings.length} <small>listing{listings.length === 1 ? "" : "s"}</small></h2>
                <Link href="/property/add" className="os-btn os-btn--ghost os-btn--sm">Add another</Link>
              </div>

              {listings.length === 0 ? (
                <div className="os-empty">
                  <h3>No listings yet</h3>
                  <p>Your published properties will appear here with edit and delete controls.</p>
                  <Link href="/property/add" className="os-btn os-btn--gold">Create your first listing</Link>
                </div>
              ) : (
                <div className="os-tablewrap">
                  <table className="os-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((property) => {
                        const identifier = property.id || property._id;
                        const available = !property.status || property.status === "available";
                        return (
                          <tr key={identifier}>
                            <td>
                              <div className="os-table__prop">
                                <img
                                  src={getImageSrc(property)}
                                  alt={property.title}
                                  onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }}
                                />
                                <div>
                                  <b>{property.title}</b>
                                  <span>
                                    {property.locality || property.location || "Vijayawada"}
                                    {property.type ? ` · ${property.type}` : ""}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{displayPrice(property)}</td>
                            <td>
                              <span className={`os-badge ${available ? "os-badge--green" : "os-badge--red"}`}>
                                {property.status || "available"}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                                <Link href={`/property/${identifier}`} className="os-tablebtn">View</Link>
                                <Link href={`/property/${identifier}/edit`} className="os-tablebtn">Edit</Link>
                                <button className="os-tablebtn os-tablebtn--danger" onClick={() => handleDelete(identifier)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                  <h3>Inbox clear</h3>
                  <p>When customers enquire about your listings, their messages arrive here.</p>
                </div>
              ) : (
                <div className="os-stack">
                  {inquiries.map((inquiry) => (
                    <div className="os-inquiry" key={inquiry.id}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <h3>{inquiry.property?.title || "Property enquiry"}</h3>
                          <span className={`os-badge ${inquiry.status === "resolved" ? "os-badge--green" : "os-badge--gold"}`}>
                            {inquiry.status || "open"}
                          </span>
                        </div>
                        <p className="os-inquiry__meta">
                          {inquiry.property?.locality || inquiry.property?.location || "Vijayawada"} · received {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                        <div className="os-inquiry__msg">
                          <b>{inquiry.user?.name || "Customer"}</b>
                          {inquiry.user?.phone ? ` · ${inquiry.user.phone}` : ""}
                          <div style={{ marginTop: 6 }}>{inquiry.message}</div>
                        </div>
                      </div>
                      <div className="os-inquiry__side">
                        <Link href={`/contact-requests?inquiry=${inquiry.id}`} className="os-btn os-btn--gold os-btn--sm">
                          Reply
                        </Link>
                        {inquiry.property?.id || inquiry.property?._id ? (
                          <Link href={`/property/${inquiry.property.id || inquiry.property._id}`} className="os-tablebtn">
                            View property
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {active === "profile" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
              <div className="os-panel">
                <div className="os-panel__eyebrow">Agency profile</div>
                <h2 className="os-panel__title">{agencyName}</h2>
                <div className="os-form-grid">
                  <label className="os-field">
                    <span>Account name</span>
                    <input className="os-input" value={session.user?.name || ""} disabled />
                  </label>
                  <label className="os-field">
                    <span>Email address</span>
                    <input className="os-input" value={session.user?.email || ""} disabled />
                  </label>
                  <label className="os-field">
                    <span>Account type</span>
                    <input className="os-input" value="Agency" disabled />
                  </label>
                </div>
                <p className="os-hint" style={{ marginTop: 16 }}>
                  Your agency name appears on listings from the seller details you enter. Contact support
                  to change account credentials.
                </p>
              </div>

              <div className="os-panel">
                <div className="os-panel__eyebrow">Footprint</div>
                <h2 className="os-panel__title">Your presence</h2>
                <div className="os-info-list">
                  <div><span>Live listings</span><b>{stats.active}</b></div>
                  <div><span>Total listings</span><b>{stats.total}</b></div>
                  <div><span>Localities covered</span><b>{localities}</b></div>
                  <div><span>Property types</span><b>{byType.length}</b></div>
                  <div><span>Open enquiries</span><b>{inquiries.filter((item) => item.status !== "resolved").length}</b></div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
