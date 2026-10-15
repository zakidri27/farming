<div align="center">

<img src="assets/logo.svg" alt="My Farm" width="120" />

# مزرعتي – My Farm

**Offline-first farm management app for Android**

[![Release](https://img.shields.io/github/v/release/zakidri27/farming?style=for-the-badge&color=22c55e)](https://github.com/zakidri27/farming/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](../LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android-3ddc84?style=for-the-badge&logo=android&logoColor=fff)](#-getting-started)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=next.js&logoColor=fff)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react&logoColor=000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119eff?style=for-the-badge&logo=capacitor&logoColor=fff)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Drizzle-4479a1?style=for-the-badge&logo=sqlite&logoColor=fff)](https://orm.drizzle.team/)

**Product page:** [https://zakidri27.github.io/farming/](https://zakidri27.github.io/farming/)  
**Download APK:** [Latest release](https://github.com/zakidri27/farming/releases/latest)

</div>

---

## Overview

**مزرعتي** ("Mzraati", Arabic for "My Farm") is an offline-first, multi-language farm management application built with Next.js + React + Capacitor. It helps you track animals, feed, purchases, births, health, production, sales, treasury, expenses, reports, contacts, and keep secure on-device backups.

- **Offline-first:** All data lives in on-device SQLite via `@capacitor-community/sqlite`. No account, server, or internet required.
- **Multi-language:** Full support for Arabic (ar), English (en), and French (fr), with RTL/LTR-aware UI.
- **Export/Import:** Back up to JSON or Excel (ExcelJS), import safely, and share/export files via Capacitor Filesystem/Share.
- **Static export:** Built with Next.js `output: 'export'` and runs in the Capacitor Android WebView.
- **Light/Dark theme:** Toggleable appearance with persistence in settings.

---

## Key Features

| Module | Description |
|---|---|
| **Dashboard** | Herd overview, treasury balance, monthly income/expenses, health and feed alerts, quick access to common actions. |
| **Animals** | Manage cattle, goats, sheep, chickens, quail: profiles, tags, breeds, birth dates, weights, status, mother linkage, and filters by type/status. |
| **Feed** | Feed stock management, transactions, allocations, low-stock alerts, and per-animal consumption tracking. |
| **Purchases & Sales** | Record purchases/sales with quantities, units, prices, totals, suppliers/customers, payment status, and filters. |
| **Births** | Track births with dam/sire, offspring details, weights, batch names, and link to new animal records. |
| **Health & Vet** | Record treatments, diagnoses, medicine costs, vet fees, visits, status, and history per animal. |
| **Production** | Log animal production (e.g. milk/other products), quantities, units, prices, total value, by date and animal. |
| **Treasury** | Track treasury entries, balances, monthly breakdowns, and reference types. |
| **Expenses & Incomes** | Categorized expenses and incomes with amounts, dates, methods, notes, and summaries. |
| **Reports** | Farm analytics including summaries and filtered reports across animals, purchases, sales, expenses, feed, health, production. |
| **Clients & Suppliers (Contacts)** | Manage customers and suppliers with contact details and notes. |
| **Tracking & Animal Records** | Track movements/events and maintain comprehensive animal records with search and filters. |
| **Settings** | App language (ar/en/fr), theme (light/dark), and access to backup tools; data wipe with confirmation. |
| **Backup** | Export full dataset as JSON or Excel; import a previously exported file (replaces current data with safeguards). |

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16.2.6 (App Router, static export)
- **UI:** [React](https://react.dev/) 19.2.6, [TypeScript](https://www.typescriptlang.org/) 5.9.3
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) 4.1.17
- **ORM/Data:** [Drizzle ORM](https://orm.drizzle.team/) 0.45.2 + on-device SQLite via [`@capacitor-community/sqlite`](https://github.com/capacitor-community/sqlite) 8.1.1
- **Mobile:** [Capacitor](https://capacitorjs.com/) 8.5.1 (Android)
- **Files/Export:** [Capacitor Filesystem](https://capacitorjs.com/docs/apis/filesystem), [Capacitor Share](https://capacitorjs.com/docs/apis/share), [ExcelJS](https://github.com/exceljs/exceljs) 4.4.0
- **Dev tooling:** ESLint 9.39, drizzle-kit 0.31, PostCSS 8.5, TypeScript 5.9

---

## Project Structure

```text
src/
├── app/           # Next.js App Router pages (animals, feed, purchases, sales, treasury, expenses, reports, contacts, tracking, records, births, health, production, settings, backup)
├── components/    # UI components (Sidebar, TopBar, ResponsiveLayout, OfflineInit, AppDialog)
├── db/            # SQLite schema + local DB adapter (camelCase<->snake_case mapping)
├── hooks/         # useIsMobile
├── lib/           # i18n, offline-api bridge, backup (JSON/Excel), treasury helpers, utils
└── assets/        # app assets

android/            # Capacitor Android project (source; build outputs ignored)
drizzle/            # Drizzle config/migrations
manual/             # User manual (HTML/PDF)
docs/               # GitHub Pages landing page
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Android Studio](https://developer.android.com/studio) with Android SDK (for building APK/AAB)
- JDK 17+ (Capacitor 8 / Android Gradle Plugin compatible)

### Local development (web)
```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

**Note:** The app is designed for native (Capacitor WebView). In a plain browser, the on-device SQLite fetch bridge is not activated (bridge only installs in `Capacitor.isNativePlatform()`); `/api/*` calls will not be served by the app's SQLite layer outside the native shell. UI and static pages render, but data operations expect the native bridge.

### Build & run on Android (recommended for full functionality)
```bash
# Build static export
npm run build

# Sync web assets to Android
npx cap sync android

# Open in Android Studio or build via CLI
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease
```

### Quality checks
```bash
# Lint
npm run lint

# Type check
npm run typecheck
```

---

## Offline Architecture

- **On-device SQLite:** `@capacitor-community/sqlite` powers a local database (`farm_local`) with 16 tables (animals, contacts, purchases, sales, expenses, incomes, feed stock/transactions/allocations, health records, debts, treasury, settings, births, productions, consumptions).
- **Fetch bridge:** `src/lib/offline-api.ts` installs a fetch interceptor **only in the native Capacitor WebView** (`Capacitor.isNativePlatform()`); it intercepts `fetch` requests to `origin/api/*` and serves them directly from SQLite. Outside native (browser/dev), normal fetches apply.
- **Schema mapping:** `src/db/local.ts` maps camelCase fields to snake_case columns and vice versa; uses ISO date strings for timestamps.
- **Initialization:** `OfflineInit` component and module-load bridge initialize the DB early on app start.
- **Backup/restore:** Export imports the full dataset as JSON (exact) or Excel (formatted sheets); import replaces current data with validation and chunked inserts.

---

## Backup & Data

- **Export JSON:** Full, lossless snapshot of all tables (ready to restore later).
- **Export Excel:** Multi-sheet workbook with professional formatting, per-module sheets (Animals, Purchases, Sales, Expenses, Feed, Health, Births, Production, Contacts, Treasury, Incomes, Debts, Settings, Consumptions).
- **Import:** Supports JSON and Excel files previously exported by this app; restore replaces current data. **Always export a copy before importing.**
- **Wipe data:** Settings → Delete all data (irreversible, with confirmation).

---

## License

[MIT](../LICENSE) — Copyright (c) 2026 Zaki

---

## Download

Get the latest Android APK from the [Releases page](https://github.com/zakidri27/farming/releases/latest).
