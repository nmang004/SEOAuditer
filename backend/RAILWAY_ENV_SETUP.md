# Railway Environment Variables Setup

## Required Environment Variables

Railway automatically provides these when you add services:
- `DATABASE_URL` - Automatically set when you add PostgreSQL
- `REDIS_URL` - Automatically set when you add Redis
- `PORT` - Automatically set by Railway

## Manual Configuration Required

You MUST manually add these in Railway dashboard (Settings → Variables):

```
JWT_SECRET=<generate-a-secure-32-character-string>
ALLOWED_ORIGINS=https://seoauditer.netlify.app
NODE_ENV=production
```

### How to Generate JWT_SECRET

Option 1: Use this command locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Option 2: Use an online generator for a 32+ character random string

## Deployment will fail without these variables!

The application requires `DATABASE_URL` and `JWT_SECRET` to start successfully.