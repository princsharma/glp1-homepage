// app/dashboard/admin/doctors/page.jsx
//
// Admin doctors table — list, search, filter by status, edit priority,
// approve/reject, edit profile, delete. The "priority" column is what
// drives the public picker order: higher = surfaced earlier, top 3 only.
//
// All mutations call /api/admin/doctors/[uid] (PATCH/DELETE) and then
// refetch — simple but fine for the typical doctor-roster size.

"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/auth";
import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending review" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "deactivated", label: "Deactivated" },
];

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [busyUid, setBusyUid] = useState("");

  const refresh = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("not signed in");
      const res = await fetch("/api/admin/doctors", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "fetch failed");
      setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
      setError("");
    } catch (e) {
      setError(e?.message || "Could not load doctors.");
      setDoctors([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!doctors) return [];
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        (d.licensedStates || []).join(" ").toLowerCase().includes(q)
      );
    });
  }, [doctors, query, statusFilter]);

  const patchDoctor = async (uid, body) => {
    setBusyUid(uid);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/doctors/${uid}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "update failed");
      await refresh();
    } catch (e) {
      // Surface the error inline rather than alert()-ing — the toolbar
      // banner is good enough for an internal admin tool.
      setError(e?.message || "Update failed");
    } finally {
      setBusyUid("");
    }
  };

  const deleteDoctor = async (uid, fullName) => {
    if (!window.confirm(`Delete ${fullName}? This cannot be undone.`)) return;
    setBusyUid(uid);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/doctors/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "delete failed");
      await refresh();
    } catch (e) {
      setError(e?.message || "Delete failed");
    } finally {
      setBusyUid("");
    }
  };

  const setPriority = async (uid, value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    await patchDoctor(uid, { priority: n });
  };

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Doctors</div>
          <h1 className={styles.pageTitle}>Clinician management</h1>
          <p className={styles.pageSubtitle}>
            Approve applications, set priority for the patient picker (top 3
            highest priority appear), edit profile, or remove accounts.
          </p>
        </div>
      </header>

      <div className={admin.tableCard}>
        <div className={admin.tableToolbar}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or state…"
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
            {doctors === null
              ? "Loading…"
              : `${filtered.length} of ${doctors.length}`}
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
                <th>Doctor</th>
                <th>States</th>
                <th>Status</th>
                <th>Priority</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.uid}>
                  <td>
                    <div className={admin.cellMain}>
                      <div
                        className={admin.cellAvatar}
                        style={d.photoURL ? { backgroundImage: `url("${d.photoURL}")` } : undefined}
                        aria-hidden
                      >
                        {!d.photoURL && (d.firstName?.[0] || d.fullName?.[0] || "D").toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className={admin.cellName}>Dr. {d.fullName}</div>
                        <div className={admin.cellSub}>{d.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={admin.cellSub} style={{ whiteSpace: "normal" }}>
                      {(d.licensedStates || []).join(", ") || "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`${admin.statusPill} ${statusClass(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <input
                      type="number"
                      defaultValue={d.priority}
                      className={admin.priorityInput}
                      disabled={busyUid === d.uid}
                      onBlur={(e) => {
                        if (Number(e.target.value) !== d.priority) {
                          setPriority(d.uid, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      aria-label={`Priority for Dr. ${d.fullName}`}
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className={admin.rowActions}>
                      {d.status === "pending" && (
                        <button
                          type="button"
                          className={`${admin.btnGhost} ${admin.btnApprove}`}
                          disabled={busyUid === d.uid}
                          onClick={() => patchDoctor(d.uid, { status: "active" })}
                        >
                          Approve
                        </button>
                      )}
                      {d.status === "active" && (
                        <button
                          type="button"
                          className={admin.btnGhost}
                          disabled={busyUid === d.uid}
                          onClick={() => patchDoctor(d.uid, { status: "deactivated" })}
                        >
                          Deactivate
                        </button>
                      )}
                      {d.status === "pending" && (
                        <button
                          type="button"
                          className={admin.btnGhost}
                          disabled={busyUid === d.uid}
                          onClick={() => patchDoctor(d.uid, { status: "rejected" })}
                        >
                          Reject
                        </button>
                      )}
                      {(d.status === "rejected" || d.status === "deactivated") && (
                        <button
                          type="button"
                          className={`${admin.btnGhost} ${admin.btnApprove}`}
                          disabled={busyUid === d.uid}
                          onClick={() => patchDoctor(d.uid, { status: "active" })}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        type="button"
                        className={admin.btnGhost}
                        disabled={busyUid === d.uid}
                        onClick={() => setEditing(d)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${admin.btnGhost} ${admin.btnDanger}`}
                        disabled={busyUid === d.uid}
                        onClick={() => deleteDoctor(d.uid, d.fullName)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && doctors !== null && (
                <tr>
                  <td colSpan={5}>
                    <div className={admin.emptyState}>
                      <div className={admin.emptyStateTitle}>
                        No doctors match your filters
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

      {editing && (
        <DoctorEditModal
          doctor={editing}
          onClose={() => setEditing(null)}
          onSave={async (fields) => {
            await patchDoctor(editing.uid, fields);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function DoctorEditModal({ doctor, onClose, onSave }) {
  const [firstName, setFirstName] = useState(doctor.firstName || "");
  const [lastName, setLastName] = useState(doctor.lastName || "");
  const [phone, setPhone] = useState(doctor.phone || "");
  const [bio, setBio] = useState(doctor.bio || "");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ firstName, lastName, phone, bio });
    setSaving(false);
  };

  return (
    <div className={admin.modalBackdrop} onClick={onClose} role="presentation">
      <form
        className={admin.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 className={admin.modalTitle}>Edit doctor</h2>
        <p className={admin.modalSub}>
          {doctor.email} · status {doctor.status}
        </p>
        <div className={admin.modalField}>
          <label className={admin.modalLabel}>First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={admin.modalInput}
          />
        </div>
        <div className={admin.modalField}>
          <label className={admin.modalLabel}>Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={admin.modalInput}
          />
        </div>
        <div className={admin.modalField}>
          <label className={admin.modalLabel}>Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={admin.modalInput}
          />
        </div>
        <div className={admin.modalField}>
          <label className={admin.modalLabel}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={admin.modalInput}
            rows={4}
            style={{ resize: "vertical" }}
          />
        </div>
        <div className={admin.modalActions}>
          <button
            type="button"
            className={admin.btnGhost}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${admin.btnGhost} ${admin.btnApprove}`}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function statusClass(s) {
  switch (s) {
    case "active":
      return admin.statusActive;
    case "pending":
      return admin.statusPending;
    case "rejected":
      return admin.statusRejected;
    case "deactivated":
      return admin.statusDeactivated;
    default:
      return admin.statusDeactivated;
  }
}
