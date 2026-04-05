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
- **Action**: Initialize Next.js (App Router) with TypeScript, Tailwind CSS, and `next-pwa`.
- **Config**:
  - Set up `next-pwa` in `next.config.js`.
  - Define `en-GB` as the locale in `next.config.js` or `layout.tsx`.
- **Verification**:
  - `npm run build` succeeds.
  - Service worker is generated in `public/`.

### Step 2: Base Components
- **Action**: Create base Button and Card components following mobile-first touch target guidelines (min 44px).
- **Note**: Branding and specific SFRS color consolidation moved to Phase 6.
- **Verification**: Visual check of components on small screen viewports.

### Step 3: Database & Auth Layer
- **Action**: Initialize Prisma with SQLite.
- **Action**: Implement NextAuth.js with `CredentialsProvider` and `PrismaAdapter`.
- **Schema Implementation**:
  - `User` (id, username, passwordHash, role: ADMIN | USER)
  - `Equipment` (id, externalId, name, location, category, procedurePath, status: ON_RUN | OFF_RUN)
  - `TestRequirement` (id, equipmentId, frequency, type)
  - `TestLog` (id, equipmentId, userId, timestamp, type, result, notes)
- **Verification**:
  - `npx prisma migrate dev` succeeds.
  - Test login flow works.

---

## 🚜 Phase 2: Inventory & Administration (Active)

### Step 4: Equipment Management (Admin Only)
- **Action**: Create CRUD UI for Equipment.
- **Action**: Implement local file upload for procedures (PDFs/Images) to `public/procedures/`.
- **Verification**: Verify files are correctly saved and `procedurePath` is updated in SQLite.

### Step 5: Bulk Upload Engine
- **Action**: Build CSV Parser using `papaparse`.
- **Logic**: Validate unique `Equipment_ID` and map `Weekly_Test_Type` etc. to `TestRequirement` records.
- **Strictness**: Implement robust validation for `Test_Type` strings (`None`, `Visual`, `Functional`).
- **Verification**: Upload a sample CSV; verify all relationships are created in the DB.

### Step 6: User Management (Admin Only)
- **Action**: Create UI to Manage Users (Add/List/Delete).
- **Action**: Implement Password Reset functionality.
- **Rules**: Enforce password requirements (Minimum 6 characters, including at least one uppercase and one lowercase letter).
- **Verification**: Admin can create a new user and reset their password. Verify password requirements are enforced.

---

## 🧠 Phase 3: Core Testing Logic

### Step 7: Testing Window Calculations
- **Action**: Create a `testing-windows.ts` utility using `date-fns` for:
  - Weekly (Mon 00:00 - Sun 23:59)
  - Monthly (1st - Last day)
  - Quarterly/Annual (Fixed periods)
- **Verification**: Unit tests for edge cases (e.g., Leap years, month boundaries).

### Step 8: Test Logging API & OTR Workflow
- **Action**: Create API route `/api/tests/log`.
- **Rules Logic**:
  - `Functional` log automatically satisfies `Visual` requirement for the period.
  - `Acceptance` log satisfies all requirements for the period.
  - `FAIL` result -> Set `Equipment.status = OFF_RUN`.
  - `PASS` result on `Acceptance` test -> Set `Equipment.status = ON_RUN`.
- **Verification**: Integration tests for OTR status state machine.

---

## 📱 Phase 4: User Experience & Offline

### Step 9: Compliance Dashboard (Real-time)
- **Action**: Build dashboard with Green/Red/Amber status.
- **Action**: Implement TanStack Query (React Query) with `refetchInterval: 30000` (30s polling).
- **Visuals**: Ensure `DD/MM/YYYY` date format and one-tap access to procedure documents.
- **Verification**: Open dashboard in two tabs; log a test in one; ensure the second updates within 30s.

### Step 10: Offline Queue (Dexie.js)
- **Action**: Implement IndexedDB queue for `TestLog` submissions and background sync.
- **Conflict Handling**:
  - If two logs for the same window have the same result: Highlight as duplicate to the user.
  - If one is PASS and one is FAIL: Flag for both users to double-check and confirm their log is correct.
- **Verification**: Use Chrome DevTools "Offline" mode; log tests; go online; verify sync to SQLite.

---

## 🏁 Phase 5: Audit & History

### Step 11: Audit Log & History
- **Action**: Create filterable table for `TestLog` history.
- **Constraint**: Immutable for standard users. Admins can edit or delete logs in exceptional circumstances (e.g., log added in error) via a dedicated UI.
- **Formatting**: Ensure all dates are displayed as `DD/MM/YYYY`.
- **Verification**: Verify audit log is visible and filterable. Verify Admin-only edit/delete capabilities.

---

## 🎨 Phase 6: Branding & Final Polish

### Step 12: SFRS Branding
- **Action**: Consolidate SFRS-specific colors in Tailwind config:
  - `sfrs-red`: `#D1121F` (Danger/Fail)
  - `sfrs-green`: `#00843D` (Safety/Pass)
  - `sfrs-amber`: `#FFB81C` (OTR/Warning)
- **Action**: Apply brand colors across the UI.

### Step 13: Final Polish & Deslopify Audit
- **Action**: Full accessibility scan (Lighthouse/axe).
- **Touch Targets**: Audit and ensure all interactive elements meet the 44x44px minimum.
- **Action**: Run final `npx deslopify review` on the entire codebase.
- **Verification**: Ensure all "Success Criteria" (spec section 6) are met.

---

## 📋 Success Criteria Checklist
- [ ] Log a weekly functional test in < 30 seconds.
- [ ] OTR items are clearly visible (Amber/Red).
- [ ] OTR items require Acceptance Test to clear.
- [ ] All logs include User ID and Timestamp.
- [ ] App is functional for logging when Wi-Fi drops.
