# Firebase setup

This project runs entirely on Firebase's **Spark (free) plan**: Authentication +
Firestore + Hosting + Security Rules. There are **no Cloud Functions** and **no
Firebase Storage** — the app needs no paid/billing services. The legacy Spring
Boot backend, MySQL schema and Docker compose files were removed in the
migration; nothing else needs to be hosted.

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (example: `inventory-pro-2024`) and create it.
3. From the project dashboard, open **Project settings → General**.
4. Under **Your apps**, click the web icon (`</>`) and register a web app.
5. Copy the config values:

   ```
   REACT_APP_FIREBASE_API_KEY
   REACT_APP_FIREBASE_AUTH_DOMAIN
   REACT_APP_FIREBASE_PROJECT_ID
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID
   REACT_APP_FIREBASE_APP_ID
   ```

## 2. Configure the frontend

```bash
cp frontend/.env.example frontend/.env
```

Paste the values into `frontend/.env`. `frontend/.env` is git-ignored; the
example file contains placeholders only. These values are not secrets — they
are public identifiers that ship in the browser build — but keep real
credentials out of the repository regardless.

## 3. Enable Authentication

1. In the Firebase console open **Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. (Optional) Open **Settings → Authorized domains** and add your staging domain.

## 4. Create the Cloud Firestore database

1. Open **Firestore Database → Create database**.
2. Choose **Production mode**, pick a region, and finish.
3. Deploy the rules and indexes when ready (below).

## 5. Deploy hosting and Firestore rules

Install the Firebase CLI once:

```bash
npm install -g firebase-tools
```

Bind the repo to your project:

```bash
npx firebase use <your-project-id>
```

Deploy everything (free tier — no functions, no storage):

```bash
npm run build --prefix frontend
npx firebase deploy --only hosting,firestore:rules
```

This pushes `firestore.rules`, `firestore.indexes.json`, and the built frontend
from `frontend/build`.

To push only one target: `npx firebase deploy --only firestore` or `--only
hosting`.

## 6. Create the first admin (bootstrap)

The very **first Firebase Auth account that registers through the app becomes
the system ADMIN**. This is done atomically in Firestore: the first
registration claims a `bootstrap/lock` document and creates its matching ADMIN
profile in the same transaction; every later registration is forced to the
`STAFF` role. Nobody can upgrade their own role afterwards — the Firestore
security rules only let an ADMIN change roles.

> Important: as soon as a fresh project is deployed and **Email/Password**
> sign-in is enabled, register the administrator account FIRST via the app's
> Register page, before sharing the login URL. Anyone who registers first wins
> the bootstrap.

After the first admin exists, add users from the app's **Admin → Users**
screen:
- New accounts are created by self-registration (STAFF), then promoted to the
  needed role.
- Use **Deactivate** instead of Delete (the free plan has no Admin SDK, so auth
  identities can't be removed; a deactivated account is completely blocked by
  the security rules).
- Use the **Reset Password** button to send the user a Firebase password-reset
  email (the free plan can't force a new password server-side).

## 7. Verifying locally

- `npm test --prefix frontend` runs the service-layer unit tests
  (`frontend/src/services/__tests__`). No live backend is required.
- If you want to test against a local emulator:

  ```bash
  npx firebase emulators:start
  ```

  and point the app at the emulator by setting
  `REACT_APP_USE_EMULATOR=true` and the emulator URLs in
  `frontend/src/firebase/firebase.js` (dev-only; not documented further here).