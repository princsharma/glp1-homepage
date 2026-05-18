// lib/firebase/admin.js
//
// Firebase ADMIN SDK singleton — SERVER-ONLY.
//
// This file MUST NEVER be imported from a client component, page, or browser
// bundle. It uses a service-account private key that grants root-level access
// to the entire Firebase project (bypasses Security Rules, can create users,
// read/write any document). Leaking it = total project compromise.
//
// Safe import sites:
//   - app/api/**/route.js     (Next.js API route handlers, run server-side)
//   - server actions / server components
//
// Init is LAZY — credentials are read on first actual use, not at module
// load. This matters because Next.js's build-time page-data collection
// evaluates route modules without env vars set the same way as runtime; an
// eager initializer would crash the build. With lazy init, an import of this
// module is free; the credential check only fires when an Admin SDK call
// actually happens.

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (typeof window !== "undefined") {
  // Hard fail — this should never happen, but if it does we want a screaming
  // stack trace, not a silent credential leak.
  throw new Error(
    "[firebase-admin] Imported from a browser context. This module is server-only.",
  );
}

let _app = null;
let _auth = null;
let _db = null;

function buildCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Env var stores `\n` as literal backslash-n; convert back to real newlines.
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );

  const missing = [];
  if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
  if (missing.length > 0) {
    throw new Error(
      `[firebase-admin] Missing required env vars: ${missing.join(", ")}. ` +
        `See Firebase Console → Project Settings → Service accounts.`,
    );
  }

  return cert({ projectId, clientEmail, privateKey });
}

function getAdminApp() {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp({ credential: buildCredential() });
  return _app;
}

// Proxy-based lazy singletons. Importers can `import { adminAuth }` and use
// it like a normal object; the underlying SDK instance is created on first
// property access.
function makeLazy(factory) {
  let target = null;
  return new Proxy(function () {}, {
    get(_t, prop) {
      if (!target) target = factory();
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
    apply(_t, _thisArg, args) {
      if (!target) target = factory();
      return target.apply ? target.apply(_thisArg, args) : target(...args);
    },
    has(_t, prop) {
      if (!target) target = factory();
      return prop in target;
    },
  });
}

export const adminAuth = makeLazy(() => {
  if (_auth) return _auth;
  _auth = getAuth(getAdminApp());
  return _auth;
});

export const adminDb = makeLazy(() => {
  if (_db) return _db;
  _db = getFirestore(getAdminApp());
  return _db;
});

export default { getAdminApp };
