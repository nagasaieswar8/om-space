"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const PLANS = [
  {
    id: "basic",
    name: "Basic Contact",
    price: 99,
    displayPrice: "₹99",
    features: [
      "Agency phone number",
      "1 site visit request",
      "Valid for 7 days",
    ],
  },
  {
    id: "premium",
    name: "Premium Contact",
    price: 299,
    displayPrice: "₹299",
    recommended: true,
    features: [
      "Agency phone number",
      "WhatsApp access",
      "3 site visit requests",
      "Priority response",
      "Valid for 30 days",
    ],
  },
];

const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const IconChat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  </svg>
);

const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export default function ContactModal({ agent, propId }) {
  const { data: session } = useSession();
  const [step, setStep] = useState("plans");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [postMessage, setPostMessage] = useState("");
  const [orderId] = useState("ORD" + Date.now().toString().slice(-8));

  const handlePayment = async () => {
    if (!cardName || !cardNumber || !expiry || !cvv) {
      setError("Please fill in all payment details");
      return;
    }
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setError("Please enter a valid 16-digit card number");
      return;
    }

    setError("");
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setProcessing(false);
    setStep("success");
  };

  const handleSendMessage = async () => {
    if (!postMessage.trim()) {
      setError("Please enter a message for the agency");
      return;
    }

    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: postMessage, propertyId: propId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send message");
        return;
      }
      setPostMessage("");
      alert("Message sent to the agency!");
    } catch {
      setError("Failed to send message");
    }
  };

  if (!session) {
    return (
      <div className="os-enq">
        <h3 className="os-enq__title">Contact agency</h3>
        <p className="os-enq__sub">Unlock verified agency contact details.</p>
        <div className="os-enq__login">
          Sign in as a customer to call, message and arrange a site visit.
        </div>
        <Link href="/login" className="os-btn os-btn--gold os-btn--block" style={{ marginTop: 12 }}>
          Login to continue
        </Link>
      </div>
    );
  }

  if (session.user?.role !== "customer") {
    return (
      <div className="os-enq">
        <h3 className="os-enq__title">Contact agency</h3>
        <p className="os-enq__sub">This action is available to customer accounts.</p>
        <div className="os-enq__login">Agency and admin accounts manage enquiries from their own portals.</div>
      </div>
    );
  }

  if (step === "plans") {
    return (
      <div>
        <div className="os-contact__head">
          <h3 className="os-contact__title">Contact agency</h3>
          <p className="os-contact__sub">Select a plan to unlock agency contact details</p>
        </div>

        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={`os-plan ${selectedPlan?.id === plan.id ? "is-on" : ""}`}
            onClick={() => setSelectedPlan(plan)}
            aria-pressed={selectedPlan?.id === plan.id}
          >
            {plan.recommended && <span className="os-plan__tag">Recommended</span>}
            <span className="os-plan__top">
              <span className="os-plan__name">{plan.name}</span>
              <span className="os-plan__price">{plan.displayPrice}</span>
            </span>
            <span className="os-plan__features">
              {plan.features.map((feature) => (
                <span className="os-plan__feature" key={feature}>{feature}</span>
              ))}
            </span>
          </button>
        ))}

        {error && <div className="os-error" style={{ marginBottom: 10 }}>{error}</div>}

        <button
          type="button"
          className="os-btn os-btn--gold os-btn--block"
          onClick={() => {
            if (!selectedPlan) {
              setError("Please select a plan first");
              return;
            }
            setError("");
            setStep("payment");
          }}
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div>
        <div className="os-contact__bar">
          <button type="button" className="os-contact__back" onClick={() => setStep("plans")} aria-label="Back to plans">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <b>Payment details</b>
          <span>{selectedPlan?.displayPrice}</span>
        </div>

        <div className="os-summary">
          <b>Order summary</b>
          <div><span>{selectedPlan?.name}</span><span>{selectedPlan?.displayPrice}</span></div>
          <div><span>Order ID</span><span>{orderId}</span></div>
        </div>

        <div className="os-contact__stack">
          <label className="os-field">
            <span>Cardholder name</span>
            <input className="os-input" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" />
          </label>
          <label className="os-field">
            <span>Card number</span>
            <input
              className="os-input"
              value={cardNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
                setCardNumber(val);
              }}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              style={{ letterSpacing: "0.05em" }}
            />
          </label>
          <div className="os-form-row">
            <label className="os-field">
              <span>Expiry date</span>
              <input
                className="os-input"
                value={expiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
                  setExpiry(val);
                }}
                placeholder="MM/YY"
                inputMode="numeric"
              />
            </label>
            <label className="os-field">
              <span>CVV</span>
              <input
                className="os-input"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="123"
                type="password"
                inputMode="numeric"
              />
            </label>
          </div>
        </div>

        {error && <div className="os-error" style={{ marginTop: 12 }}>{error}</div>}

        <button
          type="button"
          className="os-btn os-btn--gold os-btn--block"
          onClick={handlePayment}
          disabled={processing}
          style={{ marginTop: 14 }}
        >
          {processing ? "Processing payment…" : `Pay ${selectedPlan?.displayPrice}`}
        </button>
      </div>
    );
  }

  return (
    <div className="os-contact__done">
      <div className="os-contact__mark"><IconCheck /></div>
      <h3>Payment successful</h3>
      <div className="os-contact__order">Order ID: {orderId}</div>

      <div className="os-contact__details">
        <b>Agency contact details</b>
        <div className="os-contact__line"><IconUser /><span>{agent || "OM SPACE Agency"}</span></div>
        <div className="os-contact__line"><IconPhone /><a href="tel:+919876543210">+91 98765 43210</a></div>
        <div className="os-contact__line"><IconChat /><a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">WhatsApp the agency</a></div>
      </div>

      <div className="os-contact__msg">
        <b>Send a message to the agency</b>
        <textarea
          className="os-textarea"
          value={postMessage}
          onChange={(e) => setPostMessage(e.target.value)}
          placeholder="Hi, I'm interested in this property and would like to schedule a visit..."
          rows={3}
        />
        {error && <div className="os-error" style={{ marginBottom: 8 }}>{error}</div>}
        <button type="button" className="os-btn os-btn--ghost os-btn--block os-btn--sm" onClick={handleSendMessage}>
          Send message
        </button>
      </div>

      <button
        type="button"
        className="os-btn os-btn--ghost os-btn--block os-btn--sm"
        onClick={() => {
          setStep("plans");
          setSelectedPlan(null);
          setCardNumber("");
          setExpiry("");
          setCvv("");
          setCardName("");
          setPostMessage("");
          setError("");
        }}
      >
        Done
      </button>
    </div>
  );
}
