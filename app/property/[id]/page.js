// app/property/[id]/page.js
import { notFound } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SaveButton from "@/components/SaveButton";
import ShareButton from "@/components/ShareButton";
import InquiryForm from "@/components/InquiryForm";
import EMICalculator from "@/components/EMICalculator";
import ContactModal from "@/components/ContactModal";
import PropertyImages from "@/components/PropertyImages";
import StreetView from "@/components/StreetView";
import SatelliteMap from "@/components/SatelliteMap";
import PropertyCard from "@/components/PropertyCard";
import { connectDB } from "@/lib/mongodb";
import Property from "@/models/Property";
import { priceLabel, decodeListing } from "@/lib/constants";

async function findProperty(id) {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byMongoId = await Property.findById(id).lean();
    if (byMongoId) return byMongoId;
  }
  return Property.findOne({ id }).lean();
}

export async function generateMetadata({ params }) {
  try {
    const { id } = await params;
    await connectDB();
    const prop = await findProperty(id);
    if (!prop) return { title: "Property not found — OM SPACE" };
    return {
      title: `${prop.title} in ${prop.locality || "Vijayawada"} — OM SPACE`,
      description: prop.description || `Explore this ${prop.type || "property"} in ${prop.locality || "Vijayawada"} on OM SPACE.`,
    };
  } catch {
    return { title: "Property — OM SPACE" };
  }
}

function priceLabelFor(prop) {
  return priceLabel(prop.price || prop.min_price);
}

function initialsOf(name) {
  return name
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default async function PropertyPage({ params }) {
  const { id } = await params;

  let prop = null;
  try {
    await connectDB();
    prop = await findProperty(id);
  } catch (error) {
    console.error("Error loading property:", error);
  }
  if (!prop) notFound();

  let similar = [];
  try {
    similar = await Property.find({
      _id: { $ne: prop._id },
      status: "available",
      locality: prop.locality,
    }).limit(4).lean();
  } catch (error) {
    console.error("Error loading similar properties:", error);
  }

  const priceText = priceLabelFor(prop);
  const locality = prop.locality || prop.city || "Vijayawada";
  const address = [prop.location, locality, prop.city || "Vijayawada", "Andhra Pradesh"]
    .flatMap((part) => String(part || "").split(",").map((piece) => piece.trim()))
    .filter(Boolean)
    .filter((part, index, list) => list.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index);
  const propType = prop.type || "Property";
  const isLand = ["Residential Land", "Farm House"].includes(propType);
  const listingType = prop.listing_type ? decodeListing(prop.listing_type) : prop.listing || "Buy";
  const isRent = listingType === "Rent";
  const area = prop.area ? `${prop.area}${prop.area_unit ? ` ${prop.area_unit}` : ""}` : "On request";
  const bedrooms = prop.bedrooms || (prop.beds ? String(prop.beds) : "");
  const bathrooms = prop.bathrooms || (prop.baths ? String(prop.baths) : "");
  const bhkLabel = bedrooms ? `${bedrooms} BHK` : isLand ? "Land parcel" : "Studio";
  const statusLabel = prop.status
    ? prop.status.charAt(0).toUpperCase() + prop.status.slice(1)
    : "Available";

  const emiPrice =
    parseFloat(prop.min_price) > 0
      ? parseFloat(prop.min_price)
      : parseFloat(prop.max_price) > 0
        ? parseFloat(prop.max_price)
        : 0;

  const pricePerSqft = prop.price_per_sqft ? parseFloat(prop.price_per_sqft) : 0;
  const agencyName = prop.seller_company || prop.seller_name || "OM SPACE";
  const propertyId = prop.id || prop._id?.toString();
  const hasCoordinates = Boolean(prop.latitude && prop.longitude);

  const specs = [
    { label: "Built-up area", value: area },
    { label: "Property type", value: propType },
    ...(isLand ? [] : [{ label: "Bedrooms", value: bhkLabel }]),
    ...(isLand || !bathrooms ? [] : [{ label: "Bathrooms", value: bathrooms }]),
    ...(prop.furnishing ? [{ label: "Furnishing", value: prop.furnishing }] : []),
    ...(typeof prop.facing === "string" && prop.facing ? [{ label: "Facing", value: prop.facing }] : []),
    ...(prop.total_floors ? [{ label: "Total floors", value: prop.total_floors }] : []),
    ...(prop.age ? [{ label: "Age", value: prop.age }] : []),
  ];

  const amenities = Array.isArray(prop.amenities)
    ? prop.amenities.filter((item) => typeof item === "string" && item.trim())
    : [];
  const highlights = Array.isArray(prop.highlights)
    ? prop.highlights.filter((item) => typeof item === "string" && item.trim())
    : Array.isArray(prop.tags)
      ? prop.tags.filter((item) => typeof item === "string" && item.trim())
      : [];
  const featureChips = [...new Set([...amenities, ...highlights])];

  return (
    <>
      <Navbar />
      <main style={{ background: "var(--os-cream)", minHeight: "100vh" }}>
        <div className="os-container">
          <nav className="os-breadcrumb os-breadcrumb--light" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/listings">Properties</Link>
            <span>/</span>
            <Link href={`/listings?search=${encodeURIComponent(locality)}`}>{locality}</Link>
            <span>/</span>
            <b>{prop.title}</b>
          </nav>

          <div className="os-detail">
            <div>
              <PropertyImages
                mainImg={prop.images?.[0] || prop.imageUrl}
                title={prop.title}
                images={prop.images || []}
                type={propType}
                status={prop.status}
                featured={prop.featured}
              />

              <div className="os-panel" style={{ marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
                  <div>
                    <div className="os-panel__eyebrow">{listingType} · {statusLabel}</div>
                    <div className="os-price">
                      {priceText}
                      {isRent && <small> / month</small>}
                    </div>
                    {pricePerSqft > 0 && (
                      <div className="os-hint" style={{ marginTop: 6 }}>
                        ₹{pricePerSqft.toLocaleString()} per sq ft
                      </div>
                    )}
                  </div>
                  <div className="os-detail__actions">
                    <SaveButton propertyId={propertyId} />
                    <ShareButton title={prop.title} path={`/property/${propertyId}`} />
                  </div>
                </div>

                <h1 className="os-detail__title">{prop.title}</h1>
                <div className="os-detail__loc">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {address.join(", ")}
                </div>

                <div className="os-specs" style={{ marginTop: 24 }}>
                  {specs.map((spec) => (
                    <div className="os-spec" key={spec.label}>
                      <span>{spec.label}</span>
                      <b>{spec.value}</b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="os-panel">
                <div className="os-panel__eyebrow">The property</div>
                <h2 className="os-panel__title">About this home</h2>
                <p style={{ fontSize: 13.5, lineHeight: 1.9, color: "var(--os-grey)" }}>
                  {prop.description ||
                    `This ${isLand ? "land parcel" : propType.toLowerCase()} in ${locality}, Vijayawada offers ${area} of space, available for ${listingType.toLowerCase()}. Reach out to the listing agency for site visits, documents and availability.`}
                </p>
              </div>

              <div className="os-panel">
                <div className="os-panel__eyebrow">Features & amenities</div>
                <h2 className="os-panel__title">What this property offers</h2>
                {featureChips.length > 0 ? (
                  <div className="os-amenities">
                    {featureChips.map((item) => (
                      <span className="os-amenity" key={item}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="os-amenities">
                    {[propType, area, bhkLabel, listingType, statusLabel]
                      .filter(Boolean)
                      .map((item) => (
                        <span className="os-amenity" key={item}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {item}
                        </span>
                      ))}
                  </div>
                )}
                <p className="os-hint" style={{ marginTop: 16 }}>
                  {amenities.length > 0
                    ? "Amenities listed by the agency. Confirm specifics during your site visit."
                    : "Detailed amenities are available from the agency on request."}
                </p>
              </div>

              {hasCoordinates && (
                <div className="os-panel">
                  <div className="os-panel__eyebrow">Location</div>
                  <h2 className="os-panel__title">Explore the neighbourhood</h2>
                  {isLand ? (
                    <SatelliteMap latitude={prop.latitude} longitude={prop.longitude} title={prop.title} />
                  ) : (
                    <StreetView latitude={prop.latitude} longitude={prop.longitude} title={prop.title} />
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${prop.latitude},${prop.longitude}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="os-textlink"
                    style={{ marginTop: 16, display: "inline-flex" }}
                  >
                    Open in Google Maps
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>
              )}

              {emiPrice > 0 && !isRent && (
                <div className="os-panel">
                  <EMICalculator price={emiPrice} />
                </div>
              )}

              {similar.length > 0 && (
                <div style={{ marginTop: 44 }}>
                  <div className="os-section-head" style={{ alignItems: "flex-end" }}>
                    <div>
                      <span className="os-eyebrow">More in {locality}</span>
                      <h2 className="os-h2" style={{ marginTop: 12 }}>
                        Similar <span className="os-italic">properties</span>
                      </h2>
                    </div>
                    <Link href={`/listings?search=${encodeURIComponent(locality)}`} className="os-textlink">
                      View all
                    </Link>
                  </div>
                  <div className="os-grid">
                    {similar.map((item, index) => (
                      <PropertyCard key={item._id} prop={item} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="os-sidecard">
              <div className="os-panel">
                <InquiryForm propertyId={propertyId} />
              </div>

              <div className="os-panel os-agencycard">
                <div className="os-agencycard__mark">{initialsOf(agencyName) || "OS"}</div>
                <h3>{agencyName}</h3>
                <p>Listing agency on OM SPACE</p>
                <div className="os-agencycard__meta">
                  <div>
                    <b>{listingType}</b>
                    <span>Listing</span>
                  </div>
                  <div>
                    <b>{statusLabel}</b>
                    <span>Status</span>
                  </div>
                </div>
                <div style={{ marginTop: 18 }}>
                  <ContactModal agent={agencyName} propTitle={prop.title} propId={propertyId} />
                </div>
              </div>

              <div className="os-panel">
                <div className="os-panel__eyebrow">Reference</div>
                <h3 style={{ fontFamily: "var(--os-serif)", fontSize: 21, marginBottom: 12 }}>Property information</h3>
                {[
                  ["Property ID", propertyId || "N/A"],
                  ["Listed", prop.posted_date || "Recently"],
                  ["Type", propType],
                  ["Area", area],
                  ["Bedrooms", bhkLabel],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      fontSize: 12,
                      padding: "9px 0",
                      borderBottom: "1px solid var(--os-line)",
                    }}
                  >
                    <span style={{ color: "var(--os-grey)" }}>{label}</span>
                    <span style={{ fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="os-panel os-panel--dark">
                <div className="os-panel__eyebrow">Need a second opinion?</div>
                <h3 style={{ fontFamily: "var(--os-serif)", fontSize: 23, lineHeight: 1.2 }}>
                  Talk it through with our team.
                </h3>
                <p style={{ fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
                  Questions about documents, loans or the neighbourhood? We are happy to help.
                </p>
                <Link href="/help" className="os-btn os-btn--gold os-btn--sm" style={{ marginTop: 16 }}>
                  Visit the help centre
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
