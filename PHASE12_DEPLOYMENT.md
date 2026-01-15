# Phase 12: Deployment Guide

**Date:** January 12, 2026  
**Purpose:** Step-by-step guide for deploying Palabra with Phase 12 features

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ PostgreSQL database (local or hosted)
- ✅ Git repository set up
- ✅ Vercel account (or preferred hosting)
- ✅ Domain name (optional but recommended)

---

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended for Vercel Deployment)

1. **Create Database**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Create Postgres database
   vercel postgres create palabra-db
   ```

2. **Get Connection String**
   ```bash
   vercel postgres connect palabra-db
   # Copy the DATABASE_URL provided
   ```

### Option B: Supabase (Free Tier Available)

1. Visit [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Format: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`

### Option C: Railway

1. Visit [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL service
4. Copy DATABASE_URL from variables

### Option D: Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu
   sudo apt install postgresql
   sudo systemctl start postgresql
   ```

2. **Create Database**
   ```bash
   psql postgres
   CREATE DATABASE palabra;
   CREATE USER palabrauser WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE palabra TO palabrauser;
   \q
   ```

3. **Connection String**
   ```
   postgresql://palabrauser:your_password@localhost:5432/palabra
   ```

---

## Step 2: Environment Configuration

1. **Copy Environment Template**
   ```bash
   cd palabra
   cp .env.example .env
   ```

2. **Configure Environment Variables**
   
   Edit `.env`:
   ```env
   # Database
   DATABASE_URL="postgresql://..."
   
   # Authentication
   NEXTAUTH_SECRET="YOUR_SECURE_SECRET_HERE"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Optional: OAuth Providers
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   
   # Optional: API Keys (existing features)
   GOOGLE_TRANSLATE_API_KEY=""
   FORVO_API_KEY=""
   ```

3. **Generate Secure Secret**
   ```bash
   # Generate a secure secret
   openssl rand -base64 32
   # Copy output to NEXTAUTH_SECRET
   ```

---

## Step 3: Install Dependencies

```bash
# Navigate to palabra directory
cd palabra

# Install npm packages
npm install

# This will install:
# - @prisma/client
# - jose
# - All other dependencies
```

---

## Step 4: Database Migration

1. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

2. **Push Schema to Database**
   ```bash
   npm run prisma:push
   ```
   
   Or for production with migrations:
   ```bash
   npm run prisma:migrate
   ```

3. **Verify Database**
   ```bash
   npm run prisma:studio
   # Opens Prisma Studio at http://localhost:5555
   # You should see all tables created
   ```

---

## Step 5: Build and Test Locally

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Features**
   - Visit http://localhost:3000
   - Create an account
   - Add vocabulary
   - Check sync functionality
   - Test offline mode
   - Try PWA install prompt

3. **Build for Production**
   ```bash
   npm run build
   ```
   
   Fix any build errors before deployment.

4. **Test Production Build**
   ```bash
   npm start
   # Test at http://localhost:3000
   ```

---

## Step 6: Deploy to Vercel

### Using Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   # From palabra directory
   vercel
   
   # Follow prompts:
   # - Link to existing project or create new
   # - Confirm settings
   ```

3. **Set Environment Variables**
   ```bash
   # Set production variables
   vercel env add DATABASE_URL production
   # Paste your production database URL
   
   vercel env add NEXTAUTH_SECRET production
   # Paste your secret
   
   vercel env add NEXTAUTH_URL production
   # Enter your production URL (e.g., https://palabra.vercel.app)
   ```

4. **Deploy Production**
   ```bash
   vercel --prod
   ```

### Using Vercel Dashboard

1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Connect your Git repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `palabra`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Add Environment Variables:
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL (your deployment URL)

6. Click "Deploy"

---

## Step 7: Post-Deployment Setup

1. **Run Database Migration**
   ```bash
   # Connect to production database
   DATABASE_URL="your_production_url" npm run prisma:push
   ```

2. **Verify Deployment**
   - Visit your deployed URL
   - Create test account
   - Test authentication
   - Test sync functionality
   - Check PWA install

3. **Configure Custom Domain** (Optional)
   ```bash
   vercel domains add yourdomain.com
   # Follow DNS configuration instructions
   ```

4. **Update NEXTAUTH_URL**
   ```bash
   # Update to your custom domain
   vercel env add NEXTAUTH_URL production
   # Enter: https://yourdomain.com
   
   # Redeploy
   vercel --prod
   ```

---

## Step 8: PWA Configuration

1. **Update Manifest** (if needed)
   
   Edit `public/manifest.json`:
   ```json
   {
     "name": "Palabra - Spanish Vocabulary Learning",
     "short_name": "Palabra",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#007aff",
     "background_color": "#ffffff"
   }
   ```

2. **Generate PWA Icons** (if not already done)
   - Create 192x192 icon → `public/icon-192.png`
   - Create 512x512 icon → `public/icon-512.png`
   - Ensure they're properly referenced in manifest

3. **Verify Service Worker**
   - Visit your app
   - Open DevTools → Application → Service Workers
   - Verify service worker is registered
   - Check cache storage

---

## Step 9: Monitoring & Maintenance

### Setup Monitoring

1. **Vercel Analytics**
   ```bash
   npm install @vercel/analytics
   ```
   
   Add to `app/layout.tsx`:
   ```typescript
   import { Analytics } from '@vercel/analytics/react';
   
   export default function RootLayout() {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

2. **Error Tracking** (Optional)
   - Sentry
   - LogRocket
   - Bugsnag

### Database Maintenance

```bash
# Backup database (production)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# View database usage
npm run prisma:studio

# Check sync logs
# Query SyncLog table for issues
```

### Performance Monitoring

- Monitor sync times in SyncLog table
- Check service worker cache sizes
- Monitor API response times
- Track user sign-ups

---

## Step 10: Verify Deployment Checklist

- [ ] App loads at production URL
- [ ] User can sign up
- [ ] User can sign in
- [ ] Vocabulary syncs to server
- [ ] Reviews sync to server
- [ ] Stats sync to server
- [ ] PWA install prompt appears
- [ ] Service worker registers
- [ ] Offline mode works
- [ ] Multiple devices sync
- [ ] HTTPS enabled
- [ ] Custom domain working (if applicable)

---

## Alternative Hosting Platforms

### Netlify

1. Connect repository
2. Build settings:
   - Build command: `cd palabra && npm run build`
   - Publish directory: `palabra/.next`
   - Functions directory: `palabra/.netlify/functions`

3. Environment variables (same as Vercel)
4. Deploy

### Railway

1. Create project from GitHub
2. Add PostgreSQL service
3. Add web service (Next.js)
4. Configure environment variables
5. Deploy

### AWS Amplify

1. Connect repository
2. Configure build settings
3. Add environment variables
4. Deploy

---

## Troubleshooting

### Build Errors

**Error: Module not found '@prisma/client'**
```bash
npm install @prisma/client
npm run prisma:generate
```

**Error: DATABASE_URL not set**
```bash
# Check .env file exists
# Verify DATABASE_URL is set
# Try: export DATABASE_URL="your_url"
```

### Database Connection Errors

**Error: Connection refused**
- Check database is running
- Verify connection string format
- Check firewall settings
- Verify SSL mode if required

**Error: SSL required**
```env
DATABASE_URL="postgresql://...?sslmode=require"
```

### Sync Issues

**Data not syncing**
1. Check network connectivity
2. Verify user is authenticated
3. Check browser console for errors
4. Check sync logs in database
5. Verify service worker is active

**Conflicts not resolving**
- Check version numbers in database
- Verify timestamps are correct
- Check conflict resolution logic

### PWA Issues

**Install prompt not showing**
- Check browser compatibility
- Verify manifest.json is valid
- Check service worker registration
- Verify HTTPS connection

**Service worker not registering**
- Check browser console
- Verify sw.js is accessible
- Check Content-Type header
- Clear browser cache

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Database connection encrypted
- [ ] NEXTAUTH_SECRET is strong and secret
- [ ] Environment variables not in Git
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevented (Prisma handles this)
- [ ] XSS prevention in place
- [ ] CSRF protection enabled

---

## Backup Strategy

### Database Backups

**Automated (Recommended):**
```bash
# Set up daily backups
# Example with Vercel Postgres
vercel postgres backup create palabra-db

# Or with cron job
0 2 * * * pg_dump $DATABASE_URL > /backups/palabra_$(date +\%Y\%m\%d).sql
```

**Manual:**
```bash
# Full backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### User Data Exports

- Implement export functionality in Phase 13
- Allow users to download their data
- Regular backup reminders

---

## Performance Optimization

### Database

```sql
-- Add indexes for common queries
CREATE INDEX idx_vocabulary_user_next_review 
  ON "VocabularyItem" ("userId", "nextReviewDate");

CREATE INDEX idx_review_user_date 
  ON "Review" ("userId", "reviewDate");
```

### Caching

- Enable Vercel Edge caching
- Configure CDN for static assets
- Use ISR for static pages

### Database Connection Pooling

```env
# Add to DATABASE_URL
DATABASE_URL="postgresql://...?connection_limit=5&pool_timeout=20"
```

---

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check error logs
- Monitor database size
- Review sync logs
- Check service worker updates

**Monthly:**
- Database backup verification
- Performance audit
- Security updates
- Dependency updates

**Quarterly:**
- Full security audit
- Performance optimization
- User feedback review
- Feature planning

---

## Conclusion

Your Palabra deployment is now complete! Users can:

- ✅ Create accounts and sign in
- ✅ Sync vocabulary across devices
- ✅ Use the app offline
- ✅ Install as a PWA
- ✅ Access from any device
- ✅ Enjoy automatic data synchronization

For support or issues, refer to:
- PHASE12_COMPLETE.md for implementation details
- This guide for deployment help
- GitHub issues for bug reports

**Happy Learning! 🎉**

