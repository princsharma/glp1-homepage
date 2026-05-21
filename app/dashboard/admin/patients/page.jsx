// app/dashboard/admin/patients/page.jsx
//
// Admin patients table — list, search by name/email, edit basic profile
// fields, delete the user doc. Backed by /api/admin/patients[/uid].

"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/auth";
import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [busyUid, setBusyUid] = useState("");

  const refresh = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("not signed in");
      const res = await fetch("/api/admin/patients", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "fetch failed");
      setPatients(Array.isArray(data.patients) ? data.patients : []);
      setError("");
    } catch (e) {
      setError(e?.message || "Could not load patients.");
      setPatients([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!patients) return [];
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q),
    );
  }, [patients, query]);

  const patchPatient = async (uid, body) => {
    setBusyUid(uid);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/patients/${uid}`, {
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
      setError(e?.message || "Update failed");
    } finally {
      setBusyUid("");
    }
  };

  const deletePatient = async (uid, fullName) => {
    if (!window.confirm(`Delete ${fullName}? This cannot be undone.`)) return;
    setBusyUid(uid);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/patients/${uid}`, {
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

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Patients</div>
          <h1 className={styles.pageTitle}>Patient accounts</h1>
          <p className={styles.pageSubtitle}>
            Search the patient roster. Edit basic profile fields or remove an
            account entirely.
          </p>
        </div>
      </header>

      <div className={admin.tableCard}>
        <div className={admin.tableToolbar}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className={admin.searchInput}
          />
          <span className={admin.tableMeta}>
            {patients === null
              ? "Loading…"
              : `${filtered.length} of ${patients.length}`}
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
                <th>Patient</th>
                <th>Phone</th>
                <th>DOB</th>
                <th>Status</th>
                <th>Signed up</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.uid}>
                  <td>
                    <div className={admin.cellMain}>
                      <div className={admin.cellAvatar} aria-hidden>
                        {(p.firstName?.[0] || p.email?.[0] || "P").toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className={admin.cellName}>{p.fullName}</div>
                        <div className={admin.cellSub}>{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={admin.cellSub}>{p.phone || "—"}</span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>{p.dob || "—"}</span>
                  </td>
                  <td>
                    <span className={`${admin.statusPill} ${patientStatusClass(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <span className={admin.cellSub}>{formatDate(p.createdAtMs)}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className={admin.rowActions}>
                      <button
                        type="button"
                        className={admin.btnGhost}
                        disabled={busyUid === p.uid}
                        onClick={() => setEditing(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${admin.btnGhost} ${admin.btnDanger}`}
                        disabled={busyUid === p.uid}
                        onClick={() => deletePatient(p.uid, p.fullName)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && patients !== null && (
                <tr>
                  <td colSpan={6}>
                    <div className={admin.emptyState}>
                      <div className={admin.emptyStateTitle}>
                        No patients match your search
                      </div>
                      Try clearing the search field.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <PatientEditModal
          patient={editing}
          onClose={() => setEditing(null)}
          onSave={async (fields) => {
            await patchPatient(editing.uid, fields);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function PatientEditModal({ patient, onClose, onSave }) {
  const [firstName, setFirstName] = useState(patient.firstName || "");
  const [lastName, setLastName] = useState(patient.lastName || "");
  const [phone, setPhone] = useState(patient.phone || "");
  const [status, setStatus] = useState(patient.status || "incomplete");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ firstName, lastName, phone, status });
    setSaving(false);
  };

  return (
    <div className={admin.modalBackdrop} onClick={onClose} role="presentation">
      <form
        className={admin.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 className={admin.modalTitle}>Edit patient</h2>
        <p className={admin.modalSub}>{patient.email}</p>
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
          <label className={admin.modalLabel}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={admin.modalInput}
          >
            <option value="incomplete">Incomplete</option>
            <option value="onboarded">Onboarded</option>
            <option value="active">Active</option>
          </select>
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

function patientStatusClass(s) {
  switch (s) {
    case "onboarded":
    case "active":
      return admin.statusOnboarded;
    case "incomplete":
      return admin.statusIncomplete;
    default:
      return admin.statusDeactivated;
  }
}

function formatDate(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
