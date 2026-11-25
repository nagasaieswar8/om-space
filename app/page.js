"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertySkeleton from "@/components/PropertySkeleton";
import Reveal from "@/components/Reveal";
import Counter from "@/components/Counter";

const LOCALITIES = [
  "Tadepalli",
  "Benz Circle",
  "Moghalrajpuram",
  "Machilipatnam",
  "Dwaraka Nagar",
  "Vijayawada City Center",
];

const PROPERTY_TYPES = [
  "Residential Apartment",
  "Independent House/Villa",
  "Residential Land",
  "Commercial Office Space",
  "Shop/Showroom",
  "Builder Floor",
];

const BUDGETS = [
  { value: "", label: "Any budget" },
  { value: "5000000", label: "Under ₹50 L" },
  { value: "10000000", label: "Under ₹1 Cr" },
  { value: "30000000", label: "Under ₹3 Cr" },
  { value: "50000000", label: "Under ₹5 Cr" },
];

const CATEGORIES = [
  { name: "Apartments", type: "Residential Apartment", image: "/images/apartment.jpg", note: "City living, beautifully arranged" },
  { name: "Villas", type: "Independent House/Villa", image: "/images/villa.jpg", note: "Private space, generous light" },
  { name: "Independent houses", type: "Independent House/Villa", image: "/images/independent-house.jpg", note: "A home that is entirely yours" },
  { name: "Commercial", type: "Commercial Office Space", image: "/images/commercial.jpg", note: "Workspaces with presence" },
  { name: "Plots", type: "Residential Land", image: "/images/plot.jpg", note: "Build your own beginning" },
];

const LOCATION_IMAGES = {
  Tadepalli: "/images/loc-tadepalli.jpg",
  "Benz Circle": "/images/loc-benz-circle.jpg",
  Moghalrajpuram: "/images/loc-moghalrajpuram.jpg",
  Machilipatnam: "/images/plot.jpg",
  "Dwaraka Nagar": "/images/loc-dwaraka.jpg",
  "Vijayawada City Center": "/images/loc-city-center.jpg",
};

const TESTIMONIALS = [
  {
    quote: "We found a home that actually matched the way we live. The listings were honest, and the agency replied the same day.",
    name: "Ananya & Rohit",
    detail: "First-time buyers · Tadepalli",
    initials: "AR",
  },
  {
    quote: "As an agency, OM SPACE gives us a clean place to present properties and a simple inbox for every enquiry.",
    name: "Kiran Reddy",
    detail: "Partner agency · Benz Circle",
    initials: "KR",
  },
  {
    quote: "The comparison view saved us weeks. We could see price, area and location side by side before calling anyone.",
    name: "Meera S.",
    detail: "Renting in Vijayawada",
    initials: "MS",
  },
];

const WHY = [
  {
    title: "Verified, presentable listings",
    body: "Every property is presented with the details that matter — location, area, price and agency — so you can decide with confidence.",
  },
  {
    title: "A calmer way to search",
    body: "Filter by locality, property type, budget and bedrooms. Switch to map view when you want to understand the neighbourhood.",
  },
  {
    title: "Direct agency conversations",
    body: "Send an enquiry from any property page and continue the conversation from your customer portal. No middle layers.",
  },
  {
    title: "One platform, three portals",
    body: "Customers discover, agencies manage, administrators oversee. Everyone works from the same source of truth.",
  },
];

function agencyInitials(name) {
  return name
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const ctaRef = useRef(null);

  const loadProperties = () => {
    setLoading(true);
    setLoadError(false);
    fetch("/api/properties?limit=12&sortBy=createdAt&sortOrder=desc")
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        setProperties(data.properties || []);
        setTotal(data.pagination?.total || 0);
      })
      .catch(() => {
        setProperties([]);
        setTotal(0);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const section = ctaRef.current;
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const layer = section.querySelector(".os-cta__bg");
        if (layer) layer.style.transform = `translate3d(0, ${rect.top * -0.08}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const runSearch = () => {
    const params = new URLSearchParams();
    if (location.trim()) params.set("search", location.trim());
    if (type) params.set("type", type);
    if (budget) params.set("maxPrice", budget);
    router.push(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const featured = [...properties]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, 8);

  const localityCounts = properties.reduce((acc, property) => {
    const key = property.locality;
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const agencyMap = new Map();
  properties.forEach((property) => {
    const name = property.seller_company || property.seller_name;
    if (!name) return;
    const entry = agencyMap.get(name) || { name, listings: 0, localities: new Set() };
    entry.listings += 1;
    if (property.locality) entry.localities.add(property.locality);
    agencyMap.set(name, entry);
  });
  const agencies = [...agencyMap.values()].sort((a, b) => b.listings - a.listings).slice(0, 3);

  const portalHref = session
    ? session.user?.role === "admin"
      ? "/admin"
      : session.user?.role === "agency"
        ? "/agency-dashboard"
        : "/customer-dashboard"
    : "/login";

  const submitNewsletter = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="os-hero">
          <div
            className="os-hero__bg"
            role="img"
            aria-label="A modern luxury home with a pool at dusk"
            style={{ backgroundImage: "url('/images/hero-villa.jpg')" }}
          />
          <div className="os-hero__overlay" />
          <div className="os-hero__grain" />
          <span className="os-hero__orb os-hero__orb--one" aria-hidden="true" />
          <span className="os-hero__orb os-hero__orb--two" aria-hidden="true" />

          <div className="os-container os-hero__inner">
            <div className="os-hero__content">
              <span className="os-eyebrow os-anim-up">Vijayawada · Andhra Pradesh</span>
              <h1 className="os-hero__title os-anim-up os-delay-1">
                Find a Place Where<br />
                Your <em>Story</em> Begins.
              </h1>
              <p className="os-hero__sub os-anim-up os-delay-2">
                OM SPACE brings together verified homes, trusted local agencies and a search
                experience that feels considered from the first click to the final key.
              </p>

              <div className="os-searchbar os-anim-up os-delay-3" role="search" aria-label="Property search">
                <label className="os-searchbar__field">
                  <span className="os-searchbar__label">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Location
                  </span>
                  <input
                    className="os-searchbar__control"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runSearch()}
                    placeholder="Locality, project or landmark"
                    aria-label="Location"
                  />
                </label>

                <label className="os-searchbar__field">
                  <span className="os-searchbar__label">Property type</span>
                  <select className="os-searchbar__control" value={type} onChange={(e) => setType(e.target.value)} aria-label="Property type">
                    <option value="">All property types</option>
                    {PROPERTY_TYPES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="os-searchbar__field">
                  <span className="os-searchbar__label">Budget</span>
                  <select className="os-searchbar__control" value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Budget">
                    {BUDGETS.map((item) => (
                      <option key={item.label} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>

                <button className="os-btn os-btn--gold" onClick={runSearch}>
                  Search homes
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>

              <div className="os-hero__actions os-anim-up os-delay-4">
                <Link href="/listings" className="os-btn os-btn--light">
                  Explore properties
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <a href="#why" className="os-btn os-btn--outline-light">Why OM SPACE</a>
              </div>

              <div className="os-hero__stats">
                <div className="os-hero__stat">
                  <b><Counter value={total} suffix="+" /></b>
                  <span>Live listings</span>
                </div>
                <div className="os-hero__stat">
                  <b><Counter value={LOCALITIES.length} /></b>
                  <span>Prime localities</span>
                </div>
                <div className="os-hero__stat">
                  <b><Counter value={PROPERTY_TYPES.length} /></b>
                  <span>Property types</span>
                </div>
              </div>
            </div>
          </div>

          <span className="os-hero__scroll" aria-hidden="true">
            <i />
            Scroll to explore
          </span>
        </section>

        {/* ── Featured properties ──────────────────────────────── */}
        <section className="os-section os-section--cream" id="featured">
          <div className="os-container">
            <div className="os-section-head">
              <Reveal>
                <span className="os-eyebrow">Handpicked for you</span>
                <h2 className="os-h2">
                  Featured <span className="os-italic">properties</span>
                </h2>
                <p className="os-lead">
                  A considered selection of homes across Vijayawada — each one presented with the
                  detail you need before you pick up the phone.
                </p>
              </Reveal>
              <Reveal delay={120}>
                <Link href="/listings" className="os-textlink">
                  View all properties
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </Reveal>
            </div>

            {loading ? (
              <div className="os-grid">
                <PropertySkeleton count={3} />
              </div>
            ) : loadError ? (
              <div className="os-empty">
                <h3>Listings are taking a moment</h3>
                <p>We could not reach the property service. Your connection and database are untouched.</p>
                <button className="os-btn" onClick={loadProperties}>Try again</button>
              </div>
            ) : featured.length === 0 ? (
              <div className="os-empty">
                <h3>No listings yet</h3>
                <p>Be the first to publish a property on OM SPACE.</p>
                <Link href={session?.user?.role === "agency" || session?.user?.role === "admin" ? "/property/add" : "/agency-login"} className="os-btn">
                  List a property
                </Link>
              </div>
            ) : (
              <div className="os-grid">
                {featured.map((property, index) => (
                  <Reveal key={property.id || property._id} delay={index * 60}>
                    <PropertyCard prop={property} index={index} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Categories ───────────────────────────────────────── */}
        <section className="os-section os-section--white">
          <div className="os-container">
            <div className="os-section-head">
              <Reveal>
                <span className="os-eyebrow">Explore by category</span>
                <h2 className="os-h2">
                  Every kind of <span className="os-italic">address</span>
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="os-lead" style={{ maxWidth: 360 }}>
                  From a first apartment to a commercial floor, start with the shape of the space
                  you have in mind.
                </p>
              </Reveal>
            </div>

            <div className="os-cats">
              {CATEGORIES.map((category, index) => (
                <Reveal key={category.name} delay={index * 70} variant="zoom">
                  <Link href={`/listings?type=${encodeURIComponent(category.type)}`} className="os-cat" style={{ display: "flex" }}>
                    <img src={category.image} alt={category.name} loading="lazy" />
                    <span className="os-cat__arrow" aria-hidden="true">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </span>
                    <div className="os-cat__body">
                      <span className="os-cat__count">Collection</span>
                      <h3 className="os-cat__name">{category.name}</h3>
                      <p style={{ fontSize: 11, color: "rgba(247,244,236,.62)", marginTop: 5 }}>{category.note}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why ──────────────────────────────────────────────── */}
        <section className="os-section os-section--cream" id="why">
          <div className="os-container os-why">
            <Reveal variant="left" className="os-why__media">
              <img src="/images/cta-home.jpg" alt="A contemporary home at dusk" loading="lazy" />
              <div className="os-why__badge">
                <b>3</b>
                <span>Connected portals. One calm experience.</span>
              </div>
            </Reveal>

            <Reveal variant="right" delay={100}>
              <span className="os-eyebrow">Why choose OM SPACE</span>
              <h2 className="os-h2" style={{ marginTop: 16 }}>
                Real estate, with the <span className="os-italic">noise</span> removed.
              </h2>
              <p className="os-lead" style={{ marginTop: 16, marginBottom: 26 }}>
                Finding a property should not feel like admin work. We keep the listing clear, the
                agency reachable and the next step obvious.
              </p>
              {WHY.map((item, index) => (
                <div className="os-feature" key={item.title}>
                  <span className="os-feature__num">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Locations ────────────────────────────────────────── */}
        <section className="os-section os-section--white" id="locations">
          <div className="os-container">
            <div className="os-section-head">
              <Reveal>
                <span className="os-eyebrow">Popular locations</span>
                <h2 className="os-h2">
                  Neighbourhoods worth <span className="os-italic">knowing</span>
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <Link href="/listings" className="os-textlink">
                  Browse the map
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </Reveal>
            </div>

            <div className="os-locs">
              {LOCALITIES.slice(0, 6).map((locality, index) => (
                <Reveal key={locality} delay={index * 55}>
                  <Link href={`/listings?search=${encodeURIComponent(locality)}`} className="os-loc" style={{ display: "flex" }}>
                    <img src={LOCATION_IMAGES[locality] || "/images/loc-city-center.jpg"} alt={locality} loading="lazy" />
                    <div className="os-loc__body">
                      <div>
                        <div className="os-loc__name">{locality}</div>
                        <div className="os-loc__meta">
                          {localityCounts[locality] ? `${localityCounts[locality]} listing${localityCounts[locality] > 1 ? "s" : ""} here` : "Explore the area"}
                        </div>
                      </div>
                      <span className="os-loc__arrow" aria-hidden="true">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="os-section os-section--tight os-section--cream">
          <div className="os-container">
            <div className="os-cta" ref={ctaRef}>
              <div className="os-cta__bg" style={{ backgroundImage: "url('/images/independent-house.jpg')" }} />
              <Reveal className="os-cta__body">
                <span className="os-eyebrow">Your next chapter</span>
                <h2 className="os-h2" style={{ marginTop: 16 }}>
                  Find your <span className="os-italic">dream home</span> without the guesswork.
                </h2>
                <p className="os-lead">
                  Start with a locality, a budget or a feeling. We will show you homes that fit the
                  life you are building.
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
                  <Link href="/listings" className="os-btn os-btn--gold">Start exploring</Link>
                  <Link href={session ? portalHref : "/register"} className="os-btn os-btn--outline-light">
                    {session ? "Open my portal" : "Create an account"}
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Agencies ─────────────────────────────────────────── */}
        <section className="os-section os-section--white" id="agencies">
          <div className="os-container">
            <div className="os-section-head">
              <Reveal>
                <span className="os-eyebrow">Trusted agencies</span>
                <h2 className="os-h2">
                  People who know the <span className="os-italic">ground</span>
                </h2>
                <p className="os-lead">
                  Work with agencies already publishing on OM SPACE. Their listings and enquiries
                  live in the same platform.
                </p>
              </Reveal>
              <Reveal delay={100}>
                <Link href="/register?role=agency" className="os-textlink">
                  Become a partner
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </Reveal>
            </div>

            <div className="os-agencies">
              {agencies.map((agency, index) => (
                <Reveal key={agency.name} delay={index * 70}>
                  <div className="os-agency">
                    <div className="os-agency__mark">{agencyInitials(agency.name) || "OS"}</div>
                    <h3>{agency.name}</h3>
                    <p>Verified agency on OM SPACE</p>
                    <div className="os-agency__stats">
                      <div>
                        <b>{agency.listings}</b>
                        <span>Listings</span>
                      </div>
                      <div>
                        <b>{agency.localities.size}</b>
                        <span>Localities</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}

              <Reveal delay={agencies.length * 70}>
                <div className="os-agency os-agency--dark">
                  <div className="os-agency__mark">+</div>
                  <h3>Your agency here</h3>
                  <p>
                    Publish listings, manage enquiries and build a presence on OM SPACE.
                  </p>
                  <div style={{ marginTop: 18 }}>
                    <Link href="/register?role=agency" className="os-btn os-btn--gold os-btn--sm">Join as an agency</Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────── */}
        <section className="os-section os-section--cream">
          <div className="os-container">
            <div className="os-section-head">
              <Reveal>
                <span className="os-eyebrow">In their words</span>
                <h2 className="os-h2">
                  A platform people <span className="os-italic">return</span> to
                </h2>
              </Reveal>
            </div>
            <div className="os-quotes">
              {TESTIMONIALS.map((testimonial, index) => (
                <Reveal key={testimonial.name} delay={index * 80}>
                  <div className="os-quote">
                    <div className="os-quote__stars" aria-label="5 out of 5 stars">★★★★★</div>
                    <blockquote>“{testimonial.quote}”</blockquote>
                    <div className="os-quote__person">
                      <span className="os-quote__avatar">{testimonial.initials}</span>
                      <div>
                        <b>{testimonial.name}</b>
                        <span>{testimonial.detail}</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Newsletter ───────────────────────────────────────── */}
        <section className="os-section os-section--white" id="newsletter">
          <div className="os-container">
            <Reveal>
              <div className="os-news">
                <div>
                  <span className="os-eyebrow">Stay in the know</span>
                  <h2 className="os-h2" style={{ marginTop: 14 }}>
                    The best of OM SPACE, <span className="os-italic">occasionally</span>.
                  </h2>
                  <p className="os-lead" style={{ marginTop: 14 }}>
                    New listings, neighbourhood notes and practical buying advice. No noise, no spam.
                  </p>
                </div>
                <div>
                  <form className="os-news__form" onSubmit={submitNewsletter}>
                    <input
                      className="os-news__input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      aria-label="Email address"
                    />
                    <button type="submit" className="os-btn os-btn--gold">Subscribe</button>
                  </form>
                  {subscribed ? (
                    <p className="os-news__success">You are on the list. We will be in touch soon.</p>
                  ) : (
                    <p className="os-news__note">By subscribing you agree to receive occasional emails from OM SPACE.</p>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
