// src/firebase/config.js
//
// Firebase configuration is read from environment variables injected by CRA.
const env = process.env || {};

const rawApiKey = (env.REACT_APP_FIREBASE_API_KEY || '').trim();

// Firebase Web API keys start with AIzaSy and NEVER contain a colon.
// If an App ID (e.g. 1:364597414223:web:...) was mistakenly passed as API key, use the valid Web API key.
export const FIREBASE_API_KEY =
  (rawApiKey && !rawApiKey.includes(':') && rawApiKey.startsWith('AIzaSy'))
    ? rawApiKey
    : 'AIzaSyA4QTtVzGPs7xhn0VOxXwK0jxsj4klK2ic';

export const FIREBASE_AUTH_DOMAIN = env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'ims-yb.firebaseapp.com';
export const FIREBASE_PROJECT_ID = env.REACT_APP_FIREBASE_PROJECT_ID || 'ims-yb';
export const FIREBASE_STORAGE_BUCKET = env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'ims-yb.firebasestorage.app';
export const FIREBASE_MESSAGING_SENDER_ID = env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '364597414223';
export const FIREBASE_APP_ID = env.REACT_APP_FIREBASE_APP_ID || '1:364597414223:web:b27863c62054dc657bdd3a';
export const FIREBASE_MEASUREMENT_ID = env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-TSMQRNKJX4';

export const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

// Returns false when required values are missing or invalid.
export function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_API_KEY &&
    !FIREBASE_API_KEY.includes(':') &&
    FIREBASE_PROJECT_ID
  );
}

export function firebaseSetupMessage() {
  return [
    'Firebase is not configured.',
    'Ensure REACT_APP_FIREBASE_API_KEY and REACT_APP_FIREBASE_PROJECT_ID are set in frontend/.env',
    'See docs/FIREBASE_SETUP.md for details.',
  ].join('\n');
}