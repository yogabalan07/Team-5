// src/firebase/firebase.js
import { initializeApp, getApps, getApp } from '@firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
import { getFunctions } from '@firebase/functions';
import { firebaseConfig, isFirebaseConfigured } from './config';

let app = null;
let auth = null;
let db = null;
let functions = null;

if (isFirebaseConfigured()) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  try {
    setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    // Persistence is best-effort; failure here should not crash the app.
    console.warn('Could not set auth persistence', e);
  }
} else {
  console.warn('[firebase] Not configured - Firebase services are disabled.');
}

export { app, auth, db, functions };