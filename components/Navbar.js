"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Brand from "@/components/Brand";

const BUY_LINKS = [
  { label: "All properties for sale", note: "Browse every available home", href: "/listings?listing_type=P" },
  { label: "Apartments", note: "Residential apartment homes", href: "/listings?listing_type=P&type=Residential%20Apartment" },
  { label: "Villas & independent houses", note: "Space to grow into", href: "/listings?listing_type=P&type=Independent%20House%2FVilla" },
  { label: "Plots & land", note: "Build from the ground up", href: "/listings?listing_type=P&type=Residential%20Land" },
  { label: "Commercial spaces", note: "Offices and showrooms", href: "/listings?listing_type=P&type=Commercial%20Office%20Space" },
];

const RENT_LINKS = [
  { label: "All rental homes", note: "Move in sooner", href: "/listings?listing_type=R" },
  { label: "Apartments for rent", note: "City living, ready now", href: "/listings?listing_type=R&type=Residential%20Apartment" },
  { label: "Villas & houses for rent", note: "More room to live", href: "/listings?listing_type=R&type=Independent%20House%2FVilla" },
  { label: "Commercial rentals", note: "Offices and retail", href: "/listings?listing_type=R&type=Commercial%20Office%20Space" },
];

function NavbarContent() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const role = session?.user?.role;
  const listing = searchParams.get("listing") || searchParams.get("listing_type");
  const isHome = pathname === "/";
  const solid = !isHome || scrolled;

  const portal =
    role === "admin"
      ? { label: "Admin portal", href: "/admin" }
      : role === "agency"
        ? { label: "Agency portal", href: "/agency-dashboard" }
        : { label: "My portal", href: "/customer-dashboard" };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("os-lock", open);
    return () => document.body.classList.remove("os-lock");
  }, [open]);

  const isBuy = listing === "P" || listing === "Buy";
  const isRent = listing === "R" || listing === "Rent";
  const active = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const openAgencyTools = () =>
    router.push(role === "agency" || role === "admin" ? "/property/add" : "/agency-login");

  const links = [
    { label: "Home", href: "/" },
    { label: "Buy", href: "/listings?listing_type=P", menu: BUY_LINKS, on: isBuy },
    { label: "Rent", href: "/listings?listing_type=R", menu: RENT_LINKS, on: isRent },
    { label: "Agencies", href: "/#agencies" },
    { label: "About us", href: "/#why" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <>
      <header className={`os-nav ${solid ? "os-nav--solid" : "os-nav--over"} ${open ? "os-nav--open" : ""}`}>
        <div className="os-container os-nav__inner">
          <Link href="/" aria-label="OM SPACE home">
            <Brand />
          </Link>

          <nav className="os-nav__links" aria-label="Primary">
            {links.map((link) => (
              <div className="os-nav__item" key={link.label}>
                <Link
                  href={link.href}
                  className={`os-nav__link ${(link.on ?? active(link.href)) ? "is-active" : ""}`}
                >
                  {link.label}
                  {link.menu && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </Link>
                {link.menu && (
                  <div className="os-dropdown">
                    {link.menu.map((item) => (
                      <Link href={item.href} key={item.label}>
                        {item.label}
                        <small>{item.note}</small>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="os-nav__actions">
            {session ? (
              <>
                <span className="os-nav__meta">
                  Welcome, <strong>{session.user?.name?.split(" ")[0] || "friend"}</strong>
                </span>
                <Link href={portal.href} className="os-btn os-btn--sm os-auth-desktop" style={{ background: "transparent", color: "inherit", borderColor: "currentColor" }}>
                  {portal.label}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="os-nav__meta"
                  style={{ background: "none", border: 0, padding: "8px 4px", color: "inherit", cursor: "pointer" }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openAgencyTools}
                  className="os-nav__meta os-auth-desktop"
                  style={{ background: "none", border: 0, padding: 0, color: "inherit", cursor: "pointer" }}
                >
                  List a property
                </button>
                <Link
                  href="/login"
                  className="os-btn os-btn--sm os-auth-desktop"
                  style={{ background: "transparent", color: "inherit", borderColor: "currentColor" }}
                >
                  Sign in
                </Link>
                <Link href="/register" className="os-btn os-btn--gold os-btn--sm os-nav__join">
                  Join OM SPACE
                </Link>
              </>
            )}
            <button
              className={`os-nav__toggle ${open ? "is-open" : ""}`}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="os-mobile">
          {links.map((link) => (
            <Link key={link.label} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/help" onClick={() => setOpen(false)}>Help</Link>

          <div className="os-mobile__group">
            {session ? (
              <>
                <Link href={portal.href} className="os-btn os-btn--gold" onClick={() => setOpen(false)}>
                  {portal.label}
                </Link>
                {role === "agency" || role === "admin" ? (
                  <Link href="/property/add" className="os-btn os-btn--outline-light" onClick={() => setOpen(false)}>
                    List a property
                  </Link>
                ) : null}
                <button
                  className="os-btn os-btn--outline-light"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="os-btn os-btn--gold" onClick={() => setOpen(false)}>
                  Customer sign in
                </Link>
                <Link href="/register" className="os-btn os-btn--outline-light" onClick={() => setOpen(false)}>
                  Create an account
                </Link>
                <Link href="/agency-login" className="os-btn os-btn--outline-light" onClick={() => setOpen(false)}>
                  Agency portal
                </Link>
                <Link href="/admin-login" className="os-btn os-btn--outline-light" onClick={() => setOpen(false)}>
                  Admin portal
                </Link>
              </>
            )}
          </div>
          <span className="os-mobile__eyebrow">Vijayawada · Andhra Pradesh</span>
        </div>
      )}
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div style={{ height: "var(--os-nav-h)" }} />}>
      <NavbarContent />
    </Suspense>
  );
}
