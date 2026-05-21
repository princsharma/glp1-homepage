// app/dashboard/admin/AdminSidebar.jsx
//
// Admin-side sidebar. Mirrors the doctor/patient sidebar pattern so the
// chrome stays consistent across portals — same sticky rail, same mobile
// drawer behaviour, swapped nav items and branding.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import styles from "../patient/dashboard.module.css";

const NAV = [
  { href: "/dashboard/admin", label: "Overview", icon: HomeIcon, exact: true },
  { href: "/dashboard/admin/doctors", label: "Doctors", icon: StethIcon },
  { href: "/dashboard/admin/patients", label: "Patients", icon: UsersIcon },
  { href: "/dashboard/admin/appointments", label: "Appointments", icon: CalendarIcon },
];

export default function AdminSidebar({ profile, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Admin";
  const displayEmail = profile?.email || user?.email || "";
  const initial = (
    profile?.firstName?.[0] ||
    profile?.email?.[0] ||
    user?.email?.[0] ||
    "A"
  ).toUpperCase();
  const activeLabel =
    NAV.find((n) =>
      n.exact ? pathname === n.href : pathname.startsWith(n.href),
    )?.label || "Dashboard";

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/admin/admin-login");
  };

  const sidebarMarkup = (
    <aside
      className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`}
      aria-label="Admin navigation"
    >
      <button
        type="button"
        className={styles.drawerCloseBtn}
        onClick={() => setDrawerOpen(false)}
        aria-label="Close menu"
      >
        <CloseIcon />
      </button>

      <Link
        href="/dashboard/admin"
        className={styles.brand}
        onClick={() => setDrawerOpen(false)}
      >
        <span className={styles.brandMark} aria-hidden>O</span>
        <span className={styles.brandText}>
          <em className={styles.brandTextEm}>Ongo</em> Admin
        </span>
      </Link>

      <nav className={styles.navList}>
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              onClick={() => setDrawerOpen(false)}
            >
              <span className={styles.navIcon}><Icon /></span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.userFooter}>
        <div className={styles.avatar} aria-hidden>{initial}</div>
        <div className={styles.userMeta}>
          <div className={styles.userName}>{displayName}</div>
          {displayEmail && (
            <div className={styles.userEmail}>{displayEmail}</div>
          )}
        </div>
        <button
          type="button"
          className={styles.signOutBtn}
          onClick={handleSignOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <SignOutIcon />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className={styles.mobileBar}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <MenuIcon />
          <span style={{ fontWeight: 600 }}>{activeLabel}</span>
        </button>
        <Link
          href="/dashboard/admin"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}
        >
          <span className={styles.brandMark} aria-hidden style={{ width: 32, height: 32, fontSize: 14 }}>O</span>
        </Link>
      </div>

      {drawerOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      {sidebarMarkup}
    </>
  );
}

/* ── Icons ───────────────────────────────────────────────────────────── */
function iconProps(size = 18) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

function HomeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
      <circle cx="17" cy="8" r="3" />
      <path d="M22 20c0-3-2-5-5-5" />
    </svg>
  );
}

function StethIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M5 3v6a5 5 0 0010 0V3" />
      <line x1="5" y1="3" x2="3" y2="3" />
      <line x1="10" y1="3" x2="12" y2="3" />
      <circle cx="18" cy="15" r="3" />
      <path d="M15 14v-2a4 4 0 00-4-4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg {...iconProps(20)}>
      <line x1="4" y1="7"  x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg {...iconProps(16)}>
      <path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4" />
      <path d="M10 17l-5-5 5-5" />
      <line x1="15" y1="12" x2="5" y2="12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...iconProps(18)}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
