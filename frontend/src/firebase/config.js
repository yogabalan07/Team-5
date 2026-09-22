// src/firebase/config.js
//
// Firebase configuration is read exclusively from environment variables.
// No credentials are hard-coded or committed. Values are injected at build time
// by Create React App (variables must be prefixed with REACT_APP_).
//
// Required environment variables (see frontend/.env.example):
//   REACT_APP_FIREBASE_API_KEY
//   REACT_APP_FIREBASE_AUTH_DOMAIN
//   REACT_APP_FIREBASE_PROJECT_ID
//   REACT_APP_FIREBASE_STORAGE_BUCKET
//   REACT_APP_FIREBASE_MESSAGING_SENDER_ID
//   REACT_APP_FIREBASE_APP_ID

const env = process.env || {};

export const FIREBASE_API_KEY = env.REACT_APP_FIREBASE_API_KEY || '';
export const FIREBASE_AUTH_DOMAIN = env.REACT_APP_FIREBASE_AUTH_DOMAIN || '';
export const FIREBASE_PROJECT_ID = env.REACT_APP_FIREBASE_PROJECT_ID || '';
export const FIREBASE_STORAGE_BUCKET = env.REACT_APP_FIREBASE_STORAGE_BUCKET || '';
export const FIREBASE_MESSAGING_SENDER_ID = env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '';
export const FIREBASE_APP_ID = env.REACT_APP_FIREBASE_APP_ID || '';

export const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// Returns false when any required value is missing.
export function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_API_KEY &&
    FIREBASE_AUTH_DOMAIN &&
    FIREBASE_PROJECT_ID &&
    FIREBASE_STORAGE_BUCKET &&
    FIREBASE_MESSAGING_SENDER_ID &&
    FIREBASE_APP_ID
  );
}

export function firebaseSetupMessage() {
  return [
    'Firebase is not configured.',
    'Create a Firebase project in the Firebase Console (https://console.firebase.google.com).',
    'Open Project settings → General → "Your apps" → pick the Web app (or add one).',
    'Copy the six config values below and paste them into frontend/.env.local:',
    '',
    'REACT_APP_FIREBASE_API_KEY=...',
    'REACT_APP_FIREBASE_AUTH_DOMAIN=...',
    'REACT_APP_FIREBASE_PROJECT_ID=...',
    'REACT_APP_FIREBASE_STORAGE_BUCKET=...',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...',
    'REACT_APP_FIREBASE_APP_ID=...',
    '',
    'See docs/FIREBASE_SETUP.md for the full step-by-step guide.',
  ].join('\n');
}