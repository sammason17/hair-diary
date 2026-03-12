# Hair Diary

Professional appointment scheduling application for hairstylists. Built with Next.js 14, TypeScript, and MongoDB. With mocked dev environemnt.

## Features

- Daily calendar view with 15-minute time slots (07:00 - 20:00)
- Multi-column booking (Stewart, Sue, Notes)
- Full CRUD operations with modal interface
- Date navigation with keyboard shortcuts
- Appointment conflict prevention
- Secure authentication with NextAuth v5
- Dual-mode database (in-memory for development, MongoDB for production)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **Database**: MongoDB Atlas / In-memory
- **Authentication**: NextAuth v5 (JWT sessions)
- **Deployment**: Vercel

## Development

```bash
# Install dependencies
npm install

# Start development server (no setup required!)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

**Development mode uses an in-memory database** - no MongoDB, no .env file, no configuration needed! Just `npm run dev` and start working.

- ✅ Auto-authenticated as "Stewart"
- ✅ Full CRUD operations work
- ✅ Data persists across hot reloads
- ✅ Two pre-seeded users: stewart/sue (password: "password")

Visit http://localhost:3000

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report (100% coverage required)
npm run test-coverage
```

The project uses Jest for testing with comprehensive coverage requirements. All tests run against mocked dependencies to avoid real database calls.

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions including:
- Environment variable configuration
- MongoDB Atlas setup
- Vercel deployment steps
- User account creation

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `USE_REAL_DB` | Use MongoDB (`true`) or in-memory (`false`) | Yes |
| `MONGODB_URI` | MongoDB Atlas connection string | Production only |
| `MONGODB_DB` | Database name | Production only |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Session encryption secret | Yes |

## Architecture

- **App Router**: Next.js 14 server components with client-side interactivity
- **Dual Auth System**: Development uses mock auth, production uses NextAuth v5
- **Database Abstraction**: Single `getDb()` function supports both in-memory and MongoDB
- **Global Persistence**: In-memory DB survives Next.js hot reloads via global storage
- **API Routes**: RESTful endpoints with authentication on all routes

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## Recent Fixes (2026-03-12)

The development in-memory database has been completely fixed! Previous issues with CRUD operations, authentication, and data persistence have been resolved:

- ✅ Authentication now works in development mode (auto-login)
- ✅ All CRUD operations (Create, Read, Update, Delete) function properly
- ✅ Data persists across Next.js hot reloads
- ✅ ObjectId serialization works correctly
- ✅ Zero impact on production code

See [DEV_MODE_FIXES.md](DEV_MODE_FIXES.md) for technical details.

## License

Private
