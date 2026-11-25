"use client";
// components/InquiryForm.js
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function InquiryForm({ propertyId }) {
  const { data: session } = useSession();
  const isCustomer = session?.user?.role === "customer";
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!message.trim()) { setStatus("empty"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, propertyId }),
      });
      if (res.ok) { setStatus("success"); setMessage(""); }
      else { const d = await res.json(); setStatus(d.error || "error"); }
    } catch {
      setStatus("error");
    }
    setLoading(false);
  };

  return (
    <div className="os-enq">
      <h3 className="os-enq__title">Send an enquiry</h3>
      <p className="os-enq__sub">Get details from the agency directly</p>

      {status === "success" && (
        <div className="os-success">Enquiry sent. The agency will contact you soon.</div>
      )}
      {status && status !== "success" && status !== "empty" && (
        <div className="os-error">
          {status === "error" ? "Failed to send. Please try again." : status}
        </div>
      )}

      <textarea
        className={`os-textarea ${status === "empty" ? "is-invalid" : ""}`}
        value={message}
        onChange={(event) => { setMessage(event.target.value); setStatus(null); }}
        placeholder="I'm interested in this property. Please share more details..."
        rows={4}
        disabled={!isCustomer}
        style={!isCustomer ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
      />
      {status === "empty" && <div className="os-hint" style={{ marginTop: -4, marginBottom: 4 }}>Please enter a message</div>}

      {isCustomer ? (
        <button type="button" className="os-btn os-btn--gold os-btn--block" onClick={submit} disabled={loading}>
          {loading ? "Sending…" : "Send enquiry"}
        </button>
      ) : !session ? (
        <Link href="/login" className="os-btn os-btn--gold os-btn--block">
          Customer login to send an enquiry
        </Link>
      ) : (
        <div className="os-enq__login">Customer accounts can send property enquiries.</div>
      )}

      <button type="button" className="os-btn os-btn--ghost os-btn--block">
        Request site visit
      </button>
    </div>
  );
}
