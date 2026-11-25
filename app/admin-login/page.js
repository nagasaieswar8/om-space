"use client";
import { useState } from "react";
import { signIn, getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

export default function AdminLoginPage() {
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
    if (!session || session.user.role !== "admin") {
      setError("Access denied. Administrator credentials required.");
      await signOut({ redirect: false });
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <AuthShell
      image="/images/hero-villa.jpg"
      eyebrow="Restricted access"
      title={
        <>
          The platform, <span className="os-italic">oversight</span>.
        </>
      }
      subtitle="Administrator access to users, agencies and every listing on OM SPACE."
      quote="Stewardship is the quiet part of a good platform."
      note="This portal is reserved for platform administrators. Customer and agency accounts are redirected to their OM SPACE portals."
      footer={
        <>
          <span>
            Not an administrator? <Link href="/login">Customer sign in</Link>
          </span>
          <Link href="/agency-login">Agency portal</Link>
        </>
      }
    >
      <form className="os-auth__form" onSubmit={handleLogin}>
        {error && <div className="os-error">{error}</div>}

        <label className="os-field">
          <span>Administrator email</span>
          <input
            className="os-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@ownspace.local"
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
          {loading ? "Verifying…" : "Enter admin portal"}
        </button>
      </form>
    </AuthShell>
  );
}
