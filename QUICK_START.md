# Quick Start - Get Social Features Running Locally

## Step 1: Run Database Migration

Make sure you're in the HackMT26 directory and run:

```powershell
doppler run -- bun run db:push
```

This will create all the social media tables in your database.

## Step 2: Start Development Server

```powershell
doppler run -- bun run dev
```

## Step 3: Test the Features

1. Open your browser: `http://localhost:3000`
2. Sign in to your account
3. Navigate to: `http://localhost:3000/app/social`
4. Click "New Post" to create your first post!

## Troubleshooting

### If Doppler doesn't work:
Make sure you've run:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
doppler setup
```

### If database migration fails:
- Make sure DATABASE_URL is set in Doppler
- Check that your database is accessible

### If you get import errors:
- Make sure all dependencies are installed: `bun install`
