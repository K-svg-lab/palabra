# Stripe Webhook 405 Error - Resolution
**Date**: February 12, 2026  
**Status**: 🔄 In Progress  
**Error**: `405 Method Not Allowed` on `/api/webhooks/stripe`

---

## 🐛 Problem

Stripe webhooks are failing with HTTP 405 errors when attempting to POST to:
```
https://palabra.vercel.app/api/webhooks/stripe
```

**Evidence from Stripe Dashboard:**
- ✅ Webhook events are being sent
- ❌ Getting `405 ERR` response
- ❌ Shows "Method Not Allowed"

**What This Means:**
- The endpoint URL exists (otherwise would be 404)
- The endpoint is NOT accepting POST requests
- This indicates the route file wasn't properly deployed to Vercel

---

## 🔍 Root Cause Analysis

### Investigation Steps

1. **Verified route file exists locally:**
   ```
   ✅ app/api/webhooks/stripe/route.ts exists
   ✅ Has proper `export async function POST()`
   ✅ Code is correct
   ```

2. **Verified file is in Git:**
   ```bash
   $ git ls-files | grep webhooks/stripe
   app/api/webhooks/stripe/route.ts  ✅
   ```

3. **Verified file is on origin/main:**
   ```bash
   $ git log --oneline origin/main | grep webhook
   fe3540b Fix: Await headers() in webhook route for Next.js 15+
   7de3163 Phase 18.3.1: Monetization implementation with Stripe
   ✅ Both commits present on GitHub
   ```

4. **Checked recent deployments:**
   - Latest push: `b0fe4ee` (docs: Document Stripe URL trim fix)
   - Webhook route commits: `fe3540b` and `7de3163`
   - ✅ Webhook commits are BEFORE latest deployment

### Conclusion

The webhook route file:
- ✅ Exists in the codebase
- ✅ Is committed to Git
- ✅ Is pushed to GitHub
- ❌ Is NOT being served by Vercel production deployment

**This is a Vercel deployment/build issue.**

---

## 💡 Possible Causes

1. **Stale Build Cache**: Vercel cached an old build before the webhook route existed
2. **Incomplete Deployment**: The webhook route wasn't included in the build output
3. **Next.js App Router Issue**: Route handler not being recognized
4. **Build Failure**: Vercel build succeeded but route wasn't included

---

## 🔧 Solutions Attempted

### Solution 1: Force Vercel Rebuild ✅ (Current)

**Action Taken:**
```bash
# Created trigger file
echo "rebuild" > .vercel-rebuild-trigger

# Committed and pushed
git add .vercel-rebuild-trigger
git commit -m "fix: Force Vercel rebuild to deploy webhook route (405 error fix)"
git push
```

**Expected Result:**
- Vercel will detect the new commit
- Trigger a fresh build
- Include the webhook route in deployment
- Webhook endpoint will accept POST requests

**Verification Steps** (after deployment completes):
1. Wait 2-3 minutes for Vercel deployment
2. Check Vercel dashboard deployment status
3. Test webhook manually:
   ```bash
   curl -X POST https://palabra.vercel.app/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
4. Should get a response (not 405)

---

### Solution 2: Manual Redeploy (If Solution 1 Fails)

If the automatic deployment doesn't fix it:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/nutritrues-projects/palabra/deployments

2. **Find Latest Deployment:**
   - Click the three dots (...)
   - Select "Redeploy"
   - Check "Use existing build cache: NO"
   - Click "Redeploy"

3. **This forces a clean rebuild from scratch**

---

### Solution 3: Check Environment Variables (If Solution 2 Fails)

The webhook secret must be set in Vercel:

1. **Go to Vercel Settings:**
   - https://vercel.com/nutritrues-projects/palabra/settings/environment-variables

2. **Verify These Variables Exist:**
   - `STRIPE_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
   - `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_` or `pk_live_`)

3. **If Missing:**
   - Add them
   - Redeploy the application

---

## 📊 Current Status

| Component | Status |
|-----------|--------|
| Webhook route file | ✅ Exists locally |
| Git commit | ✅ Committed (`fe3540b`) |
| GitHub push | ✅ Pushed to origin/main |
| Vercel deployment | ⏳ Rebuilding now |
| Webhook endpoint | ❌ Returns 405 (pre-rebuild) |

---

## 🎯 Next Steps

1. ⏳ **Wait for Vercel deployment** (~2-3 minutes)
   - Monitor: https://vercel.com/nutritrues-projects/palabra/deployments
   - Look for status: "Ready"

2. ✅ **Verify webhook endpoint works:**
   ```bash
   # Should return JSON, not 405
   curl -X GET https://palabra.vercel.app/api/webhooks/stripe
   ```

3. ✅ **Test Stripe webhook delivery:**
   - Make a new test purchase
   - Check Stripe dashboard for successful delivery
   - Verify database updates correctly

---

## 🔍 Verification Checklist

After deployment completes:

- [ ] Vercel shows "Ready" status
- [ ] GET `/api/webhooks/stripe` returns JSON (not 405)
- [ ] POST `/api/webhooks/stripe` returns 400 with "No signature" (not 405)
- [ ] Stripe webhook test succeeds
- [ ] Database updates on successful payment

---

## 📝 Lessons Learned

1. **Vercel Build Cache Can Be Sticky**: Sometimes requires forced rebuild
2. **405 vs 404**: 405 means route exists but method not allowed (missing POST handler or deployment issue)
3. **API Routes Need Full Deployment**: Just pushing code isn't enough; Vercel must build and deploy
4. **Always Verify Deployment**: Check both GitHub AND Vercel deployment logs

---

**Status**: ⏳ Awaiting Vercel rebuild completion  
**ETA**: 2-3 minutes from commit time (17c65e2)  
**Next Check**: Verify webhook endpoint responds correctly
