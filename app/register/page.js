"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState("customer");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "", company: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = searchParams?.get("role");
    if (role === "agency" || role === "agent") setSelectedRole("agency");
    if (role === "customer" || role === "buyer") setSelectedRole("customer");
  }, [searchParams]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Choose a password of at least 8 characters.");
      return;
    }
    if (selectedRole === "agency" && (!form.phone || !form.company)) {
      setError("Please provide an agency name and phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: selectedRole,
          phone: form.phone,
          company: form.company,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "We could not create the account.");
        setLoading(false);
        return;
      }
      router.push(selectedRole === "agency" ? "/agency-login" : "/login");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      image="/images/cta-home.jpg"
      eyebrow="Join OM SPACE"
      title={
        <>
          Begin your <span className="os-italic">chapter</span>.
        </>
      }
      subtitle="One account for saved homes, enquiries and a calmer property search."
      quote="Every good move starts with a place to imagine."
      note="Customers search and save. Agencies publish and manage. Both live inside the same considered platform."
      footer={
        <>
          <span>
            Already have an account? <Link href="/login">Sign in</Link>
          </span>
          <Link href="/agency-login">Agency portal</Link>
        </>
      }
    >
      <form className="os-auth__form" onSubmit={handleRegister}>
        <div className="os-auth__role" role="group" aria-label="Account type">
          <button
            type="button"
            className={`os-rolecard ${selectedRole === "customer" ? "is-on" : ""}`}
            onClick={() => { setSelectedRole("customer"); setError(""); }}
          >
            <b>I'm looking for a home</b>
            <span>Save properties, compare and contact agencies.</span>
          </button>
          <button
            type="button"
            className={`os-rolecard ${selectedRole === "agency" ? "is-on" : ""}`}
            onClick={() => { setSelectedRole("agency"); setError(""); }}
          >
            <b>I'm an agency</b>
            <span>Publish listings and manage enquiries.</span>
          </button>
        </div>

        {error && <div className="os-error">{error}</div>}

        <div className="os-form-row">
          <label className="os-field">
            <span>Full name</span>
            <input className="os-input" value={form.name} onChange={update("name")} placeholder="Your full name" autoComplete="name" required />
          </label>
          <label className="os-field">
            <span>Email address</span>
            <input className="os-input" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" autoComplete="email" required />
          </label>
        </div>

        <div className="os-form-row">
          <label className="os-field">
            <span>Password</span>
            <input className="os-input" type="password" value={form.password} onChange={update("password")} placeholder="At least 8 characters" autoComplete="new-password" required />
          </label>
          <label className="os-field">
            <span>Confirm password</span>
            <input className="os-input" type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Repeat your password" autoComplete="new-password" required />
          </label>
        </div>

        {selectedRole === "agency" && (
          <div className="os-form-row">
            <label className="os-field">
              <span>Agency name</span>
              <input className="os-input" value={form.company} onChange={update("company")} placeholder="Your agency" autoComplete="organization" />
            </label>
            <label className="os-field">
              <span>Phone number</span>
              <input className="os-input" type="tel" value={form.phone} onChange={update("phone")} placeholder="9876543210" autoComplete="tel" />
            </label>
          </div>
        )}

        <button type="submit" className="os-btn os-btn--gold os-btn--block" disabled={loading} style={{ marginTop: 6 }}>
          {loading ? "Creating your account…" : selectedRole === "agency" ? "Create agency account" : "Create customer account"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", background: "var(--os-cream)" }}>
          <div className="os-skeleton" style={{ width: 220, height: 16 }} />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
