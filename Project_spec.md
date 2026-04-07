# Project Specification: SFRS Equipment Testing Tracker (ETT)

## 1. Executive Summary
The SFRS Equipment Testing Tracker is a Progressive Web App (PWA) designed for the Scottish Fire and Rescue Service (SFRS). It enables firefighters and Crew Commanders to manage, log, and monitor recurring equipment inspections (Weekly, Monthly, Quarterly, Annual) with a mobile-first, offline-capable interface. The system ensures operational readiness by providing "at-a-glance" compliance dashboards and clear workflows for equipment that fails inspection ("Off the Run").

## 2. Technical Stack
To ensure consistency and ease of agentic development, the following stack is mandated:
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (SFRS Branding)
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: NextAuth.js (Simple Credentials provider)
- **PWA Capabilities**: `@ducanh2912/next-pwa` for service workers and offline queuing.
- **Client State**: TanStack Query (React Query) for real-time polling (30s).
- **Offline Storage**: Dexie.js (IndexedDB) for local test log queuing.
- **Localization**: British English (en-GB), Metric units, Date format: DD/MM/YYYY.

## 3. Functional Requirements

### 3.1 User Roles & Access
- **Firefighter (Standard User)**:
  - View dashboard of outstanding tests.
  - Record test results (Pass/Fail) with notes.
  - Access Equipment Information Cards (EIC) - procedure PDFs/Images.
- **Crew Commander (Admin)**:
  - All Firefighter permissions.
  - Add/Edit/Remove equipment.
  - Bulk upload equipment via CSV.
  - Manage users (Add/List/Delete) and reset passwords.
  - View and manage full audit history (can delete logs in exceptional circumstances).
- **Password Requirements**:
  - Minimum 6 characters.
  - At least one uppercase letter.
  - At least one lowercase letter.

### 3.2 Equipment & Testing Logic
- **Inventory Management**:
  - Fields: `Equipment_ID` (Unique External Key), `Name`, `Location`, `Category`, `Procedure_Link` (File upload), `SFRS_ID` (Optional), `Manufacturer_ID` (Optional).
- **Testing Frequencies**:
  - **Weekly**: Monday 00:00 to Sunday 23:59.
  - **Monthly**: 1st of the month to the last day of the month.
  - **Quarterly**: Fixed quarters (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec).
  - **Annual**: 1st Jan to 31st Dec.
- **Test Types**:
  - **Visual**: A surface-level check.
  - **Functional**: A test of operation. **Crucially, a Functional test implies a Visual test is also completed.**
  - **Acceptance**: A rigorous functional test required to bring equipment back "On the Run". **Crucially, an Acceptance test implies both a Visual and Functional test are completed.**
- **Compliance Logic (Dashboard Layer)**:
  - A successful `Functional` test satisfies both the `Visual` and `Functional` requirements for that specific piece of equipment within the current testing window.
  - A successful `Acceptance` test satisfies all scheduled requirements (Visual, Functional) for that period.
- **"Off the Run" (OTR) Workflow**:
  - If any test is marked as **Fail**, the equipment status becomes "Off the Run".
  - It remains OTR until a successful **Acceptance Test** is logged.
  - While OTR, scheduled tests must still be attempted and logged until repaired/replaced.

### 3.3 Dashboard & Logging
- **Compliance View Indicators**:
  - **Green (PASSED)**: Successful test in current window.
  - **Red (FAILED/OTR)**: Failed test in current window OR equipment status is OFF_RUN.
  - **Amber (OVERDUE)**: No successful test in current window AND no successful test in the previous window.
  - **Grey (OUTSTANDING)**: No successful test in current window, but the previous window was satisfied.
  - Real-time updates via 30s polling to prevent duplicate testing.
- **Recording a Test**:
  - Select Equipment -> Select Test Type -> Result (Pass/Fail) -> Notes (Optional) -> Timestamp & User ID (Automatic).
- **Audit History**:
  - **Deletion Model**: Irreversible deletion (with secondary audit log tracking the deletion event).
  - **Retention & Authorization**: Only administrators can perform deletions in exceptional circumstances (e.g., data entry errors).
  - **Visibility**: Once deleted, the record is removed from all compliance reporting and standard history views.
  - **Audit Workflow**: Deletions are performed via the Audit UI and are immediately reflected in compliance calculations.
  - **Filtering**: "Filterable by Equipment, User, and Result" applies only to active (non-deleted) records.

### 3.4 Offline & PWA Support
- **Service Worker**: Cache the UI and procedure documents (EICs) for offline access.
- **Sync Queue (Dexie.js)**: If a user logs a test while offline, the app queues the request in IndexedDB and automatically syncs with the server once connectivity is restored or on app reload.

## 4. Data Architecture

### 4.1 Schema (Prisma/SQLite)
- `User`: id, username, passwordHash, role (ADMIN/USER).
- `Equipment`: id, externalId, name, location, category, procedurePath, status (ON_RUN/OFF_RUN), sfrsId, mfrId.
- `TestRequirement`: equipmentId, frequency (WEEKLY/MONTHLY/etc), type (VISUAL/FUNCTIONAL).
- `TestLog`: id, equipmentId, userId, timestamp, type, result (PASS/FAIL), notes.
- `AuditEvent`: id, actorId, action (e.g. "DELETE_LOG"), targetId, timestamp, metadata.

### 4.2 Bulk Upload Template
The system accepts a CSV with the following headers:
`Equipment_ID, Name, Location, Category, SFRS_ID, Manufacturer_ID, Weekly_Test_Type, Monthly_Test_Type, Quarterly_Test_Type, Annual_Test_Type`
- Values for `Test_Type`: `None`, `Visual`, `Functional`.

## 5. UI/UX Guidelines
- **Mobile-First**: Large touch targets (min 44x44px).
- **SFRS Branding**:
  - `sfrs-red`: `#D1121F`
  - `sfrs-green`: `#00843D`
  - `sfrs-amber`: `#FFB81C`
  - `sfrs-grey`: `#64748B`
- **Procedure Access**: One-tap access to EICs from the testing screen.

## 6. Success Criteria
1. A firefighter can log a weekly functional test in under 30 seconds.
2. An "Off the Run" item is clearly visible on the dashboard and cannot return to "On the Run" without an Acceptance Test.
3. App is functional for logging when Wi-Fi drops.
