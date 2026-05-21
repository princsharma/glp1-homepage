// app/dashboard/admin/layout.jsx
//
// Shared chrome for every /dashboard/admin/* sub-route. Role-gated so
// only users with role === "admin" can render anything beyond the
// loading shim — anyone else is redirected by useRequireRole.

"use client";

import { useRequireRole } from "@/lib/auth/useRequireRole";
import AdminSidebar from "./AdminSidebar";
import styles from "../patient/dashboard.module.css";

export default function AdminLayout({ children }) {
  const { ready, user, profile } = useRequireRole("admin");

  if (!ready) {
    return <main className={styles.loading}>Loading admin console…</main>;
  }

  return (
    <div className={styles.shell}>
      <AdminSidebar profile={profile} user={user} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
