# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hair Diary is a Next.js appointment scheduling application for hairstylists Stewart and Sue. It displays a day calendar with 15-minute time slots from 07:00 to 20:00, organized in three columns: Stewart, Sue, and Notes. Appointments are stored in MongoDB and accessed via REST API routes.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test-coverage
```

### Known Issues

**Development Database (In-Memory Mode)**: The in-memory database currently has issues with CRUD operations in local development. Create, Update, and Delete operations do not work properly on local. A ticket will be raised to fix this issue. In the meantime, use `USE_REAL_DB=true` with a MongoDB instance for full CRUD functionality.

## Environment Setup

Required environment variables (create `.env.local`):

```
MONGODB_URI=<your-mongodb-atlas-connection-string>
MONGODB_DB=hair-diary
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-a-secret>
```

## Architecture

### Database Structure

MongoDB database with two collections:

1. **users** - Stores authentication credentials
   - `email`: string
   - `name`: string
   - `passwordHash`: bcrypt hash
   - Users must be seeded manually (no registration flow)

2. **appointments** - Stores booking information
   - `date`: string (YYYY-MM-DD)
   - `startTime`: string (HH:MM)
   - `endTime`: string (HH:MM)
   - `column`: "stewart" | "sue" | "notes"
   - `clientName`: string
   - `phone`: string (optional)
   - `notes`: string (optional)

### Authentication Flow

- NextAuth v5 (beta) with Credentials provider
- JWT-based sessions (no database sessions)
- Authentication config in `lib/authOptions.ts`
- Login page at `/login` with client-side form
- Auth routes handled by `app/api/auth/[...nextauth]/route.ts`
- PUT and DELETE operations on appointments require authentication
- GET and POST on appointments are currently unauthenticated

### Database Abstraction Layer

The app uses a database abstraction in `lib/db.ts` that supports both in-memory and MongoDB:

**In-Memory Mode (Default)**:
- Controlled by `USE_REAL_DB` environment variable (false by default)
- Stores data in a JavaScript object that resets on server restart
- Perfect for development - no MongoDB setup required
- Includes pre-seeded test users (stewart@example.com, sue@example.com)

**MongoDB Mode (Production)**:
- Set `USE_REAL_DB=true` to enable
- Uses MongoDB Atlas or any MongoDB instance
- Connection handled via singleton pattern in `lib/mongodb.ts`
- Reuses connection across hot reloads to prevent pool exhaustion

All API routes and authentication use `getDb()` which automatically returns the correct database implementation.

### API Routes

**GET /api/appointments**
- Query param: `?date=YYYY-MM-DD` (optional)
- Returns array of appointments for specified date (or all if no date)
- No authentication required

**POST /api/appointments**
- Creates new appointment
- No authentication required
- Returns created appointment with `_id`

**PUT /api/appointments/[id]**
- Updates appointment by MongoDB `_id`
- No authentication required

**DELETE /api/appointments/[id]**
- Deletes appointment by MongoDB `_id`
- No authentication required

### Frontend Structure

- Next.js 14 App Router with TypeScript
- Tailwind CSS v3 for styling (downgraded from v4 for stability)
- Main client component: `components/Calendar.tsx`
  - Generates 15-minute time slots from 7:00 to 20:00
  - Date navigation: << (previous day), Today button, date picker, >> (next day)
  - Grid layout: time column + 3 appointment columns (Stewart, Sue, Notes)
  - Appointments visually span multiple slots based on duration (using CSS grid rowspan)
  - Click any slot to create new appointment
  - Click existing appointment to edit/delete
  - Time pickers use dropdown selects (15-min increments only)
  - Double-booking prevention: validates no overlapping appointments in same column
  - Notes column behavior:
    - Shows note text directly in calendar (not client name)
    - Simplified form: only time range and note text
    - Truncates long notes with line-clamp-3
  - Stewart/Sue columns:
    - Shows client name and phone
    - Full form with client name (required), phone, times, notes

### Path Aliases

TypeScript path mappings:
- `@/components/*` → `./components/*`
- `@/lib/*` → `./lib/*`

## Testing

The project uses Jest for unit testing with 100% code coverage requirements.

### Test Configuration

- **Framework**: Jest with TypeScript support via ts-jest
- **Environment**: Node (for testing server-side code)
- **Coverage**: 100% threshold on statements, branches, functions, and lines
- **Setup**: `jest.setup.ts` configures test environment variables
- **Config**: `jest.config.ts` defines test patterns and coverage rules

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report (enforces 100% coverage)
npm run test-coverage
```

### Test Structure

- Tests are located in `__tests__` directories alongside the code they test
- Mock implementations prevent real database calls
- Database abstraction layer (`lib/db.ts`) has comprehensive test coverage including:
  - In-memory database operations (default development mode)
  - MongoDB mode configuration
  - All CRUD operations (Create, Read, Update, Delete)
  - Edge cases and error handling

### Writing New Tests

When adding new features:
1. Create test file in appropriate `__tests__` directory
2. Use `@jest/globals` for imports (describe, it, expect, etc.)
3. Mock external dependencies (database, APIs, etc.)
4. Maintain 100% coverage threshold
5. Test both happy paths and error cases

## Key Implementation Notes

- Uses NextAuth v5 beta (API differs from v4) - currently optional/unused
- Authentication is implemented but not enforced on API routes
- No user registration flow - users must be manually seeded
- Session strategy is JWT, not database-backed
- In-memory database is default for easy development (set USE_REAL_DB=true for production MongoDB)
- All appointments are publicly accessible (no per-user filtering)
- Time slots are enforced at 15-minute intervals via dropdown selects
- Appointments can span multiple time slots and display accordingly
- Double-booking prevention checks for overlapping times within the same column
- Notes column works differently: displays note text instead of client name, simplified form
