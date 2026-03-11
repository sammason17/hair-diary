# Deployment Guide

## Prerequisites

- MongoDB Atlas cluster configured
- GitHub repository
- Vercel account

## Environment Variables

Configure these in Vercel (Settings → Environment Variables):

```bash
USE_REAL_DB=true
MONGODB_URI=<your-mongodb-atlas-connection-string>
MONGODB_DB=hair-diary
NEXTAUTH_URL=<your-vercel-app-url>
NEXTAUTH_SECRET=<your-generated-secret>
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Use the output as your `NEXTAUTH_SECRET` value.

## MongoDB Atlas Setup

### 1. Network Access

**Option A: Allow All IPs (Simplest)**
- Go to Network Access → Add IP Address
- Select "Allow Access from Anywhere" (0.0.0.0/0)
- Database access is still protected by username/password

**Option B: Vercel IP Ranges (More Restrictive)**
- Get Vercel's IP ranges from: https://vercel.com/docs/edge-network/regions
- Add each IP range to MongoDB Network Access
- Note: Vercel IPs can change, so Option A is more reliable

### 2. Add Users to Database

In MongoDB Atlas:

1. Click "Browse Collections" on your cluster
2. Create database `hair-diary` with collection `users`
3. Insert user documents:

**User 1:**
```json
{
  "username": "stewart",
  "name": "Stewart",
  "passwordHash": "<bcrypt-hash-from-env>"
}
```

**User 2:**
```json
{
  "username": "sue",
  "name": "Sue",
  "passwordHash": "<bcrypt-hash-from-env>"
}
```

*Note: Get password hashes from your local `.env.local` file (in `lib/db.ts` comments)*

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure environment variables (see above)
4. Deploy

### 3. Update NEXTAUTH_URL

After first deployment:

1. Copy your Vercel app URL (e.g., `https://your-app.vercel.app`)
2. Go to Vercel → Settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual URL
4. Redeploy (Deployments → ... → Redeploy)

## Verification

1. Visit your deployed app
2. You should be redirected to `/login`
3. Log in with your credentials
4. Create a test appointment
5. Refresh page - appointment should persist

## Troubleshooting

**Cannot connect to MongoDB:**
- Verify `MONGODB_URI` is correct in Vercel env vars
- Check MongoDB Network Access includes Vercel IPs or 0.0.0.0/0
- Verify database user exists with correct permissions

**Login not working:**
- Check users were added to MongoDB `users` collection
- Verify `NEXTAUTH_SECRET` is set in Vercel
- Check browser console for errors

**Appointments not persisting:**
- Verify `USE_REAL_DB=true` in production env vars
- Check MongoDB connection in Vercel function logs
