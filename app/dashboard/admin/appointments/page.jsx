// app/dashboard/admin/appointments/page.jsx
//
// Admin appointments table — all appointments across the platform. Filter
// by status, search across patient / doctor names, cancel or delete an
// appointment.

"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/auth";
import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState("");

  const refresh = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("not signed in");
      const res = await fetch("/api/admin/appointments", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "fetch failed");
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      setError("");
    } catch (e) {
      setError(e?.message || "Could not load appointments.");
      setAppointments([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!appointments) return [];
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.patientEmail.toLowerCase().includes(q)
      );
    });
  }, [appointments, query, statusFilter]);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setBusyId(id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "update failed");
      await refresh();
    } catch (e) {
      setError(e?.message || "Update failed");
    } finally {
      setBusyId("");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this appointment record? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "delete failed");
      await refresh();
    } catch (e) {
      setError(e?.message || "Delete failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Appointments</div>
          <h1 className={styles.pageTitle}>All consultations</h1>
          <p className={styles.pageSubtitle}>
            Every appointment across the platform — cancel mistakes, clean up
            stale records, or just keep an eye on bookings.
          </p>
        </div>
      </header>

      <div className={admin.tableCard}>
        <div className={admin.tableToolbar}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient, doctor, type, or email…"
            className={admin.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={admin.filterSelect}
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className={admin.tableMeta}>
            {appointments === null
              ? "Loading…"
              : `${filtered.length} of ${appointments.length}`}
          </span>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 20px",
              color: "#b3261e",
              background: "#fde7e2",
              fontSize: 13,
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            {error}
          </div>
        )}

        <div className={admin.tableScroll}>
          <table className={admin.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className={admin.cellName}>{formatDay(a.date)}</div>
                    <div className={admin.cellSub}>{a.time || "—"}</div>
                  </td>
                  <td>
                    <div className={admin.cellName}>{a.patientName || "—"}</div>
                    <div className={admin.cellSub}>{a.patientEmail || ""}</div>
                  </td>
                  <td>
                    <span className={admin.cellName}>{a.doctorName || "—"}</span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>{a.type}</span>
                  </td>
                  <td>
                    <span className={`${admin.statusPill} ${apptStatusClass(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className={admin.rowActions}>
                      {a.status === "scheduled" && (
                        <button
                          type="button"
                          className={admin.btnGhost}
                          disabled={busyId === a.id}
                          onClick={() => cancel(a.id)}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${admin.btnGhost} ${admin.btnDanger}`}
                        disabled={busyId === a.id}
                        onClick={() => remove(a.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && appointments !== null && (
                <tr>
                  <td colSpan={6}>
                    <div className={admin.emptyState}>
                      <div className={admin.emptyStateTitle}>
                        No appointments match your filters
                      </div>
                      Try clearing the search or status filter.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function apptStatusClass(s) {
  switch (s) {
    case "scheduled":
      return admin.statusScheduled;
    case "completed":
      return admin.statusCompleted;
    case "cancelled":
      return admin.statusCancelled;
    default:
      return admin.statusDeactivated;
  }
}

function formatDay(iso) {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
