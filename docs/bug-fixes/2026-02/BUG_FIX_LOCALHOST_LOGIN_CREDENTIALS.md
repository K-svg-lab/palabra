# Localhost Login: "Invalid email or password" (Credentials work on deployed site)

**Date:** February 10, 2026  
**Status:** Addressed with code fixes + troubleshooting guide

---

## Symptom

- Login works on the **deployed site** (e.g. Vercel).
- Same credentials on **localhost:3000** return **"Invalid email or password"**.

---

## Common causes

### 1. Different database (most likely)

Localhost uses whatever `DATABASE_URL` is in `.env` or `.env.local`. If that points to a **different** database than production (e.g. local PostgreSQL, or a different Neon branch), then:

- The **user account exists only in the production DB**.
- Local has no user (or a different user), so `findUnique` returns `null` → "Invalid email or password".

**Fix:** Use the **same** database as production for local login:

- Copy the production `DATABASE_URL` (e.g. from Vercel → Project → Settings → Environment Variables) into `.env.local`.
- Restart the dev server (`npm run dev`).
- Run migrations if needed: `npx prisma db push --schema=lib/backend/prisma/schema.prisma`.

**Note:** Never commit `.env` or `.env.local`; they are in `.gitignore`.

### 2. Email casing

Lookup was case-sensitive. If the account was created with one casing (e.g. `KBrookes2507@gmail.com`) and you type another (e.g. `kbrookes2507@gmail.com`), sign-in could fail in one environment depending on how the email was stored.

**Fix (in code):** Sign-in now:

- Normalizes email to lowercase for the first lookup.
- Falls back to the original (trimmed) email if no user is found, so existing mixed-case accounts still work.
- Sign-up now stores normalized (lowercase) email for new accounts.

---

## Code changes made

1. **`app/api/auth/signin/route.ts`**
   - Normalize email: `email.trim().toLowerCase()` for primary lookup.
   - Fallback: if not found, try `email.trim()` so mixed-case stored emails still match.
   - In **development only**: log whether failure was "User not found" or "Password mismatch" so you can see the cause in the terminal.

2. **`app/api/auth/signup/route.ts`**
   - Store normalized email (`email.trim().toLowerCase()`) for new users so future logins are case-insensitive.

---

## How to confirm the cause locally

1. Try signing in again on localhost.
2. Watch the **terminal** where `npm run dev` is running:
   - **`[SignIn] User not found or no password: kbrookes2507@gmail.com`** → local DB has no such user. Use production `DATABASE_URL` in `.env.local` (see above).
   - **`[SignIn] Password mismatch for: ...`** → user exists but password doesn’t match (e.g. different hashing or different account). Unlikely if the same credentials work on production; if you see this, ensure local and production use the same `DATABASE_URL` and same code (same hashing).

---

## Summary

| Cause              | Fix |
|--------------------|-----|
| Different database | Set `DATABASE_URL` in `.env.local` to the production URL and restart dev server. |
| Email casing       | Handled in code (normalize + fallback). |

After ensuring local uses the same DB as production (and restarting the dev server), the same credentials that work on the deployed site should work on localhost.
