# SFRS Equipment Testing Tracker (ETT) - Comprehensive Development Plan

This document provides a step-by-step roadmap for an AI agent to build the SFRS ETT application. It follows the **Deslopify** principles to ensure idiomatic, robust, and high-quality code.

## 🛠 Deslopify Guardrails (Apply to EVERY Step)

1.  **Pre-Code Guidance**: Before writing code for a step, search for best practices for the specific technology (e.g., "Next.js App Router performance patterns").
2.  **Generic > Specific**: Avoid hardcoding values. Use environment variables, constants, or configuration objects.
3.  **Post-Code Review**: After completing a step, run `npx deslopify review` (or perform a self-critique) to identify "slop" (symptom-patching, non-idiomatic patterns, missing error handling).
4.  **Test-Driven Development**: Every functional step must include verification via Vitest (logic) or Playwright (UI/PWA).
5.  **Type Safety**: No `any`. Strict TypeScript mode. Use Zod for runtime validation of all inputs (API, CSV, Forms).
6.  **Accessibility (A11y)**: Ensure a minimum 44x44px touch target for all interactive elements.

---

## 🏗 Phase 1: Foundation & Identity (Completed)

### Step 1: Project Scaffold & PWA Setup
- **Action**: Initialize Next.js (App Router) with TypeScript, Tailwind CSS, and `@ducanh2912/next-pwa`.
- **Config**:
  - Set up `next-pwa` in `next.config.ts`.
  - Define `en-GB` as the locale.
- **Verification**:
  - `npm run build -- --webpack` succeeds.
  - Service worker is generated in `public/`.

### Step 2: Base Components
- **Action**: Create base Button and Card components following mobile-first touch target guidelines (min 44px).
- **Verification**: Visual check of components on small screen viewports.

### Step 3: Database & Auth Layer
- **Action**: Initialize Prisma with SQLite.
- **Action**: Implement NextAuth.js with `CredentialsProvider` and `PrismaAdapter`.
- **Schema Implementation**:
  - `User` (id, username, passwordHash, role: ADMIN | USER)
  - `Equipment` (id, externalId, name, location, category, procedurePath, status, sfrsId, mfrId)
  - `TestRequirement` (id, equipmentId, frequency, type)
  - `TestLog` (id, equipmentId, userId, timestamp, type, result, notes)
- **Verification**:
  - `npx prisma migrate dev` succeeds.
  - Test login flow works.

---

## 🚜 Phase 2: Inventory & Administration (Completed)

### Step 4: Equipment Management (Admin Only)
- **Action**: Create CRUD UI for Equipment.
- **Action**: Implement local file upload for procedures (PDFs/Images) to `public/procedures/`.
- **New Fields**: Support `sfrsId` and `mfrId`.
- **Verification**: Verify files are correctly saved and metadata is updated in SQLite.

### Step 5: Bulk Upload Engine
- **Action**: Build CSV Parser using `papaparse`.
- **Logic**: Validate unique `Equipment_ID` and map testing requirements.
- **Support**: Include `SFRS_ID` and `Manufacturer_ID` in the CSV template.
- **Verification**: Upload a sample CSV; verify all relationships and fields are created in the DB.

### Step 6: User Management (Admin Only)
- **Action**: Create UI to Manage Users (Add/List/Delete).
- **Action**: Implement Password Reset functionality.
- **Rules**: Enforce password requirements (min 6 chars, 1 upper, 1 lower).
- **Verification**: Admin can create a new user and reset their password.

---

## 🧠 Phase 3: Core Testing Logic (Completed)

### Step 7: Testing Window Calculations
- **Action**: Create a `testing-windows.ts` utility using `date-fns` for Weekly, Monthly, Quarterly, and Annual periods.
- **Verification**: Unit tests for edge cases (Leap years, month boundaries).

### Step 8: Test Logging API & OTR Workflow
- **Action**: Create API route `/api/tests/log`.
- **Rules Logic**:
  - `Functional` log satisfies `Visual` requirement (UI-side logic only).
  - `Acceptance` log satisfies all requirements.
  - `FAIL` result -> Set `Equipment.status = OFF_RUN`.
  - `PASS` result on `Acceptance` test -> Set `Equipment.status = ON_RUN`.
- **Verification**: Integration tests for OTR status state machine.

---

## 📱 Phase 4: User Experience & Offline (Upcoming)

### Step 9: Compliance Dashboard (Real-time)
- **Action**: Build a mobile-first dashboard for standard users.
- **Information Density**:
  - Show Equipment Name, Location, SFRS ID, and Manufacturer ID.
  - Clearly display required tests and their frequencies (e.g., "Weekly (Visual)", "Monthly (Functional)").
- **Satisfaction Logic**: Implement UI logic where a successful Functional test "checks off" the Visual requirement for the same period.
- **Procedure Access**: Provide a "one-tap" link to the EIC (Equipment Information Card) PDF/Image.
- **Polling**: Implement TanStack Query with `refetchInterval: 30000` (30s).
- **Verification**: Open dashboard in two tabs; log a test in one; ensure the second updates.

### Step 10: Offline Queue & Sync
- **Action**: Implement `Dexie.js` (IndexedDB) to queue `TestLog` submissions when offline.
- **Background Sync**: Implement a sync manager that attempts to flush the queue when connectivity returns or on app reload.
- **Conflict Handling**:
  - Same result: Highlight as duplicate to the user.
  - Differing results (PASS/FAIL): Flag for both users to double-check and confirm their log.
- **Verification**: Use Chrome DevTools "Offline" mode; log tests; go online; verify sync to server.

---

## 🏁 Phase 5: Audit & History

### Step 11: Audit Log & History
- **Action**: Create filterable table for `TestLog` history.
- **Filtering**: By Equipment, User, Date Range, and Result (PASS/FAIL).
- **Formatting**: All dates displayed as `DD/MM/YYYY`.
- **Verification**: Verify audit log is visible and correctly filterable.

### Step 12: Admin Corrections (Exceptional Circumstances)
- **Action**: Allow Admins to edit or delete existing logs via the Audit UI.
- **Constraint**: Standard users have immutable logs.
- **Verification**: Verify Admin can delete a log and the equipment status/compliance updates accordingly.

---

## 🎨 Phase 6: Branding & Final Polish

### Step 13: SFRS Branding
- **Action**: Consolidate SFRS-specific colors in Tailwind config:
  - `sfrs-red`: `#D1121F` (Danger/Fail)
  - `sfrs-green`: `#00843D` (Safety/Pass)
  - `sfrs-amber`: `#FFB81C` (OTR/Warning)
- **Action**: Integrate official SFRS logos (Logo, Favicon, PWA Splash).
- **Verification**: Full UI audit for color consistency and branding.

### Step 14: Final Polish & Deslopify Audit
- **Action**: Full accessibility scan (Lighthouse/axe).
- **Action**: Ensure all interactive elements meet the 44x44px touch target minimum.
- **Action**: Run final `npx deslopify review` on the entire codebase.
- **Verification**: All "Success Criteria" (spec section 6) are met.

---

## 📋 Success Criteria Checklist
- [ ] Log a weekly functional test in < 30 seconds.
- [ ] OTR items are clearly visible (Amber/Red).
- [ ] OTR items require Acceptance Test to clear.
- [ ] All logs include User ID and Timestamp.
- [ ] App is functional for logging when Wi-Fi drops.
