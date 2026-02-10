# Database Migration Guide
**Phase 18.2 - Tasks 18.2.2 & 18.2.3**

**Date:** February 10, 2026  
**Status:** Ready for Migration

---

## 📋 **Quick Start**

### **Step 1: Verify Environment**
```bash
# Check .env.local has DATABASE_URL
cat .env.local | grep DATABASE_URL
```

Expected output:
```
DATABASE_URL=postgresql://...
```

### **Step 2: Run Migration**
```bash
# Push schema changes to database
npx prisma db push --schema=lib/backend/prisma/schema.prisma
```

### **Step 3: Open Prisma Studio**
```bash
# Verify tables were created
npx prisma studio --schema=lib/backend/prisma/schema.prisma
```

Look for:
- ✅ `ElaborativePromptCache` table
- ✅ `ElaborativeResponse` table

---

## 🗄️ **Schema Changes**

### **New Tables (2)**

#### **1. ElaborativePromptCache**
Caches AI-generated elaborative prompts for cost optimization.

**Fields:**
- `id` - Primary key
- `word` - Spanish word
- `level` - CEFR level (A1-C2)
- `promptType` - Type of prompt (etymology, connection, usage, comparison, personal)
- `question` - The elaborative question
- `hints` - Optional hints (JSONB array)
- `idealAnswer` - Optional ideal answer
- `useCount` - How many times this prompt was used
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- Unique on `(word, level)`
- Index on `word`
- Index on `level`
- Index on `useCount`

#### **2. ElaborativeResponse**
Tracks user engagement with deep learning prompts.

**Fields:**
- `id` - Primary key
- `userId` - Foreign key to User
- `wordId` - Vocabulary word ID
- `promptType` - Type of prompt shown
- `question` - The question asked
- `userResponse` - User's response (null if skipped)
- `skipped` - Boolean (true if auto-skipped)
- `responseTime` - Milliseconds taken
- `createdAt` - Timestamp

**Indexes:**
- Index on `userId`
- Index on `wordId`
- Index on `skipped`
- Index on `createdAt`

**Foreign Keys:**
- `userId` → `User.id` (CASCADE delete)

---

## 🔧 **Migration Commands**

### **Development (Recommended)**
```bash
npx prisma db push --schema=lib/backend/prisma/schema.prisma
```

**What it does:**
- ✅ Creates new tables
- ✅ Adds indexes
- ✅ Updates foreign keys
- ⚠️ No migration file created (good for dev)

### **Production (Recommended for Deployment)**
```bash
npx prisma migrate dev \
  --name add_deep_learning_and_ab_testing \
  --schema=lib/backend/prisma/schema.prisma
```

**What it does:**
- ✅ Creates migration file in `prisma/migrations/`
- ✅ Applies migration to database
- ✅ Generates Prisma client
- ✅ Version controlled (can rollback)

---

## ✅ **Verification Steps**

### **1. Check Tables Exist**
```bash
npx prisma studio --schema=lib/backend/prisma/schema.prisma
```

Navigate to:
- `ElaborativePromptCache` table
- `ElaborativeResponse` table

### **2. Test Insert**
```sql
-- In Prisma Studio or psql
INSERT INTO "ElaborativePromptCache" (
  id, word, level, "promptType", question, "useCount"
) VALUES (
  'test-1', 
  'perro', 
  'B1', 
  'connection', 
  'How might you remember that "perro" means "dog"?',
  1
);
```

### **3. Test API Endpoint**
```bash
# Start dev server
npm run dev

# Test feature flags (guest user)
curl http://localhost:3000/api/user/feature-flags
```

Expected response:
```json
{
  "flags": {
    "aiExamples": true,
    "retrievalVariation": true,
    "interleavedPractice": true,
    "interferenceDetection": true,
    "deepLearningMode": false
  },
  "isGuest": true
}
```

---

## 🚨 **Troubleshooting**

### **Error: Environment variable not found: DATABASE_URL**

**Solution 1: Check .env.local**
```bash
cat .env.local | grep DATABASE_URL
```

If missing, add:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

**Solution 2: Export manually**
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
npx prisma db push --schema=lib/backend/prisma/schema.prisma
```

### **Error: Can't reach database server**

**Check PostgreSQL is running:**
```bash
# macOS
brew services list | grep postgresql

# Start if not running
brew services start postgresql
```

**Check connection:**
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### **Error: P3005 - Database schema is not empty**

This is normal! It means you have existing tables.

**Solution:**
```bash
# Use db push (safe for development)
npx prisma db push --schema=lib/backend/prisma/schema.prisma

# OR create migration (for production)
npx prisma migrate dev --name add_deep_learning --schema=lib/backend/prisma/schema.prisma
```

---

## 📊 **After Migration**

### **Expected Database State**

**Total Tables:** 20+ (including new tables)
- ✅ `ElaborativePromptCache` (NEW)
- ✅ `ElaborativeResponse` (NEW)
- ✅ `ConfusionPair` (from Task 18.2.1)
- ✅ `User`, `VocabularyItem`, `ReviewAttempt`, etc. (existing)

**Total Indexes:** 50+ (including new indexes)
- ✅ 4 indexes on `ElaborativePromptCache`
- ✅ 4 indexes on `ElaborativeResponse`

**Foreign Keys:**
- ✅ `ElaborativeResponse.userId` → `User.id`

### **Next Steps**

1. **Test Deep Learning Mode:**
   ```bash
   # Navigate to /settings
   # Enable "Deep Learning Mode"
   # Set frequency to "Every 12 cards"
   # Start review session
   # After 12 cards, should see deep learning prompt
   ```

2. **Test A/B Testing:**
   ```bash
   # Sign up as new user
   # Check UserCohort table in Prisma Studio
   # Should see experimentGroup assigned
   # Should see featureFlags populated
   ```

3. **Test Admin Dashboard:**
   ```bash
   # Set ADMIN_EMAIL in .env.local
   ADMIN_EMAIL=your-email@example.com
   
   # Navigate to /admin/ab-tests
   # Should see A/B test dashboard
   # Should see "No Active Tests" (since all tests have active: false)
   ```

---

## 🎯 **Testing Checklist**

- [ ] Database migration successful
- [ ] `ElaborativePromptCache` table exists
- [ ] `ElaborativeResponse` table exists
- [ ] All indexes created
- [ ] Foreign keys working
- [ ] Prisma Studio shows new tables
- [ ] Feature flags API returns correct data
- [ ] Deep learning settings toggle works
- [ ] Admin dashboard loads (after setting ADMIN_EMAIL)
- [ ] No console errors in dev server

---

## 📝 **Rollback (If Needed)**

### **Development (db push)**
```bash
# Manually drop tables
npx prisma studio --schema=lib/backend/prisma/schema.prisma
# Delete ElaborativePromptCache and ElaborativeResponse tables manually
```

### **Production (migrate)**
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back MIGRATION_NAME --schema=lib/backend/prisma/schema.prisma

# Apply previous migration
npx prisma migrate deploy --schema=lib/backend/prisma/schema.prisma
```

---

## 📚 **Additional Resources**

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma DB Push Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate/db-push)
- [PHASE18.2_VERIFICATION_SUMMARY.md](./PHASE18.2_VERIFICATION_SUMMARY.md) - Full test results
- [PHASE18.2.2_COMPLETE.md](./PHASE18.2.2_COMPLETE.md) - Deep Learning Mode details
- [PHASE18.2.3_COMPLETE.md](./PHASE18.2.3_COMPLETE.md) - A/B Testing Framework details

---

## 🏁 **Summary**

**What to Run:**
```bash
# 1. Migration
npx prisma db push --schema=lib/backend/prisma/schema.prisma

# 2. Verify
npx prisma studio --schema=lib/backend/prisma/schema.prisma

# 3. Test
npm run dev
curl http://localhost:3000/api/user/feature-flags
```

**Expected Outcome:**
- ✅ 2 new tables created
- ✅ 8 new indexes created
- ✅ 1 new foreign key created
- ✅ API endpoints working
- ✅ Ready for Phase 18.2.4

---

**Migration Prepared By:** AI Assistant  
**Date:** February 10, 2026  
**Schema Version:** Phase 18.2 (Tasks 18.2.2 & 18.2.3)
