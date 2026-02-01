# Local Setup Guide - Social Features Branch

## ✅ Branch Created
You're now on the `darshan_profile` branch. All social features are committed here and won't affect `main`.

## 🚀 Quick Setup Steps

### 1. Install Missing Dependencies
```bash
# Make sure you're in the HackMT26 directory
cd HackMT26

# Install date-fns (required for date formatting)
bun add date-fns
```

### 2. Run Database Migration
```bash
# This will create all the new social media tables
bun run db:push
```

### 3. Start Development Server
```bash
# Make sure Doppler is running with your secrets
doppler run -- bun run dev

# OR if you have .env.local file
bun run dev
```

### 4. Access the Social Features
- Navigate to: `http://localhost:3000/app/social`
- You should see the Community feed
- Click "New Post" to create your first post

## 📋 What's Available

### Pages
- `/app/social` - Main community feed
- `/app/social/create` - Create new post
- `/app/social/post/[id]` - View individual post
- `/app/social/post/[id]/edit` - Edit post

### Features
- ✅ Create posts about medications
- ✅ Upload images (up to 5 per post)
- ✅ Rate medications (1-5 stars)
- ✅ Like and comment on posts
- ✅ Search and filter posts
- ✅ Follow/unfollow users

## 🔧 Troubleshooting

### If you get "date-fns not found" error:
```bash
bun add date-fns
```

### If database errors occur:
```bash
# Regenerate and push schema
bun run db:generate
bun run db:push
```

### If images don't upload:
- Image upload UI is ready but needs UploadThing integration
- For now, you can test with image URLs manually
- See `SOCIAL_FEATURES.md` for integration details

## 📝 Notes

- All changes are on `darshan_profile` branch
- Main branch is untouched
- You can switch back to main anytime: `git checkout main`
- To switch back to this branch: `git checkout darshan_profile`

## 🎯 Next Steps

1. Install dependencies: `bun add date-fns`
2. Run migration: `bun run db:push`
3. Start dev server: `doppler run -- bun run dev`
4. Test the features!

Enjoy your new social features! 🎉
