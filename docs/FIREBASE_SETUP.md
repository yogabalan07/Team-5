# Firebase setup

This project runs entirely on Firebase (Auth + Firestore + Functions + Hosting).
The legacy Spring Boot backend, MySQL schema and Docker compose files were
removed in the migration; nothing else needs to be hosted.

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

## 5. Deploy rules, functions and hosting

Install the Firebase CLI once:

```bash
npm install -g firebase-tools
```

Bind the repo to your project:

```bash
npx firebase use <your-project-id>
```

Deploy everything:

```bash
npm run build --prefix frontend
npx firebase deploy
```

This pushes `firestore.rules`, `firestore.indexes.json`, the Cloud Functions in
`functions/`, and the built frontend from `frontend/build`.

To push only one target: `npx firebase deploy --only firestore`, `--only
functions`, or `--only hosting`.

## 6. Create the first admin

The rules and the app only allow `ADMIN` accounts to manage users. To
bootstrap your first administrator, run the exported `bootstrapAdmin` Cloud
Function once (it refuses to run once any admin exists):

```bash
npx firebase functions:shell
# in the shell:
bootstrapAdmin({ username: 'root', email: 'you@example.com', password: 'changeme' })
```

After that, log in through the web app and invite/assign further users from the
**Admin → Users** screen (must be logged in as an admin).

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