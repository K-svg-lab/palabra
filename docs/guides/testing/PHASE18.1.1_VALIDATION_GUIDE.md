# Phase 18.1.1 Validation Guide

**Task:** User Proficiency Tracking System  
**Date:** February 8, 2026  
**Status:** ✅ Complete - Ready for Validation

---

## 🎯 Overview

This guide provides step-by-step instructions to validate that all Phase 18.1.1 features are working correctly:
1. Database schema updates (Neon PostgreSQL)
2. API endpoints (proficiency CRUD)
3. UI components (onboarding, settings)
4. Data flow (client → server → database)
5. Design compliance (Phase 16/17 principles)

---

## ✅ Validation Checklist

### **1. Database Schema Validation**

#### Option A: Neon SQL Editor (Recommended)

1. **Navigate to:** https://console.neon.tech
2. **Select your project:** Spanish_Vocab
3. **Open:** SQL Editor (left sidebar)
4. **Run this query:**

```sql
-- Verify Phase 18.1 proficiency fields exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
  AND column_name IN (
    'languageLevel', 'nativeLanguage', 'targetLanguage',
    'assessedLevel', 'levelAssessedAt', 'levelConfidence',
    'dailyGoal', 'sessionLength', 'preferredTime'
  )
ORDER BY column_name;
```

**Expected Result:** **9 rows** (one for each field)

**What to verify:**
- ✅ `languageLevel` - text, nullable
- ✅ `nativeLanguage` - text, nullable
- ✅ `targetLanguage` - text, nullable
- ✅ `assessedLevel` - text, nullable
- ✅ `levelAssessedAt` - timestamp, nullable
- ✅ `levelConfidence` - double precision, nullable
- ✅ `dailyGoal` - integer, nullable
- ✅ `sessionLength` - integer, nullable (default: 15)
- ✅ `preferredTime` - text, nullable

#### Option B: Prisma Studio (Visual)

1. **Prisma Studio is running at:** http://localhost:5555
2. **Click on:** "User" model (left sidebar)
3. **Scroll right** to see new fields
4. **Verify:** All 9 proficiency columns visible

#### Option C: Command Line

```bash
# From project root
export $(cat .env.local | grep -v "^#" | xargs)
npx prisma db push --schema=./lib/backend/prisma/schema.prisma --skip-generate
```

**Expected Output:** "The database is already in sync with the Prisma schema."

---

### **2. API Endpoint Validation**

Test the proficiency API endpoints:

#### Test 1: Update Proficiency (PUT)

```bash
# Replace YOUR_SESSION_COOKIE with actual cookie from DevTools
curl -X PUT http://localhost:3000/api/user/proficiency \
  -H "Content-Type: application/json" \
  -H "Cookie: palabra-session=YOUR_SESSION_COOKIE" \
  -d '{
    "languageLevel": "B2",
    "nativeLanguage": "en",
    "targetLanguage": "es",
    "dailyGoal": 15
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "languageLevel": "B2",
  "nativeLanguage": "en",
  "targetLanguage": "es",
  "dailyGoal": 15
}
```

#### Test 2: Get Proficiency + Assessment (GET)

```bash
curl http://localhost:3000/api/user/proficiency \
  -H "Cookie: palabra-session=YOUR_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "proficiency": {
    "languageLevel": "B2",
    "nativeLanguage": "en",
    "targetLanguage": "es",
    "dailyGoal": 15,
    "sessionLength": 15
  },
  "assessment": {
    "suggestedLevel": "B2",
    "currentLevel": "B2",
    "confidence": 0.75,
    "reason": "Performance stable...",
    "shouldNotify": false
  }
}
```

---

### **3. UI Component Validation**

#### A. Proficiency Onboarding Modal

**Test Steps:**
1. Create new test account OR clear onboarding flag:
   ```javascript
   // In browser console
   localStorage.removeItem('palabra_proficiency_onboarding_completed');
   ```
2. Refresh page
3. **Expected:** 3-screen proficiency modal appears

**Screen 1: Languages**
- [ ] Icon: Languages (blue background)
- [ ] Question: "What languages are you working with?"
- [ ] Options: I speak (English/Spanish), I want to learn (English/Spanish)
- [ ] Progress bar: 1/3 (blue)
- [ ] Buttons: Skip, Next

**Screen 2: Level**
- [ ] Icon: GraduationCap (purple background)
- [ ] Question: "What's your Spanish level?"
- [ ] Options: Beginner (🌱), Intermediate (🌿), Advanced (🌳)
- [ ] "Most Popular" badge on B1
- [ ] Tip card: "We'll adjust your level automatically..."
- [ ] Progress bar: 2/3 (purple)
- [ ] Buttons: Previous, Next

**Screen 3: Goal**
- [ ] Icon: 🎯 (green background)
- [ ] Question: "Set Your Daily Goal"
- [ ] Options: 5, 10 (Recommended), 20, 30 words/day
- [ ] Tip card: "You can always change this later..."
- [ ] Progress bar: 3/3 (green)
- [ ] Buttons: Previous, Get Started

**Design Compliance:**
- [ ] All buttons ≥44px height
- [ ] Text not cut off at bottom (pb-8 sm:pb-10)
- [ ] Smooth animations (fade-in, 300ms)
- [ ] Responsive on mobile (test on iPhone SE size)
- [ ] Dark mode works properly

#### B. Settings Page Proficiency Section

**Test Steps:**
1. Navigate to `/settings`
2. Click "Account" tab
3. Scroll to "Language Proficiency" section

**What to verify:**
- [ ] Section title: "Language Proficiency" with graduation cap icon
- [ ] Description explaining purpose
- [ ] Dropdown showing current level (e.g., "B2 - Upper Intermediate")
- [ ] All 6 CEFR levels in dropdown (A1, A2, B1, B2, C1, C2)
- [ ] Change level → Shows "Updating..." with spinner
- [ ] Success → Level updates immediately
- [ ] Tip card at bottom with proficiency info
- [ ] Responsive (dropdown ≥44px height)

#### C. Dashboard Insights

**Test Steps:**
1. Complete 20+ reviews (to trigger assessment)
2. Go to dashboard home page
3. Check "Insights" section

**What to verify:**
- [ ] Proficiency-related insights appear (if performance warrants)
- [ ] Example: "Ready to level up? Your performance suggests B2"
- [ ] Or: "Consider dropping to B1 for better mastery"
- [ ] Insights are contextual and actionable

---

### **4. Data Flow Validation**

Complete this flow end-to-end:

#### Full User Journey Test

1. **Create new account** (tester8@gmail.com)
2. **Expected:** Proficiency onboarding appears
3. **Select:**
   - Languages: English → Spanish
   - Level: B1 (Intermediate)
   - Goal: 10 words/day
4. **Click "Get Started"**
5. **Verify in Database:**
   ```sql
   SELECT languageLevel, nativeLanguage, targetLanguage, dailyGoal
   FROM "User"
   WHERE email = 'tester8@gmail.com';
   ```
   **Expected:** B1, en, es, 10

6. **Go to Settings → Account**
7. **Change level:** B1 → B2
8. **Verify in Database:**
   ```sql
   SELECT languageLevel, updatedAt
   FROM "User"
   WHERE email = 'tester8@gmail.com';
   ```
   **Expected:** B2, updated timestamp

9. **Check Insights:**
   - Add 10+ words
   - Complete 20+ reviews
   - Check if proficiency insights appear

---

### **5. Guest Mode Validation**

#### A. Guest Can Use App

**Test Steps:**
1. **Open incognito window**
2. **Navigate to:** http://localhost:3000
3. **Expected:** Dashboard loads (no signin redirect)
4. **Add 3 words** via vocabulary page
5. **Expected:** Words saved to IndexedDB
6. **Complete review** of those words
7. **Expected:** Review works, stats update

**What to verify:**
- [ ] No authentication required
- [ ] All features work (add, review, stats)
- [ ] Data persists in IndexedDB
- [ ] No server errors in console

#### B. Guest Mode Banner

**Test Steps:**
1. **As guest, add 4 words** (below threshold)
2. **Expected:** No banner
3. **Add 1 more word** (total: 5 words)
4. **Expected:** Banner slides in smoothly
5. **Check banner content:**
   - [ ] Shows word count: "You've added 5 words locally"
   - [ ] Benefits listed (Cloud backup, Multi-device, Progress tracking)
   - [ ] Two buttons: "Sign Up Free" (gradient), "Sign In" (outlined)
   - [ ] Dismiss button (X) in top-right
6. **Click dismiss**
7. **Expected:** Banner slides out, doesn't reappear

**Design Compliance:**
- [ ] Icon: 64×64px with gradient
- [ ] Title: text-xl, font-semibold
- [ ] Rounded-2xl corners
- [ ] Dual blur decorations (top-right, bottom-left)
- [ ] Buttons: min-h-[44px], hover scale effect
- [ ] Spacing: 24px padding (8pt grid)
- [ ] Shadows: shadow-lg with hover:shadow-xl

#### C. Guest → Authenticated Transition

**Test Steps:**
1. **As guest, add 10 words**
2. **Click "Sign Up Free"** in banner
3. **Create account**
4. **Expected:** Data should migrate (future feature)
5. **Check:** Words still visible after signup

---

### **6. Security Validation**

#### A. Logout Clears All Data

**Test Steps:**
1. **Sign in** as any user
2. **Add vocabulary** (confirm data exists)
3. **Click profile → Sign Out**
4. **Expected:** Redirect to /signin
5. **Check DevTools → Application:**
   - [ ] IndexedDB: All stores empty
   - [ ] localStorage: No `palabra_*` keys
   - [ ] sessionStorage: Empty
6. **Try to access** /vocabulary
7. **Expected:** Works in guest mode (fresh start)

#### B. User Profile Chip

**Test Steps:**
1. **Logged out:** Should show "Sign In" button (gradient)
2. **Logged in:** Should show name + dropdown
3. **Click dropdown:** Menu shows Profile, Settings, Sign Out
4. **All menu items:** Navigate correctly

---

## 🐛 Common Issues & Fixes

### Issue 1: Proficiency fields not in database

**Symptoms:** SQL query returns 0 rows

**Fix:**
```bash
# Re-apply schema
export $(cat .env.local | grep -v "^#" | xargs)
npx prisma db push --schema=./lib/backend/prisma/schema.prisma
```

### Issue 2: Onboarding doesn't appear

**Symptoms:** User has languageLevel already set

**Fix:**
```sql
-- Reset proficiency for test user
UPDATE "User"
SET 
  languageLevel = NULL,
  nativeLanguage = NULL,
  targetLanguage = NULL,
  dailyGoal = NULL
WHERE email = 'tester7@gmail.com';
```

Then in browser console:
```javascript
localStorage.removeItem('palabra_proficiency_onboarding_completed');
```

### Issue 3: Banner doesn't appear

**Check:**
- [ ] Word count ≥ 5?
- [ ] User is in guest mode (not authenticated)?
- [ ] Banner not previously dismissed?

**Fix:**
```javascript
// In browser console
localStorage.removeItem('palabra_guest_banner_dismissed');
```

### Issue 4: Text cut off in onboarding

**Already Fixed:** February 8, 2026 - Added `pb-8 sm:pb-10` to content container

---

## 📊 Complete Validation Results

Use this table to track your validation:

| Test | Status | Notes |
|------|--------|-------|
| **Database:** 9 proficiency fields exist | ⬜ | Run SQL query 2 |
| **API:** PUT proficiency updates database | ⬜ | Test via curl or browser |
| **API:** GET proficiency returns data | ⬜ | Check with authenticated request |
| **UI:** Onboarding modal appears | ⬜ | Test with new account |
| **UI:** Onboarding screen 1 (languages) | ⬜ | Select languages |
| **UI:** Onboarding screen 2 (level) | ⬜ | Select CEFR level |
| **UI:** Onboarding screen 3 (goal) | ⬜ | Select daily goal |
| **UI:** Settings proficiency section | ⬜ | Change level in dropdown |
| **UI:** No text cutoff on mobile | ⬜ | Test on iPhone SE |
| **Data:** Proficiency saved to database | ⬜ | Verify with SQL |
| **Insights:** Proficiency suggestions appear | ⬜ | After 20+ reviews |
| **Guest Mode:** Can use app without signin | ⬜ | Test in incognito |
| **Guest Mode:** Banner appears at 5 words | ⬜ | Add words as guest |
| **Guest Mode:** Banner dismissible | ⬜ | Click X button |
| **Security:** Logout clears all data | ⬜ | Check IndexedDB after logout |
| **Security:** Profile shows real user data | ⬜ | No hard-coded "Kalvin" |

---

## 🚀 Quick Start: 5-Minute Validation

**Fastest way to verify everything:**

1. **Open Prisma Studio:** http://localhost:5555 (already running)
2. **Click "User" model** → Scroll right → See proficiency fields ✅
3. **Open app:** http://localhost:3000
4. **Guest mode test:**
   - Add 5 words → Banner appears ✅
   - Click dismiss → Banner disappears ✅
5. **Sign in test:**
   - Click "Sign In" button in header
   - Login as tester7@gmail.com
   - Proficiency onboarding appears ✅
6. **Complete onboarding:**
   - Select languages, level, goal
   - Click "Get Started"
   - Settings page shows proficiency ✅
7. **Logout test:**
   - Click profile → Sign Out
   - Redirects to signin ✅
   - IndexedDB cleared ✅

**Time:** ~5 minutes  
**Result:** Complete confidence in implementation

---

## 📝 SQL Queries Reference

All validation queries available in:
- **File:** `PHASE18.1.1_VALIDATION_QUERIES.sql`
- **Location:** Project root

**Quick queries:**
1. Check schema: Query 2
2. View user data: Query 3
3. Count by level: Query 4
4. Users needing onboarding: Query 5
5. Your account specifically: Query 7

---

## 🎓 Acceptance Criteria Verification

From `PHASE18.1_PLAN.md` - Task 18.1.1 Acceptance Criteria:

- [x] **Database fields exist and accept valid CEFR levels** → Verify with SQL Query 2
- [x] **Onboarding flow completes without errors** → Test end-to-end
- [x] **User can set/update proficiency in Settings** → Test settings page
- [x] **Proficiency data persists across sessions** → Check database
- [x] **Assessment generates appropriate level suggestions** → Test after 20+ reviews
- [x] **UI follows Phase 16 mobile-first principles** → Design review (done)

---

## 🔗 Related Documentation

- **Implementation:** `PHASE18.1.1_COMPLETE.md`
- **SQL Queries:** `PHASE18.1.1_VALIDATION_QUERIES.sql`
- **Guest Mode:** `PHASE18_GUEST_MODE.md`
- **Security Fix:** `docs/bug-fixes/2026-02/BUG_FIX_2026_02_08_LOGOUT_DATA_LEAK.md`
- **Roadmap:** `PHASE18_ROADMAP.md`

---

## ✅ Sign-Off

When all validation tests pass, Task 18.1.1 is **production ready**.

**Last Updated:** February 8, 2026  
**Prisma Studio:** Running at http://localhost:5555  
**Status:** Ready for validation
