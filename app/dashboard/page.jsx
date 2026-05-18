// app/dashboard/page.jsx
//
// Role router. Anyone landing on /dashboard gets sent to the dashboard that
// matches their role. Not signed in → /login. Unknown role → /login as a
// safe fallback.
//
// This is the only place that knows the role → subroute mapping; each
// dashboard page enforces its own role using useRequireRole, so even a user
// who hand-types /dashboard/admin in the URL is bounced.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/auth/useAuthUser";

const ROLE_HOME = {
  patient: "/dashboard/patient",
  doctor: "/dashboard/doctor",
  admin: "/dashboard/admin",
};

export default function DashboardIndex() {
  const router = useRouter();
  const { user, role, loading } = useAuthUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/dashboard");
      return;
    }
    router.replace(ROLE_HOME[role] || "/login");
  }, [loading, user, role, router]);

  // Brief flash while we wait for auth + role to resolve. No layout shift.
  return (
    <main style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
      Loading your dashboard…
    </main>
  );
}
