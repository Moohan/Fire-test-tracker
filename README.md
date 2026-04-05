# SFRS Equipment Testing Tracker (ETT)

The SFRS Equipment Testing Tracker is a Progressive Web App (PWA) designed for the Scottish Fire and Rescue Service (SFRS). It enables firefighters and Crew Commanders to manage, log, and monitor recurring equipment inspections (Weekly, Monthly, Quarterly, Annual) with a mobile-first, offline-capable interface.

## Core Features

- **Mobile-First PWA**: Optimized for use on tablets and phones on the station floor.
- **Offline Capability**: Log tests even when Wi-Fi drops; sync automatically when back online.
- **Compliance Dashboard**: At-a-glance status (Green/Red/Amber) for all equipment.
- **Off the Run (OTR) Workflow**: Clear visibility and strict recovery path (Acceptance Test) for failed equipment.
- **Bulk Management**: Admin tools for CSV bulk upload and equipment/user management.
- **Audit Ready**: Immutable (for standard users) history of every test performed.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: NextAuth.js
- **PWA**: `@ducanh2912/next-pwa`

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

4. Seed the admin user:
   ```bash
   npx prisma db seed
   ```
   *Default credentials: `admin` / `admin123`*

### Development

Run the development server:
```bash
npm run dev -- --webpack
```
*Note: The `--webpack` flag is required due to compatibility issues between Turbopack and the PWA plugin.*

### Testing

Run E2E tests with Playwright:
```bash
npx playwright test
```

## Documentation

- [Project Specification](./Project_spec.md)
- [Development Plan](./DEVELOPMENT_PLAN.md)
- [Agent Instructions](./AGENTS.md)
