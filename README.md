# Hair Diary

Professional appointment scheduling application for hairstylists. Built with Next.js 14, TypeScript, and MongoDB.

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

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Development mode uses an in-memory database - no MongoDB setup required.

Visit http://localhost:3000

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
- **Authentication**: Server-side session validation on all protected routes
- **Database Abstraction**: Single `getDb()` function supports both in-memory and MongoDB
- **API Routes**: RESTful endpoints with session-based authorization

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## License

Private
