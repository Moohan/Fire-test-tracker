# SFRS Equipment Testing Tracker (ETT) - Comprehensive Development Plan

This document provides a step-by-step roadmap for an AI agent to build the SFRS ETT application. It follows the **Deslopify** principles to ensure idiomatic, robust, and high-quality code.

## 🛠 Deslopify Guardrails (Apply to EVERY Step)

1.  **Pre-Code Guidance**: Search for best practices for the specific technology (e.g., "Next.js App Router performance patterns").
2.  **Generic > Specific**: Avoid hardcoding values. Use environment variables and CSS variables for branding.
3.  **Post-Code Review**: Run `npm run lint` and `npm test` after completing a step.
4.  **Type Safety**: Strict TypeScript mode. Use Zod for runtime validation.
5.  **Accessibility (A11y)**: Ensure a minimum 44x44px touch target for all interactive elements.

---

## 🏗 Phase 1: Foundation & Identity (Completed)

### Step 1: Project Scaffold & PWA Setup

- **Action**: Initialize Next.js (App Router) with TypeScript, Tailwind CSS, and `@ducanh2912/next-pwa`.
- **Config**: Define `en-GB` locale and DD/MM/YYYY formatting.

### Step 2: Base Components

- **Action**: Create base Button and Card components with 44px+ touch targets.

### Step 3: Database & Auth Layer

- **Action**: Initialize Prisma with SQLite and NextAuth.js (Credentials).

---

## 🚜 Phase 2: Inventory & Administration (Completed)

### Step 4: Equipment Management (Admin Only)

- **Action**: Create CRUD UI for Equipment, including `sfrsId` and `mfrId` fields.
- **Action**: Implement local file upload for EICs to `public/procedures/`.

### Step 5: Bulk Upload Engine

- **Action**: Build CSV Parser using `papaparse` supporting all equipment fields.

### Step 6: User Management (Admin Only)

- **Action**: Create UI to Manage Users and enforce password policies.

---

## 🧠 Phase 3: Core Testing Logic (Completed)

### Step 7: Testing Window Calculations

- **Action**: Create `testing-windows.ts` utility for recurring compliance periods.

### Step 8: Test Logging API & OTR Workflow

- **Action**: Create API route `/api/tests/log` with OTR status logic.

---

## 📱 Phase 4: User Experience & Offline (Completed)

### Step 9: Compliance Dashboard (Real-time)

- **Action**: Build mobile-first dashboard with TanStack Query (30s polling).
- **Logic**: Implement "Functional satisfies Visual" dashboard-side logic.

### Step 10: Offline Queue & Sync

- **Action**: Implement `Dexie.js` for offline logging and a background `SyncManager`.

---

## 🏁 Phase 5: Audit & History (Completed)

### Step 11: Audit Log & History

- **Action**: Create filterable Audit History table with DD/MM/YYYY formatting.

### Step 12: Admin Corrections

- **Action**: Allow Admins to delete logs from the Audit UI in exceptional circumstances.

---

## 🎨 Phase 6: Branding & Final Polish (Completed)

### Step 13: SFRS Branding

- **Action**: Apply official SFRS colors (#D1121F, #00843D, #FFB81C) via CSS variables.

### Step 14: Final Polish

- **Action**: Final accessibility audit and performance optimization.

---

## 📋 Success Criteria Checklist

- [x] Log a weekly functional test in < 30 seconds.
- [x] OTR items are clearly visible (Amber/Red).
- [x] OTR items require Acceptance Test to clear.
- [x] All logs include User ID and Timestamp.
- [x] App is functional for logging when Wi-Fi drops.
