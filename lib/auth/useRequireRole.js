// lib/auth/useRequireRole.js
//
// Drop-in guard for any page that should only render to a specific role.
//
//   const { ready, user, profile } = useRequireRole("patient");
//   if (!ready) return <Loading/>;
//   // ...render patient UI with user/profile in hand
//
// Behavior:
//   - while loading                 → ready=false, do nothing (UI shows skeleton)
//   - signed out                    → redirect to the login page for that role
//                                     (doctor → /doctor/doctor-login,
//                                      everyone else → /login)
//   - signed in, wrong role         → redirect to that user's actual home
//   - signed in, correct role       → ready=true, render
//
// Client-side guarding only — Firestore Security Rules are still the source
// of truth for which data is readable. This hook only controls navigation.

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthUser } from "./useAuthUser";

const ROLE_HOME = {
  patient: "/dashboard/patient",
  doctor: "/dashboard/doctor",
  admin: "/dashboard/admin",
};

// Doctor sign-in is intentionally kept on a separate URL so patients
// never see anything about clinician registration.
const ROLE_LOGIN = {
  patient: "/login",
  doctor: "/doctor/doctor-login",
  admin: "/login",
};

export function useRequireRole(requiredRole) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, role, loading } = useAuthUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const loginUrl = ROLE_LOGIN[requiredRole] || "/login";
      router.replace(`${loginUrl}?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (role !== requiredRole) {
      // Wrong role — send to *their* home so they don't get stuck in a loop.
      router.replace(ROLE_HOME[role] || ROLE_LOGIN[requiredRole] || "/login");
    }
  }, [loading, user, role, requiredRole, router, pathname]);

  const ready = !loading && !!user && role === requiredRole;
  return { ready, user, profile, role };
}
