// app/dashboard/admin/page.jsx
//
// STUB — full admin dashboard is a later iteration. Mirrors the doctor
// stub. When we build the real admin panel this is where the user list,
// role-promotion UI, and audit log will live.

"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useRequireRole } from "@/lib/auth/useRequireRole";

export default function AdminDashboardStub() {
  const router = useRouter();
  const { ready, profile } = useRequireRole("admin");

  if (!ready) {
    return <main style={layout}>Loading…</main>;
  }

  return (
    <main style={layout}>
      <div style={card}>
        <div style={kicker}>Admin dashboard</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
          Coming soon
        </h1>
        <p style={{ margin: "0 0 24px", color: "#5c6470" }}>
          Hi {profile?.firstName || "Admin"} — the admin tools are still
          under construction. User management, role assignment, and audit
          logging will live here.
        </p>
        <button
          type="button"
          onClick={async () => {
            await signOut(auth);
            router.replace("/login");
          }}
          style={signOutBtn}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}

const layout = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  background: "#f6f7f9",
  fontFamily: "system-ui, sans-serif",
  color: "#1f2933",
};
const card = {
  background: "white",
  borderRadius: 12,
  padding: 32,
  maxWidth: 480,
  width: "100%",
  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
};
const kicker = {
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#5c6470",
  marginBottom: 4,
};
const signOutBtn = {
  background: "transparent",
  border: "1px solid #d6dae0",
  borderRadius: 8,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 14,
};
