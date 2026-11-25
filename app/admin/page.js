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
  { id: "properties", label: "Properties" },
  { id: "users", label: "Users" },
  { id: "agencies", label: "Agencies" },
];

const NAV_ICONS = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  properties: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  users: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></>,
  agencies: <><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></>,
};

function NavIcon({ id }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {NAV_ICONS[id]}
    </svg>
  );
}

function priceOf(prop) {
  return prop.price ? priceLabel(prop.price) : "On request";
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [active, setActive] = useState("overview");
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalProperties: 0, activeListings: 0, totalInquiries: 0 });
  const [loading, setLoading] = useState(true);
  const [propertyQuery, setPropertyQuery] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin-login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.replace(roleHome(session?.user?.role));
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role !== "admin") return;

    Promise.all([
      fetch("/api/properties?limit=100").then((res) => res.json()),
      fetch("/api/properties?limit=1&status=available").then((res) => res.json()),
      fetch("/api/admin/users").then((res) => res.json()),
      fetch("/api/inquiries").then((res) => res.json()),
    ])
      .then(([propertyData, activeData, userData, inquiryData]) => {
        setProperties(propertyData.properties || []);
        setUsers(userData.users || []);
        setStats({
          totalProperties: propertyData.pagination?.total || 0,
          activeListings: activeData.pagination?.total || 0,
          totalInquiries: inquiryData.total ?? (inquiryData.inquiries || []).length,
        });
      })
      .catch((error) => console.error("Admin data:", error))
      .finally(() => setLoading(false));
  }, [session?.user?.role]);

  const roleCounts = useMemo(() => {
    const counts = { customer: 0, agency: 0, admin: 0 };
    users.forEach((user) => {
      if (counts[user.role] !== undefined) counts[user.role] += 1;
    });
    return counts;
  }, [users]);

  const agencyUsers = useMemo(() => {
    return users
      .filter((user) => user.role === "agency")
      .map((user) => {
        const listings = properties.filter((property) => {
          const owner = String(property.agentId || "");
          if (owner && (owner === String(user.id || "") || owner === String(user._id || ""))) return true;
          if (property.agent && property.agent.toLowerCase() === (user.email || "").toLowerCase()) return true;
          const seller = property.seller_company || property.seller_name;
          return seller && seller.toLowerCase() === (user.name || "").toLowerCase();
        });
        return { ...user, listings: listings.length };
      })
      .sort((a, b) => b.listings - a.listings);
  }, [users, properties]);

  const filteredProperties = useMemo(() => {
    const query = propertyQuery.trim().toLowerCase();
    return properties.filter((property) => {
      if (propertyStatus && (property.status || "available") !== propertyStatus) return false;
      if (!query) return true;
      return [property.title, property.locality, property.location, property.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [properties, propertyQuery, propertyStatus]);

  const filteredUsers = useMemo(
    () => users.filter((user) => !roleFilter || user.role === roleFilter),
    [users, roleFilter]
  );

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
            <div className="os-skeleton" style={{ height: 360, borderRadius: 20 }} />
          </main>
        </div>
      </>
    );
  }

  if (!session || session.user?.role !== "admin") return null;

  const handleDeleteProperty = async (id) => {
    if (!confirm("Delete this property?")) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
        return;
      }
      setProperties((current) => current.filter((property) => (property._id || property.id) !== id));
      setStats((current) => ({ ...current, totalProperties: Math.max(0, current.totalProperties - 1) }));
    } catch {
      alert("Error deleting property");
    }
  };

  const handleDeleteUser = async (email) => {
    if (!confirm("Delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete user");
        return;
      }
      setUsers((current) => current.filter((user) => user.email !== email));
    } catch {
      alert("Error deleting user");
    }
  };

  const initials = (session.user?.name || "OS")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const unavailable = Math.max(0, stats.totalProperties - stats.activeListings);

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
              <span>Administrator</span>
            </div>
          </div>

          <nav className="os-portal__nav" aria-label="Admin portal">
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
                {item.id === "agencies" && roleCounts.agency > 0 && <small>{roleCounts.agency}</small>}
              </button>
            ))}
          </nav>

          <div className="os-portal__bottom">
            <Link href="/listings" className="os-btn os-btn--gold os-btn--sm os-btn--block">Open public site</Link>
            <Link href="/help" className="os-btn os-btn--outline-light os-btn--sm os-btn--block" style={{ marginTop: 8 }}>
              Help centre
            </Link>
          </div>
        </aside>

        <main className="os-portal__main">
          <div className="os-portal__top">
            <div>
              <span className="os-eyebrow">Admin portal</span>
              <h1>{active === "overview" ? "Platform at a glance." : "Manage the platform."}</h1>
              <p>Users, agencies and listings across OM SPACE, in one view.</p>
            </div>
            <Link href="/property/add" className="os-btn os-btn--ghost">Add property</Link>
          </div>

          {active === "overview" && (
            <>
              <div className="os-stats">
                {[
                  { label: "Total properties", value: stats.totalProperties },
                  { label: "Registered agencies", value: roleCounts.agency },
                  { label: "Customer accounts", value: roleCounts.customer },
                  { label: "Total enquiries", value: stats.totalInquiries },
                ].map((stat) => (
                  <div className="os-stat" key={stat.label}>
                    <b><Counter value={stat.value} /></b>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
                <div className="os-panel">
                  <div className="os-panel__eyebrow">Customer activity</div>
                  <h2 className="os-panel__title">Who is on the platform</h2>
                  <div className="os-bars">
                    {[
                      { label: "Customers", value: roleCounts.customer },
                      { label: "Agencies", value: roleCounts.agency },
                      { label: "Administrators", value: roleCounts.admin },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="os-bar__head">
                          <b>{row.label}</b>
                          <span>{row.value} account{row.value === 1 ? "" : "s"}</span>
                        </div>
                        <div className="os-bar__track">
                          <div
                            className="os-bar__fill"
                            style={{ width: `${Math.round((row.value / Math.max(1, users.length)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="os-info-list" style={{ marginTop: 22 }}>
                    <div><span>Total registered users</span><b>{users.length}</b></div>
                    <div><span>Active listings</span><b>{stats.activeListings}</b></div>
                    <div><span>Sold / unavailable</span><b>{unavailable}</b></div>
                  </div>
                </div>

                <div className="os-panel">
                  <div className="os-panel__eyebrow">Recent listings</div>
                  <h2 className="os-panel__title">Newest properties</h2>
                  {properties.length === 0 ? (
                    <p className="os-hint">No properties have been published yet.</p>
                  ) : (
                    properties.slice(0, 5).map((property) => (
                      <div
                        key={property._id || property.id}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--os-line)" }}
                      >
                        <img
                          src={getImageSrc(property)}
                          alt=""
                          style={{ width: 42, height: 36, borderRadius: 6, objectFit: "cover" }}
                          onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <b style={{ display: "block", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {property.title}
                          </b>
                          <span className="os-hint">{property.locality || property.location || "Vijayawada"}</span>
                        </div>
                        <span className="os-hint" style={{ whiteSpace: "nowrap" }}>{priceOf(property)}</span>
                      </div>
                    ))
                  )}
                  <button className="os-btn os-btn--ghost os-btn--sm" style={{ marginTop: 16 }} onClick={() => setActive("properties")}>
                    Manage all properties
                  </button>
                </div>
              </div>
            </>
          )}

          {active === "properties" && (
            <div>
              <div className="os-results-bar">
                <h2>{stats.totalProperties} <small>properties on the platform</small></h2>
                <div className="os-results-tools">
                  <input
                    className="os-input"
                    style={{ width: 220, padding: "9px 12px", fontSize: 12 }}
                    placeholder="Search title or locality"
                    value={propertyQuery}
                    onChange={(event) => setPropertyQuery(event.target.value)}
                  />
                  <select
                    className="os-select"
                    style={{ width: 150, padding: "9px 12px", fontSize: 12 }}
                    value={propertyStatus}
                    onChange={(event) => setPropertyStatus(event.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="os-empty">
                  <h3>No properties found</h3>
                  <p>Try a different search or status.</p>
                  <button className="os-btn" onClick={() => { setPropertyQuery(""); setPropertyStatus(""); }}>Reset</button>
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
                      {filteredProperties.map((property) => {
                        const identifier = property.id || property._id;
                        const available = (property.status || "available") === "available";
                        return (
                          <tr key={property._id || identifier}>
                            <td>
                              <div className="os-table__prop">
                                <img
                                  src={getImageSrc(property)}
                                  alt={property.title}
                                  onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }}
                                />
                                <div>
                                  <b>{property.title}</b>
                                  <span>{property.locality || property.location || "Vijayawada"}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{priceOf(property)}</td>
                            <td>
                              <span className={`os-badge ${available ? "os-badge--green" : "os-badge--red"}`}>
                                {property.status || "available"}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                <Link href={`/property/${identifier}`} className="os-tablebtn">View</Link>
                                <button className="os-tablebtn os-tablebtn--danger" onClick={() => handleDeleteProperty(property._id || identifier)}>
                                  Delete
                                </button>
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

          {active === "users" && (
            <div>
              <div className="os-results-bar">
                <h2>{users.length} <small>registered users</small></h2>
                <div className="os-tabs">
                  {[
                    { value: "", label: "All", count: users.length },
                    { value: "customer", label: "Customers", count: roleCounts.customer },
                    { value: "agency", label: "Agencies", count: roleCounts.agency },
                    { value: "admin", label: "Admins", count: roleCounts.admin },
                  ].map((option) => (
                    <button
                      key={option.value || "all"}
                      className={`os-tab ${roleFilter === option.value ? "is-on" : ""}`}
                      onClick={() => setRoleFilter(option.value)}
                    >
                      {option.label} <small>{option.count}</small>
                    </button>
                  ))}
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="os-empty">
                  <h3>No users in this group</h3>
                  <p>Choose another role filter to see more accounts.</p>
                </div>
              ) : (
                <div className="os-tablewrap">
                  <table className="os-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id || user.email}>
                          <td style={{ fontWeight: 600 }}>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`os-badge ${user.role === "agency" ? "os-badge--gold" : user.role === "admin" ? "os-badge--red" : "os-badge--green"}`}>
                              {user.role}
                            </span>
                          </td>
                          <td style={{ color: "var(--os-grey)" }}>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button className="os-tablebtn os-tablebtn--danger" onClick={() => handleDeleteUser(user.email)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {active === "agencies" && (
            <div>
              <div className="os-results-bar">
                <h2>{agencyUsers.length} <small>registered agenc{agencyUsers.length === 1 ? "y" : "ies"}</small></h2>
              </div>
              {agencyUsers.length === 0 ? (
                <div className="os-empty">
                  <h3>No agencies yet</h3>
                  <p>Agency accounts will appear here once they register.</p>
                  <Link href="/register?role=agency" className="os-btn">Invite an agency</Link>
                </div>
              ) : (
                <div className="os-tablewrap">
                  <table className="os-table">
                    <thead>
                      <tr>
                        <th>Agency</th>
                        <th>Email</th>
                        <th>Listings</th>
                        <th>Joined</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agencyUsers.map((agency) => (
                        <tr key={agency.id || agency.email}>
                          <td>
                            <div className="os-table__prop">
                              <span
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  background: "var(--os-cream)",
                                  border: "1px solid var(--os-line)",
                                  display: "grid",
                                  placeItems: "center",
                                  fontFamily: "var(--os-serif)",
                                  color: "var(--os-forest)",
                                  flexShrink: 0,
                                }}
                              >
                                {(agency.name || "A").slice(0, 1).toUpperCase()}
                              </span>
                              <b>{agency.name}</b>
                            </div>
                          </td>
                          <td>{agency.email}</td>
                          <td><span className="os-badge os-badge--grey">{agency.listings} listings</span></td>
                          <td style={{ color: "var(--os-grey)" }}>
                            {agency.createdAt ? new Date(agency.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Link href="/agency-dashboard" className="os-tablebtn">Open portal</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
