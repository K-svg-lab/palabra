# Phase 12: Quick Start Guide

**Date:** January 12, 2026  
**Purpose:** Get Phase 12 features up and running in 10 minutes

---

## 🚀 Quick Start (Development)

### 1. Prerequisites Check
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### 2. Install Dependencies
```bash
cd palabra
npm install
```

### 3. Setup Database (Choose One)

#### Local PostgreSQL (Easiest for Development)
```bash
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb palabra

# Connection string
export DATABASE_URL="postgresql://localhost:5432/palabra"
```

#### Supabase (Free Cloud Database)
1. Visit [supabase.com](https://supabase.com)
2. Create project
3. Copy DATABASE_URL from Settings → Database
4. Add to `.env`

### 4. Configure Environment
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://localhost:5432/palabra"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
EOF
```

### 5. Setup Database Schema
```bash
npm run prisma:generate
npm run prisma:push
```

### 6. Start Development Server
```bash
npm run dev
```

### 7. Test It Out! 🎉

Visit http://localhost:3000 and:
- ✅ Create an account
- ✅ Add some vocabulary
- ✅ See the PWA install prompt
- ✅ Try offline mode (DevTools → Network → Offline)
- ✅ Open in another browser/device and see sync work!

---

## 🔥 Key Features to Test

### Authentication
```
1. Sign Up → http://localhost:3000/signup (or wherever you add the sign-up page)
2. Sign In → Use email/password
3. Sign Out → Session cleared
```

### Synchronization
```
1. Add vocabulary on Device A
2. Open app on Device B
3. See automatic sync!
```

### PWA
```
1. Wait for install prompt (appears after 3 seconds)
2. Click "Install Now"
3. App opens in standalone mode
4. Add to home screen (mobile)
```

### Offline Mode
```
1. Open DevTools
2. Network tab → Throttle → Offline
3. Add vocabulary offline
4. Go back online
5. Watch automatic sync!
```

---

## 📱 Test on Mobile

### iOS
```
1. Open Safari
2. Visit your local dev URL (use ngrok for testing)
3. Tap Share → Add to Home Screen
4. Test offline functionality
```

### Android
```
1. Open Chrome
2. Visit your app
3. Tap install prompt
4. App installs to home screen
5. Test offline and sync
```

---

## 🐛 Common Issues

### Can't Connect to Database
```bash
# Check PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Test connection
psql $DATABASE_URL
```

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Service Worker Not Updating
```bash
# Hard refresh
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows/Linux)

# Or unregister in DevTools
Application → Service Workers → Unregister
```

---

## 🔧 Useful Commands

```bash
# View database
npm run prisma:studio

# Reset database
npm run prisma:push -- --force-reset

# Check types
npx tsc --noEmit

# Lint
npm run lint

# Build production
npm run build

# Start production
npm start
```

---

## 📊 Check Sync Status

### Browser Console
```javascript
// Get sync service
const syncService = getSyncService();

// Check state
const state = await syncService.getState();
console.log(state);

// Manual sync
await syncService.sync();
```

### Database (Prisma Studio)
```bash
npm run prisma:studio
# Open http://localhost:5555
# Check SyncLog table for sync history
```

---

## 🎯 What's New in Phase 12

### Backend
- ✅ PostgreSQL database
- ✅ User authentication
- ✅ RESTful API endpoints
- ✅ Sync logging

### Sync
- ✅ Cloud synchronization
- ✅ Conflict detection
- ✅ Multi-device support
- ✅ Offline queue

### PWA
- ✅ Install prompt
- ✅ Offline indicator
- ✅ Enhanced service worker
- ✅ Background sync

---

## 📚 Next Steps

1. **Read Full Docs**
   - `PHASE12_COMPLETE.md` - Complete implementation guide
   - `PHASE12_DEPLOYMENT.md` - Production deployment

2. **Deploy**
   - Follow deployment guide
   - Set up production database
   - Configure environment

3. **Customize**
   - Add OAuth providers
   - Customize PWA manifest
   - Add analytics

4. **Test**
   - Multi-device testing
   - Offline scenarios
   - Conflict resolution
   - Performance

---

## 💡 Pro Tips

### Development

```bash
# Use environment-specific configs
cp .env.example .env.development
cp .env.example .env.production

# Watch for changes
npm run dev -- --turbo  # Turbopack (faster)
```

### Testing Sync

```bash
# Use two different browsers
# Firefox + Chrome
# Or two browser profiles
# Or different devices on same network
```

### Debugging

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Check service worker logs
DevTools → Application → Service Workers → View logs

# Check sync queue
DevTools → Application → IndexedDB → palabra-sync
```

---

## 🎉 Success Criteria

You've successfully set up Phase 12 when:

- [ ] App runs at http://localhost:3000
- [ ] Can create an account
- [ ] Can add vocabulary
- [ ] Data syncs to database
- [ ] PWA install prompt appears
- [ ] Offline mode works
- [ ] Service worker registered
- [ ] Multiple devices can sync

---

## 🆘 Need Help?

1. Check error console in browser
2. Check terminal for server errors
3. Review `PHASE12_COMPLETE.md` for details
4. Check database with Prisma Studio
5. Verify environment variables

---

**Setup Time:** ~10 minutes  
**Difficulty:** ⭐⭐⭐ (Intermediate)  
**Status:** Ready for development

**Happy Coding! 🚀**

