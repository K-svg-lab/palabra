# Backend Infrastructure - Quick Reference Card

**Palabra Spanish Vocabulary Learning Application**

For complete documentation, see **BACKEND_INFRASTRUCTURE.md**

---

## 🎯 Architecture at a Glance

```
Client (React/Next.js) 
    ↕ 
IndexedDB (Local) + API Routes (Serverless)
    ↕
PostgreSQL (Cloud) + External APIs
```

---

## 📊 Database Quick Reference

### IndexedDB Stores (Local)
- `vocabulary` - Word data
- `reviews` - SR algorithm data
- `sessions` - Study sessions
- `stats` - Daily statistics
- `settings` - User preferences
- `tags` - Custom tags

### PostgreSQL Tables (Cloud)
- `User` - Authentication
- `Vocabulary` - Multi-user words
- `Review` - SR tracking
- `Session` - Study history
- `DailyStats` - Analytics
- `Device` - Device tracking
- `SyncLog` - Sync history
- `UserSettings` - Preferences

---

## 🔌 API Endpoints Quick Reference

### Authentication
```
POST /api/auth/signup      - Register user
POST /api/auth/signin      - Authenticate
POST /api/auth/signout     - End session
GET  /api/auth/me          - Current user
```

### Synchronization
```
POST /api/sync/vocabulary  - Sync words
POST /api/sync/reviews     - Sync reviews
POST /api/sync/stats       - Sync stats
```

### Vocabulary Lookup
```
POST /api/vocabulary/lookup - Get word data
```

---

## 🔐 Authentication Flow

```typescript
// 1. Sign up
await fetch('/api/auth/signup', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// 2. Sign in (sets cookie)
await fetch('/api/auth/signin', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// 3. Check auth status
const user = await fetch('/api/auth/me');

// 4. Sign out
await fetch('/api/auth/signout', { method: 'POST' });
```

---

## 🔄 Sync Service Quick Reference

### Sync Modes
- **Incremental**: Only changed items (default)
- **Full**: All items (initial sync)

### Conflict Resolution
- **Strategy**: Last-write-wins (newest timestamp)
- **Tracking**: Version numbers + timestamps

### Triggers
- On app startup
- On network reconnection
- After local mutations (debounced 5s)
- Manual sync button
- Background sync (service worker)

---

## 🗄️ Key File Locations

### Backend
```
lib/backend/
├── prisma/schema.prisma    # Database schema
├── auth.ts                 # Auth utilities
├── db.ts                   # Prisma client
└── api-utils.ts            # API helpers
```

### API Routes
```
app/api/
├── auth/*                  # Auth endpoints
├── sync/*                  # Sync endpoints
└── vocabulary/lookup/      # Lookup endpoint
```

### Services
```
lib/services/
├── sync.ts                 # Sync service (600 lines)
├── translation.ts          # Translation API
├── dictionary.ts           # Dictionary API
└── audio.ts                # Pronunciation
```

### Database (Client)
```
lib/db/
├── schema.ts               # IndexedDB schema
├── vocabulary.ts           # Vocab operations
├── reviews.ts              # Review operations
├── sessions.ts             # Session tracking
└── stats.ts                # Stats aggregation
```

---

## 🌐 External APIs

| Service | Purpose | Provider |
|---------|---------|----------|
| Translation | Spanish ↔ English | LibreTranslate (free) |
| Dictionary | Definitions, metadata | Wiktionary API |
| Examples | Sample sentences | Tatoeba API |
| Audio | Pronunciation | Browser TTS |

---

## ⚙️ Environment Variables

### Required
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."  # openssl rand -base64 32
NEXTAUTH_URL="https://..."
```

### Optional
```bash
LIBRETRANSLATE_API_KEY=""
FORVO_API_KEY=""
NEXT_PUBLIC_ANALYTICS_ID=""
```

---

## 🚀 Common Commands

### Development
```bash
npm run dev                 # Start dev server
npm run prisma:studio       # Open DB GUI
npm run prisma:generate     # Generate Prisma client
```

### Database
```bash
npm run prisma:push         # Push schema (dev)
npm run prisma:migrate      # Create migration (prod)
```

### Build & Deploy
```bash
npm run build               # Production build
npm run start               # Start production server
vercel --prod               # Deploy to Vercel
```

---

## 🔍 Debugging Quick Tips

### Check Auth
```typescript
const user = await fetch('/api/auth/me');
console.log(await user.json());
```

### Check Sync Status
```typescript
const status = syncService.getStatus();
console.log(status);
```

### Force Sync
```typescript
await syncService.sync({ force: true });
```

### Check Storage
```typescript
const estimate = await navigator.storage.estimate();
console.log(`Used: ${estimate.usage}, Quota: ${estimate.quota}`);
```

### Database Connection
```bash
npx prisma db pull  # Test connection
```

---

## 📁 Data Flow

### Adding Vocabulary
```
1. User submits word (frontend)
2. Save to IndexedDB (instant)
3. Queue sync (background)
4. POST to /api/sync/vocabulary
5. Save to PostgreSQL
6. Sync to other devices
```

### Multi-Device Sync
```
Device A (changes) → PostgreSQL → Device B (pulls)
```

---

## 🎨 Architecture Patterns

### Client-Side
- **State**: TanStack Query (server) + Zustand (client)
- **Forms**: React Hook Form + Zod
- **Storage**: IndexedDB via idb wrapper
- **Offline**: Service Worker + Cache API

### Server-Side
- **Auth**: JWT in HTTP-only cookies
- **Database**: Prisma ORM + PostgreSQL
- **API**: Next.js Route Handlers
- **Validation**: Zod schemas

---

## 📊 Key Metrics

| Component | Size |
|-----------|------|
| Total Backend Code | ~3,890 lines |
| Database Schema | ~500 lines |
| Sync Service | ~600 lines |
| API Endpoints | ~560 lines |
| Auth System | ~200 lines |

---

## ⚠️ Common Issues & Solutions

### Database Connection Failed
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

### Sync Not Working
```typescript
// Check auth
const user = await fetch('/api/auth/me');

// Manual sync
await syncService.sync({ force: true });
```

### IndexedDB Quota Exceeded
```typescript
// Request persistent storage
await navigator.storage.persist();
```

---

## 📚 Documentation Links

- **Full Backend Docs**: `BACKEND_INFRASTRUCTURE.md`
- **Phase 12 Details**: `PHASE12_COMPLETE.md`
- **Deployment Guide**: `DEPLOYMENT.md` (in palabra/)
- **PRD**: `README_PRD.txt`

---

## 🔮 Evolution Timeline

| Phase | Feature | Storage |
|-------|---------|---------|
| 1-11 | Client-only | IndexedDB |
| 12 | Cloud sync | IndexedDB + PostgreSQL |
| Future | Real-time sync | + WebSockets |

---

## 💡 Pro Tips

1. **Always check `BACKEND_INFRASTRUCTURE.md` first** - Single source of truth
2. **Use Prisma Studio** for database debugging - `npm run prisma:studio`
3. **Test sync locally** before deploying - Set up local PostgreSQL
4. **Monitor sync logs** - Check SyncLog table for issues
5. **Use incremental sync** - Faster and more efficient
6. **Request persistent storage** - Prevents quota issues

---

## 🆘 Getting Help

1. Check `BACKEND_INFRASTRUCTURE.md`
2. Review inline code comments
3. Check troubleshooting section
4. Review phase documents
5. Check external API docs

---

**Last Updated:** January 13, 2026  
**Quick Reference Version:** 1.0

*For comprehensive documentation, always refer to BACKEND_INFRASTRUCTURE.md*

