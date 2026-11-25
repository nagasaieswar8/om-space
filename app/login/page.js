"use client";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

export default function LoginPage() {
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
    const role = session?.user?.role;
    router.push(role === "admin" ? "/admin" : role === "agency" ? "/agency-dashboard" : "/customer-dashboard");
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Sign in to your <span className="os-italic">space</span>.
        </>
      }
      subtitle="Saved homes, enquiries and your next shortlist are waiting."
      quote="The right address changes how a day feels."
      note="Sign in with the account you registered on OM SPACE. Your role decides where you land — customer, agency or admin."
      footer={
        <>
          <span>
            New here? <Link href="/register">Create an account</Link>
          </span>
          <span style={{ display: "flex", gap: 14 }}>
            <Link href="/agency-login">Agency</Link>
            <Link href="/admin-login">Admin</Link>
          </span>
        </>
      }
    >
      <form className="os-auth__form" onSubmit={handleLogin}>
        {error && <div className="os-error">{error}</div>}

        <label className="os-field">
          <span>Email address</span>
          <input
            className="os-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
