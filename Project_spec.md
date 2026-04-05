# Project Specification: SFRS Equipment Testing Tracker (ETT)

## 1. Executive Summary
The SFRS Equipment Testing Tracker is a Progressive Web App (PWA) designed for the Scottish Fire and Rescue Service (SFRS). It enables firefighters and Crew Commanders to manage, log, and monitor recurring equipment inspections (Weekly, Monthly, Quarterly, Annual) with a mobile-first, offline-capable interface. The system ensures operational readiness by providing "at-a-glance" compliance dashboards and clear workflows for equipment that fails inspection ("Off the Run").

## 2. Technical Stack
To ensure consistency and ease of agentic development, the following stack is mandated:
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: NextAuth.js (Simple Credentials provider)
- **PWA Capabilities**: `next-pwa` for service workers and offline queuing.
- **Localization**: British English (en-GB), Metric units, Date format: DD/MM/YYYY.

## 3. Functional Requirements

### 3.1 User Roles & Access
- **Firefighter (Standard User)**:
  - View dashboard of outstanding tests.
  - Record test results (Pass/Fail) with notes.
  - Access procedure documentation (PDFs/Images).
- **Crew Commander (Admin)**:
  - All Firefighter permissions.
  - Add/Edit/Remove equipment.
  - Bulk upload equipment via CSV.
  - Manage users (Add/List/Delete) and reset passwords.
  - View full audit history of all tests.
- **Password Requirements**:
  - Minimum 6 characters.
  - At least one uppercase letter.
  - At least one lowercase letter.

### 3.2 Equipment & Testing Logic
- **Inventory Management**:
  - Fields: `Equipment_ID` (Unique), `Name`, `Location` (e.g., Appliance 1, Locker 3), `Category`, `Procedure_Link` (File upload).
- **Testing Frequencies**:
  - **Weekly**: Monday 00:00 to Sunday 23:59.
  - **Monthly**: 1st of the month to the last day of the month.
  - **Quarterly**: Fixed quarters (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec).
  - **Annual**: 1st Jan to 31st Dec.
- **Test Types**:
  - **Visual**: A surface-level check.
  - **Functional**: A test of operation. **Crucially, a Functional test implies a Visual test is also completed.**
  - **Acceptance**: A rigorous functional test required to bring equipment back "On the Run". **Crucially, an Acceptance test implies both a Visual and Functional test are completed.**
- **Compliance Logic**:
  - A successful `Functional` test satisfies both the `Visual` and `Functional` requirements for that specific piece of equipment within the current testing window.
  - A successful `Acceptance` test satisfies all scheduled requirements (Visual, Functional) for that period.
- **"Off the Run" (OTR) Workflow**:
  - If any test is marked as **Fail**, the equipment status becomes "Off the Run".
  - It remains OTR until a successful **Acceptance Test** is logged.
  - While OTR, scheduled tests must still be attempted and logged (likely as Fail) until repaired/replaced.

### 3.3 Dashboard & Logging
- **Compliance View**:
  - Visual indicators: Green (Complete for period), Red (Outstanding/Overdue), Amber (Failed/OTR).
  - Real-time updates via WebSockets or frequent polling (30s) to prevent duplicate testing by multiple users.
- **Recording a Test**:
  - Select Equipment -> Select Test Type -> Result (Pass/Fail) -> Notes (Optional, e.g., "Replaced batteries") -> Timestamp & User ID (Automatic).
- **Audit History**:
  - Permanent, immutable log of every test result for standard users.
  - Admins may edit or delete logs in exceptional circumstances.
  - Filterable by Equipment, Date Range, User, and Result.

### 3.4 Offline & PWA Support
- **Service Worker**: Cache the UI and procedure documents for offline access.
- **Sync Queue**: If a user logs a test while offline, the app must queue the request and automatically sync with the server once connectivity is restored.
- **Conflict Handling**:
  - If multiple logs for the same equipment window arrive:
    - Same result: Highlight as duplicate/unnecessary test.
    - Differing results (PASS/FAIL): Flag for both users to double-check and confirm their log is correct.

## 4. Data Architecture

### 4.1 Schema (Prisma/SQLite)
- `User`: id, username, passwordHash, role (ADMIN/USER).
- `Equipment`: id, externalId, name, location, category, procedurePath, status (ON_RUN/OFF_RUN).
- `TestRequirement`: equipmentId, frequency (WEEKLY/MONTHLY/etc), type (VISUAL/FUNCTIONAL).
- `TestLog`: id, equipmentId, userId, timestamp, type, result (PASS/FAIL), notes.

### 4.2 Bulk Upload Template
The system must accept a CSV with the following headers:
`Equipment_ID, Name, Location, Category, Weekly_Test_Type, Monthly_Test_Type, Quarterly_Test_Type, Annual_Test_Type`
- Values for `Test_Type`: `None`, `Visual`, `Functional`.
- Validation: Strict check for unique `Equipment_ID` and valid `Test_Type` strings.

## 5. UI/UX Guidelines
- **Mobile-First**: Primary use case is on tablets/phones on the station floor. Large touch targets.
- **SFRS Context**: Use high-contrast "Emergency Service" style UI (e.g., clear Reds for danger/fail, Greens for safety/pass).
- **Procedure Access**: One-tap access to the uploaded PDF/Image from the testing screen.

## 6. Success Criteria
1. A firefighter can log a weekly functional test in under 30 seconds.
2. An "Off the Run" item is clearly visible on the dashboard and cannot return to "On the Run" without an Acceptance Test.
3. Every single test event is recorded with a timestamp and user ID for audit purposes.
4. The app remains functional (for logging) when the station Wi-Fi drops.
