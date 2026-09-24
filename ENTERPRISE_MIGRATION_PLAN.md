# Enterprise Migration Plan: Inventory to Enterprise Business Management System (EBMS)

## Executive Summary
This document defines the comprehensive architectural assessment, audit findings, and execution blueprint for transforming the existing **Inventory Management System** into an **Enterprise Business Management System (EBMS)**. The system is designed to run seamlessly and reliably within the constraints of the **Firebase Spark (free) tier** while maintaining enterprise-grade security, data consistency, real-time performance, and responsive UI/UX.

---

## 1. Current Architecture & Codebase Audit

### 1.1 Technology Stack
- **Frontend Core**: React 18.2.0, React Router v6.18.0, Create React App (react-scripts 5.0.1)
- **UI Framework**: Material-UI (MUI) v5.14.18, Emotion, Recharts 2.9.0, React Toastify 9.1.3
- **Data & Auth**: Firebase JS SDK (Modular v10/v9 compat layer via `@firebase/app`, `@firebase/auth`, `@firebase/firestore`), LocalStorage persistence cache
- **Target Backend Model**: Pure Serverless Firebase (Firestore + Firebase Auth + Firebase Hosting) without paid Cloud Functions or Firebase Storage.

### 1.2 Current Collections in Firestore
1. `users` — User profile, role, status (`isActive`), contact details, search tokens.
2. `roles` — Roster of supported system roles.
3. `usernames` — Reservation collection to ensure unique usernames upon registration.
4. `bootstrap` — Bootstrap document (`bootstrap/lock`) controlling first-admin self-provisioning.
5. `customers` — Customer master records with credit limits and balances.
6. `suppliers` — Supplier master records with credit balances.
7. `items` — Product master records with pricing, tax, stock levels, and flags.
8. `itemBrands` — Master brand references.
9. `itemGroups` — Master group/category references.
10. `itemSections` — Master section/aisle references.
11. `units` — Units of measurement (UOM).
12. `taxes` — Tax rates and classifications.
13. `purchaseOrders` — Purchase orders created by purchase managers.
14. `purchaseInvoices` — Purchase entries with atomic stock addition.
15. `purchaseReturns` — Purchase returns with atomic stock decrement and debit adjustments.
16. `salesInvoices` — Sales invoices with atomic stock decrement and customer dues.
17. `salesReturns` — Sales returns with atomic stock replenishment and credit adjustments.
18. `billReceipts` — Inward payments from customers linked to sales invoices.
19. `billPayments` — Outward payments to suppliers linked to purchase invoices.
20. `stockTransactions` — Stock movement ledger tracking before/after quantities and transaction references.
21. `counters` — Atomic sequencing counters for collision-free document numbering (`INV-`, `PO-`, `PI-`, `REC-`, `PAY-`, `RET-`).

### 1.3 Current Routes & Page Components
- `/login` → `Login.jsx`
- `/register` → `Register.jsx`
- `/dashboard` → `Dashboard.jsx`
- `/customers`, `/customers/new`, `/customers/edit/:id` → `CustomerList.jsx`, `CustomerForm.jsx`
- `/suppliers`, `/suppliers/new`, `/suppliers/edit/:id` → `SupplierList.jsx`, `SupplierForm.jsx`
- `/items`, `/items/new`, `/items/edit/:id` → `ItemList.jsx`, `ItemForm.jsx`
- `/items/brands`, `/items/groups`, `/items/sections`, `/items/units`, `/items/taxes` → Master list views
- `/sales/entry`, `/sales/edit/:id`, `/sales/list`, `/sales/return`, `/sales/print/:id`, `/sales/invoice/:id` → Sales workflow views
- `/purchases/order`, `/purchases/edit-order/:id`, `/purchases/orders`, `/purchases/entry`, `/purchases/list`, `/purchases/return`, `/purchases/grn` → Purchase workflow views
- `/accounts/receipts`, `/accounts/payments`, `/accounts/ledger` → Financial receipt/payment & ledger views
- `/reports/sales`, `/reports/sales-details`, `/reports/purchases`, `/reports/purchase-details`, `/reports/customer-receipts`, `/reports/supplier-payments`, `/reports/stock` → Comprehensive reporting views
- `/admin/users` → `UserManagement.jsx`

### 1.4 Existing Security Model
- Security rules in `firestore.rules` enforce role-based access control (RBAC).
- `isEnabled()` helper verifies `request.auth != null` and `users/{request.auth.uid}.data.isActive == true`.
- Granular permissions mapped per collection (`ADMIN`, `BILLING_CLERK`, `ACCOUNTS`, `PURCHASE_MANAGER`, `STORE_MANAGER`, `STAFF`).
- Field restriction via `changesOnly(...)` for counter updates and balance updates.

---

## 2. P0 Firestore Security Issue Root-Cause Analysis

### 2.1 The Problem
Users observed `FirebaseError: Missing or insufficient permissions` when loading the Dashboard, Customers, or Items page.

### 2.2 Root-Cause Identification
1. **Recursive Dependency in `users/{userId}` Rule**:
   - `firestore.rules` defined:
     ```firestore-rules
     match /users/{userId} {
       allow read: if isEnabled() && (request.auth.uid == userId || isAdmin());
     ```
   - Notice that `isEnabled()` calls `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isActive == true`.
   - When a newly authenticated user or unverified user signs in, calling `authService.loadProfile(uid)` executes a `getDoc(users/{uid})`.
   - The security rule evaluates `isEnabled()`, which itself executes `getDoc(users/{uid})`. If the document has not yet been read or if the user is checking whether their profile exists, the rule fails with `permission-denied`!
   - Because `loadProfile` failed with permission-denied, `AuthContext` was unable to resolve the active profile document, leading to an unauthenticated/unprivileged client state that subsequently failed all downstream dashboard queries.

2. **Fix Implemented in Phase 0**:
   - Update `users/{userId}` rule so that a signed-in user can directly read their own profile without recursive `isEnabled()` evaluation:
     ```firestore-rules
     match /users/{userId} {
       allow read: if (isSignedIn() && request.auth.uid == userId) || isAdmin();
     ```
   - In `authService.js`, introduce resilient `ensureProfile()` that handles orphan accounts (auth user exists without Firestore profile) by automatically provisioning the Firestore profile and assigning `ADMIN` if `bootstrap/lock` is available, or `STAFF` otherwise.
   - In `itemService.js`, fix the `classifyStock` return type mismatch where `isLowStock` was being set to `undefined`.

---

## 3. Target Architecture & 17-Module System Blueprint

### 3.1 Extended RBAC Matrix
The target system expands the enterprise roles and granular permissions:

| Enterprise Role | Code | Permissions |
|---|---|---|
| Super Administrator | `SUPER_ADMIN` | Full System Access, Company Settings, Security Rules, Audit Logs |
| Administrator | `ADMIN` | User Management, Master Data, Approvals, All Business Modules |
| Inventory Manager | `INVENTORY_MANAGER` | Items, Warehouses, Stock Ledger, Adjustments, Transfers |
| Sales Manager | `SALES_MANAGER` | Quotations, Orders, Deliveries, Invoices, Returns, Sales Targets |
| Purchase Manager | `PURCHASE_MANAGER` | Requisitions, POs, GRN, Invoices, Debit Notes |
| Warehouse Staff | `WAREHOUSE_STAFF` | Stock Movements, Picking, Packing, Goods Receipts, Bin Locations |
| Salesperson | `SALESPERSON` | Customer Inquiries, Quotations, Sales Orders, Assigned Invoices |
| Accountant | `ACCOUNTANT` | Receipts, Payments, Expenses, Vouchers, Financial Transactions, P&L |
| Viewer | `VIEWER` | Read-only access to authorized reports and master listings |

### 3.2 Target Firestore Collections Architecture
```
users/                     // System user profiles and role assignments
roles/                     // Role definitions and permission bitmaps
permissions/               // Granular permission declarations
auditLogs/                 // Immutable audit records (actor, action, diff, timestamp)

products/ (or items/)      // Master item catalog with barcode, batch, serial, pricing
itemGroups/                // Category & grouping taxonomy
categories/                // Product categories
brands/                    // Product brands
units/                     // Measurement units (pcs, kg, box, etc.)
taxes/                     // GST & tax rates
priceLists/                // Wholesale, Retail, Distributor price tiers

customers/                 // Customer accounts with credit limits and balances
customerGroups/            // Retail, Wholesale, Corporate classifications
customerTransactions/      // Customer financial statement records

suppliers/                 // Supplier accounts with payment terms and balances
supplierGroups/            // Domestic, Import, Raw Material groups
supplierTransactions/      // Supplier financial statement records

warehouses/                // Physical warehouse facilities
warehouseLocations/        // Racks, shelves, and bin coordinate tracking
warehouseStock/            // SKU inventory by warehouse location
stockMovements/            // Stock ledger movements (IN, OUT, ADJUST, TRANSFER)
stockReservations/         // Reserved stock for pending sales orders
stockTransfers/            // Inter-warehouse dispatch and receipt records

salesQuotations/           // Sales price estimates for clients
salesOrders/               // Confirmed customer sales orders
deliveries/                // Delivery notes, picking slips, packing lists
salesInvoices/             // Billing invoices with payment terms
salesPayments/             // Payment collections & allocation records
salesReturns/              // Customer returns
creditNotes/               // Credit notes linked to returns or price adjustments

purchaseRequisitions/      // Internal purchase requests
supplierQuotations/        // Quotes received from vendors
purchaseOrders/            // Vendor POs
goodsReceipts/             // GRN inspections and stock intake
purchaseInvoices/          // Vendor invoices payable
supplierPayments/          // Disbursements & payment vouchers
purchaseReturns/           // Goods returned to suppliers
debitNotes/                // Debit notes issued against vendor bills

employees/                 // Staff personnel records
departments/               // Organizational departments
designations/              // Job titles
salespersons/              // Sales agent commission profiles & targets

expenses/                  // Company operational expenditure
expenseCategories/         // Rent, Utilities, Salaries, Logistics, etc.
financialTransactions/     // Cash & Bank account movements

approvals/                 // Multi-stage approval queue (PO, Discount, Adjustment)
notifications/             // System and alert notifications (Spark-compatible)
settings/                  // Company profile, numbering schemes, localization
```

---

## 4. Phased Implementation Roadmap (17 Modules)

### Phase 0: Audit & Firebase Foundation (Current)
- Complete repository audit, data flow mapping, and root-cause resolution for permission errors.
- Validate unit tests and frontend build.

### Phase 1: Product & Master Data Expansion
- Enhance `items` to support Barcodes, Categories, Brands, Units, Tax/GST, Price Lists, Batches, and Serial Numbers.
- Batch & serial tracking support in item forms and tables.

### Phase 2: Customer & Supplier Management
- Customer & Supplier Groups, multiple delivery/billing addresses, credit limits, statements, and transaction histories.

### Phase 3: Sales Workflow Lifecycle
- End-to-end sales pipeline: Quotations → Sales Orders → Order Confirmation → Stock Reservation → Delivery/Picking/Packing → Invoicing → Sales Returns & Credit Notes.

### Phase 4: Purchase Workflow Lifecycle
- End-to-end purchasing pipeline: Purchase Requisition → Supplier Quotations → Purchase Order → Approval → GRN (Goods Received Note) → Purchase Invoice → Debit Notes.

### Phase 5: Inventory & Stock Ledger
- Comprehensive Stock Ledger, Stock Adjustments (reason-based), Stock Reservations, Damaged/Expired Stock isolation, Opening/Closing stock calculation.

### Phase 6: Multi-Warehouse Management
- Warehouses, Locations (Aisles, Racks, Shelves, Bins), Inter-Warehouse Transfers with Dispatch & Intake confirmation.

### Phase 7: Payments & Financial Management
- Accounts Receivable, Accounts Payable, Payment Vouchers, Cash & Bank Transactions, Expense Management, Financial Summaries.

### Phase 8: Employee & Salesperson Management
- Employees, Departments, Designations, Sales Target assignment, Commission tracking linked to sales invoices.

### Phase 9: Approvals & Workflow Engine
- Configurable approval stages for POs, High-Discount Sales, Stock Adjustments, and Credit Returns (Draft, Pending, Approved, Rejected, Cancelled).

### Phase 10: Notifications & Alert System
- Spark-compatible deterministic alert engine: Low Stock, Expiry, Payment Dues, Approval Pending alerts.

### Phase 11: Enterprise Business Reports
- Comprehensive filtered reporting with date ranges, totals, analytics, and export for Sales, Purchases, Stock Movements, Customers, Suppliers, Financials, and Sales Targets.

### Phase 12: Documents & PDF/Excel Export
- Client-side PDF generator and formatted CSV/Excel export for Invoices, Quotations, POs, Delivery Notes, and Payment Receipts.

### Phase 13: System Settings & Company Profile
- Company Branding, Tax Regimes, Document Auto-Numbering configurations, Currency & Localization settings.

### Phase 14: Audit Logs & Security Hardening
- Immutable audit logging on transactions, user activity tracking, login history, and strict Firestore Security Rules hardening.

### Phase 15: Final QA, Verification & Deployment Readiness
- End-to-end integration testing, full build verification, and deployment configurations.

---

## 5. Technical Constraints & Spark Tier Compatibility
1. **No Backend Servers or Cloud Functions**: All business logic and calculations run client-side with Firestore transactions (`runTransaction`) and batched writes (`writeBatch`) guaranteeing ACID consistency.
2. **No Firebase Storage Dependency**: Document rendering and exports are performed client-side using Canvas/HTML5 PDF engines and Blob downloads.
3. **Optimized Firestore Reads**: Pagination (`getPaged`), composite index queries, and targeted document updates (`updateDoc`) minimize Spark read/write quotas.
4. **Security Enforcement**: Firestore rules prevent client bypass, ensuring unauthorized writes or privilege escalations are rejected at the database level.
