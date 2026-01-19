# SM-2 Debug Panel - Setup & Usage

**Created:** January 19, 2026  
**Status:** Password Protected ✅  
**Location:** `/debug-sm2`

---

## Overview

The SM-2 Debug Panel is a password-protected testing interface that allows developers to verify and debug the spaced repetition algorithm without waiting for days. It's kept in the codebase for ongoing debugging but protected from regular users.

---

## Quick Access

**URL:** `http://localhost:3000/debug-sm2` (development)  
**URL:** `https://palabra-nu.vercel.app/debug-sm2` (production)

---

## Password Setup

### Default Password

**Default:** `Reaper789`

The debug panel uses a default password if no environment variable is set. This password is used for both local development and production.

### Custom Password (Recommended for Production)

For production deployments, set a custom password using environment variables:

#### Local Development

1. Open or create `palabra/.env.local`:

```bash
# SM-2 Debug Panel Password
NEXT_PUBLIC_DEBUG_PASSWORD=your_secure_password_here
```

2. Restart the dev server:

```bash
npm run dev
```

#### Vercel Production

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add new variable:
   - **Key:** `NEXT_PUBLIC_DEBUG_PASSWORD`
   - **Value:** Your secure password
   - **Environments:** Production, Preview (optional), Development (optional)

3. Redeploy the application:

```bash
git push origin main
```

Or trigger manual deployment in Vercel dashboard.

---

## Security Features

### Authentication

- **Session-based:** Password persists during browser session
- **Automatic logout:** Clears on browser close
- **Failed attempts:** Max 5 attempts before redirect to dashboard
- **No backend:** Client-side only (suitable for debug tools)

### Access Control

- **Not indexed:** Not included in sitemap or robots.txt
- **No links:** Not linked from main navigation
- **Developer-only:** Requires knowledge of URL and password

### Environment Variables

- **NEXT_PUBLIC_DEBUG_PASSWORD:** Accessible in browser (client-side)
- **Not sensitive data:** Debug access only, no user data exposed
- **Easy to rotate:** Change password anytime via env variable

---

## Usage

### Step 1: Navigate to Debug Panel

Go to `http://localhost:3000/debug-sm2` or the production URL.

### Step 2: Enter Password

- Use default `debug2026` for local development
- Use custom password if set in environment variables

### Step 3: Access Debug Tools

Once authenticated, you can:
- View SM-2 parameters for all words
- Simulate time passing (fast-forward days)
- Test different ratings and preview outcomes
- Apply test reviews and verify status transitions
- Inspect review schedules and intervals

### Step 4: Exit Debug Panel

Click the **"Exit Debug"** button (red, top-right) to:
- Clear authentication
- Return to main dashboard
- Require re-authentication on next visit

---

## Features

### Password Protection Screen

- Clean, professional login interface
- Warning banner for unauthorized access
- Failed attempt tracking
- Auto-redirect after 5 failed attempts
- Easy return to dashboard

### Debug Panel Interface

All features from `SM2_TESTING_GUIDE.md`:
- Real-time SM-2 parameter viewing
- Time simulation control
- Schedule preview for all ratings
- One-click test reviews
- Status transition verification
- Timestamp inspection

### Exit Button

- Fixed top-right position
- Always visible
- One-click logout and redirect
- Clears session authentication

---

## File Structure

```
palabra/
├── app/
│   └── (dashboard)/
│       └── debug-sm2/
│           ├── layout.tsx          # Password protection wrapper
│           └── page.tsx             # Debug panel interface
├── .env.local                      # Local environment variables (gitignored)
└── .env.example                    # Example env file (committed to repo)
```

---

## For Developers

### Changing the Password

**Local:**
Edit `palabra/.env.local` and restart dev server.

**Production:**
Update in Vercel dashboard and redeploy.

### Bypassing Authentication (Local Development Only)

If you need to bypass authentication for rapid testing:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `sessionStorage.setItem('debug_auth', 'authenticated')`
4. Refresh the page

**Warning:** Never do this in production or commit code that bypasses authentication.

### Removing the Debug Panel

If you want to remove the debug panel entirely:

```bash
rm -rf palabra/app/\(dashboard\)/debug-sm2
```

Then remove any references in documentation.

---

## Security Considerations

### Why Client-Side Authentication?

This is a **debug tool**, not a security feature. It's designed to:
- Prevent accidental access by regular users
- Avoid confusion from debug tools in production
- Keep the code simple and maintainable

### What It Doesn't Protect Against

- Determined attackers can bypass client-side checks
- Anyone with access to the code can see the logic
- Not suitable for protecting sensitive user data

### Why This Is OK

- **No sensitive data:** Debug panel only shows SM-2 algorithm behavior
- **No modifications to user data:** Test reviews are for demonstration only
- **Developer tool:** Intended for authorized developers, not end users
- **Easy to rotate:** Change password instantly if compromised

### If You Need Stronger Security

Consider:
- Server-side authentication with JWT tokens
- Integration with existing user authentication system
- Admin role check in database
- IP whitelisting in Vercel
- Completely removing from production builds

---

## Testing the Password Protection

### Test 1: Access Without Password

1. Navigate to `/debug-sm2`
2. Verify password screen appears
3. Try clicking "Return to Dashboard" → Should redirect to `/`

### Test 2: Wrong Password

1. Enter incorrect password
2. Verify error message appears
3. Try 5 times → Should redirect to dashboard

### Test 3: Correct Password

1. Enter correct password (default: `debug2026`)
2. Verify debug panel loads
3. Verify "Exit Debug" button appears (top-right)

### Test 4: Session Persistence

1. Access debug panel with correct password
2. Navigate to different route (e.g., `/vocabulary`)
3. Return to `/debug-sm2`
4. Should NOT ask for password again (session active)

### Test 5: Logout

1. In debug panel, click "Exit Debug" button
2. Should redirect to dashboard
3. Navigate back to `/debug-sm2`
4. Should ask for password again (session cleared)

### Test 6: Browser Close

1. Access debug panel with correct password
2. Close browser completely
3. Open browser and navigate to `/debug-sm2`
4. Should ask for password again (session cleared)

---

## Troubleshooting

### Problem: "Loading..." appears forever

**Solution:** Clear browser cache and session storage:
```javascript
// In browser console:
sessionStorage.clear();
location.reload();
```

### Problem: Password doesn't work

**Check:**
1. Is `NEXT_PUBLIC_DEBUG_PASSWORD` set correctly?
2. Did you restart dev server after changing `.env.local`?
3. In production, did you redeploy after setting env variable?
4. Try default password `debug2026`

### Problem: Can't access in production

**Check:**
1. Is the route deployed? Check Vercel deployment logs
2. Is env variable set in Vercel dashboard?
3. Did you redeploy after setting env variable?
4. Try accessing via direct URL (not linked anywhere)

### Problem: Want to disable password temporarily

**Quick disable (local development only):**

Edit `palabra/app/(dashboard)/debug-sm2/layout.tsx`:

```typescript
// Temporarily always authenticate (remove after testing!)
useEffect(() => {
  setIsAuthenticated(true); // <-- Add this line
  setIsChecking(false);
}, []);
```

**Remember to revert this change!**

---

## Maintenance

### Regular Tasks

- **Review password:** Change quarterly or when staff changes
- **Check logs:** Monitor for excessive failed attempts
- **Update documentation:** Keep this file current with any changes

### When to Remove

Consider removing the debug panel when:
- SM-2 algorithm is thoroughly validated
- No ongoing development on spaced repetition features
- Production environment needs to be fully locked down
- Tool is no longer providing value

### When to Keep

Keep the debug panel when:
- Actively developing/debugging SM-2 features
- Need to verify algorithm behavior quickly
- Training new developers on the spaced repetition system
- Troubleshooting user-reported scheduling issues

---

## Related Documentation

- **SM2_TESTING_GUIDE.md** - Detailed testing scenarios for SM-2 algorithm
- **DEBUG_SESSION_2026_01_19.md** - Previous debugging session for status regression
- **PHASE4_COMPLETE.md** - Original SM-2 implementation documentation
- **palabra/lib/utils/spaced-repetition.ts** - SM-2 algorithm source code

---

**Last Updated:** January 19, 2026

---

## Quick Reference

| Item | Value |
|------|-------|
| **URL (Local)** | `http://localhost:3000/debug-sm2` |
| **URL (Production)** | `https://palabra-nu.vercel.app/debug-sm2` |
| **Default Password** | `Reaper789` |
| **Env Variable** | `NEXT_PUBLIC_DEBUG_PASSWORD` |
| **Session Storage Key** | `debug_auth` |
| **Max Failed Attempts** | 5 |
| **Logout Button** | Top-right corner (red) |

---

*For questions or issues, refer to the main project documentation or contact the development team.*
