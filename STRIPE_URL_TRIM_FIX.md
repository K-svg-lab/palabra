# Stripe Integration - URL Trim Fix
**Date**: February 12, 2026  
**Status**: ✅ Fixed

## Issue

Stripe checkout sessions were failing with a 400 error due to invalid URLs. The error showed:

```json
{
  "cancel_url": "https://palabra.vercel.app\n/settings/subscription?canceled=true",
  "success_url": "https://palabra.vercel.app\n/settings/subscription?success=true&tier=lifetime"
}
```

Notice the `\n` (newline) character in the middle of the URLs, which made them invalid.

## Root Cause

The `NEXTAUTH_URL` environment variable in Vercel had a trailing newline/whitespace character that was being concatenated into the checkout URLs.

## Solution

Added `.trim()` to the `NEXTAUTH_URL` environment variable when building URLs:

### Files Changed

**`app/api/subscription/checkout/route.ts`**
```typescript
// Before
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// After  
const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim();
```

**`app/api/subscription/portal/route.ts`**
```typescript
// Before
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// After
const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim();
```

## Testing Results

✅ **Test 1: Premium Yearly Subscription**
- Payment completed successfully
- User `tester7` upgraded to Premium tier
- Database updated correctly:
  - `subscriptionTier` = `premium`
  - `subscriptionStatus` = `active`
  - `stripeCustomerId` and `stripeSubscriptionId` populated

✅ **No more URL validation errors**
- Checkout URLs are now properly formatted
- Success redirect works: `/settings/subscription?success=true&tier=premium`

## Next Steps

- ✅ Fix deployed to production
- ⏳ Test additional subscription tiers (Monthly, Lifetime)
- ⏳ Test cancellation flow
- ⏳ Test billing portal access

---

**Commit:** d0f6d52  
**Deployed:** February 12, 2026
