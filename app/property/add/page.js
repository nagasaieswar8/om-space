"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PropertyForm from "@/components/PropertyForm";
import { isPropertyManager } from "@/lib/roles";

export default function AddPropertyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: "80svh", display: "grid", placeItems: "center" }}>
          <div className="os-skeleton" style={{ width: 240, height: 16 }} />
        </div>
      </>
    );
  }

  if (!isPropertyManager(session)) {
    return (
      <>
        <Navbar />
        <main className="os-container" style={{ paddingBlock: 80 }}>
          <div className="os-empty">
            <h3>Agency access required</h3>
            <p>Only agency accounts and administrators can publish properties on OM SPACE.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/agency-login" className="os-btn os-btn--gold">Open the agency portal</Link>
              <Link href="/register?role=agency" className="os-btn os-btn--ghost">Create an agency account</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          city: payload.city,
          location: payload.location,
          price: payload.price,
          type: payload.type,
          listing: payload.listing,
          beds: payload.beds,
          baths: payload.baths,
          area: payload.area,
          status: payload.status,
          imageUrl: payload.imageUrl,
          description: payload.description,
          amenities: payload.amenities,
          agentId: session.user.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The listing could not be published.");
      router.push(`/property/${data.id || data._id}`);
    } catch (submitError) {
      setError(submitError.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="os-page-hero">
        <div className="os-container os-page-hero__inner">
          <div className="os-breadcrumb">
            <Link href="/agency-dashboard">Agency portal</Link>
            <span>/</span>
            <b>New listing</b>
          </div>
          <span className="os-eyebrow">Publish with care</span>
          <h1>
            List a <span className="os-italic">property</span>.
          </h1>
          <p className="os-lead">
            Clear details make better enquiries. Add the essentials now — you can refine the rest at
            any time from your agency portal.
          </p>
        </div>
      </section>

      <main className="os-container">
        <div className="os-detail" style={{ gridTemplateColumns: "minmax(0, 1fr) 330px" }}>
          <div className="os-panel">
            <div className="os-panel__eyebrow">Listing details</div>
            <h2 className="os-panel__title" style={{ marginBottom: 24 }}>Tell us about the property</h2>
            <PropertyForm
              onSubmit={handleSubmit}
              saving={loading}
              error={error}
              submitLabel="Publish property"
              onCancel={() => router.push("/agency-dashboard")}
            />
          </div>

          <aside className="os-sidecard">
            <div className="os-panel">
              <div className="os-panel__eyebrow">Before you publish</div>
              <h3 style={{ fontFamily: "var(--os-serif)", fontSize: 24, marginBottom: 14 }}>A good listing</h3>
              {[
                "A specific title with the locality and home type.",
                "A realistic price so the right buyers find you.",
                "The actual built-up area in square feet.",
                "A cover image that shows the property in daylight.",
                "A short description of what makes it worth visiting.",
              ].map((tip, index) => (
                <div className="os-feature" key={tip} style={{ paddingBottom: 15 }}>
                  <span className="os-feature__num">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <p style={{ fontSize: 12.5, lineHeight: 1.6 }}>{tip}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="os-panel os-panel--dark">
              <div className="os-panel__eyebrow">After publishing</div>
              <h3 style={{ fontFamily: "var(--os-serif)", fontSize: 22, lineHeight: 1.25 }}>
                Enquiries land in your agency portal.
              </h3>
              <p style={{ fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
                Reply from the inbox and keep every conversation in one place.
              </p>
              <Link href="/agency-dashboard" className="os-btn os-btn--gold os-btn--sm" style={{ marginTop: 16 }}>
                View my listings
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
