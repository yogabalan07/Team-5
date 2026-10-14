# Team-5 Inventory Management System

A production-grade inventory management web app with sales, purchases, returns,
accounts, reports and role-based access control. The application is fully
serverless — the React frontend talks directly to Firebase Authentication and
Cloud Firestore. There is no Node/Spring backend to host.

## Stack

- **Frontend**: React 18 (Create React App), Material UI 5, Recharts
- **Backend**: Firebase — Authentication (email/password), Cloud Firestore,
  Hosting, Security Rules. Runs entirely on the free Spark plan: no Cloud
  Functions, no Firebase Storage, no paid services.
- **Numbers & stock**: issued atomically via Firestore `runTransaction`
  (see `frontend/src/services/inventoryOps.js`)

## Repository layout

```
frontend/              React application (CRA)
  src/firebase/        Firebase init + env-driven configuration
  src/services/        Data-access layer (Firestore-backed, REST-compatible)
  src/services/__tests__  Pure-logic unit tests
firebase.json          Firebase config (rules + hosting)
firestore.rules        Firestore security rules
.branches/.firebaserc  Firebase project binding
```

## Local development

1. Install dependencies:

   ```bash
   npm install --prefix frontend
   ```

2. Copy `frontend/.env.example` to `frontend/.env` and fill in your Firebase
   project's web-app config (see [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)).

3. Run the app:

   ```bash
   npm run start --prefix frontend
   ```

4. Run the tests:

   ```bash
   CI=true npm test --prefix frontend
   ```

5. Build for production:

   ```bash
   npm run build --prefix frontend
   ```

## Roles

| Role               | Accesses                                                      |
| ------------------ | ------------------------------------------------------------- |
| `ADMIN`            | Everything, including user management                         |
| `STORE_MANAGER`    | Items, brands, groups, sections, units                        |
| `BILLING_CLERK`    | Customers and sales                                            |
| `PURCHASE_MANAGER` | Suppliers, purchase orders and purchase invoices               |
| `ACCOUNTS`         | Bill receipts, bill payments, account ledger                   |
| `STAFF`            | Default role for self-registered accounts (read access)        |

Self-registration always creates a `STAFF` account. The very first account to
register on a fresh system becomes the system `ADMIN` (atomic bootstrap); after
that, roles are managed by an admin from the **Admin → Users** screen.

## Data model

Core collections: `customers`, `suppliers`, `itemBrands`, `itemGroups`,
`itemSections`, `units`, `taxes`, `items`, `purchaseOrders`, `purchaseInvoices`,
`salesInvoices`, `salesReturns`, `purchaseReturns`, `billReceipts`,
`billPayments`, `stockTransactions`, `counters`, `users`, `bootstrap`.

All reads are available to any enabled (active) authenticated user; writes are
gated by role in `firestore.rules`, which reads each user's role from their
profile document (`users/{uid}.role`). The profile is created during
self-registration (forced `STAFF`) or by the first-admin bootstrap, and can
only be changed by an `ADMIN`.

## Document numbering

Business documents use collision-free, date-scoped numbers of the form
`PREFIX-YYYYMMDD-000001` (e.g. `INV-20240615-000042`). The sequence counter
lives in `counters` and is incremented inside the same transaction that creates
the document.

## Deployment

```bash
npm run build --prefix frontend
npx firebase deploy --only hosting,firestore:rules
```

You must be logged in (`npx firebase login`) and the project must be bound
(hosting + firestore). See [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).
The app runs entirely on the free Spark plan; enabling Blaze is not required
and no dashboard feature depends on it.