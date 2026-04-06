# SFRS Equipment Testing Tracker (ETT)

The SFRS Equipment Testing Tracker is a Progressive Web App (PWA) designed for the Scottish Fire and Rescue Service (SFRS). It enables firefighters and Crew Commanders to manage, log, and monitor recurring equipment inspections (Weekly, Monthly, Quarterly, Annual) with a mobile-first, offline-capable interface.

## 🚀 Core Features

- **Mobile-First PWA**: Optimized for use on tablets and phones on the station floor with 44px+ touch targets.
- **Compliance Dashboard**: Real-time monitoring with Green/Red/Amber status indicators and 30s polling.
- **Intelligent Satisfaction Logic**: Functional tests automatically satisfy Visual requirements for the same period.
- **Offline Capability**: Robust offline logging using Dexie.js (IndexedDB); syncs automatically when back online.
- **Off the Run (OTR) Workflow**: Strict recovery path for failed equipment; requires an Acceptance test to return to "On the Run".
- **Audit Ready**: Immutable test history for standard users; Admin-only corrections/deletions.
- **Bulk Management**: Admin tools for CSV bulk upload and full equipment/user administration.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (via Prisma ORM)
- **Auth**: NextAuth.js (Credentials Provider)
- **State Management**: TanStack Query (React Query)
- **Offline Storage**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS (Official SFRS Branding)
- **PWA**: `@ducanh2912/next-pwa`
- **Date Handling**: `date-fns` (ISO Weekly/Monthly/Quarterly windows)

## 🏁 Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

1. **Clone and Install**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Initialize Database**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
   *Default Admin: `admin` / `admin123`*

### Development & Build

Run the development server:
```bash
npm run dev -- --webpack
```

Build for production:
```bash
npm run build -- --webpack
```
*Note: The `--webpack` flag is required for PWA plugin compatibility with Next.js 16.*

## 🧪 Testing

- **Unit Tests**: `npm test` (Vitest)
- **E2E Tests**: `npx playwright test`

## 📚 Documentation

- [Project Specification](./Project_spec.md)
- [Development Plan](./DEVELOPMENT_PLAN.md)
- [Agent Instructions](./AGENTS.md)
