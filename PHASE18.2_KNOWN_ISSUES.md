# Phase 18.2 Known Issues
**Advanced Learning Features - Bug Tracking**

**Last Updated:** February 10, 2026, 19:45 PST

---

## 🐛 **Resolved Issues**

### **Issue #1: Sync Service TypeError - Undefined Length** ✅ FIXED
**Date Reported:** February 10, 2026  
**Date Fixed:** February 10, 2026  
**Severity:** 🔴 CRITICAL  
**Status:** ✅ RESOLVED

**Summary:**  
After deploying Phase 18.2, the app showed infinite "Loading..." preventing content from rendering.

**Error Message:**
```
[Sync] Error: TypeError: Cannot read properties of undefined (reading 'length')
```

**Root Cause:**  
`lib/services/sync.ts` lines 489-492 accessed `.length` on potentially undefined API response properties without optional chaining.

**Fix:**
```typescript
// File: lib/services/sync.ts (lines 489-492)
downloaded: (vocabResult.operations?.length || 0) + (reviewsResult.reviews?.length || 0) + (statsResult.stats?.length || 0),
conflicts: vocabResult.conflicts?.length || 0,
conflictDetails: vocabResult.conflicts || [],
```

**Files Modified:**
- `lib/services/sync.ts` (3 lines)

**Full Documentation:**  
📄 `docs/bug-fixes/2026-02/BUG_FIX_2026_02_10_PHASE18.2_SYNC_UNDEFINED_LENGTH.md`

**Impact:**
- Before: App completely broken (100% loading failure)
- After: App loads normally in 3-5 seconds

---

### **Safeguard: Auth check timeout** ✅ ADDED (Feb 10, 2026)

**Purpose:** Prevent endless "Loading..." if `/api/auth/me` ever hangs.

**Change:** Home page and dashboard layout now use an 8-second timeout (AbortController) when calling `/api/auth/me`. If the request doesn’t complete in time, the app treats the user as a guest and continues loading.

**Files:** `app/(dashboard)/page.tsx`, `app/(dashboard)/layout.tsx`

---

### **Issue #2: Localhost login – credentials rejected** ✅ FIXED (Feb 10, 2026)

**Summary:**  
Login worked on the deployed site but localhost:3000 returned "Invalid email or password" for the same credentials.

**Root causes:**
1. **Different database** – Local `DATABASE_URL` pointed to a different DB (user exists only in production). Fix: use production `DATABASE_URL` in `.env.local`.
2. **Email casing** – Lookup was case-sensitive. Fix: sign-in normalizes email (lowercase) and falls back to original; sign-up stores normalized email.

**Code changes:**
- `app/api/auth/signin/route.ts` – Email normalization, fallback lookup, dev-only logs ("User not found" vs "Password mismatch").
- `app/api/auth/signup/route.ts` – Store normalized email for new users.

**Full Documentation:**  
📄 `docs/bug-fixes/2026-02/BUG_FIX_LOCALHOST_LOGIN_CREDENTIALS.md`  
📄 Debug/troubleshooting: `docs/guides/troubleshooting/LOCALHOST_HANG_DEBUG_GUIDE.md` (Related section)

---

## ⚠️ **Active Issues**

_No active issues reported._

---

## 📋 **Issue Reporting Template**

When reporting a new issue, include:

```markdown
### **Issue #X: [Brief Title]**
**Date Reported:** YYYY-MM-DD  
**Severity:** 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM / 🔵 LOW  
**Status:** 🔍 INVESTIGATING / 🔧 IN PROGRESS / ✅ RESOLVED

**Summary:**  
Brief description of the issue

**Error Message:**
```
Error text here
```

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**  
What should happen

**Actual Behavior:**  
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: macOS 14.2
- Node: 20.11.0
- Next.js: 16.1.1

**Workaround (if any):**  
Temporary solution

**Related Files:**
- `path/to/file.ts`

**Notes:**  
Additional context
```

---

## 🔗 **Related Documentation**

- [PHASE18.2_PLAN.md](./PHASE18.2_PLAN.md) - Original implementation plan
- [PHASE18.2_VERIFICATION_SUMMARY.md](./PHASE18.2_VERIFICATION_SUMMARY.md) - Test results & verification
- [DEPLOYMENT_2026_02_10_PHASE18.2.md](./docs/deployments/2026-02/DEPLOYMENT_2026_02_10_PHASE18.2.md) - Deployment guide
- [docs/bug-fixes/2026-02/](./docs/bug-fixes/2026-02/) - All bug fix documentation

---

## 📊 **Statistics**

- **Total Issues Reported:** 2
- **Resolved Issues:** 2 (100%)
- **Active Issues:** 0 (0%)
- **Average Time to Resolution:** < 30 minutes

---

**For support or to report issues, check the documentation first, then create a new bug fix document in `docs/bug-fixes/2026-02/`**
