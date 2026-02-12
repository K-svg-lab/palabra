# Phase 18.3.5: Production Authentication Security Upgrade - PLAN

**Task ID:** 18.3.5  
**Status:** 🟡 IN PROGRESS  
**Priority:** 🔴 **CRITICAL** (Required before App Store submission)  
**Duration:** 1-2 days  
**Started:** February 12, 2026  
**Dependencies:** Phase 12 (Authentication system exists)

---

## 🚨 **Why This Is Critical**

The current authentication system uses **SHA-256** for password hashing, which is **NOT secure** for password storage. The code explicitly states:

```typescript
// For production, use bcrypt:
// import bcrypt from 'bcryptjs';
// return bcrypt.hash(password, 10);
```

**Security Issues with SHA-256:**
- ❌ Too fast (vulnerable to brute force attacks)
- ❌ No built-in salt (rainbow table attacks)
- ❌ Not designed for password hashing
- ❌ Will NOT pass App Store security review
- ❌ Violates OWASP password storage guidelines

**Required for Production:**
- ✅ bcrypt or argon2 (slow, salted, designed for passwords)
- ✅ Email verification (prevent fake accounts)
- ✅ Password reset flow (user support requirement)
- ✅ Enhanced rate limiting (prevent attacks)

---

## 🎯 **Objectives**

### **Phase 1: Critical Security Fixes** (Day 1 - MUST DO)
1. ✅ Upgrade password hashing to bcrypt
2. ✅ Implement email verification system
3. ✅ Implement password reset flow
4. ✅ Migrate existing user passwords (if any production users)

### **Phase 2: Enhanced Security** (Day 2 - RECOMMENDED)
5. ✅ Add OAuth providers (Google, Apple)
6. ✅ Improve rate limiting
7. ✅ Add security event logging
8. ✅ Implement account lockout (failed login attempts)

### **Phase 3: Future Enhancements** (Post-launch)
9. ⏳ Two-factor authentication (SMS/TOTP)
10. ⏳ Session management (active sessions list)
11. ⏳ Security audit logging
12. ⏳ Suspicious activity detection

---

## 📋 **Implementation Checklist**

### **1. Password Hashing Upgrade** 🔴 CRITICAL
- [ ] Install bcryptjs package
- [ ] Update `lib/backend/auth.ts` - replace SHA-256 with bcrypt
- [ ] Update password verification logic
- [ ] Add password migration utility (for existing users)
- [ ] Test password hashing performance (should be ~200-500ms)
- [ ] Update signup endpoint
- [ ] Update signin endpoint
- [ ] **BEFORE DEPLOY**: Migrate existing production passwords

### **2. Email Verification System** 🔴 CRITICAL
- [ ] Add email service configuration (SendGrid, Resend, or AWS SES)
- [ ] Create verification token generation utility
- [ ] Create email templates (HTML + plain text)
- [ ] Add database field: `emailVerified` (already exists ✅)
- [ ] Add database model: `VerificationToken` (already exists ✅)
- [ ] Create API endpoint: `POST /api/auth/verify-email`
- [ ] Create API endpoint: `POST /api/auth/resend-verification`
- [ ] Update signup flow to send verification email
- [ ] Create email verification page: `app/verify-email/page.tsx`
- [ ] Add "Resend verification" UI
- [ ] Test email delivery (dev + production)
- [ ] Add verification check to protected routes

### **3. Password Reset Flow** 🔴 CRITICAL
- [ ] Create password reset token generation utility
- [ ] Add password reset email template
- [ ] Create API endpoint: `POST /api/auth/forgot-password`
- [ ] Create API endpoint: `POST /api/auth/reset-password`
- [ ] Create "Forgot Password" page: `app/forgot-password/page.tsx`
- [ ] Create "Reset Password" page: `app/reset-password/page.tsx`
- [ ] Add password strength validator
- [ ] Test reset flow end-to-end
- [ ] Add token expiration (15-30 minutes)
- [ ] Add rate limiting (prevent abuse)

### **4. OAuth Providers** 🟡 RECOMMENDED
- [ ] Install NextAuth.js (or keep custom implementation)
- [ ] Configure Google OAuth (credentials from Google Cloud Console)
- [ ] Configure Apple Sign In (credentials from Apple Developer)
- [ ] Add OAuth callback endpoints
- [ ] Update User model to support OAuth accounts
- [ ] Add "Sign in with Google" button
- [ ] Add "Sign in with Apple" button
- [ ] Handle OAuth account linking
- [ ] Test OAuth flow on iOS/Android
- [ ] Add OAuth to signup page
- [ ] Add OAuth to signin page

### **5. Enhanced Rate Limiting** 🟡 RECOMMENDED
- [ ] Keep in-memory rate limiting for MVP (current)
- [ ] Add IP-based rate limiting
- [ ] Add email-based rate limiting
- [ ] Add exponential backoff for failed logins
- [ ] Account lockout after 5 failed attempts (15-minute cooldown)
- [ ] Log rate limit violations
- [ ] Add admin alerts for suspicious activity

### **6. Security Event Logging** 🟡 RECOMMENDED
- [ ] Create `SecurityEvent` database model
- [ ] Log: Successful logins
- [ ] Log: Failed login attempts
- [ ] Log: Password changes
- [ ] Log: Email verification
- [ ] Log: Password reset requests
- [ ] Log: Account lockouts
- [ ] Add admin dashboard for security events

---

## 🛠️ **Technical Implementation**

### **1. Install Dependencies**

```bash
# bcrypt for password hashing
npm install bcryptjs
npm install -D @types/bcryptjs

# Email service (choose one)
npm install @sendgrid/mail  # SendGrid
# OR
npm install resend  # Resend (recommended, modern)
# OR
npm install nodemailer  # Self-hosted SMTP

# Optional: NextAuth.js for OAuth
npm install next-auth@beta  # v5 for Next.js 15+
```

---

### **2. File Structure**

```
lib/
├── backend/
│   ├── auth.ts (UPDATE) - Replace SHA-256 with bcrypt
│   ├── email.ts (NEW) - Email service abstraction
│   └── security-events.ts (NEW) - Security logging
├── emails/
│   ├── templates/
│   │   ├── verify-email.tsx (NEW)
│   │   ├── reset-password.tsx (NEW)
│   │   └── welcome.tsx (NEW)
│   └── service.ts (NEW) - Email sending service
app/
├── api/
│   └── auth/
│       ├── verify-email/
│       │   └── route.ts (NEW)
│       ├── resend-verification/
│       │   └── route.ts (NEW)
│       ├── forgot-password/
│       │   └── route.ts (NEW)
│       ├── reset-password/
│       │   └── route.ts (NEW)
│       └── callback/
│           ├── google/
│           │   └── route.ts (NEW - OAuth)
│           └── apple/
│               └── route.ts (NEW - OAuth)
├── verify-email/
│   └── page.tsx (NEW)
├── forgot-password/
│   └── page.tsx (NEW)
└── reset-password/
    └── page.tsx (NEW)
```

---

### **3. Database Schema Updates**

```prisma
// lib/backend/prisma/schema.prisma

// ✅ Already exists (no changes needed)
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime? // ✅ Already exists
  password      String?   // ✅ Already exists
  // ... rest of fields
}

// ✅ Already exists (no changes needed)
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// NEW: Security event logging
model SecurityEvent {
  id        String   @id @default(cuid())
  userId    String?
  eventType String   // "login_success", "login_failed", "password_reset", etc.
  ipAddress String?
  userAgent String?  @db.Text
  metadata  Json?    @db.JsonB
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
}
```

---

### **4. Environment Variables**

```bash
# .env.local (update)

# Email Service (choose one)
SENDGRID_API_KEY="SG.xxx"
# OR
RESEND_API_KEY="re_xxx"

# Email Configuration
EMAIL_FROM="noreply@palabra.app"
EMAIL_FROM_NAME="Palabra"

# OAuth (optional)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
APPLE_CLIENT_ID="com.palabra.app"
APPLE_CLIENT_SECRET="xxx"

# Security
PASSWORD_RESET_TOKEN_EXPIRY="1800000"  # 30 minutes in ms
EMAIL_VERIFICATION_TOKEN_EXPIRY="86400000"  # 24 hours in ms
MAX_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION="900000"  # 15 minutes in ms
```

---

## 🔐 **Security Best Practices**

### **Password Hashing (bcrypt)**
```typescript
// Correct configuration
const SALT_ROUNDS = 12; // 2^12 iterations (~400ms per hash)

// Too low: 10 (fast but less secure)
// Recommended: 12 (good balance)
// High security: 14 (slower but more secure)
```

### **Token Generation**
```typescript
// Secure random token generation
import crypto from 'crypto';

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 character hex string
}
```

### **Rate Limiting Strategy**
```typescript
// Progressive rate limiting
- Email verification: 3 per hour
- Password reset: 5 per hour
- Login attempts: 5 per 15 minutes
- Account creation: 3 per day per IP
```

---

## 🧪 **Testing Checklist**

### **Password Security**
- [ ] Test bcrypt hashing (should take ~200-500ms)
- [ ] Test password verification (correct password)
- [ ] Test password verification (incorrect password)
- [ ] Test password migration (existing SHA-256 → bcrypt)
- [ ] Test password strength validation

### **Email Verification**
- [ ] Test verification email sent on signup
- [ ] Test verification link works
- [ ] Test verification token expiration
- [ ] Test resend verification email
- [ ] Test already verified email
- [ ] Test invalid/expired token

### **Password Reset**
- [ ] Test forgot password email sent
- [ ] Test reset password link works
- [ ] Test reset password token expiration
- [ ] Test password reset completes successfully
- [ ] Test invalid/expired reset token
- [ ] Test rate limiting (multiple requests)

### **OAuth (if implemented)**
- [ ] Test Google Sign In (web)
- [ ] Test Google Sign In (iOS app)
- [ ] Test Google Sign In (Android app)
- [ ] Test Apple Sign In (web)
- [ ] Test Apple Sign In (iOS app)
- [ ] Test account linking (same email)
- [ ] Test account conflict handling

### **Security**
- [ ] Test rate limiting (login attempts)
- [ ] Test account lockout (5 failed logins)
- [ ] Test security event logging
- [ ] Test token expiration
- [ ] Test CSRF protection

---

## 📊 **Migration Strategy (Existing Users)**

### **Scenario: Production users exist with SHA-256 passwords**

**Option 1: Forced Password Reset (RECOMMENDED)**
1. Deploy new bcrypt system
2. Mark all existing users as `emailVerified: false`
3. Send password reset emails to all users
4. Users reset password → stored as bcrypt
5. Clear migration flag

**Option 2: Hybrid System (Fallback)**
1. Check password hash length (SHA-256 = 64 chars, bcrypt = 60 chars)
2. If SHA-256: verify with old method, then rehash with bcrypt
3. If bcrypt: verify with bcrypt
4. Gradually migrate users on next login

**Option 3: No Existing Users (EASIEST)**
- If no production users yet, just deploy new system
- No migration needed ✅

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Email service configured and tested
- [ ] Environment variables set (production)
- [ ] Database migrations applied
- [ ] Security review completed
- [ ] Rollback plan prepared

### **Deployment**
- [ ] Deploy to staging first
- [ ] Test all auth flows on staging
- [ ] Migrate existing users (if any)
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Test production auth flows

### **Post-Deployment**
- [ ] Verify email delivery working
- [ ] Monitor login success/failure rates
- [ ] Check security event logs
- [ ] Test password reset flow
- [ ] Verify OAuth providers working (if implemented)

---

## 📈 **Success Criteria**

### **Security (MUST PASS)**
- ✅ bcrypt with 12 rounds (not SHA-256)
- ✅ Email verification working
- ✅ Password reset working
- ✅ No plaintext passwords logged
- ✅ Tokens expire correctly
- ✅ Rate limiting prevents abuse
- ✅ OWASP password guidelines followed

### **User Experience**
- ✅ Signup → verification email within 30 seconds
- ✅ Password reset → email within 30 seconds
- ✅ OAuth sign-in works (if implemented)
- ✅ Error messages clear and helpful
- ✅ Mobile-friendly auth pages

### **Performance**
- ✅ Password hashing: 200-500ms (acceptable)
- ✅ Email delivery: < 30 seconds
- ✅ Token verification: < 50ms
- ✅ No auth endpoint > 1 second response time

---

## ⏱️ **Timeline**

### **Day 1: Critical Security (6-8 hours)**
- Hour 1-2: Install dependencies, setup email service
- Hour 2-3: Upgrade password hashing to bcrypt
- Hour 3-4: Implement email verification
- Hour 4-6: Implement password reset flow
- Hour 6-7: Testing and bug fixes
- Hour 7-8: Documentation updates

### **Day 2: Enhanced Security (4-6 hours)**
- Hour 1-2: OAuth providers setup (Google, Apple)
- Hour 2-3: Enhanced rate limiting
- Hour 3-4: Security event logging
- Hour 4-5: Comprehensive testing
- Hour 5-6: Deploy to staging, then production

---

## 🔗 **Resources**

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt npm package](https://www.npmjs.com/package/bcryptjs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Resend Email Service](https://resend.com/docs)
- [Google OAuth Setup](https://console.cloud.google.com/)
- [Apple Sign In Setup](https://developer.apple.com/sign-in-with-apple/)

---

## 🚨 **Risks & Mitigations**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Existing users can't login after bcrypt upgrade | HIGH | Implement hybrid verification or forced reset |
| Email delivery fails | HIGH | Test thoroughly, have backup SMTP |
| OAuth provider outage | MEDIUM | Keep email/password as fallback |
| Rate limiting too strict | MEDIUM | Monitor metrics, adjust thresholds |
| Password reset token leaked | LOW | Short expiration (30 min), one-time use |

---

## ✅ **Next Steps**

1. ✅ Review this plan
2. 🔄 Start implementation (Day 1 tasks)
3. ⏳ Test thoroughly
4. ⏳ Deploy to staging
5. ⏳ Deploy to production
6. ⏳ Monitor and adjust

---

**Created:** February 12, 2026  
**Priority:** 🔴 CRITICAL (blocks App Store submission)  
**Owner:** Security Lead  
**Status:** Ready to implement

---

**⚠️ IMPORTANT:** This MUST be completed before App Store submission. SHA-256 password storage will fail security review and violates industry standards.
