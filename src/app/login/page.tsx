"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/assistants");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#ffffff",
    }}>
      <div style={{
        width: 380, background: "#efebe5", borderRadius: 16,
        padding: 32, border: "1px solid #e0dcd6",
      }}>
        <h1 style={{
          fontFamily: "'Saira Stencil One', sans-serif",
          fontSize: 24, color: "#00c9af", margin: "0 0 6px",
        }}>
          SessionOps Studio
        </h1>
        <p style={{ fontSize: 13, color: "#35393f", fontFamily: "'Inter', sans-serif", margin: "0 0 28px" }}>
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: "#35393f", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@test.com"
              required
              style={{
                width: "100%", background: "#ffffff", border: "1px solid #e0dcd6",
                borderRadius: 8, padding: "9px 12px", fontSize: 14,
                fontFamily: "'Inter', sans-serif", color: "#1e2229", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: "#35393f", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", background: "#ffffff", border: "1px solid #e0dcd6",
                borderRadius: 8, padding: "9px 12px", fontSize: 14,
                fontFamily: "'Inter', sans-serif", color: "#1e2229", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#e74c3c", fontFamily: "'Inter', sans-serif", marginBottom: 16 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "10px", borderRadius: 8, border: "none",
              background: "#00c9af", color: "#fff", fontSize: 14, fontWeight: 600,
              fontFamily: "'Inter', sans-serif", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: 12, background: "rgba(0,201,175,0.08)", borderRadius: 8, border: "1px solid rgba(0,201,175,0.2)" }}>
          <p style={{ fontSize: 12, fontFamily: "'Inter', sans-serif", color: "#35393f", margin: 0, fontWeight: 600 }}>Demo credentials</p>
          <p style={{ fontSize: 12, fontFamily: "'Inter', sans-serif", color: "#35393f", margin: "4px 0 0" }}>Admin: admin@test.com / admin123</p>
          <p style={{ fontSize: 12, fontFamily: "'Inter', sans-serif", color: "#35393f", margin: "2px 0 0" }}>Viewer: viewer@test.com / viewer123</p>
        </div>
      </div>
    </div>
  );
}
