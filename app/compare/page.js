"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { priceLabel } from "@/lib/constants";
import { useCompare } from "@/lib/CompareContext";

function PropertyComparison({ properties }) {
  if (properties.length === 0) {
    return (
      <>
        <Navbar />
        <section className="os-page-hero">
          <div className="os-container os-page-hero__inner">
            <div className="os-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <b>Compare</b>
            </div>
            <span className="os-eyebrow">Side by side</span>
            <h1>
              Compare <span className="os-italic">properties</span>.
            </h1>
            <p className="os-lead">Put shortlisted homes next to each other before you decide.</p>
          </div>
        </section>
        <main className="os-container" style={{ paddingBlock: "40px 80px" }}>
          <div className="os-empty">
            <h3>Nothing to compare yet</h3>
            <p>Add properties from the listings page using the compare button on each card.</p>
            <Link href="/listings" className="os-btn os-btn--gold">Browse properties</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const prices = properties.map((p) => parseFloat(p.min_price) || 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const priceTone = (p) => {
    const price = parseFloat(p.min_price) || 0;
    if (price === minPrice && prices.filter((x) => x === minPrice).length === 1) return "is-low";
    if (price === maxPrice && prices.filter((x) => x === maxPrice).length === 1) return "is-high";
    return "";
  };

  const fields = [
    { label: "Price", fn: (p) => priceLabel(p.price) },
    { label: "Type", fn: (p) => p.type || "N/A" },
    { label: "Locality", fn: (p) => p.locality || p.location || "N/A" },
    { label: "Bedrooms", fn: (p) => p.bedrooms && p.bedrooms !== "0" ? `${p.bedrooms} BHK` : "N/A" },
    { label: "Bathrooms", fn: (p) => p.bathrooms && p.bathrooms !== "0" ? p.bathrooms : "N/A" },
    { label: "Area", fn: (p) => p.area || "N/A" },
    {
      label: "Price/sqft",
      fn: (p) => p.price_per_sqft && p.price_per_sqft !== "0"
        ? `₹${parseFloat(p.price_per_sqft).toLocaleString("en-IN")}`
        : "N/A",
    },
    { label: "Total floors", fn: (p) => p.total_floors && p.total_floors !== "0" ? p.total_floors : "N/A" },
    { label: "Age", fn: (p) => p.age && p.age !== "0" ? `${p.age} years` : "N/A" },
    {
      label: "Listing type",
      fn: (p) => {
        if (p.listing_type === "P") return "Buy";
        if (p.listing_type === "R") return "Rent";
        if (p.listing_type === "PG") return "PG";
        return p.listing || "N/A";
      },
    },
    { label: "New launch", fn: (p) => p.is_new_launch === "Y" ? "Yes" : "No" },
    { label: "Verified", fn: (p) => p.verified ? "Yes" : "No" },
    { label: "Seller", fn: (p) => p.seller_name || p.seller_company || "N/A" },
  ];

  return (
    <>
      <Navbar />
      <section className="os-page-hero">
        <div className="os-container os-page-hero__inner">
          <div className="os-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Listings</span>
            <span>/</span>
            <b>Compare</b>
          </div>
          <span className="os-eyebrow">Side by side</span>
          <h1>
            Compare <span className="os-italic">properties</span>.
          </h1>
          <p className="os-lead">
            {properties.length} {properties.length === 1 ? "property" : "properties"} lined up on price,
            space and location so the trade-offs are obvious.
          </p>
        </div>
      </section>

      <main className="os-container" style={{ paddingBlock: "34px 80px" }}>
        <div className="os-compare-wrap">
          <table className="os-compare">
            <thead>
              <tr>
                <th>Feature</th>
                {properties.map((prop, i) => {
                  const image = prop.images?.[0]
                    ? `https://images.weserv.nl/?url=${encodeURIComponent(prop.images[0])}&w=400&q=80`
                    : "/images/placeholder.jpg";
                  return (
                    <th key={prop.id || prop._id || i}>
                      <Link href={`/property/${prop.id || prop._id}`} aria-label={`View ${prop.title || "property"}`}>
                        <img
                          src={image}
                          alt={prop.title || "Property image"}
                          className="os-compare__img"
                          onError={(event) => { event.target.src = "/images/placeholder.jpg"; }}
                        />
                      </Link>
                      <div className="os-compare__name">{prop.title || "Property"}</div>
                      <div className="os-compare__loc">{prop.locality || prop.location || "Vijayawada"}</div>
                      <div className="os-compare__price">{priceLabel(prop.price)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.label}>
                  <td>{field.label}</td>
                  {properties.map((prop, i) => {
                    const isPrice = field.label === "Price";
                    return (
                      <td key={i} className={isPrice ? priceTone(prop) : ""}>
                        {field.fn(prop)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td>Actions</td>
                {properties.map((prop, i) => (
                  <td key={i}>
                    <Link href={`/property/${prop.id || prop._id}`} className="os-btn os-btn--ghost os-btn--sm">
                      View details
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 24 }}>
          <Link href="/listings" className="os-btn os-btn--ghost">Keep browsing</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

function CompareSkeleton() {
  return (
    <>
      <Navbar />
      <div className="os-container" style={{ paddingBlock: 70 }}>
        <div className="os-skeleton" style={{ width: 280, height: 38, marginBottom: 22 }} />
        <div className="os-skeleton" style={{ height: 420, borderRadius: 20 }} />
      </div>
    </>
  );
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { compareList } = useCompare();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (!ids) {
      setProperties(compareList);
      setLoading(false);
      return;
    }

    const idArray = ids.split(",").map(id => id.trim());
    Promise.all(
      idArray.map(id =>
        fetch(`/api/properties/${id}`).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    ).then(results => {
      setProperties(results.filter(p => p !== null));
      setLoading(false);
    });
  }, [searchParams, compareList]);

  if (status === "loading" || loading) return <CompareSkeleton />;
  if (!session) return null;

  return <PropertyComparison properties={properties} />;
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <ComparePageContent />
    </Suspense>
  );
}
