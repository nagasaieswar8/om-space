"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PropertyForm from "@/components/PropertyForm";
import { isPropertyManager, roleHome } from "@/lib/roles";

export default function EditPropertyPage() {
  const { data: session, status } = useSession();
  const { id } = useParams();
  const router = useRouter();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/agency-login");
      return;
    }
    if (status === "authenticated" && !isPropertyManager(session)) {
      router.replace(roleHome(session?.user?.role));
      return;
    }
    if (status !== "authenticated" || !id || !isPropertyManager(session)) return;

    fetch(`/api/properties/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load listing");
        setInitial({
          title: data.title || "",
          city: data.city || "Vijayawada",
          location: data.location || data.locality || "",
          price: data.price || "",
          type: data.type || "Residential Apartment",
          listing: data.listing || (data.listing_type === "R" ? "Rent" : "Buy"),
          beds: data.beds ?? data.bedrooms ?? "",
          baths: data.baths ?? data.bathrooms ?? "",
          area: data.area_num ?? data.area ?? "",
          status: data.status || "available",
          imageUrl: data.imageUrl || data.images?.[0] || "",
          description: data.description || "",
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
        });
      })
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, [status, session, id, router]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update listing");
      router.push(session?.user?.role === "admin" ? "/admin" : "/agency-dashboard");
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="os-container" style={{ paddingBlock: 70 }}>
          <div className="os-skeleton" style={{ width: 280, height: 40, marginBottom: 24 }} />
          <div className="os-skeleton" style={{ height: 460, borderRadius: 20 }} />
        </div>
      </>
    );
  }

  if (!isPropertyManager(session)) return null;

  return (
    <>
      <Navbar />
      <section className="os-page-hero">
        <div className="os-container os-page-hero__inner">
          <div className="os-breadcrumb">
            <Link href={session?.user?.role === "admin" ? "/admin" : "/agency-dashboard"}>
              {session?.user?.role === "admin" ? "Admin portal" : "Agency portal"}
            </Link>
            <span>/</span>
            <b>Edit listing</b>
          </div>
          <span className="os-eyebrow">Keep it current</span>
          <h1>
            Refine the <span className="os-italic">listing</span>.
          </h1>
          <p className="os-lead">
            Update the price, availability or description. Changes appear on the public site
            immediately.
          </p>
        </div>
      </section>

      <main className="os-container">
        <div className="os-detail" style={{ gridTemplateColumns: "minmax(0, 1fr) 330px" }}>
          <div className="os-panel">
            <div className="os-panel__eyebrow">Listing details</div>
            <h2 className="os-panel__title" style={{ marginBottom: 24 }}>Edit the property</h2>
            {initial && (
              <PropertyForm
                initial={initial}
                onSubmit={handleSubmit}
                saving={saving}
                error={error}
                submitLabel="Save changes"
                onCancel={() => router.back()}
                priceIsText
              />
            )}
          </div>

          <aside className="os-sidecard">
            <div className="os-panel">
              <div className="os-panel__eyebrow">Good to know</div>
              <h3 style={{ fontFamily: "var(--os-serif)", fontSize: 24, marginBottom: 14 }}>Editing safely</h3>
              {[
                "Price changes apply to new enquiries and the public card.",
                "Mark the property sold or rented when it is no longer available.",
                "Descriptions and amenities appear on the property page.",
                "Deleting a listing is permanent and lives in your portal.",
              ].map((tip) => (
                <p key={tip} style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--os-grey)", padding: "8px 0", borderBottom: "1px solid var(--os-line)" }}>
                  {tip}
                </p>
              ))}
            </div>

            <div className="os-panel os-panel--dark">
              <div className="os-panel__eyebrow">Need a hand?</div>
              <h3 style={{ fontFamily: "var(--os-serif)", fontSize: 22, lineHeight: 1.25 }}>
                We are happy to review a listing with you.
              </h3>
              <Link href="/help" className="os-btn os-btn--gold os-btn--sm" style={{ marginTop: 16 }}>
                Visit the help centre
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
