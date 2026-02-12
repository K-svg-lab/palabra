# Google Play Store Setup Guide - Palabra

**Last Updated:** February 12, 2026  
**App Name:** Palabra - Spanish Vocabulary  
**Developer:** Kalvin Brookes  
**Target Launch:** Q1 2026

---

## 📋 **Prerequisites**

### **Before You Begin**
- [ ] Google Play Console account ($25 one-time fee)
- [ ] All app assets prepared (icon, screenshots, feature graphic)
- [ ] Privacy Policy and Terms of Service published
- [ ] Production build tested and verified
- [ ] Google Developer Account verified

**Important:** Google Play Console registration can take 24-48 hours for verification.

---

## 🚀 **Step-by-Step Setup**

### **Phase 1: Google Play Console Registration**

#### **1.1 Create Google Play Console Account**

1. **Go to:** [play.google.com/console/signup](https://play.google.com/console/signup)
2. **Sign in** with Google Account (or create one)
3. **Accept Agreement:**
   - Read Google Play Developer Distribution Agreement
   - Check "I agree" checkbox
   - Click "Continue"
4. **Pay Registration Fee:**
   - One-time fee: $25 USD
   - Payment via credit/debit card or Google Pay
5. **Complete Account Details:**
   - **Developer Name:** Kalvin Brookes (public-facing name)
   - **Email Address:** kbrookes2507@gmail.com (contact email)
   - **Phone Number:** (your phone number)
   - **Website:** https://palabra-nu.vercel.app (optional but recommended)

---

#### **1.2 Verify Identity**

Google requires identity verification (anti-fraud measure):

1. **Navigate to:** Settings → Developer account → Identity
2. **Provide Information:**
   - Personal identity verification (government ID)
   - Business verification (if applicable)
3. **Upload Documents** (clear photos/scans):
   - Passport, driver's license, or national ID
   - Proof of address (bank statement, utility bill < 3 months old)
4. **Wait for Approval:** 24-48 hours typically

**Status Check:** Email notification when verified

---

### **Phase 2: Create New App**

#### **2.1 Initialize App**

1. **Go to:** [play.google.com/console](https://play.google.com/console)
2. **Click "Create app"** (top right)
3. **Fill in App Details:**

**App Details:**
- **App name:** Palabra - Spanish Vocabulary
- **Default language:** English (United States)
- **App or game:** App
- **Free or paid:** Free

**Declarations:**
- [ ] This app complies with Google Play's Developer Program Policies ✓
- [ ] I acknowledge that my app is subject to US export laws ✓

4. **Click "Create app"**

---

#### **2.2 Complete Dashboard Tasks**

Google Play Console uses a **task-based dashboard**. Complete all required tasks before publishing.

---

### **Phase 3: Store Listing**

Navigate to **Grow → Store Presence → Main store listing**

#### **3.1 App Details**

**App name:**
```
Palabra - Spanish Vocabulary
```
(50 characters max)

**Short description:**
```
Master Spanish vocabulary with AI-powered flashcards and spaced repetition.
```
(80 characters max)

**Full description:**
```
Transform your Spanish vocabulary learning with Palabra - the most intelligent and beautiful vocabulary app available.

🎯 DESIGNED FOR REAL LEARNING
Palabra isn't just another flashcard app. It's a complete learning system backed by cognitive science research, featuring:

• 5 VARIED REVIEW METHODS
Traditional flashcards, fill-in-the-blank, multiple choice, audio recognition, and context selection. Each method strengthens different aspects of memory.

• AI-POWERED EXAMPLES
Get 3 contextually rich example sentences tailored to your proficiency level (A1-C2 CEFR). Every word comes alive with real usage.

• SMART SPACED REPETITION
Our enhanced SM-2 algorithm adapts to your performance across different review methods, optimizing when you see each word for maximum retention.

... (see metadata.md for full 4000-character description)
```
(4000 characters max)

---

#### **3.2 Graphics Assets**

**App icon:**
- Upload: 512×512px PNG (32-bit with alpha channel)
- File: `public/app-icon-512.png`
- Requirements: High-resolution, professional, distinctive

**Feature graphic:**
- Upload: 1024×500px JPG or PNG
- Content: Promotional banner showcasing app
- Example: App screenshots montage with "Master Spanish Vocabulary" headline
- **Important:** This is the banner shown at top of store listing

**Screenshots (Required):**
- **Phone:** 1080×1920px minimum (2-8 screenshots)
- **7-inch tablet:** 1600×2560px (optional, 2-8 screenshots)
- **10-inch tablet:** 1600×2560px (optional, 2-8 screenshots)

Upload 6 screenshots in order:
1. Home Dashboard
2. Review Methods (5 methods shown)
3. Vocabulary Entry (AI-powered)
4. Progress & Analytics
5. Review Session
6. Subscription Pricing

**Promo video (Optional):**
- YouTube URL of app demo video
- 30 seconds to 2 minutes ideal
- Shows actual app usage

---

#### **3.3 Categorization**

**App category:**
- **Category:** Education
- **Tags:** (select all relevant)
  - Language Learning ✓
  - Flashcards ✓
  - Vocabulary ✓
  - Spanish ✓

**Store listing contact details:**
- **Email:** kbrookes2507@gmail.com
- **Phone:** (optional)
- **Website:** https://palabra-nu.vercel.app (recommended)

---

### **Phase 4: Store Settings**

Navigate to **Grow → Store Presence → Store settings**

#### **4.1 App Access**

**Special access:**
- App requires special access or credentials: **Yes**
- Instructions: 
  ```
  DEMO ACCOUNT CREDENTIALS:
  Email: reviewer@palabra.app
  Password: ReviewPalabra2026!
  
  After login, select B1 (Intermediate) proficiency level to begin.
  ```

---

#### **4.2 Ads**

**Does your app contain ads?**
- No (Palabra is ad-free)

---

#### **4.3 Content Rating**

Click **"Start questionnaire"**

**Category:** Education

**Questionnaire:**
1. Does your app depict violence?
   - No

2. Does your app contain sexual or suggestive content?
   - No

3. Does your app contain profanity or crude humor?
   - No

4. Does your app depict controlled substances?
   - No

5. Does your app contain user-generated content?
   - No (vocabulary lists are personal, not shared publicly in v1.0)

6. Does your app facilitate gambling?
   - No

7. Does your app have social features?
   - No (in v1.0)

**Result:** Everyone (equivalent to iOS 4+)

---

#### **4.4 Target Audience**

**Age group:**
- Primary: 18-24 (college students)
- Secondary: 25-34 (professionals)

**Appeal to children:**
- Does your app appeal to children under 13? No
- (App is educational for teens/adults)

---

#### **4.5 News Apps Declaration**

**Is your app a news app?**
- No

---

#### **4.6 COVID-19 Contact Tracing**

**Is your app a COVID-19 contact tracing app?**
- No

---

#### **4.7 Data Safety**

Navigate to **Policy → App content → Data safety**

This is Google's equivalent of Apple's App Privacy section.

**Data collection and security:**

**1. Does your app collect or share user data?**
- Yes

**2. Is all user data encrypted in transit?**
- Yes (HTTPS/TLS 1.3)

**3. Do you provide a way for users to request data deletion?**
- Yes (Settings → Account → Delete Account)

---

**Data types collected:**

**Personal info:**
- **Email addresses**
  - Collected: Yes
  - Shared: No
  - Processed ephemerally: No
  - Required: Yes (for cloud sync)
  - Purpose: Account management, authentication

**App activity:**
- **App interactions** (review sessions, vocabulary additions)
  - Collected: Yes
  - Shared: No
  - Required: No (can use app offline without account)
  - Purpose: Analytics, app functionality

**App info and performance:**
- **Crash logs**
  - Collected: Yes
  - Shared: No
  - Purpose: App stability and performance

---

### **Phase 5: App Content**

#### **5.1 Privacy Policy**

Navigate to **Policy → App content → Privacy Policy**

**Privacy policy URL:**
```
https://palabra-nu.vercel.app/privacy
```

- Must be accessible without authentication
- Must be in same language as app listing
- Must disclose all data collection practices

---

#### **5.2 App Access (Credentials)**

Already completed in Store Settings (Step 4.1)

---

#### **5.3 Ads Declaration**

Already completed in Store Settings (Step 4.2)

---

#### **5.4 Content Ratings**

Already completed in Store Settings (Step 4.3)

---

#### **5.5 Target Audience**

Already completed in Store Settings (Step 4.4)

---

#### **5.6 Coronavirus (COVID-19) Declaration**

Already completed in Store Settings (Step 4.6)

---

#### **5.7 Data Safety**

Already completed in Store Settings (Step 4.7)

---

### **Phase 6: App Bundle / Build Upload**

#### **6.1 Create Production Release**

Navigate to **Release → Production**

**Release Type:**
Since Palabra is a PWA, you have 2 options:

---

**Option 1: Trusted Web Activity (TWA) - Recommended for PWA**

1. **Use Bubblewrap** (Google's official TWA builder):
   ```bash
   # Install Bubblewrap CLI
   npm install -g @bubblewrap/cli
   
   # Initialize project
   bubblewrap init --manifest https://palabra-nu.vercel.app/manifest.json
   
   # Build APK
   bubblewrap build
   
   # Sign APK (create keystore first)
   keytool -genkey -v -keystore palabra-release.keystore -alias palabra -keyalg RSA -keysize 2048 -validity 10000
   
   # Upload APK to Google Play Console
   ```

2. **Digital Asset Links:**
   - Verify you control the domain
   - Add `assetlinks.json` to your web app:
     ```json
     [{
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "app.palabra.twa",
         "sha256_cert_fingerprints": ["..."]
       }
     }]
     ```
   - Place at: `https://palabra-nu.vercel.app/.well-known/assetlinks.json`

---

**Option 2: WebView Wrapper (Alternative)**

Use tools like:
- **Capacitor** (recommended, more control)
- **Cordova** (older, stable)
- **Android Studio** (manual WebView setup)

---

#### **6.2 Upload App Bundle**

1. **Create New Release**
2. **Upload AAB (Android App Bundle)** - preferred over APK
   - File: `palabra-release.aab`
   - Signed with your keystore
3. **Release Name:** 1.0.0 (Version 1)
4. **Release Notes:**
   ```
   🎉 Welcome to Palabra 1.0!
   
   The most intelligent Spanish vocabulary app is here:
   
   🧠 INTELLIGENT FEATURES
   • 5 varied review methods for better retention
   • AI-generated examples tailored to your level (A1-C2)
   • Smart spaced repetition with method-specific optimization
   • Interference detection for confused word pairs
   • Bidirectional practice (ES→EN and EN→ES)
   
   ✨ BEAUTIFUL DESIGN
   • Apple-inspired UI with Activity Rings
   • Streak tracking with glowing animations
   • 12 achievement badges
   • Dark mode support
   
   📊 TRACK YOUR GROWTH
   • Real-time retention metrics
   • Method performance analytics
   • Beautiful charts and visualizations
   
   💰 GENEROUS FREE TIER
   • Unlimited vocabulary words
   • All 5 review methods
   • Cloud sync included
   
   Download now and start mastering Spanish vocabulary!
   ```
   (500 characters max per language)

---

#### **6.3 Countries/Regions**

**Available in:**
- All countries and regions (195 countries) ✓

**Exclude countries (if needed):**
- (None - make available globally)

---

### **Phase 7: Pricing & Distribution**

Navigate to **Release → Production → Countries/regions and pricing**

**Pricing:**
- **Free** (app is free, premium via Stripe)
- **Contains in-app purchases:** Yes
  - Premium Monthly: €4.99
  - Premium Yearly: €39.99
  - Lifetime: €79.99

**Distribution:**
- **Available on Google Play:** Yes ✓

**Device Categories:**
- Phone ✓
- Tablet ✓
- Chromebook ✓ (PWA works on all devices)
- Wear OS (optional, not needed for v1.0)
- Android TV (optional, not needed for v1.0)

---

### **Phase 8: In-App Products (Optional)**

If you want to offer Google Play Billing (alternative to Stripe):

Navigate to **Monetize → Products → Subscriptions**

**Create Subscription #1: Premium Monthly**
- **Product ID:** premium_monthly
- **Name:** Premium Monthly
- **Description:** Unlock all premium features with monthly subscription
- **Billing period:** 1 month
- **Price:** €4.99
- **Free trial:** 14 days (optional)
- **Grace period:** 3 days (allows payment retry)

**Create Subscription #2: Premium Yearly**
- **Product ID:** premium_yearly
- **Billing period:** 1 year
- **Price:** €39.99
- **Free trial:** 14 days

**Create One-Time Product: Lifetime Premium**
- Navigate to **Monetize → Products → In-app products**
- **Product ID:** premium_lifetime
- **Price:** €79.99

**Important:** You'll need to integrate Google Play Billing API if using this approach. Google takes 15-30% commission.

---

### **Phase 9: Pre-Launch Report (Recommended)**

Navigate to **Release → Testing → Pre-launch report**

**What it does:**
- Google automatically tests your app on real devices
- Identifies crashes, performance issues, security vulnerabilities
- Generates report with screenshots and logs

**How to use:**
1. Upload signed APK/AAB (same as production build)
2. Wait 30-60 minutes for testing
3. Review report for issues
4. Fix critical issues before production release

**Benefits:**
- Catch bugs early
- Test on devices you don't own
- Improve app quality
- Reduce 1-star reviews from crashes

---

### **Phase 10: Submit for Review**

#### **10.1 Review Pre-Submission Checklist**

- [ ] All dashboard tasks completed (green checkmarks)
- [ ] App icon uploaded (512×512px)
- [ ] Feature graphic uploaded (1024×500px)
- [ ] 6+ screenshots uploaded (phone + tablet)
- [ ] Full description written (compelling, under 4000 chars)
- [ ] Privacy Policy accessible
- [ ] Data Safety questionnaire complete
- [ ] Content rating received (Everyone)
- [ ] Signed AAB/APK uploaded
- [ ] Release notes written
- [ ] Demo account credentials provided
- [ ] Pre-launch report reviewed (if used)

---

#### **10.2 Submit for Review**

1. **Navigate to:** Release → Production
2. **Click "Review release"**
3. **Verify all information**
4. **Click "Start rollout to Production"**

**What Happens Next:**
- **Under review:** 1-3 days (average)
- **Approved:** App goes live automatically
- **Rejected:** Email with reasons + how to fix

**Review Timeline:**
- First submission: 3-7 days (more thorough)
- Updates: 1-3 days (faster)
- Policy violations: Can take longer

---

## 📊 **Post-Submission**

### **Monitoring Dashboard**

**Google Play Console Analytics:**
- **Statistics:** Installs, uninstalls, ratings
- **Crashes & ANRs:** App stability metrics
- **Reviews:** User feedback
- **Financial reports:** Revenue (if using Google Play Billing)

**Key Metrics to Monitor:**
- Install rate
- Uninstall rate
- Crashes per user session
- Average rating (aim for 4.5+)

---

### **Responding to Reviews**

1. **Navigate to:** Ratings and reviews
2. **Filter:** Show only recent, or filter by rating
3. **Reply to reviews:**
   - Click "Reply" under review
   - Keep response professional, helpful
   - Under 350 characters
   - Offer support email for issues

**Best Practices:**
- Reply within 24-48 hours
- Acknowledge user feedback
- Fix issues mentioned in reviews
- Thank positive reviewers
- Don't argue with negative reviewers

---

### **Publishing Updates**

**Create New Release:**
1. **Navigate to:** Release → Production → Create new release
2. **Upload new AAB** with incremented version code
3. **Write release notes** (what's new)
4. **Choose rollout type:**
   - **Full rollout:** 100% of users immediately
   - **Staged rollout:** Gradual (1% → 5% → 10% → 50% → 100%)
5. **Review and rollout**

**Staged Rollout Benefits:**
- Catch crashes early (small percentage affected)
- Monitor metrics before full rollout
- Can halt rollout if critical issues found

**Update Frequency:**
- Bug fixes: As needed
- New features: Monthly or quarterly
- Critical security fixes: Immediately

---

## 🚨 **Common Rejection Reasons & Fixes**

### **1. Broken Demo Account**
**Issue:** Reviewer can't log in or use app features
**Fix:**
- Test demo credentials in production
- Ensure account has sample vocabulary data
- Provide step-by-step testing instructions

### **2. Missing Privacy Policy**
**Issue:** Privacy policy link broken or incomplete
**Fix:**
- Verify URL is accessible: https://palabra-nu.vercel.app/privacy
- Ensure policy covers all data collection
- Match Data Safety disclosures with policy

### **3. Misleading Store Listing**
**Issue:** Screenshots or description don't match app
**Fix:**
- Use actual app screenshots (no mockups or design concepts)
- Ensure description accurately reflects features
- Remove exaggerated claims

### **4. Copyright Violations**
**Issue:** App icon or content uses copyrighted material
**Fix:**
- Use original designs only
- License any third-party content
- Attribute OpenAI-generated content properly

### **5. In-App Purchases Not Declared**
**Issue:** App has purchases but not declared in listing
**Fix:**
- Check "Contains in-app purchases" in store listing
- Clearly display pricing before purchase
- Implement Google Play Billing (or disclose Stripe external payments)

### **6. Target Audience Mismatch**
**Issue:** Content rating doesn't match actual content
**Fix:**
- Re-take content rating questionnaire
- Ensure AI-generated examples are appropriate for "Everyone"
- Add content filters if needed

---

## 📚 **Resources**

### **Official Documentation**
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [Android Developer Documentation](https://developer.android.com/)

### **PWA/TWA Tools**
- [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) - Official TWA builder
- [PWABuilder](https://www.pwabuilder.com/) - Generate Android package from PWA
- [Capacitor](https://capacitorjs.com/) - Native container for web apps

### **Design Resources**
- [Material Design Guidelines](https://material.io/design)
- [Android App Icon Guidelines](https://developer.android.com/google-play/resources/icon-design-specifications)

### **Support**
- [Google Play Developer Community](https://support.google.com/googleplay/android-developer/community)
- [Stack Overflow - google-play](https://stackoverflow.com/questions/tagged/google-play)

---

## ✅ **Final Checklist**

- [ ] Google Play Console account registered and verified
- [ ] App created in Google Play Console
- [ ] Store listing complete (name, description, screenshots)
- [ ] App icon uploaded (512×512px)
- [ ] Feature graphic uploaded (1024×500px)
- [ ] 6+ phone screenshots uploaded (1080×1920px)
- [ ] Privacy Policy published and linked
- [ ] Data Safety questionnaire completed
- [ ] Content rating obtained (Everyone)
- [ ] Demo account created and tested
- [ ] Signed AAB/APK built and uploaded
- [ ] Release notes written
- [ ] Pre-launch report reviewed (optional but recommended)
- [ ] Submitted for review
- [ ] Monitoring dashboard checked daily

---

**Status:** Ready for submission  
**Estimated Setup Time:** 3-5 hours (first time), 1-2 hours (updates)  
**Review Time:** 1-7 days (average 3 days for first submission)

**Next Steps:**
1. Complete Google Play Console registration
2. Build TWA or WebView wrapper for PWA
3. Upload all assets and complete store listing
4. Run pre-launch report
5. Submit for review
6. Monitor for approval (1-7 days)
