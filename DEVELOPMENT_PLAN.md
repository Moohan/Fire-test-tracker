# SFRS Equipment Testing Tracker (ETT) - Comprehensive Development Plan

This document provides a step-by-step roadmap for an AI agent to build the SFRS ETT application. It follows the **Deslopify** principles to ensure idiomatic, robust, and high-quality code.

## 🛠 Deslopify Guardrails (Apply to EVERY Step)

1.  **Pre-Code Guidance**: Before writing code for a step, search for best practices for the specific technology (e.g., "Next.js App Router performance patterns").
2.  **Generic > Specific**: Avoid hardcoding values. Use environment variables, constants, or configuration objects.
3.  **Post-Code Review**: After completing a step, run `npx deslopify review` (or perform a self-critique) to identify "slop" (symptom-patching, non-idiomatic patterns, missing error handling).
4.  **Test-Driven Development**: Every functional step must include verification via Vitest (logic) or Playwright (UI/PWA).
5.  **Type Safety**: No `any`. Strict TypeScript mode. Use Zod for runtime validation of all inputs (API, CSV, Forms).
6.  **Accessibility (A11y)**: Ensure a minimum 44x44px touch target for all interactive elements and high-contrast ratios for "Emergency Service" UI.

---

## 🏗 Phase 1: Foundation & Identity

### Step 1: Project Scaffold & PWA Setup
- **Action**: Initialize Next.js (App Router) with TypeScript, Tailwind CSS, and `next-pwa`.
- **Config**:
  - Set up `next-pwa` in `next.config.js`.
  - Define `en-GB` as the locale in `next.config.js` or `layout.tsx`.
- **Verification**:
  - `npm run build` succeeds.
  - Service worker is generated in `public/`.
  - **Deslopify**: Check `next.config.js` for best-practice PWA settings.

### Step 2: Global Theme & Base Components
- **Action**: Implement Tailwind theme with SFRS colors:
  - `sfrs-red`: `#D1121F` (Danger/Fail)
  - `sfrs-green`: `#00843D` (Safety/Pass)
  - `sfrs-amber`: `#FFB81C` (OTR/Warning)
- **Action**: Create base Button and Card components following mobile-first touch target guidelines (min 44px).
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
  - **Deslopify**: Ensure password hashing is secure (bcrypt/argon2) and not rolled manually.

---

## 🚜 Phase 2: Inventory & Administration

### Step 4: Equipment Management (Admin Only)
- **Action**: Create CRUD UI for Equipment.
- **Action**: Implement local file upload for procedures (PDFs/Images) to `public/procedures/`.
- **Verification**: Verify files are correctly saved and `procedurePath` is updated in SQLite.

### Step 5: Bulk Upload Engine
- **Action**: Build CSV Parser using `papaparse` or similar.
- **Logic**: Validate unique `Equipment_ID` and map `Weekly_Test_Type` etc. to `TestRequirement` records.
- **Verification**: Upload a sample CSV; verify all relationships are created in the DB.
- **Deslopify**: Ensure robust error reporting for malformed CSV rows (don't just fail silently).

---

## 🧠 Phase 3: Core Testing Logic

### Step 6: Testing Window Calculations
- **Action**: Create a `testing-windows.ts` utility using `date-fns` for:
  - Weekly (Mon 00:00 - Sun 23:59)
  - Monthly (1st - Last day)
  - Quarterly/Annual (Fixed periods)
- **Verification**: Unit tests for edge cases (e.g., Leap years, month boundaries).

### Step 7: Test Logging API & OTR Workflow
- **Action**: Create API route `/api/tests/log`.
- **Rules Logic**:
  - `Functional` log automatically satisfies `Visual` requirement for the period.
  - `Acceptance` log satisfies all requirements for the period.
  - `FAIL` result -> Set `Equipment.status = OFF_RUN`.
  - `PASS` result on `Acceptance` test -> Set `Equipment.status = ON_RUN`.
- **Verification**: Integration tests for OTR status state machine.
- **Deslopify**: Ensure the OTR logic is centralized in a service/domain layer, not scattered in API routes.

---

## 📱 Phase 4: User Experience & Offline

### Step 8: Compliance Dashboard (Real-time)
- **Action**: Build dashboard with Green/Red/Amber status.
- **Action**: Implement TanStack Query (React Query) with `refetchInterval: 30000` (30s polling).
- **Verification**: Open dashboard in two tabs; log a test in one; ensure the second updates within 30s.

### Step 9: Offline Queue (Dexie.js)
- **Action**: Implement IndexedDB queue for `TestLog` submissions.
- **Action**: background sync process that triggers when `online` event fires.
- **Conflict Handling**: If two logs arrive for the same window (one Pass, one Fail), flag the equipment in the UI for "Conflict Resolution."
- **Verification**: Use Chrome DevTools "Offline" mode; log tests; go online; verify sync to SQLite.

---

## 🏁 Phase 5: Audit & Finalization

### Step 10: Immutable Audit Log
- **Action**: Create filterable table for `TestLog` history.
- **Constraint**: Ensure no "Delete" or "Edit" routes/buttons exist for logs.
- **Verification**: Attempt to delete a log via API; ensure it fails.

### Step 11: Final Polish & Deslopify Audit
- **Action**: Full accessibility scan (Lighthouse/axe).
- **Action**: Run final `npx deslopify review` on the entire codebase.
- **Verification**: Ensure all "Success Criteria" (spec section 6) are met.

---

## 📋 Success Criteria Checklist
- [ ] Log a weekly functional test in < 30 seconds.
- [ ] OTR items are clearly visible (Amber/Red).
- [ ] OTR items require Acceptance Test to clear.
- [ ] All logs include User ID and Timestamp.
- [ ] App is functional for logging when Wi-Fi drops.
