# Apple App Store Setup Guide - Palabra

**Last Updated:** February 12, 2026  
**App Name:** Palabra - Spanish Vocabulary  
**Developer:** Kalvin Brookes  
**Target Launch:** Q1 2026

---

## 📋 **Prerequisites**

### **Before You Begin**
- [ ] Apple Developer Account ($99/year) - [Enroll Here](https://developer.apple.com/programs/enroll/)
- [ ] All app assets prepared (icon, screenshots, metadata)
- [ ] Privacy Policy and Terms of Service published
- [ ] Production build tested and verified
- [ ] Test user accounts created

**Important:** Apple Developer Account approval can take 24-48 hours. Start this process early!

---

## 🚀 **Step-by-Step Setup**

### **Phase 1: Apple Developer Account Setup**

#### **1.1 Enroll in Apple Developer Program**

1. **Go to:** [developer.apple.com/programs](https://developer.apple.com/programs/enroll/)
2. **Sign in** with your Apple ID (or create one)
3. **Choose Entity Type:**
   - **Individual** (Kalvin Brookes) - Simplest, fastest approval
   - **Organization** (requires D-U-N-S number, takes longer)
4. **Accept Agreement** and complete enrollment
5. **Pay $99/year** fee via Apple ID payment method
6. **Wait for Approval** (24-48 hours)

**Status Check:** You'll receive email when approved: "Welcome to the Apple Developer Program"

---

#### **1.2 Complete Developer Profile**

Once approved:

1. **Go to:** [developer.apple.com/account](https://developer.apple.com/account)
2. **Complete Profile:**
   - Name: Kalvin Brookes
   - Email: kbrookes2507@gmail.com
   - Phone: (your phone number)
   - Address: (your address)
3. **Set up Two-Factor Authentication** (required for App Store Connect)

---

### **Phase 2: App Store Connect Configuration**

#### **2.1 Create New App**

1. **Go to:** [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Sign in** with Apple ID
3. **Click "My Apps"** → **"+"** → **"New App"**

4. **Fill in App Information:**
   - **Platforms:** iOS ✓ (check this)
   - **Name:** Palabra - Spanish Vocabulary
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.kalvinbrookes.palabra (create new)
     - Click "Register a New Bundle ID"
     - Description: Palabra Spanish Vocabulary
     - Identifier: com.kalvinbrookes.palabra
   - **SKU:** palabra-app-2026 (internal identifier, choose any)
   - **User Access:** Full Access

5. **Click "Create"**

---

#### **2.2 App Information**

Navigate to **App Information** section:

**Name & Privacy:**
- **Name:** Palabra - Spanish Vocabulary (max 30 chars)
- **Subtitle:** Master Spanish with AI-Powered Learning (max 30 chars)
- **Category:**
  - **Primary:** Education
  - **Secondary:** Reference
- **Content Rights:** Contains third-party content (check if using OpenAI)
- **Age Rating:** Click "Edit" and complete questionnaire

**Age Rating Questionnaire:**
- Cartoon or Fantasy Violence: None
- Realistic Violence: None
- Sexual Content or Nudity: None
- Profanity or Crude Humor: None
- Alcohol, Tobacco, or Drug Use: None
- Mature/Suggestive Themes: None
- Simulated Gambling: None
- Horror/Fear Themes: None
- Prolonged Graphic Violence: None
- Graphic Sexual Content: None
- Unrestricted Web Access: No
- Gambling: No

**Result:** 4+ (No objectionable content)

**Privacy Policy:**
- **Privacy Policy URL:** https://palabra-nu.vercel.app/privacy

**App Clips (Skip for now)**

---

#### **2.3 Pricing and Availability**

Navigate to **Pricing and Availability**:

**Availability:**
- **Available in:** All territories (195 countries)
- **Pre-Order:** Not enabled (launch immediately upon approval)

**Price Schedule:**
- **Base Price:** Free (app is free, subscriptions handled via Stripe)
- **App Store Pricing:** Select "Free"

**App Distribution:**
- **App Store:** Make this app available on the App Store ✓

---

#### **2.4 App Privacy**

Navigate to **App Privacy**:

Click **"Get Started"**

**Data Collection:**

**1. Contact Info**
- **Email Address**
  - Collected: Yes
  - Linked to User: Yes
  - Used for: Account Creation, Product Personalization, App Functionality
  - Tracking: No

**2. User Content**
- **Other User Content** (vocabulary lists, study data)
  - Collected: Yes
  - Linked to User: Yes
  - Used for: App Functionality, Product Personalization
  - Tracking: No

**3. Usage Data**
- **Product Interaction** (app usage, review sessions)
  - Collected: Yes
  - Linked to User: Yes
  - Used for: Analytics, Product Personalization, App Functionality
  - Tracking: No

**Data Practices:**
- Optional Data Collection: Some data collection is optional (can use app without account)
- Data Security: All data encrypted in transit (TLS 1.3)
- Data Deletion: Users can request deletion via Settings or email

**Privacy Policy:** Link to https://palabra-nu.vercel.app/privacy

---

### **Phase 3: Version Information**

#### **3.1 Create First Version**

Navigate to **"1.0 Prepare for Submission"**:

**Screenshots:**
- **iPhone 6.7" Display (Required):**
  - Upload 6 screenshots (1290×2796px)
  - Order: Home → Review Methods → Vocabulary → Progress → Session → Subscription
- **iPhone 6.5" Display (Optional but recommended):**
  - Upload 6 screenshots (1242×2688px)
- **iPad Pro 12.9" (Optional):**
  - Upload 6 screenshots (2048×2732px)

**Promotional Text (Optional):**
```
NEW: Interference Detection! Palabra now identifies confused word pairs and provides targeted comparative review. Master Spanish faster than ever.
```
(170 characters max, can be updated anytime without review)

**Description:**
```
Transform your Spanish vocabulary learning with Palabra - the most intelligent and beautiful vocabulary app available.

🎯 DESIGNED FOR REAL LEARNING
Palabra isn't just another flashcard app. It's a complete learning system backed by cognitive science research, featuring:

• 5 VARIED REVIEW METHODS - Traditional flashcards, fill-in-the-blank, multiple choice, audio recognition, and context selection. Each method strengthens different aspects of memory.

• AI-POWERED EXAMPLES - Get 3 contextually rich example sentences tailored to your proficiency level (A1-C2 CEFR). Every word comes alive with real usage.

• SMART SPACED REPETITION - Our enhanced SM-2 algorithm adapts to your performance across different review methods, optimizing when you see each word for maximum retention.

... (see metadata.md for full 4000-character description)
```

**Keywords:**
```
spanish,vocabulary,flashcards,learning,language,study,education,spaced repetition,AI,immersion
```
(100 characters max, comma-separated)

**Support URL:**
```
mailto:kbrookes2507@gmail.com
```

**Marketing URL (Optional):**
```
https://palabra-nu.vercel.app
```

**What's New in This Version:**
```
🎉 Welcome to Palabra 1.0!

The most intelligent Spanish vocabulary app is here:

🧠 INTELLIGENT FEATURES
• 5 varied review methods for better retention
• AI-generated examples tailored to your level (A1-C2)
• Smart spaced repetition with method-specific optimization
... (see metadata.md for full 4000-character text)
```

---

#### **3.2 Build Information**

**App Clip (Skip for PWA)**

**Build:** 
- Since Palabra is a Progressive Web App (PWA), you won't upload a traditional iOS binary
- **Alternative Approach:**
  1. **Wrap PWA in iOS app** using tools like:
     - [PWABuilder](https://www.pwabuilder.com/) (recommended, free)
     - [Capacitor](https://capacitorjs.com/) (more control)
     - [Cordova](https://cordova.apache.org/) (older, stable)
  
  2. **Or submit as "Web App" listing:**
     - Less common but possible
     - Requires special approval from Apple
     - May not be accepted (Apple prefers native or wrapped PWAs)

**Recommended: Wrap PWA using PWABuilder**
```bash
# Install PWABuilder CLI
npm install -g pwabuilder

# Generate iOS app package
pwa-builder https://palabra-nu.vercel.app

# Follow prompts to generate Xcode project
# Upload to App Store Connect via Xcode
```

---

#### **3.3 Additional Information**

**Export Compliance:**
- Uses Encryption: Yes (HTTPS for data transmission)
- Exempt from Export Compliance: Yes (standard encryption only)

**Content Rights:**
- Contains third-party content: Yes (OpenAI-generated examples)
- Uses third-party content with permission: Yes

**Advertising Identifier (IDFA):**
- Serves advertisements: No
- Attributes actions: No
- Limits ad tracking: N/A (no ads)

**Age Rating:**
- Confirmed 4+ (from earlier questionnaire)

---

### **Phase 4: In-App Purchases (Subscriptions)**

**Important:** Since Palabra uses Stripe for subscriptions (not Apple IAP), you need to handle this carefully:

#### **Option 1: External Payment Link (Recommended for Web App)**
- Use "Reader" app exemption (education apps can link to external payments)
- Add clear disclosure: "Payment processed securely by Stripe"
- Link to web-based subscription page

#### **Option 2: Apple In-App Purchases (If required by Apple)**
If Apple rejects external payments:

1. **Navigate to:** Features → In-App Purchases → **"+"**
2. **Create Subscriptions:**

**Auto-Renewable Subscription #1: Premium Monthly**
- Reference Name: Premium Monthly Subscription
- Product ID: com.kalvinbrookes.palabra.premium.monthly
- Subscription Group: Premium Access (create new group)
- Subscription Duration: 1 month
- Price: €4.99 (Tier 4)
- Description: "Unlock all premium features with monthly subscription"
- Localization: English (U.S.)

**Auto-Renewable Subscription #2: Premium Yearly**
- Reference Name: Premium Yearly Subscription
- Product ID: com.kalvinbrookes.palabra.premium.yearly
- Subscription Duration: 1 year
- Price: €39.99 (Tier 39)
- Description: "Unlock all premium features with yearly subscription (save €20!)"

**Non-Renewing Subscription: Lifetime Premium**
- Reference Name: Lifetime Premium
- Product ID: com.kalvinbrookes.palabra.premium.lifetime
- Duration: Lifetime (non-renewing)
- Price: €79.99 (Tier 79)
- Description: "Unlock all premium features forever"

**Note:** You'll need to modify the app to use StoreKit (Apple's IAP framework) if going this route. Apple takes 30% commission.

---

### **Phase 5: Submit for Review**

#### **5.1 Pre-Submission Checklist**

- [ ] All screenshots uploaded (6 for iPhone 6.7")
- [ ] App icon uploaded (1024×1024px)
- [ ] Description complete (compelling, under 4000 chars)
- [ ] Keywords optimized (100 chars, relevant)
- [ ] Privacy Policy accessible (https://palabra-nu.vercel.app/privacy)
- [ ] Build uploaded (if wrapped PWA) or web app submission prepared
- [ ] Age rating completed (4+)
- [ ] In-app purchases configured (if using Apple IAP)
- [ ] App reviewed notes prepared (see below)

---

#### **5.2 App Review Information**

**Contact Information:**
- First Name: Kalvin
- Last Name: Brookes
- Phone: (your phone)
- Email: kbrookes2507@gmail.com

**Demo Account (Required):**
- Username: reviewer@palabra.app
- Password: ReviewPalabra2026!
- Instructions: "Sign in and select B1 (Intermediate) proficiency. Add a word (try 'aprender'), start a review session, and explore all 5 review methods."

**Notes:**
```
DEMO ACCOUNT CREDENTIALS:
Email: reviewer@palabra.app
Password: ReviewPalabra2026!

TESTING INSTRUCTIONS:
1. Sign up and complete proficiency onboarding (select B1 - Intermediate)
2. Add a vocabulary word (try "aprender" - to learn)
3. Start a review session (Home → "Start Review" button)
4. Try all 5 review methods (swipe or complete session to see variety)
5. View progress dashboard (bottom nav → "Progress")
6. Check settings (bottom nav → "Settings")

SUBSCRIPTION INFO:
• Subscriptions handled via Stripe (external payment provider)
• Free tier is fully functional (not a trial)
• Premium features clearly marked with upgrade prompts
• Users can cancel anytime via Stripe billing portal

PRIVACY & DATA:
• Full Privacy Policy: https://palabra-nu.vercel.app/privacy
• App works 100% offline (optional cloud sync)
• No third-party tracking or ads
• GDPR/CCPA compliant

TECHNICAL NOTES:
• Progressive Web App (PWA) architecture
• Requires modern browser (Safari 14+)
• Offline-first design (IndexedDB + Service Worker)
• Internet required for initial AI example generation only

KNOWN LIMITATIONS:
• First load requires internet connection
• AI examples require OpenAI API (internet connection)
• Cloud sync requires account creation (optional)

CONTACT:
Email: kbrookes2507@gmail.com
Response time: < 4 hours during business hours (9am-5pm PST)
```

---

#### **5.3 Version Release**

**Release Options:**
- **Manually release this version** (Recommended)
  - Allows you to control launch timing
  - Can coordinate with Product Hunt launch
  
- **Automatically release this version**
  - Goes live immediately upon approval
  - Less control, but faster

**Phased Release:**
- Enable: No (for v1.0, go full release)
- Consider for future updates (gradual rollout to 1% → 100%)

---

#### **5.4 Submit for Review**

1. **Review all sections** (App Store Connect highlights incomplete sections)
2. **Click "Submit for Review"** (top right)
3. **Confirm Submission**

**What Happens Next:**
- **Waiting for Review:** 24-48 hours (average)
- **In Review:** 1-3 hours (reviewers test your app)
- **Pending Developer Release:** Approved! (if manual release selected)
- **Ready for Sale:** Live on App Store! 🎉

---

## 📊 **Post-Submission**

### **Monitoring**

**App Store Connect Dashboard:**
- **App Analytics:** Downloads, sessions, crashes
- **Sales & Trends:** Revenue (if using Apple IAP)
- **Ratings & Reviews:** User feedback
- **TestFlight:** Beta testing metrics

**Responding to Reviews:**
1. **Navigate to:** Ratings and Reviews
2. **Reply to reviews** (especially negative ones)
3. **Keep responses:**
   - Professional and empathetic
   - Under 500 characters
   - Offer support email for issues
   - Thank positive reviewers

---

### **Updates & Maintenance**

**Release Updates:**
1. **Create New Version** (e.g., 1.0.1, 1.1.0)
2. **Upload new build** (if applicable)
3. **Update "What's New"** text
4. **Submit for Review**

**Update Frequency:**
- Bug fixes: As needed (fast approval, usually < 24 hours)
- New features: Monthly or quarterly
- Metadata updates: Anytime (no review needed for promotional text, screenshots)

---

## 🚨 **Common Rejection Reasons & Fixes**

### **1. Incomplete Demo Account**
**Issue:** Reviewer can't sign in or access features
**Fix:** 
- Verify demo account works in production
- Ensure account has sample data (vocabulary, review history)
- Test account credentials before submission

### **2. External Payment Link**
**Issue:** Apple rejects Stripe payment link
**Fix:**
- Apply for "Reader App" exemption (education apps)
- Or implement Apple In-App Purchases (IAP)
- Clearly disclose external payment provider

### **3. PWA Technical Issues**
**Issue:** Web app doesn't work offline or has slow loading
**Fix:**
- Verify service worker caching
- Test offline functionality thoroughly
- Optimize bundle size

### **4. Privacy Policy Missing**
**Issue:** Privacy policy link broken or incomplete
**Fix:**
- Verify https://palabra-nu.vercel.app/privacy is accessible
- Ensure policy covers all data collection practices
- Add clear GDPR/CCPA compliance statements

### **5. Metadata Misleading**
**Issue:** Screenshots or description don't match actual app
**Fix:**
- Use actual app screenshots (no mockups)
- Ensure description accurately reflects features
- Remove any exaggerated claims

---

## 📚 **Resources**

### **Official Documentation**
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### **PWA Tools**
- [PWABuilder](https://www.pwabuilder.com/) - Wrap PWA for iOS
- [Capacitor](https://capacitorjs.com/) - Native container for web apps
- [TWA (Trusted Web Activities)](https://developers.google.com/web/android/trusted-web-activity) - For Android

### **Support**
- [Apple Developer Forums](https://developer.apple.com/forums/)
- [Stack Overflow - ios-app-store](https://stackoverflow.com/questions/tagged/ios-app-store)

---

## ✅ **Final Checklist**

- [ ] Apple Developer Account approved
- [ ] App created in App Store Connect
- [ ] All metadata entered (name, description, keywords)
- [ ] 6+ screenshots uploaded (1290×2796px)
- [ ] App icon uploaded (1024×1024px)
- [ ] Privacy Policy live and linked
- [ ] Terms of Service live and linked
- [ ] Age rating completed (4+)
- [ ] Demo account created and tested
- [ ] App review notes written
- [ ] Build uploaded (if wrapped PWA) or web app configured
- [ ] Subscription system configured (Stripe or Apple IAP)
- [ ] Submitted for review
- [ ] Monitoring dashboard checked daily

---

**Status:** Ready for submission  
**Estimated Setup Time:** 4-6 hours (first time), 1-2 hours (subsequent updates)  
**Review Time:** 24-72 hours average

**Next Steps:**
1. Complete Apple Developer Account enrollment
2. Wrap PWA using PWABuilder (if needed)
3. Upload all assets to App Store Connect
4. Submit for review
5. Coordinate launch with marketing activities
