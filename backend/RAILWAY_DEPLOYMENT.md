# Railway Deployment Guide for SEO Director Backend

## Prerequisites
- GitHub account with this repository
- Railway account (free tier available at railway.app)

## Step-by-Step Deployment

### 1. Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for auto-deploy)

### 2. Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose this repository: `seodirector`
4. Select the `/backend` directory as the root

### 3. Add Services
Railway will automatically detect the need for:
- **PostgreSQL** - Click "+ Database" → PostgreSQL
- **Redis** - Click "+ Database" → Redis

### 4. Configure Environment Variables
In Railway dashboard, go to your backend service → Variables:

**Required Variables:**
```
NODE_ENV=production
JWT_SECRET=<generate-secure-32-char-string>
ALLOWED_ORIGINS=https://seoauditer.netlify.app
```

**Auto-provided by Railway:**
- DATABASE_URL
- DATABASE_PROXY_URL
- REDIS_URL
- PORT

### 5. Deploy
1. Railway will automatically deploy on git push
2. First deployment will:
   - Install dependencies
   - Generate Prisma client
   - Build TypeScript
   - Run database migrations
   - Start the server

### 6. Get Your Backend URL
Once deployed, Railway provides a URL like:
```
https://seodirector-backend-production.up.railway.app
```

### 7. Update Netlify Frontend
1. Go to Netlify Dashboard
2. Site Settings → Environment Variables
3. Add/Update:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app/api
   ```
4. Trigger a redeploy on Netlify

## Monitoring & Logs

### View Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Database Access
```bash
# Connect to production database
railway run psql $DATABASE_URL
```

## Cost Optimization

Railway's free tier includes:
- $5/month credit
- 500 GB bandwidth
- 100 GB-hours compute

To stay within limits:
- Use DATABASE_PROXY_URL (connection pooling)
- Enable auto-sleep for development
- Monitor usage in Railway dashboard

## Troubleshooting

### Server won't start
Check logs for:
- Missing environment variables
- Database connection issues
- Port binding problems

### Database migrations fail
```bash
# Run migrations manually
railway run npm run migrate:deploy
```

### High memory usage
- Reduce connection pool size
- Enable Node.js memory limits
- Use Railway's metrics to identify issues

## Security Checklist
- [ ] JWT_SECRET is unique and secure
- [ ] ALLOWED_ORIGINS only includes your domains
- [ ] Database has automatic backups enabled
- [ ] SSL/TLS is enforced (automatic on Railway)
- [ ] Environment variables are not exposed in logs

## Next Steps
1. Set up custom domain (optional)
2. Configure monitoring (Sentry, etc.)
3. Set up CI/CD with GitHub Actions
4. Enable database backups