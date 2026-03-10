
# Setup & Deployment Instructions

## 1. Prerequisites

- Node.js 18+
- GitHub account
- Vercel account
- MongoDB Atlas account

## 2. MongoDB Atlas

- Create a free Atlas cluster.
- Create a database user.
- Allow your IP (or 0.0.0.0/0 for dev).
- Copy the connection string.

Set `MONGODB_URI` and `MONGODB_DB` (e.g. `hair-diary`) in `.env.local`.

## 3. Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## 4. Seed users

Insert Stewart and Sue manually into the `users` collection with `email`, `name`, and `passwordHash` (bcrypt hash).

## 5. Deploy to Vercel

- Push this repo to GitHub.
- Import the project in Vercel.
- Configure env vars `MONGODB_URI` and `MONGODB_DB`.
- Deploy.
