// app/dashboard/doctor/layout.jsx
//
// Shared chrome for every /dashboard/doctor/* sub-route. Role-gated so only
// users with role="doctor" make it past the loading shim.

"use client";

import { useRequireRole } from "@/lib/auth/useRequireRole";
import DoctorSidebar from "./DoctorSidebar";
import styles from "../patient/dashboard.module.css";

export default function DoctorLayout({ children }) {
  const { ready, user, profile } = useRequireRole("doctor");

  if (!ready) {
    return <main className={styles.loading}>Loading your dashboard…</main>;
  }

  return (
    <div className={styles.shell}>
      <DoctorSidebar profile={profile} user={user} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
