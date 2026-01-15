# Backend Infrastructure Documentation

**Palabra - Spanish Vocabulary Learning Application**

**Last Updated:** January 13, 2026  
**Current Version:** Phase 12 (Production Ready)  
**Status:** ✅ Complete with PostgreSQL + IndexedDB Hybrid Architecture

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Layer](#database-layer)
3. [API Endpoints](#api-endpoints)
4. [Authentication System](#authentication-system)
5. [Synchronization Service](#synchronization-service)
6. [External API Integrations](#external-api-integrations)
7. [Caching Strategy](#caching-strategy)
8. [Environment Configuration](#environment-configuration)
9. [Deployment Architecture](#deployment-architecture)
10. [Evolution History](#evolution-history)

---

## Architecture Overview

Palabra uses a **hybrid architecture** combining client-side and cloud storage for optimal performance and offline capability.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router (React 19, TypeScript)              │
│  ├─ IndexedDB (Local Storage)                              │
│  ├─ Service Worker (PWA)                                   │
│  ├─ TanStack Query (Cache Management)                      │
│  └─ Sync Service (Bidirectional)                           │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  Serverless API Routes                                      │
│  ├─ /api/auth/*         Authentication                     │
│  ├─ /api/sync/*         Data synchronization               │
│  ├─ /api/vocabulary/*   External API proxy                 │
│  └─ Middleware          Rate limiting, CORS, auth          │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (Prisma ORM)                                    │
│  ├─ Users & Authentication                                  │
│  ├─ Vocabulary (Multi-user)                                │
│  ├─ Reviews & Sessions                                      │
│  ├─ Statistics & Analytics                                  │
│  └─ Sync Logs & Device Tracking                            │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                               │
├─────────────────────────────────────────────────────────────┤
│  ├─ LibreTranslate API      (Translations)                 │
│  ├─ Wiktionary API          (Definitions)                  │
│  ├─ Tatoeba API             (Example sentences)            │
│  └─ Browser TTS             (Pronunciation)                │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Offline-First**: Full functionality without internet connection
- **Progressive Enhancement**: Works everywhere, optimized for modern browsers
- **Cloud Sync**: Seamless multi-device experience
- **Zero Data Loss**: Local queue with retry mechanisms

---

## Database Layer

### Dual Storage Architecture

Palabra uses **two complementary storage systems**:

#### 1. IndexedDB (Client-Side)
- **Purpose**: Local storage, offline capability, performance
- **Library**: `idb` (IndexedDB wrapper)
- **Location**: `lib/db/`
- **Capacity**: ~1GB+ per origin

#### 2. PostgreSQL (Cloud)
- **Purpose**: Multi-device sync, backup, multi-user support
- **ORM**: Prisma
- **Schema**: `lib/backend/prisma/schema.prisma`
- **Capacity**: Unlimited (hosting dependent)

---

### IndexedDB Schema

**Database Name:** `palabra-db`  
**Version:** 3  
**Location:** Browser local storage

#### Object Stores

```typescript
// 1. Vocabulary Store
{
  name: 'vocabulary',
  keyPath: 'id',
  indexes: [
    'by-status',      // Filter by learning status
    'by-created',     // Sort by creation date
    'by-word',        // Search by Spanish word
    'by-updated',     // Sort by last update
    'by-tags'         // Filter by custom tags
  ]
}

// 2. Reviews Store
{
  name: 'reviews',
  keyPath: 'id',
  indexes: [
    'by-vocab',       // Get reviews for vocabulary item
    'by-next-review'  // Find due cards
  ]
}

// 3. Sessions Store
{
  name: 'sessions',
  keyPath: 'id',
  indexes: [
    'by-start-time'   // Sort by session date
  ]
}

// 4. Stats Store
{
  name: 'stats',
  keyPath: 'date',
  indexes: [
    'by-date'         // Time-series queries
  ]
}

// 5. Settings Store (Phase 10+)
{
  name: 'settings',
  keyPath: 'key'      // Key-value store
}

// 6. Tags Store (Phase 9+)
{
  name: 'tags',
  keyPath: 'id',
  indexes: [
    'by-name'         // Tag lookup
  ]
}
```

**Implementation Files:**
- `lib/db/schema.ts` - Database initialization
- `lib/db/vocabulary.ts` - Vocabulary operations
- `lib/db/reviews.ts` - Review records
- `lib/db/sessions.ts` - Session tracking
- `lib/db/stats.ts` - Statistics aggregation
- `lib/db/settings.ts` - User preferences
- `lib/db/tags.ts` - Tag management

---

### PostgreSQL Schema (Prisma)

**Location:** `lib/backend/prisma/schema.prisma`

#### Core Tables

**1. Users Table**
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  vocabulary    Vocabulary[]
  reviews       Review[]
  sessions      Session[]
  stats         DailyStats[]
  devices       Device[]
  settings      UserSettings?
}
```

**2. Vocabulary Table**
```prisma
model Vocabulary {
  id               String   @id @default(cuid())
  userId           String
  word             String   // Spanish word
  translation      String   // English translation
  gender           String?  // masculine/feminine/neutral
  partOfSpeech     String?  // noun/verb/adjective/etc
  examples         Json?    // Array of example sentences
  notes            String?  // User notes
  audioUrl         String?  // Pronunciation audio
  imageUrl         String?  // Visual association
  
  // Metadata
  status           String   @default("new") // new/learning/mastered
  tags             String[] // Custom tags
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Sync metadata
  version          Int      @default(1)
  lastSyncedAt     DateTime?
  isDeleted        Boolean  @default(false)
  
  // Relations
  user             User     @relation(fields: [userId], references: [id])
  reviews          Review[]
  
  @@index([userId, isDeleted])
  @@index([userId, status])
  @@index([word])
}
```

**3. Reviews Table**
```prisma
model Review {
  id               String   @id @default(cuid())
  userId           String
  vocabularyId     String
  
  // SM-2 Algorithm fields
  easeFactor       Float    @default(2.5)
  interval         Int      @default(0)    // Days
  repetitions      Int      @default(0)
  nextReviewDate   DateTime
  lastReviewedAt   DateTime?
  
  // Advanced SR metadata (Phase 8+)
  advancedSRData   Json?    // Forgetting curve, optimal date, etc
  
  // Review mode tracking
  reviewMode       String?  // recognition/recall/listening
  reviewDirection  String?  // spanish-to-english/english-to-spanish
  
  // Performance metrics
  totalReviews     Int      @default(0)
  correctReviews   Int      @default(0)
  avgTimeToAnswer  Int?     // Milliseconds
  
  // Sync metadata
  version          Int      @default(1)
  lastSyncedAt     DateTime?
  isDeleted        Boolean  @default(false)
  
  // Relations
  user             User       @relation(fields: [userId], references: [id])
  vocabulary       Vocabulary @relation(fields: [vocabularyId], references: [id])
  
  @@unique([userId, vocabularyId])
  @@index([userId, nextReviewDate])
  @@index([vocabularyId])
}
```

**4. Session Table**
```prisma
model Session {
  id               String   @id @default(cuid())
  userId           String
  
  // Session data
  startTime        DateTime
  endTime          DateTime?
  cardsReviewed    Int      @default(0)
  correctAnswers   Int      @default(0)
  mode             String?  // recognition/recall/listening
  direction        String?  // spanish-to-english/english-to-spanish
  
  // Session config
  sessionSize      Int?
  statusFilter     String[]?
  tagFilter        String[]?
  
  // Sync metadata
  version          Int      @default(1)
  lastSyncedAt     DateTime?
  isDeleted        Boolean  @default(false)
  
  // Relations
  user             User     @relation(fields: [userId], references: [id])
  
  @@index([userId, startTime])
}
```

**5. DailyStats Table**
```prisma
model DailyStats {
  id               String   @id @default(cuid())
  userId           String
  date             String   // YYYY-MM-DD format
  
  // Daily metrics
  wordsAdded       Int      @default(0)
  cardsReviewed    Int      @default(0)
  correctReviews   Int      @default(0)
  timeSpent        Int      @default(0)  // Minutes
  newWords         Int      @default(0)
  learningWords    Int      @default(0)
  masteredWords    Int      @default(0)
  currentStreak    Int      @default(0)
  longestStreak    Int      @default(0)
  
  // Sync metadata
  version          Int      @default(1)
  lastSyncedAt     DateTime?
  
  // Relations
  user             User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, date])
  @@index([userId, date])
}
```

**6. Device Table**
```prisma
model Device {
  id               String   @id @default(cuid())
  userId           String
  deviceId         String   // Client-generated UUID
  deviceName       String?
  deviceType       String?  // mobile/desktop/tablet
  lastActiveAt     DateTime @default(now())
  
  // Relations
  user             User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, deviceId])
  @@index([userId])
}
```

**7. SyncLog Table**
```prisma
model SyncLog {
  id               String   @id @default(cuid())
  userId           String
  deviceId         String
  syncType         String   // full/incremental
  direction        String   // push/pull
  itemsSynced      Int
  conflicts        Int      @default(0)
  syncedAt         DateTime @default(now())
  success          Boolean  @default(true)
  errorMessage     String?
  
  @@index([userId, syncedAt])
}
```

**8. UserSettings Table**
```prisma
model UserSettings {
  id                      String   @id @default(cuid())
  userId                  String   @unique
  
  // Notification preferences (Phase 10)
  notificationsEnabled    Boolean  @default(true)
  reminderTime            String?  // "09:00"
  reminderDays            Int[]?   // [1,2,3,4,5] (Mon-Fri)
  quietHoursStart         String?
  quietHoursEnd           String?
  
  // Learning preferences
  dailyGoal               Int      @default(20)
  reviewMode              String?  // Default review mode
  autoPlayAudio           Boolean  @default(true)
  
  // Sync preferences
  autoSync                Boolean  @default(true)
  syncOnWifi              Boolean  @default(false)
  
  // Relations
  user                    User     @relation(fields: [userId], references: [id])
}
```

---

## API Endpoints

All API endpoints are Next.js Route Handlers located in `app/api/`.

### Authentication Endpoints

**Base Path:** `/api/auth`

#### POST /api/auth/signup
```typescript
// Register new user
Request: {
  email: string;
  password: string;
  name?: string;
}

Response: {
  success: true;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}
```

#### POST /api/auth/signin
```typescript
// Authenticate user
Request: {
  email: string;
  password: string;
}

Response: {
  success: true;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token: string; // JWT
}

// Sets HTTP-only cookie: authToken
```

#### POST /api/auth/signout
```typescript
// End user session
Response: {
  success: true;
}

// Clears authToken cookie
```

#### GET /api/auth/me
```typescript
// Get current authenticated user
Response: {
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}
```

**Implementation:** `app/api/auth/*`  
**Auth Utils:** `lib/backend/auth.ts`

---

### Sync Endpoints

**Base Path:** `/api/sync`

#### POST /api/sync/vocabulary
```typescript
// Sync vocabulary items
Request: {
  deviceId: string;
  lastSyncTime?: number;
  items: VocabularyWord[];  // Local changes to push
}

Response: {
  success: true;
  data: {
    serverItems: VocabularyWord[];  // Server changes to pull
    conflicts: ConflictItem[];
    lastSyncTime: number;
  };
}
```

#### POST /api/sync/reviews
```typescript
// Sync review records
Request: {
  deviceId: string;
  lastSyncTime?: number;
  items: ReviewRecord[];
}

Response: {
  success: true;
  data: {
    serverItems: ReviewRecord[];
    conflicts: ConflictItem[];
    lastSyncTime: number;
  };
}
```

#### POST /api/sync/stats
```typescript
// Sync daily statistics
Request: {
  deviceId: string;
  lastSyncTime?: number;
  items: DailyStats[];
}

Response: {
  success: true;
  data: {
    serverItems: DailyStats[];
    lastSyncTime: number;
  };
}
```

**Implementation:** `app/api/sync/*`  
**Sync Service:** `lib/services/sync.ts`

---

### Vocabulary Lookup Endpoint

**Base Path:** `/api/vocabulary`

#### POST /api/vocabulary/lookup
```typescript
// Fetch all data for a Spanish word
Request: {
  word: string;
}

Response: {
  word: string;
  translation: string;
  gender?: string;
  partOfSpeech?: string;
  examples?: {
    spanish: string;
    english: string;
  }[];
  audioAvailable: boolean;
}
```

**Implementation:** `app/api/vocabulary/lookup/route.ts`  
**Services Used:**
- `lib/services/translation.ts`
- `lib/services/dictionary.ts`
- `lib/services/audio.ts`

---

## Authentication System

### JWT-Based Authentication

**Token Generation:**
```typescript
// lib/backend/auth.ts
import { SignJWT } from 'jose';

export async function createToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET
  );
  
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);
}
```

**Token Verification:**
```typescript
export async function verifyToken(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET
    );
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}
```

### Session Management

**Cookie-Based Sessions:**
- Cookie name: `authToken`
- HttpOnly: `true`
- Secure: `true` (production)
- SameSite: `Lax`
- Max-Age: 7 days

**Middleware:**
```typescript
// lib/backend/api-utils.ts
export async function requireAuth(
  request: Request
): Promise<string> {
  const token = request.cookies.get('authToken');
  if (!token) throw new Error('Unauthorized');
  
  const userId = await verifyToken(token);
  if (!userId) throw new Error('Invalid token');
  
  return userId;
}
```

### Password Security

**Hashing:**
```typescript
// Uses Web Crypto API (crypto.subtle)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}
```

**Note:** Production should use bcrypt/argon2 for better security.

### Rate Limiting

**Implementation:**
- In-memory rate limiter
- 10 requests per minute per IP
- Applied to auth endpoints
- Returns 429 on exceed

---

## Synchronization Service

### CloudSyncService

**Location:** `lib/services/sync.ts` (600+ lines)

### Sync Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENT DEVICE                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │         Local IndexedDB                            │  │
│  │  - Vocabulary                                      │  │
│  │  - Reviews                                         │  │
│  │  - Stats                                           │  │
│  └────────────────────────────────────────────────────┘  │
│                          ↕                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │         CloudSyncService                           │  │
│  │  - Push local changes                              │  │
│  │  - Pull server changes                             │  │
│  │  - Conflict detection                              │  │
│  │  - Retry queue                                     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────────┐
│                   CLOUD SERVER                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │         PostgreSQL Database                        │  │
│  │  - Multi-user data                                 │  │
│  │  - Version tracking                                │  │
│  │  - Sync logs                                       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Sync Modes

**1. Incremental Sync (Default)**
```typescript
// Only sync changed items since last sync
const lastSyncTime = await getLastSyncTime();
const localChanges = await getItemsModifiedSince(lastSyncTime);
const serverChanges = await syncAPI.push(localChanges, lastSyncTime);
await mergeServerChanges(serverChanges);
```

**2. Full Sync**
```typescript
// Sync all items (initial sync, conflict resolution)
const allLocalItems = await getAllItems();
const allServerItems = await syncAPI.fullSync(allLocalItems);
await reconcileData(allLocalItems, allServerItems);
```

### Conflict Resolution

**Strategy: Last-Write-Wins (Timestamp-Based)**

```typescript
function resolveConflict(
  localItem: SyncItem,
  serverItem: SyncItem
): SyncItem {
  // Compare version numbers
  if (localItem.version > serverItem.version) {
    return localItem;  // Local is newer
  }
  
  if (serverItem.version > localItem.version) {
    return serverItem;  // Server is newer
  }
  
  // Same version, compare timestamps
  if (localItem.updatedAt > serverItem.updatedAt) {
    return localItem;
  }
  
  return serverItem;
}
```

**Conflict Types:**
- **Update-Update**: Both client and server modified → Newest wins
- **Update-Delete**: Item modified locally but deleted on server → Delete wins
- **Create-Create**: Same item created on multiple devices → Merge with version bump

### Sync Triggers

**Automatic Sync:**
- On app startup (initial sync)
- On network reconnection (background sync)
- After local mutations (debounced 5s)
- Periodic sync (every 5 minutes when active)

**Manual Sync:**
- User triggers via UI button
- Developer triggers via API

**Background Sync:**
- Service Worker sync event
- Runs even when app is closed (Chrome/Edge only)

### Sync State Management

```typescript
type SyncState = 
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'conflict';

interface SyncStatus {
  state: SyncState;
  lastSyncTime: number | null;
  error: string | null;
  pendingItems: number;
}
```

### Device Management

**Device ID Generation:**
```typescript
// lib/utils/pwa.ts
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
}
```

**Device Tracking:**
- Each device gets unique UUID
- Server tracks last active time per device
- Sync logs include device ID
- Future: Device management UI

---

## External API Integrations

### Translation Service

**Provider:** LibreTranslate (Free, Open Source)  
**Implementation:** `lib/services/translation.ts`

```typescript
export async function translateText(
  text: string,
  sourceLang: string = 'es',
  targetLang: string = 'en'
): Promise<TranslationResult> {
  const response = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text',
    }),
  });
  
  const data = await response.json();
  return {
    translatedText: data.translatedText,
    confidence: data.confidence || null,
  };
}
```

**Features:**
- Spanish ↔ English bidirectional
- No API key required (can add for premium instance)
- Fallback error handling
- Rate limiting awareness

**Alternative Providers:**
- Google Cloud Translation API (paid, high quality)
- DeepL API (paid, highest quality)
- Azure Translator (paid)

---

### Dictionary Service

**Providers:** Wiktionary API + Tatoeba API  
**Implementation:** `lib/services/dictionary.ts`

**Wiktionary API:**
```typescript
// Get word definitions, gender, part of speech
const wiktionaryUrl = `https://en.wiktionary.org/api/rest_v1/page/definition/${word}`;
```

**Tatoeba API:**
```typescript
// Get example sentences with translations
const tatoebaUrl = `https://tatoeba.org/en/api_v0/search?from=spa&to=eng&query=${word}`;
```

**Features:**
- Automatic gender detection (el/la/un/una)
- Part of speech classification
- Example sentences from native speakers
- Fallback example generation

---

### Audio/Pronunciation Service

**Provider:** Browser Web Speech API  
**Implementation:** `lib/services/audio.ts`

```typescript
export async function playPronunciation(text: string): Promise<void> {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';  // Spanish (Spain)
  utterance.rate = 0.9;      // Slightly slower for learning
  
  // Prefer Spanish voices
  const voices = speechSynthesis.getVoices();
  const spanishVoice = voices.find(v => v.lang.startsWith('es'));
  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }
  
  speechSynthesis.speak(utterance);
}
```

**Features:**
- No external API required
- Works offline
- Voice selection (prefers Spanish)
- Speed control

**Enhanced Audio (Phase 7+):**
- Multiple pronunciation sources
- Different accents (Spain vs Latin America)
- User recording capability
- Comparison with native speaker

**Alternative Providers:**
- Forvo API (native speaker recordings, paid)
- Google Cloud TTS (high quality, paid)
- Azure Speech Services (paid)
- ElevenLabs (AI voices, paid)

---

## Caching Strategy

### Multi-Layer Caching

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: TanStack Query (In-Memory)                    │
│  - 5 min stale time                                     │
│  - 10 min cache time                                    │
│  - Automatic invalidation                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: IndexedDB (Persistent)                        │
│  - Vocabulary data                                      │
│  - Review records                                       │
│  - Session history                                      │
│  - Statistics                                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: Service Worker Cache (PWA)                    │
│  - Static assets (JS, CSS)                              │
│  - Images and audio                                     │
│  - API responses (configurable)                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: PostgreSQL (Cloud)                            │
│  - Source of truth                                      │
│  - Multi-device sync                                    │
│  - Backup and recovery                                  │
└─────────────────────────────────────────────────────────┘
```

### Cache Strategies by Content Type

**Static Assets:**
- Strategy: Cache-First
- Max-Age: 1 year
- Versioned URLs for updates

**API Responses:**
- Strategy: Network-First with Cache Fallback
- Stale-While-Revalidate: 5 minutes
- Max-Age: 1 hour

**Images & Audio:**
- Strategy: Cache-First
- Max-Age: 30 days
- Lazy loading

**HTML Pages:**
- Strategy: Network-First
- Offline fallback page

### Cache Invalidation

**Automatic:**
- On mutations (TanStack Query)
- On sync completion
- On cache size limits
- On version updates

**Manual:**
- Clear cache button (settings)
- Force refresh (pull-to-refresh)
- Developer tools

---

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/palabra"

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://your-domain.com"  # Or http://localhost:3000

# Optional: External API Keys
LIBRETRANSLATE_API_KEY=""  # If using premium instance
FORVO_API_KEY=""           # If using Forvo for audio
GOOGLE_TRANSLATE_API_KEY="" # If using Google Translate

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=""

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_SYNC="true"
NEXT_PUBLIC_ENABLE_PWA="true"
```

### Configuration Files

**Development:** `.env.local`
```bash
DATABASE_URL="postgresql://localhost:5432/palabra_dev"
NEXTAUTH_SECRET="dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

**Production:** Set via hosting platform
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Self-hosted: `.env.production`

### Prisma Configuration

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (development)
npm run prisma:push

# Create migration (production)
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

---

## Deployment Architecture

### Recommended Stack

**Hosting:** Vercel (or Netlify)
- Automatic deployments from Git
- Serverless API routes
- Global CDN
- Automatic HTTPS

**Database:** Vercel Postgres (or Supabase)
- PostgreSQL compatible
- Automatic backups
- Connection pooling
- SSL/TLS encryption

**Assets:** Vercel CDN (or Cloudflare)
- Global edge network
- Image optimization
- Automatic compression

### Deployment Flow

```
Developer Push to GitHub
         ↓
Vercel Detects Change
         ↓
Run Build Process
  - npm install
  - npm run prisma:generate
  - npm run build
         ↓
Deploy to Edge Network
         ↓
Run Database Migrations
         ↓
Verify Health Checks
         ↓
Production Live! 🎉
```

### Database Deployment

**Initial Setup:**
```bash
# 1. Create database (Vercel Postgres)
vercel postgres create

# 2. Link database to project
vercel env pull

# 3. Push schema
npm run prisma:push

# 4. Verify
npm run prisma:studio
```

**Production Migrations:**
```bash
# 1. Create migration
npx prisma migrate dev --name add_feature

# 2. Commit migration files
git add prisma/migrations
git commit -m "Add feature migration"

# 3. Deploy (runs migrations automatically)
git push origin main
```

### Performance Optimizations

**Database:**
- Connection pooling (Prisma)
- Indexes on frequent queries
- Query optimization
- Read replicas (future)

**API:**
- Edge functions (serverless)
- Response compression
- Rate limiting
- CDN caching

**Frontend:**
- Code splitting
- Lazy loading
- Image optimization
- Service Worker caching

---

## Evolution History

### Phase 1: Foundation (Jan 2026)
**Storage:** IndexedDB only  
**Scope:** Local-only application  
**Stores:** vocabulary, reviews, sessions, stats

```typescript
// Pure client-side storage
const db = await openDB('palabra-db', 1, {
  upgrade(db) {
    db.createObjectStore('vocabulary', { keyPath: 'id' });
    // ...
  }
});
```

### Phase 2: API Integrations (Jan 2026)
**Added:** External API proxy routes  
**Purpose:** Translation, dictionary, pronunciation  
**Architecture:** Serverless Next.js API routes

```typescript
// app/api/vocabulary/lookup/route.ts
export async function POST(request: Request) {
  const { word } = await request.json();
  
  // Fetch from multiple APIs
  const translation = await translateText(word);
  const definition = await fetchDefinition(word);
  const examples = await fetchExamples(word);
  
  return Response.json({ translation, definition, examples });
}
```

### Phase 8: Advanced Learning (Jan 2026)
**Added:** Advanced spaced repetition, multiple review modes  
**Architecture:** Enhanced client-side algorithms  
**Storage:** Extended IndexedDB schema with SR metadata

### Phase 10: Notifications (Jan 2026)
**Added:** Push notifications, PWA capabilities  
**Architecture:** Service Worker, Notification API  
**Storage:** Settings store in IndexedDB

### Phase 12: Cloud Sync (Jan 2026) 🚀
**Added:** Full backend infrastructure  
**Breaking Change:** Hybrid local + cloud architecture  
**Components:**
- PostgreSQL database (Prisma)
- JWT authentication
- RESTful sync API
- Conflict resolution
- Device management
- Background sync

```typescript
// Before (Phase 1-11): Local only
await db.vocabulary.add(word);

// After (Phase 12): Local + Cloud
await db.vocabulary.add(word);
await syncService.sync();  // Automatic background sync
```

### Migration Path (Phase 11 → 12)

**Zero Disruption:**
- Existing users continue working (local-first)
- Optional account creation for sync
- Automatic data migration on first sync
- No data loss

**First Sync:**
```typescript
// 1. User creates account
await authService.signUp(email, password);

// 2. Automatic full sync triggered
const localData = await getAllLocalData();
await syncService.fullSync(localData);

// 3. All local data now in cloud
// 4. Multi-device access enabled
```

---

## Monitoring & Observability

### Logging

**Server-Side Logs:**
```typescript
// lib/backend/api-utils.ts
export function logSync(userId: string, type: string, items: number) {
  console.log({
    timestamp: new Date().toISOString(),
    userId,
    event: 'sync',
    type,
    items,
  });
}
```

**Client-Side Logs:**
```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('[Sync]', 'Syncing vocabulary...', items.length);
}
```

### Health Checks

**Database:**
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    return Response.json({ status: 'unhealthy', database: 'disconnected' }, 
      { status: 503 }
    );
  }
}
```

### Analytics (Optional)

**Recommended Tools:**
- Vercel Analytics (built-in)
- PostHog (open-source)
- Google Analytics
- Plausible (privacy-focused)

**Key Metrics:**
- User sign-ups
- Daily active users
- Vocabulary added per user
- Review completion rate
- Sync success rate
- API response times

---

## Security Considerations

### Data Security

**In Transit:**
- HTTPS everywhere (TLS 1.3)
- Secure cookies (HttpOnly, Secure, SameSite)
- API endpoint authentication

**At Rest:**
- Password hashing (crypto.subtle, upgrade to bcrypt)
- Encrypted database connection
- Secure environment variables

**Client-Side:**
- IndexedDB (browser sandbox)
- No sensitive data in localStorage
- JWT tokens in HttpOnly cookies

### API Security

**Rate Limiting:**
- 10 requests/minute for auth endpoints
- 100 requests/minute for sync endpoints
- Per-user and per-IP tracking

**Input Validation:**
- Zod schemas for all inputs
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React automatic escaping)

**Authorization:**
- JWT token validation on every request
- User ownership verification
- Row-level security (Prisma filters)

### Best Practices

**Production Checklist:**
- [ ] Use bcrypt/argon2 for password hashing
- [ ] Enable CORS with specific origins
- [ ] Set up rate limiting
- [ ] Add request logging
- [ ] Monitor error rates
- [ ] Set up backup strategy
- [ ] Use environment secrets (not committed)
- [ ] Enable database SSL
- [ ] Set secure CSP headers
- [ ] Regular security audits

---

## Future Enhancements

### Short-Term (Next 3-6 months)

**Enhanced Authentication:**
- OAuth providers (Google, GitHub)
- Email verification
- Password reset flow
- Two-factor authentication

**Improved Sync:**
- Compression (gzip)
- Pagination for large datasets
- Real-time sync (WebSockets)
- Manual conflict resolution UI

**Performance:**
- Database query optimization
- CDN for audio files
- Image compression pipeline
- Lazy loading improvements

### Long-Term (6-12 months)

**Scalability:**
- Horizontal scaling
- Read replicas
- Caching layer (Redis)
- Message queue (for background jobs)

**Features:**
- Social features (shared lists)
- Collaboration (study groups)
- Advanced analytics
- AI-powered features

**Infrastructure:**
- Kubernetes deployment
- Microservices architecture
- GraphQL API (alternative to REST)
- Edge computing optimizations

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Verify Prisma client
npm run prisma:generate
```

**2. Sync Failing**
```typescript
// Check auth token
const user = await fetch('/api/auth/me');
console.log(await user.json());

// Check sync service
const syncStatus = syncService.getStatus();
console.log(syncStatus);

// Manual sync
await syncService.sync({ force: true });
```

**3. IndexedDB Quota Exceeded**
```typescript
// Check storage usage
const estimate = await navigator.storage.estimate();
console.log(`Used: ${estimate.usage}, Quota: ${estimate.quota}`);

// Request persistent storage
await navigator.storage.persist();
```

**4. Service Worker Not Updating**
```javascript
// Force update
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update());
});

// Unregister (development only)
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
```

---

## Support & Resources

### Documentation
- **Phase Documents:** See PHASE*_COMPLETE.md files
- **API Reference:** See inline code comments
- **Database Schema:** `lib/backend/prisma/schema.prisma`
- **Deployment Guide:** `DEPLOYMENT.md`

### External Resources
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **IndexedDB:** https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **TanStack Query:** https://tanstack.com/query/latest

### Getting Help
1. Check phase documentation
2. Review inline code comments
3. Search GitHub issues
4. Check troubleshooting section
5. Review external docs

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-13 | 1.0 | Initial backend infrastructure documentation |
| 2026-01-12 | Phase 12 | PostgreSQL backend, cloud sync, enhanced PWA |
| 2026-01-12 | Phase 11 | Enhanced analytics, streak tracking |
| 2026-01-12 | Phase 10 | Push notifications, PWA features |
| 2026-01-12 | Phase 9 | Tags, bulk operations, import/export |
| 2026-01-12 | Phase 8 | Advanced SR, multiple review modes |
| 2026-01-12 | Phase 7 | Enhanced vocabulary features |
| 2026-01-12 | Phase 2 | External API integrations |
| 2026-01-12 | Phase 1 | IndexedDB foundation |

---

## License

[Your License Here]

---

**Last Updated:** January 13, 2026  
**Maintainer:** Palabra Development Team  
**Status:** ✅ Production Ready

---

*This document serves as the single source of truth for all backend infrastructure in the Palabra application. All phase documents should reference this document for backend architecture details.*

