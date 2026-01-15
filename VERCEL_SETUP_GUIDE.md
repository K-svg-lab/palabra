# Vercel Deployment Setup Guide for Palabra

## Current Status ✅

Your Palabra app is ready for deployment! Here's what's been completed:

### ✅ Completed Steps:
1. ✅ Git repository initialized
2. ✅ Code committed to local repository
3. ✅ GitHub repository created: https://github.com/K-svg-lab/palabra
4. ✅ Code pushed to GitHub
5. ✅ Vercel project created and linked
6. ✅ NEXTAUTH_SECRET configured
7. ✅ NEXTAUTH_URL configured (https://palabra.vercel.app)

### 🔄 Remaining Steps:

## Step 1: Create PostgreSQL Database (Required)

You have **3 options** for the database:

### Option A: Vercel Postgres (Recommended) 🌟

1. Go to https://vercel.com/dashboard
2. Navigate to your **palabra** project
3. Click on the **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Name it: `palabra-db`
7. Select region: Choose closest to your users
8. Click **Create**
9. Vercel will automatically add `DATABASE_URL` to your environment variables

### Option B: Neon (Free PostgreSQL Hosting) 🆓

1. Go to https://console.neon.tech/signup
2. Sign up for a free account
3. Create a new project named "palabra"
4. Copy the connection string (looks like: `postgresql://...`)
5. Add it to Vercel:
   ```bash
   cd palabra
   npx vercel env add DATABASE_URL production
   # Paste your Neon connection string when prompted
   ```

### Option C: Supabase (Free PostgreSQL + More Features) 🚀

1. Go to https://supabase.com/dashboard
2. Create a new project named "palabra"
3. Go to **Settings → Database**
4. Copy the **Connection string** (URI format)
5. Add it to Vercel:
   ```bash
   cd palabra
   npx vercel env add DATABASE_URL production
   # Paste your Supabase connection string when prompted
   ```

## Step 2: Deploy to Production

Once the DATABASE_URL is configured, deploy:

```bash
cd /Users/kalvinbrookes/Library/CloudStorage/GoogleDrive-kbrookes2507@gmail.com/My\ Drive/01_Kalvin/02_Education/07_AI_Cursor_Projects/Spanish_Vocab/palabra
npx vercel --prod
```

## Step 3: Initialize Database Schema

After successful deployment, initialize your database:

```bash
# Pull the production environment variables locally
npx vercel env pull .env.production

# Generate Prisma client
npm run prisma:generate

# Push the database schema to production
npm run prisma:push
```

Or you can run this directly on Vercel through the dashboard or using Vercel CLI.

## Step 4: Verify Deployment

1. Visit: https://palabra.vercel.app
2. Test the following:
   - ✅ App loads successfully
   - ✅ Sign up creates a new account
   - ✅ Sign in works
   - ✅ Add vocabulary words
   - ✅ Review session works
   - ✅ Data persists after refresh

## Environment Variables Summary

Current environment variables set for production:

| Variable | Value | Status |
|----------|-------|--------|
| NEXTAUTH_SECRET | `CrjIda4H469M4mpHTKWM8P3J6u9UHb0iCXeeio+0iH4=` | ✅ Set |
| NEXTAUTH_URL | `https://palabra.vercel.app` | ✅ Set |
| DATABASE_URL | *Needs to be configured* | ⏳ Pending |

## Quick Command Reference

```bash
# View all environment variables
npx vercel env ls

# Add an environment variable
npx vercel env add [name] production

# Pull environment variables locally
npx vercel env pull

# Deploy to production
npx vercel --prod

# View deployment logs
npx vercel logs

# Open project in dashboard
npx vercel open
```

## Troubleshooting

### Issue: "Environment Variable DATABASE_URL references Secret database_url, which does not exist"

**Solution:** Follow Step 1 above to create and configure the DATABASE_URL.

### Issue: Database connection fails

**Solution:** Ensure your DATABASE_URL format is correct:
```
postgresql://username:password@host:port/database?sslmode=require
```

### Issue: Prisma schema not synced

**Solution:** Run the database push command:
```bash
npm run prisma:push
```

## Post-Deployment Configuration

### Enable Automatic Deployments

Your GitHub repository is already connected. Every push to `main` branch will automatically deploy to production!

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow the DNS configuration instructions
4. Update NEXTAUTH_URL environment variable to your custom domain

### Monitoring

- **Analytics**: Available in Vercel Dashboard
- **Logs**: `npx vercel logs` or view in dashboard
- **Performance**: Check Vercel Speed Insights tab

## Next Steps

After deployment:

1. ⚠️ **Complete Step 1** (Create PostgreSQL Database)
2. ⚠️ **Complete Step 2** (Deploy to Production)
3. Test your application thoroughly
4. Share your app: https://palabra.vercel.app
5. Monitor performance and errors in Vercel Dashboard
6. Consider setting up custom domain

## Support

- Vercel Documentation: https://vercel.com/docs
- Prisma Documentation: https://www.prisma.io/docs
- GitHub Repository: https://github.com/K-svg-lab/palabra
- Vercel Dashboard: https://vercel.com/nutritrues-projects/palabra

---

**Project:** Palabra - Spanish Vocabulary Learning App  
**Repository:** https://github.com/K-svg-lab/palabra  
**Production URL:** https://palabra.vercel.app  
**Status:** Ready for database configuration and final deployment

