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

## Environment Setup

### Development Mode (Default - No Setup Required)

Development mode uses an in-memory database with automatic authentication - just run `npm run dev` and start working immediately!

- **No `.env.local` file needed**
- **No MongoDB required**
- **Auto-authenticated as "Stewart"**
- **Full CRUD operations work**
- **Data persists across hot reloads**
- **Pre-seeded users**: stewart/sue (password: "password")

### Production Mode

For production deployment, create `.env.local` with:

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

The app uses a dual authentication system via `lib/devAuth.ts`:

**Development Mode (USE_REAL_DB=false)**:
- Automatic mock authentication - no login required
- Returns pre-configured session for user "Stewart"
- All API routes automatically authenticated
- Sign out is a no-op (doesn't actually log out)
- Perfect for local testing and development

**Production Mode (USE_REAL_DB=true)**:
- NextAuth v5 (beta) with Credentials provider
- JWT-based sessions (no database sessions)
- Authentication config in `lib/authOptions.ts`
- Login page at `/login` with client-side form
- Auth routes handled by `app/api/auth/[...nextauth]/route.ts`
- All API routes require valid authentication
- Real session management with proper sign out

### Database Abstraction Layer

The app uses a database abstraction in `lib/db.ts` that supports both in-memory and MongoDB:

**In-Memory Mode (Default)**:
- Controlled by `USE_REAL_DB` environment variable (false by default)
- Stores data in global memory that persists across Next.js hot reloads
- Perfect for development - no MongoDB setup required
- Includes pre-seeded test users (stewart/sue with password "password")
- Full CRUD operations supported
- Data resets only on server restart (not on hot reload)

**MongoDB Mode (Production)**:
- Set `USE_REAL_DB=true` to enable
- Uses MongoDB Atlas or any MongoDB instance
- Connection handled via singleton pattern in `lib/mongodb.ts`
- Reuses connection across hot reloads to prevent pool exhaustion

All API routes and authentication use `getDb()` which automatically returns the correct database implementation.

### API Routes

All routes require authentication (auto-handled in development mode via `lib/devAuth.ts`):

**GET /api/appointments**
- Query param: `?date=YYYY-MM-DD` (optional)
- Returns array of appointments for specified date (or all if no date)
- ObjectIds serialized to strings in response

**POST /api/appointments**
- Creates new appointment
- Returns created appointment with `_id` (serialized to string)

**PUT /api/appointments/[id]**
- Updates appointment by `_id` (MongoDB ObjectId)
- Returns 204 on success, 404 if not found

**DELETE /api/appointments/[id]**
- Deletes appointment by `_id` (MongoDB ObjectId)
- Returns 204 on success, 404 if not found

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

- **Dual Auth System**: Development mode auto-authenticates, production uses NextAuth v5 beta
- **Global Persistence**: In-memory database uses `global.__inMemoryDB` to survive Next.js hot reloads
- **No Registration**: Users must be manually seeded (pre-seeded in dev mode)
- **Session Strategy**: JWT-based (not database-backed)
- **Zero Production Impact**: All dev-mode code is isolated via `lib/devAuth.ts`
- **Development Users**: stewart/sue with password "password"
- **ObjectId Serialization**: All API responses serialize MongoDB ObjectIds to strings
- **Time Slots**: Enforced at 15-minute intervals via dropdown selects
- **Multi-Slot Appointments**: Can span multiple time slots and display accordingly
- **Double-Booking Prevention**: Validates no overlapping appointments in same column
- **Notes Column**: Displays note text instead of client name, simplified form

## Development Authentication Bypass

The `lib/devAuth.ts` module provides seamless switching between development and production:

```typescript
// Development (USE_REAL_DB=false)
getAuth() → Returns mock session immediately
devSignOut() → No-op, logs to console

// Production (USE_REAL_DB=true)
getAuth() → Calls real NextAuth auth()
devSignOut() → Calls real NextAuth signOut()
```

This allows all API routes and pages to use the same code regardless of environment.
