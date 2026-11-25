"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const pricingPlans = [
  {
    id: "basic",
    title: "Basic",
    price: 499,
    frequency: "month",
    description: "Perfect for first-time listers",
    features: ["1 property listing", "Homepage featured", "Email support", "Basic analytics"],
  },
  {
    id: "professional",
    title: "Professional",
    price: 999,
    frequency: "month",
    description: "Best for active agencies",
    features: ["5 property listings", "Premium homepage placement", "Priority inbox", "Advanced analytics", "Lead scoring", "Phone support"],
    popular: true,
  },
  {
    id: "enterprise",
    title: "Enterprise",
    price: 2499,
    frequency: "month",
    description: "For large agencies",
    features: ["Unlimited listings", "Top homepage placement", "Dedicated account manager", "Custom branding", "CRM integration", "24/7 dedicated support", "API access"],
  },
];

const VALUE_POINTS = [
  { title: "Targeted reach", text: "Your properties reach customers in your target market." },
  { title: "Real-time analytics", text: "Track views, inquiries, and lead quality in real-time." },
  { title: "Quick setup", text: "Start advertising in minutes with our simple process." },
  { title: "Smart recommendations", text: "AI powered to suggest similar properties to customers." },
  { title: "Secure platform", text: "Your listings and data are fully protected." },
  { title: "Mobile-first", text: "90% of searches happen on mobile devices." },
];

const Check = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export default function AdvertisePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (planId) => {
    setSelectedPlan(planId);
    if (!session) {
      setMessage("Please login/register to continue.");
      router.push("/login?redirect=/advertise");
      return;
    }

    if (!["agency", "admin"].includes(session.user?.role)) {
      setMessage("Only agency accounts and admins can purchase ad plans. Contact support.");
      return;
    }

    setStatus("processing");
    setMessage(`Subscribing ${planId}...`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStatus("success");
      setMessage(`Subscribed to ${planId} plan! Redirecting...`);
      setTimeout(() => router.push(session.user?.role === "admin" ? "/admin" : "/agency-dashboard"), 900);
    } catch {
      setStatus("error");
      setMessage("Subscription failed. Try again.");
    }
  };

  return (
    <>
      <Navbar />
      <section className="os-page-hero">
        <div className="os-container os-page-hero__inner">
          <div className="os-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <b>Advertise</b>
          </div>
          <span className="os-eyebrow">Agency growth</span>
          <h1>
            Put your listings <span className="os-italic">first</span>.
          </h1>
          <p className="os-lead">
            Premium advertising plans that boost your property&apos;s visibility with the customers
            already searching OM SPACE.
          </p>
        </div>
      </section>

      <main className="os-container" style={{ paddingBlock: "34px 80px" }}>
        {message && (
          <div className={status === "error" ? "os-error" : "os-success"} style={{ marginBottom: 22 }}>
            {message}
          </div>
        )}

        <div className="os-plans">
          {pricingPlans.map((plan) => {
            const active = selectedPlan === plan.id;
            const buttonClass = active
              ? "os-btn os-btn--gold os-btn--block"
              : plan.popular
                ? "os-btn os-btn--light os-btn--block"
                : "os-btn os-btn--ghost os-btn--block";
            return (
              <div
                key={plan.id}
                className={`os-adplan ${active ? "is-on" : ""} ${plan.popular ? "is-popular" : ""}`}
              >
                {plan.popular && <span className="os-adplan__tag">Popular</span>}
                <h3>{plan.title}</h3>
                <div className="os-adplan__price">
                  ₹{plan.price}<span> / {plan.frequency}</span>
                </div>
                <p className="os-adplan__desc">{plan.description}</p>
                <ul className="os-adplan__features">
                  {plan.features.map((feature) => (
                    <li key={feature}><Check /> {feature}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={status === "processing"}
                  className={buttonClass}
                >
                  {status === "processing" && active ? "Processing…" : "Get started"}
                </button>
              </div>
            );
          })}
        </div>

        <section className="os-panel" style={{ marginTop: 26 }}>
          <div className="os-panel__eyebrow">The upside</div>
          <h2 className="os-panel__title">Why advertise with OM SPACE?</h2>
          <div className="os-valuegrid">
            {VALUE_POINTS.map((point) => (
              <div className="os-value" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="os-panel os-panel--dark" style={{ marginTop: 18, textAlign: "center", padding: "46px 28px" }}>
          <div className="os-panel__eyebrow">Start today</div>
          <h2 style={{ fontFamily: "var(--os-serif)", fontSize: "clamp(28px, 3vw, 38px)", fontWeight: 500, lineHeight: 1.15 }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: 13, marginTop: 10 }}>Post your first property for free today.</p>
          <button
            type="button"
            onClick={() => router.push("/property/add")}
            className="os-btn os-btn--gold"
            style={{ marginTop: 20 }}
          >
            Post free property
          </button>
        </section>
      </main>
      <Footer />
    </>
  );
}
