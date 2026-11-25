"use client";
import { useState } from "react";
import { signIn, getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

export default function AgencyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("That email and password combination does not match an account.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    if (!session || session.user.role !== "agency") {
      setError("This portal is for agency accounts only.");
      await signOut({ redirect: false });
      setLoading(false);
      return;
    }

    router.push("/agency-dashboard");
  };

  return (
    <AuthShell
      image="/images/commercial.jpg"
      eyebrow="Agency portal"
      title={
        <>
          Your listings, <span className="os-italic">in order</span>.
        </>
      }
      subtitle="Publish properties, answer enquiries and watch your presence grow."
      quote="Good property deserves a good stage."
      note="Agency accounts can publish listings, respond to customer enquiries and manage their own portfolio."
      footer={
        <>
          <span>
            New agency? <Link href="/register?role=agency">Create an agency account</Link>
          </span>
          <span style={{ display: "flex", gap: 14 }}>
            <Link href="/login">Customer</Link>
            <Link href="/admin-login">Admin</Link>
          </span>
        </>
      }
    >
      <form className="os-auth__form" onSubmit={handleLogin}>
        {error && <div className="os-error">{error}</div>}

        <label className="os-field">
          <span>Work email</span>
          <input
            className="os-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@agency.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="os-field">
          <span>Password</span>
          <input
            className="os-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" className="os-btn os-btn--gold os-btn--block" disabled={loading} style={{ marginTop: 6 }}>
          {loading ? "Signing in…" : "Enter agency portal"}
        </button>
      </form>
    </AuthShell>
  );
}
