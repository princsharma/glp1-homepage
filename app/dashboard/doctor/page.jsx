// app/dashboard/doctor/page.jsx
//
// STUB — full doctor dashboard is a later iteration. Only renders if the
// signed-in user has role === "doctor"; everyone else is bounced by the
// role guard. Exists today so the role router has somewhere to send a
// manually-promoted doctor account, and so URL-typing a wrong role lands
// somewhere sensible rather than 404.

"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useRequireRole } from "@/lib/auth/useRequireRole";

export default function DoctorDashboardStub() {
  const router = useRouter();
  const { ready, profile } = useRequireRole("doctor");

  if (!ready) {
    return <main style={layout}>Loading…</main>;
  }

  return (
    <main style={layout}>
      <div style={card}>
        <div style={kicker}>Doctor dashboard</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
          Coming soon
        </h1>
        <p style={{ margin: "0 0 24px", color: "#5c6470" }}>
          Hi {profile?.firstName || "Doctor"} — the doctor workspace is still
          under construction. You'll see assigned patients, intake reviews,
          and consultation scheduling here.
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
