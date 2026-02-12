# Stripe Integration Testing Guide
**Phase 18.3.1 - End-to-End Testing**  
**Date**: February 11, 2026

## 🎯 Testing Objective

Verify that the complete Stripe integration works correctly:
1. Checkout sessions are created
2. Webhooks are received and processed
3. Database is updated correctly
4. User sees correct subscription status
5. Feature gating works properly

---

## ⚠️ CRITICAL: Start Stripe Listen Correctly

Before testing, ensure your stripe listen command includes the `--forward-to` flag:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**You should see:**
```
> Ready! Your webhook signing secret is whsec_xxx
> Forwarding webhooks to http://localhost:3000/api/webhooks/stripe
```

**❌ Without `--forward-to`**: Webhooks are received but NOT sent to your app  
**✅ With `--forward-to`**: Webhooks are received AND forwarded to your app

---

## 📝 Test 1: Premium Yearly Subscription

### Step 1: Start the Test

1. Navigate to: http://localhost:3000/settings/subscription
2. Ensure "Yearly" toggle is selected
3. Click "Upgrade to Premium" button

### Step 2: Complete Checkout

Use these **Stripe test card** details:

| Field | Value |
|-------|-------|
| Card Number | `4242 4242 4242 4242` |
| Expiry | `12/34` (any future date) |
| CVC | `123` (any 3 digits) |
| Name | Any name |
| Email | Your email |
| Country | Any country |

Click "Subscribe" to complete payment.

### Step 3: Verify Redirect

**Expected:** Redirected to:
```
http://localhost:3000/settings/subscription?success=true&tier=premium
```

**Check:**
- ✅ Green success alert appears
- ✅ Premium card shows "✓ ACTIVE" badge  
- ✅ "Manage Billing" button is visible
- ✅ Free card no longer shows "Current Plan"

### Step 4: Verify Webhook Processing

**Terminal 1 (stripe listen):** Should show:
```
2026-02-11 XX:XX:XX   --> checkout.session.completed [evt_xxx]
2026-02-11 XX:XX:XX  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxx]
2026-02-11 XX:XX:XX   --> customer.subscription.created [evt_xxx]
2026-02-11 XX:XX:XX  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxx]
2026-02-11 XX:XX:XX   --> invoice.payment_succeeded [evt_xxx]
2026-02-11 XX:XX:XX  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxx]
```

**Key Points:**
- ✅ `-->` means Stripe received the event
- ✅ `<-- [200]` means your app successfully processed it
- ❌ `<-- [400]` or `<-- [500]` means processing failed

**Terminal 2 (npm run dev):** Should show:
```
[Stripe Webhook] Received event: checkout.session.completed (evt_xxx)
[Stripe Webhook] User upgraded to premium
[Stripe Webhook] Received event: customer.subscription.created (evt_xxx)
[Stripe Webhook] Subscription created
[Stripe Webhook] Received event: invoice.payment_succeeded (evt_xxx)
[Stripe Webhook] Payment succeeded
```

### Step 5: Verify Database Updates

Open Prisma Studio:
```bash
npx prisma studio
```

**User Table:** Find your user (kbrookes2507@gmail.com)
- ✅ `subscriptionTier` = `premium`
- ✅ `subscriptionStatus` = `active`
- ✅ `stripeCustomerId` = `cus_xxxxx`
- ✅ `stripeSubscriptionId` = `sub_xxxxx`
- ✅ `subscriptionStart` = now
- ✅ `subscriptionEnd` = 1 year from now

**Subscription Table:**
- ✅ 1 new record created
- ✅ `userId` = your user ID
- ✅ `status` = `active`
- ✅ `currentPeriodStart` = now
- ✅ `currentPeriodEnd` = 1 year from now
- ✅ `cancelAtPeriodEnd` = `false`

**Payment Table:**
- ✅ 1 new record created
- ✅ `userId` = your user ID
- ✅ `type` = `subscription`
- ✅ `status` = `succeeded`
- ✅ `amount` = `39.99` (or stored as 3999 cents)
- ✅ `stripePaymentIntentId` = `pi_xxxxx`

### Step 6: Test Billing Portal

1. On subscription page, click "Manage Billing"
2. Should open Stripe Customer Portal
3. Should show:
   - Current subscription details
   - Payment method
   - "Cancel subscription" option
   - Billing history

---

## 📝 Test 2: Premium Monthly Subscription

### Prerequisites

First, cancel the yearly subscription:
1. Click "Manage Billing"
2. Cancel the subscription in Stripe portal
3. Wait for webhook to process
4. Verify Free tier is restored

### Steps

1. Navigate to subscription page
2. Select "Monthly" toggle
3. Click "Upgrade to Premium"
4. Complete checkout with test card `4242 4242 4242 4242`
5. Verify all steps from Test 1, but with:
   - Price: `$4.99`
   - Period end: 1 month from now (not 1 year)

---

## 📝 Test 3: Lifetime Purchase

### Prerequisites

Cancel any active subscription first (see Test 2).

### Steps

1. Navigate to subscription page
2. Click "Get Lifetime Access"
3. Complete checkout with test card `4242 4242 4242 4242`

### Expected Results

**Redirect:**
```
http://localhost:3000/settings/subscription?success=true&tier=lifetime
```

**UI:**
- ✅ Lifetime card shows "✓ ACTIVE" badge
- ✅ NO "Manage Billing" button (one-time payment)

**Webhook Events:**
```
--> checkout.session.completed
--> payment_intent.succeeded
```

**Database (User table):**
- ✅ `subscriptionTier` = `lifetime`
- ✅ `lifetimePayment` = `true`
- ✅ `lifetimePaymentDate` = now
- ✅ `lifetimeAmount` = `79.99`
- ✅ NO `stripeSubscriptionId` (one-time, not recurring)

**Database (Payment table):**
- ✅ `type` = `lifetime`
- ✅ `amount` = `79.99`

---

## 📝 Test 4: Payment Failure

Test what happens when payment fails.

### Steps

1. Start checkout for any tier
2. Use the **test card for declined payments**: `4000 0000 0000 0002`
3. Complete the form

### Expected Results

**Redirect:**
```
http://localhost:3000/settings/subscription?canceled=true
```

**UI:**
- ✅ Yellow warning alert appears
- ✅ Subscription tier unchanged (still Free)

**Webhook Events:**
```
--> payment_intent.payment_failed
<-- [200] POST http://localhost:3000/api/webhooks/stripe
```

**Database:**
- ✅ NO changes to User subscription fields
- ✅ Payment record created with `status` = `failed`

---

## 📝 Test 5: Feature Gating

After purchasing Premium, test that features are properly gated.

### Create a Test Feature Gate

This is a conceptual test - features will be gated in future implementations.

**Test API endpoint:**
```bash
curl -X GET http://localhost:3000/api/user/subscription \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (Free):**
```json
{
  "tier": "free",
  "status": "active",
  "features": {
    "deepLearning": false,
    "personalizedAI": false,
    "advancedInterference": false,
    "dataExport": false,
    "offlineMode": false,
    "advancedAnalytics": false
  }
}
```

**Expected Response (Premium):**
```json
{
  "tier": "premium",
  "status": "active",
  "features": {
    "deepLearning": true,
    "personalizedAI": true,
    "advancedInterference": true,
    "dataExport": true,
    "offlineMode": true,
    "advancedAnalytics": true
  }
}
```

---

## 📝 Test 6: Subscription Cancellation

Test the full cancellation flow.

### Steps

1. With an active Premium subscription, click "Manage Billing"
2. In Stripe portal, click "Cancel subscription"
3. Confirm cancellation
4. Return to app

### Expected Results

**Webhook Events:**
```
--> customer.subscription.updated
<-- [200] POST http://localhost:3000/api/webhooks/stripe
```

**Database (User table):**
- ✅ `subscriptionStatus` = `active` (still has access)
- ✅ `subscriptionEnd` = unchanged (end of current period)

**Database (Subscription table):**
- ✅ `cancelAtPeriodEnd` = `true`
- ✅ `canceledAt` = now
- ✅ `status` = still `active` until period ends

**UI:**
- ✅ Premium card still shows "✓ ACTIVE"
- ✅ Note shown: "Cancels on [end date]"

---

## 🔍 Troubleshooting

### Issue: Webhooks Not Forwarded

**Symptom:** Stripe listen shows events but no `<-- [200]` responses.

**Cause:** Missing `--forward-to` flag.

**Fix:**
```bash
# Stop current stripe listen (Ctrl+C)
# Restart with forward URL:
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### Issue: Webhook Processing Fails

**Symptom:** `<-- [500]` responses in stripe listen.

**Check npm run dev terminal** for errors:
```
[Stripe Webhook] Handler failed: Error message here
```

**Common causes:**
1. Database connection issue
2. Missing user in database
3. Invalid Stripe object structure
4. Prisma schema mismatch

### Issue: Database Not Updating

**Symptom:** Webhooks show [200] but database unchanged.

**Steps:**
1. Check Prisma Studio is showing latest data (refresh)
2. Check `npm run dev` terminal for database errors
3. Verify DATABASE_URL in `.env.local` is correct
4. Run `npx prisma generate` to ensure client is updated

### Issue: Wrong Subscription Tier

**Symptom:** Database shows wrong tier after purchase.

**Check:**
1. Price IDs in `.env.local` match your Stripe dashboard
2. Webhook event has correct price ID
3. Stripe product metadata is correct

---

## ✅ Test Completion Checklist

### Basic Flow
- [ ] Premium yearly checkout works
- [ ] Premium monthly checkout works
- [ ] Lifetime checkout works
- [ ] Success redirect works
- [ ] Canceled redirect works

### Webhooks
- [ ] `checkout.session.completed` processed
- [ ] `customer.subscription.created` processed
- [ ] `customer.subscription.updated` processed
- [ ] `customer.subscription.deleted` processed
- [ ] `invoice.payment_succeeded` processed
- [ ] `invoice.payment_failed` processed
- [ ] `payment_intent.succeeded` processed (lifetime)
- [ ] `payment_intent.payment_failed` processed

### Database
- [ ] User table updated correctly
- [ ] Subscription table has records
- [ ] Payment table has records
- [ ] Dates/amounts are correct
- [ ] Status transitions work

### UI/UX
- [ ] Success/canceled alerts appear
- [ ] Current plan highlighted
- [ ] Badges show correctly
- [ ] Manage Billing button works
- [ ] Stripe portal loads
- [ ] Mobile responsive

### Feature Gating
- [ ] Free users blocked from premium features
- [ ] Premium users can access features
- [ ] Lifetime users can access features
- [ ] API returns correct feature map

---

## 📊 Expected Test Results Summary

| Test | Duration | Webhooks | DB Records | Result |
|------|----------|----------|------------|---------|
| Premium Yearly | ~30 sec | 3 | User + Sub + Payment | ✅ Active |
| Premium Monthly | ~30 sec | 3 | User + Sub + Payment | ✅ Active |
| Lifetime | ~30 sec | 2 | User + Payment | ✅ Active |
| Payment Failure | ~20 sec | 1 | Payment (failed) | ⚠️ Unchanged |
| Cancellation | ~15 sec | 1 | Sub updated | 🕐 Active until end |

---

## 🎯 Success Criteria

All tests pass when:
1. ✅ Checkout completes without errors
2. ✅ Webhooks forwarded and return [200]
3. ✅ Database updated correctly
4. ✅ UI reflects correct state
5. ✅ No errors in terminal logs

---

## 📝 Next Steps After Testing

Once all tests pass:

1. **Document test results** in `PHASE18.3.1_TESTING_COMPLETE.md`
2. **Screenshot success states** for documentation
3. **Move to production setup** (Phase 18.3.1 final step)
4. **Configure live Stripe products**
5. **Deploy to Vercel with live keys**

---

**Good luck with testing! 🚀**
