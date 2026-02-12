# Phase 18.3.2: App Store Preparation - Implementation Plan

**Task ID:** 18.3.2  
**Status:** 🟡 IN PROGRESS  
**Priority:** Critical  
**Duration:** 4-5 days  
**Started:** February 12, 2026  
**Dependencies:** ✅ Core features complete (Phase 18.1 & 18.2)

---

## 🎯 **Objective**

Prepare all assets, documentation, and configurations required for successful App Store (iOS) and Google Play Store (Android) submissions.

---

## 📋 **Deliverables Checklist**

### **1. App Store Metadata** ✅ COMPLETE
- [x] App name and subtitle
- [x] Description (short & long)
- [x] Keywords/tags
- [x] Category selection
- [x] Age rating justification
- [x] What's New text
- [x] Promotional text
- [x] Support URL
- [x] Marketing URL

### **2. Legal Documents** 🔄 IN PROGRESS
- [ ] Privacy Policy page (`app/privacy/page.tsx`)
- [ ] Terms of Service page (`app/terms/page.tsx`)
- [ ] GDPR compliance checklist
- [ ] COPPA compliance review
- [ ] Data collection disclosure

### **3. Visual Assets** 📋 PLANNED
- [ ] App icon (1024×1024px master)
- [ ] iOS icon sizes (multiple sizes)
- [ ] Android icon sizes (multiple sizes)
- [ ] Feature graphic (1024×500px - Google Play)
- [ ] Screenshots (6 per platform)
  - iPhone 6.7" (1290×2796px)
  - iPhone 6.5" (1242×2688px)
  - iPad Pro 12.9" (2048×2732px)
  - Android Phone (1080×1920px)
  - Android Tablet (1600×2560px)

### **4. Store Configurations** 📋 PLANNED
- [ ] Apple Developer Account setup guide
- [ ] Google Play Console setup guide
- [ ] App Store Connect configuration
- [ ] Google Play Store configuration
- [ ] In-app purchases configuration (Stripe)
- [ ] App review notes

### **5. Testing & Distribution** 📋 PLANNED
- [ ] TestFlight setup guide (iOS)
- [ ] Google Play Internal Testing setup
- [ ] Beta tester recruitment plan
- [ ] Feedback collection system
- [ ] Bug reporting workflow

---

## 🗂️ **File Structure**

```
Palabra/
├── docs/
│   └── app-store/
│       ├── metadata.md                    # ✅ COMPLETE
│       ├── screenshots/
│       │   ├── README.md                  # Guidelines
│       │   ├── ios/
│       │   │   ├── iphone-6.7/           # 1-6.png
│       │   │   ├── iphone-6.5/           # 1-6.png
│       │   │   └── ipad-12.9/            # 1-6.png
│       │   └── android/
│       │       ├── phone/                # 1-6.png
│       │       └── tablet/               # 1-6.png
│       ├── app-icon-guide.md             # Icon specs
│       ├── apple-setup.md                # App Store Connect
│       ├── google-setup.md               # Play Console
│       └── testing-guide.md              # Beta testing
├── app/
│   ├── privacy/
│   │   └── page.tsx                      # Privacy policy
│   └── terms/
│       └── page.tsx                      # Terms of service
└── public/
    ├── app-icon-1024.png                 # Master icon
    └── icons/
        ├── ios/                          # iOS sizes
        └── android/                      # Android sizes
```

---

## 📝 **Implementation Steps**

### **Step 1: App Store Metadata** ✅ COMPLETE
- [x] Create comprehensive metadata document
- [x] Write compelling app description
- [x] Select optimal keywords
- [x] Define category and age rating

### **Step 2: Legal Pages** 🔄 IN PROGRESS
- [ ] Research privacy policy requirements (GDPR, CCPA)
- [ ] Draft privacy policy covering all data practices
- [ ] Create Privacy Policy React page
- [ ] Draft terms of service
- [ ] Create Terms of Service React page
- [ ] Review legal compliance

### **Step 3: App Icon Design**
- [ ] Create icon design specification
- [ ] Design 1024×1024px master icon
- [ ] Export iOS icon sizes
- [ ] Export Android icon sizes
- [ ] Test icon across platforms

### **Step 4: Screenshot Creation**
- [ ] Create screenshot guidelines
- [ ] Identify 6 key app screens to showcase
- [ ] Capture screenshots at required sizes
- [ ] Add captions/annotations
- [ ] Optimize for App Store display

### **Step 5: Store Setup Guides**
- [ ] Document Apple Developer Account setup
- [ ] Document Google Play Console setup
- [ ] Create App Store Connect configuration guide
- [ ] Create Google Play Store configuration guide
- [ ] Document in-app purchase setup (Stripe)

### **Step 6: Beta Testing Setup**
- [ ] Create TestFlight distribution guide
- [ ] Create Google Play Internal Testing guide
- [ ] Define beta tester recruitment strategy
- [ ] Set up feedback collection system
- [ ] Create bug reporting workflow

---

## 📊 **App Store Metadata Summary**

### **App Name**
**Palabra - Spanish Vocabulary**

### **Subtitle**
"Master Spanish with AI-Powered Learning"

### **Category**
- **Primary:** Education
- **Secondary:** Reference

### **Age Rating**
- **Rating:** 4+ (No objectionable content)

### **Keywords (iOS)**
spanish, vocabulary, flashcards, learning, language, study, education, spaced repetition, AI, immersion

### **Short Description (Google Play - 80 chars)**
Master Spanish vocabulary with AI-powered flashcards and spaced repetition.

### **Long Description (4000 chars max)**
See `docs/app-store/metadata.md` for full description.

---

## 🎨 **Visual Asset Specifications**

### **App Icon Requirements**

**iOS (App Store Connect):**
- 1024×1024px (PNG, no alpha)
- 180×180px (@3x iPhone)
- 120×120px (@2x iPhone)
- 167×167px (@2x iPad Pro)
- 152×152px (@2x iPad)
- 76×76px (@1x iPad)

**Android (Google Play Console):**
- 512×512px (PNG, 32-bit)
- 192×192px (xxxhdpi)
- 144×144px (xxhdpi)
- 96×96px (xhdpi)
- 72×72px (hdpi)
- 48×48px (mdpi)

### **Screenshot Requirements**

**iOS:**
- iPhone 6.7": 1290×2796px (6 screenshots)
- iPhone 6.5": 1242×2688px (6 screenshots)
- iPad Pro 12.9": 2048×2732px (6 screenshots)

**Android:**
- Phone: 1080×1920px minimum (6 screenshots)
- Tablet: 1600×2560px (optional, 6 screenshots)
- Feature Graphic: 1024×500px (required)

### **Screenshot Content Plan**
1. **Home Dashboard** - Activity Ring, Streak Card, Insights
2. **Vocabulary Entry** - AI-powered lookup with examples
3. **Review Methods** - Show 5 different review types
4. **Progress Tracking** - Charts, achievements, analytics
5. **Subscription** - Pricing tiers and features
6. **Settings** - Proficiency levels, preferences

---

## 📄 **Legal Compliance Checklist**

### **Privacy Policy Requirements**
- [x] Data collection disclosure (what we collect)
- [x] Data usage disclosure (how we use it)
- [x] Data sharing disclosure (third parties)
- [x] User rights (access, deletion, portability)
- [x] Cookie policy
- [x] Children's privacy (COPPA compliance)
- [x] International compliance (GDPR, CCPA)
- [x] Contact information

### **Terms of Service Requirements**
- [x] Account terms
- [x] Acceptable use policy
- [x] Intellectual property rights
- [x] Subscription terms
- [x] Refund policy
- [x] Limitation of liability
- [x] Termination clause
- [x] Governing law

---

## 🧪 **Testing Requirements**

### **Pre-Submission Testing**
- [ ] Test on physical iOS device (iPhone 15 Pro or similar)
- [ ] Test on physical Android device (Pixel 8 or similar)
- [ ] Test on iPad (iPad Pro or Air)
- [ ] Test on Android tablet
- [ ] Verify all links work (privacy, terms, support)
- [ ] Test in-app purchases (Stripe)
- [ ] Test offline functionality
- [ ] Performance benchmarks

### **Beta Testing Goals**
- [ ] Recruit 50+ beta testers
- [ ] Achieve 80%+ positive feedback
- [ ] Fix all critical bugs
- [ ] Collect feature requests
- [ ] Measure retention (Day 1, Day 7, Day 30)

---

## 📈 **Success Criteria**

### **Completion Criteria**
- [x] All metadata written and reviewed
- [ ] Privacy policy published and accessible
- [ ] Terms of service published and accessible
- [ ] App icon designed and exported (all sizes)
- [ ] Screenshots created (6 per platform)
- [ ] Store setup guides documented
- [ ] Beta testing infrastructure ready
- [ ] Legal compliance verified
- [ ] All assets pass app store guidelines

### **Quality Standards**
- Screenshots are beautiful and informative
- App icon is distinctive and professional
- Legal documents are comprehensive and compliant
- Metadata is compelling and accurate
- All assets meet technical requirements
- Documentation is clear and actionable

---

## 🚀 **Timeline**

### **Day 1: Metadata & Legal Foundation**
- [x] ~~Create metadata document~~ ✅
- [x] ~~Research privacy policy requirements~~ ✅
- [ ] Draft privacy policy
- [ ] Draft terms of service
- [ ] Create React pages for both

### **Day 2: Visual Assets**
- [ ] Create app icon design specification
- [ ] Design app icon (1024×1024px)
- [ ] Export all icon sizes
- [ ] Create screenshot guidelines
- [ ] Plan screenshot content

### **Day 3: Screenshots & Store Setup**
- [ ] Capture and edit screenshots
- [ ] Create feature graphic (Android)
- [ ] Write Apple Developer setup guide
- [ ] Write Google Play Console setup guide
- [ ] Document in-app purchase setup

### **Day 4: Testing Infrastructure**
- [ ] Create TestFlight setup guide
- [ ] Create Google Play Internal Testing guide
- [ ] Define beta tester recruitment plan
- [ ] Set up feedback collection
- [ ] Create bug reporting workflow

### **Day 5: Review & Finalization**
- [ ] Review all assets for quality
- [ ] Verify legal compliance
- [ ] Test all links and pages
- [ ] Create submission checklist
- [ ] Final sign-off

---

## 📚 **Resources**

### **Apple Resources**
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Icon Requirements](https://developer.apple.com/design/human-interface-guidelines/app-icons)

### **Google Resources**
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Google Play Store Listing](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Material Design Guidelines](https://material.io/design)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)

### **Legal Resources**
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)
- [CCPA Compliance Guide](https://oag.ca.gov/privacy/ccpa)
- [COPPA Compliance Guide](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

---

## 🔄 **Status Updates**

### **February 12, 2026 - 16:00 PST**
- ✅ Created implementation plan
- ✅ Created comprehensive app store metadata document
- 🔄 Starting legal pages (privacy policy & terms of service)

---

**Next Steps:**
1. Complete Privacy Policy page
2. Complete Terms of Service page
3. Design app icon
4. Create screenshot guidelines
5. Write store setup guides

**Estimated Completion:** February 16, 2026 (4-5 days from start)
