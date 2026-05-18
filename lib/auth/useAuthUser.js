// lib/auth/useAuthUser.js
//
// Client-side React hook that exposes:
//   - the signed-in Firebase Auth user (or null)
//   - the user's Firestore profile doc from users/{uid}
//   - their role (defaults to "patient" if the doc has no `role` field —
//     handles older records written before role was introduced)
//   - a `loading` flag while the initial auth + profile fetch resolves
//
// Subscribes to onAuthStateChanged so login/logout in another tab updates
// every consumer of this hook. Also live-subscribes to the Firestore doc so
// role changes (e.g., admin promotes a user) reflect immediately without a
// page reload.

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firestore";

export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub = null;

    const authUnsub = onAuthStateChanged(auth, (nextUser) => {
      // Tear down any previous profile listener — the UID may have changed.
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(nextUser);
      // Live-subscribe to users/{uid}. If the doc doesn't exist yet (just-
      // signed-up users between auth and first save-progress write), we
      // still resolve loading=false with profile=null so callers can render
      // a skeleton instead of spinning forever.
      profileUnsub = onSnapshot(
        doc(db, "users", nextUser.uid),
        (snap) => {
          setProfile(snap.exists() ? snap.data() : null);
          setLoading(false);
        },
        (err) => {
          // Permission errors usually mean Firestore rules aren't deployed.
          // Surface in console but don't crash — keep the auth user, drop
          // the profile, and let the UI degrade gracefully.
          // eslint-disable-next-line no-console
          console.warn("[useAuthUser] profile snapshot error:", err);
          setProfile(null);
          setLoading(false);
        },
      );
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  // Role resolution rule: explicit field on the doc wins; otherwise default
  // to "patient" so existing records and brand-new signups behave the same.
  const role = profile?.role ?? (user ? "patient" : null);

  return { user, profile, role, loading };
}
