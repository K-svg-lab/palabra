# Beta Testing & Distribution Guide - Palabra

**Last Updated:** February 12, 2026  
**Purpose:** Set up beta testing infrastructure for iOS (TestFlight) and Android (Internal Testing)  
**Goal:** Recruit 50+ beta testers, collect feedback, fix bugs before public launch

---

## 🎯 **Beta Testing Strategy**

### **Objectives**
1. **Identify Critical Bugs** - Catch crashes, UI issues, data loss
2. **Validate UX** - Ensure learning flow is intuitive
3. **Test Performance** - Verify smooth experience across devices
4. **Collect Feedback** - Feature requests, improvement suggestions
5. **Build Buzz** - Early adopters become advocates

### **Success Metrics**
- **50+ beta testers** recruited
- **80%+ positive feedback** (4+ stars)
- **<5% crash rate** (industry standard: <1%)
- **Critical bugs fixed** before launch
- **20+ detailed feedback submissions**

---

## 📱 **iOS TestFlight Setup**

### **Overview**
TestFlight is Apple's official beta testing platform for iOS apps.

**Benefits:**
- Up to 10,000 external testers
- Easy distribution (email invite or public link)
- Crash reports and feedback built-in
- No need for device UDIDs

---

### **Step 1: Prepare Build**

#### **1.1 Version Requirements**

**Build Settings:**
- **Version Number:** 1.0.0
- **Build Number:** 1 (increment for each build: 1, 2, 3...)
- **Bundle Identifier:** com.kalvinbrookes.palabra
- **Signing:** Use distribution certificate (not development)

#### **1.2 Export Archive**

If using Xcode (wrapped PWA):
1. **Product → Archive**
2. **Distribute App → App Store Connect**
3. **Upload** (wait 5-10 minutes for processing)

If using PWABuilder or Capacitor:
- Follow tool-specific build instructions
- Export `.ipa` file
- Upload to App Store Connect via Transporter app

---

### **Step 2: Configure TestFlight**

Navigate to **App Store Connect → My Apps → Palabra → TestFlight**

#### **2.1 Build Information**

1. **Select build** (e.g., 1.0.0 build 1)
2. **Provide export compliance:**
   - Uses encryption: Yes
   - Exempt: Yes (standard HTTPS only)
3. **What to Test** (release notes for testers):
   ```
   🎉 BETA BUILD 1 - Welcome to Palabra!
   
   Thanks for beta testing! Please focus on:
   
   🧪 TESTING PRIORITIES:
   1. Add 5-10 vocabulary words
   2. Complete at least 2 review sessions
   3. Try all 5 review methods (swipe through full session)
   4. Check progress dashboard and achievements
   5. Test offline mode (airplane mode)
   6. Report any crashes or bugs
   
   🐛 KNOWN ISSUES:
   - (List any known bugs here)
   
   💬 FEEDBACK:
   - Use TestFlight's built-in feedback feature
   - Or email: kbrookes2507@gmail.com
   - Focus on: usability, bugs, performance
   
   Thank you for helping make Palabra better! 🙏
   ```

---

#### **2.2 Internal Testing (Optional)**

**Internal Testers:**
- Limited to 100 users
- Must have App Store Connect access role
- Get automatic access to all builds

**Good for:**
- Your team/friends with developer accounts
- Quick smoke testing before external beta
- QA team

**How to Add:**
1. **App Store Connect → Users and Access**
2. **Add users** with "App Manager" or "Developer" role
3. They'll receive email to download TestFlight app

---

#### **2.3 External Testing (Recommended)**

**External Testers:**
- Up to 10,000 users
- No App Store Connect access needed
- Can be invited individually or via public link

**Setup:**
1. **Click "External Testing"** tab
2. **Create Group:** "Beta Testers - Wave 1"
3. **Add Build:** Select 1.0.0 (build 1)
4. **Provide Test Information:**
   - App name: Palabra
   - Beta test description: (same as "What to Test" above)
   - Privacy policy: https://palabra-nu.vercel.app/privacy
5. **Submit for Review** (Apple reviews TestFlight builds, usually < 24 hours)

---

#### **2.4 Invite Testers**

**Option A: Email Invites (Targeted)**
1. **Click "Add Testers"** in group
2. **Enter emails** (comma-separated or CSV upload)
3. Testers receive email with TestFlight download link

**Option B: Public Link (Broader Reach)**
1. **Enable Public Link** in TestFlight group settings
2. **Copy link:** e.g., `https://testflight.apple.com/join/ABC123XY`
3. **Share link:**
   - Twitter, Reddit, Product Hunt
   - r/Spanish, r/languagelearning communities
   - Spanish learning Facebook groups
   - Your email list

**Public Link Benefits:**
- No email collection required
- Easy to share on social media
- First-come-first-served (10,000 limit)

---

### **Step 3: Tester Experience**

**What testers see:**
1. **Receive invite** (email or click public link)
2. **Install TestFlight** app from App Store (if not already installed)
3. **Accept invite** and install Palabra beta
4. **Automatic updates** when you upload new builds
5. **Provide feedback** via TestFlight's built-in tool

**Feedback Mechanisms:**
- **In-App Feedback:** Testers shake device or use TestFlight menu
- **Screenshots:** TestFlight captures screenshots with device info
- **Crash Reports:** Automatically sent to you (anonymized)

---

### **Step 4: Manage Beta Testing**

#### **4.1 Monitor Feedback**

**Dashboard Location:** App Store Connect → TestFlight → Builds → Feedback

**Types of Feedback:**
- **Crashes:** Prioritize fixes (P0)
- **Bugs:** Fix before launch (P1)
- **Feature Requests:** Note for future updates
- **Praise:** Use in marketing materials

#### **4.2 Release New Builds**

When you fix bugs or add features:
1. **Increment build number** (e.g., 1.0.0 build 2)
2. **Upload new build** to App Store Connect
3. **Add to TestFlight group**
4. **Testers auto-update** (they receive notification)
5. **Update "What to Test"** notes for new build

#### **4.3 Communicate with Testers**

**Best Practices:**
- Send weekly email updates (progress, what's fixed)
- Respond to feedback within 24-48 hours
- Thank testers publicly (with permission)
- Offer incentives:
  - Free lifetime premium (for active testers)
  - Early access to new features
  - Credit in app (optional "Beta Testers" section in About)

---

## 🤖 **Android Internal Testing Setup**

### **Overview**
Google Play Console offers Internal, Closed, and Open testing tracks.

**Testing Tracks:**
1. **Internal Testing** (max 100 testers) - Quick smoke tests
2. **Closed Testing** (unlimited) - Targeted beta with email list
3. **Open Testing** (unlimited) - Public beta, anyone can join

**Recommendation:** Start with **Closed Testing** for 50-100 targeted testers

---

### **Step 1: Prepare Build**

#### **1.1 Version Requirements**

**Build Settings:**
- **Version Name:** 1.0.0 (user-facing)
- **Version Code:** 1 (internal, must increment: 1, 2, 3...)
- **Package Name:** app.palabra.twa or com.kalvinbrookes.palabra
- **Signing:** Use release keystore (create and keep secure!)

#### **1.2 Build APK/AAB**

**Android App Bundle (AAB) - Recommended:**
```bash
# Using Bubblewrap (TWA)
bubblewrap build --release

# Or using Capacitor
npx cap sync android
cd android
./gradlew bundleRelease

# Sign AAB
jarsigner -keystore palabra-release.keystore app-release.aab palabra
```

**APK (Alternative):**
- Larger file size
- Not required by Google Play anymore
- Use AAB instead

---

### **Step 2: Configure Internal/Closed Testing**

Navigate to **Google Play Console → Testing → Closed testing**

#### **2.1 Create Track**

1. **Click "Create new release"**
2. **Release name:** Beta 1.0.0
3. **Upload AAB:** `palabra-release.aab`
4. **Release notes:**
   ```
   🎉 BETA BUILD 1 - Welcome to Palabra!
   
   Thanks for beta testing! Please test:
   
   ✅ Add 5-10 vocabulary words
   ✅ Complete 2+ review sessions
   ✅ Try all 5 review methods
   ✅ Check progress dashboard
   ✅ Test offline mode
   ✅ Report bugs via email
   
   Known issues:
   - (List any known bugs)
   
   Feedback: kbrookes2507@gmail.com
   
   Thank you! 🙏
   ```

---

#### **2.2 Create Tester List**

**Option A: Email List (Recommended)**
1. **Click "Testers" tab**
2. **Create email list:** "Beta Testers - Wave 1"
3. **Add emails** (comma-separated or CSV upload)
4. **Save**

**Option B: Google Groups**
1. **Create Google Group:** palabra-beta-testers@googlegroups.com
2. **Add group to tester list**
3. **Invite people to group**

---

#### **2.3 Share Opt-In URL**

1. **Copy opt-in URL:** e.g., `https://play.google.com/apps/testing/app.palabra.twa`
2. **Share with testers:**
   - Send email with instructions
   - Post in communities (Reddit, Facebook groups)
   - Share on Twitter/social media

**Tester Experience:**
1. Click opt-in URL
2. Accept beta invitation (becomes tester)
3. Download app from Google Play (marked as "Beta")
4. Receive automatic updates

---

### **Step 3: Manage Android Beta**

#### **3.1 Monitor Feedback**

**Google Play Console → Feedback:**
- **Crash reports:** Release → Crashes and ANRs
- **Reviews:** Ratings and reviews (beta testers can review)
- **Pre-launch report:** Automated testing results

**External Feedback:**
- Email: kbrookes2507@gmail.com
- Google Form: Create feedback form (optional)
- In-app feedback: Add feedback button linking to email/form

---

#### **3.2 Release New Builds**

1. **Increment version code** (e.g., Version 2)
2. **Build new AAB** with fixes/features
3. **Upload to Closed Testing track**
4. **Update release notes**
5. **Testers auto-update** via Google Play

---

#### **3.3 Graduate to Production**

When ready to launch:
1. **Review beta feedback** (all critical bugs fixed)
2. **Promote release:**
   - Closed Testing → Production
   - Or create new Production release with same AAB
3. **Submit for review**
4. **Go live!**

---

## 📊 **Beta Tester Recruitment**

### **Target Audience**
- **Spanish language students** (high school, college)
- **Language learning enthusiasts** (Reddit, Facebook groups)
- **Early adopters** (Product Hunt community)
- **Tech-savvy users** (can provide detailed feedback)

### **Recruitment Channels**

**Reddit Communities:**
- r/Spanish (300K+ members)
- r/languagelearning (500K+ members)
- r/betatests (100K+ members)

**Example Post:**
```
[iOS/Android] Palabra - Spanish Vocabulary Beta Test 🇪🇸

I'm launching Palabra, a Spanish vocabulary app with 5 review methods, AI-generated examples, and beautiful Apple-inspired design.

Looking for 50 beta testers to try it out before public launch!

✨ What you'll get:
• Early access to all features
• Free lifetime premium (for active testers)
• Help shape the final product

🧪 What I need:
• Test for 1-2 weeks
• Add 10+ words, do 5+ review sessions
• Report bugs and provide feedback

📱 Platforms: iOS (TestFlight) + Android (Google Play Beta)

Sign up: [Link to Google Form with email collection]

Thanks! 🙏
```

**Facebook Groups:**
- Spanish learners groups (search "learn Spanish")
- Language exchange groups
- Study groups for students

**Twitter:**
- Tweet with hashtags: #Spanish #languagelearning #betatest
- Tag language learning influencers
- Share screenshots/demo video

**Product Hunt:**
- Create "Upcoming" page before launch
- Collect emails for beta access
- Build anticipation for launch day

**Your Network:**
- Friends learning Spanish
- College Spanish department (if you have contacts)
- Spanish teachers (they can recruit students)

---

### **Tester Selection Criteria**

**Prioritize:**
- Active language learners (will use app seriously)
- Mix of proficiency levels (A1-C2)
- iOS and Android users (50/50 split ideally)
- Diverse devices (different phone models)
- English speakers (for feedback clarity)

**Screen with Google Form:**
1. Email address
2. Spanish proficiency level (A1-C2)
3. Device type (iOS/Android, model)
4. How often do you study Spanish? (Daily, Weekly, Monthly)
5. What Spanish learning tools do you currently use?
6. What's your #1 vocabulary learning challenge?

---

## 📝 **Feedback Collection**

### **Structured Feedback Form**

Create Google Form with:

**Section 1: Overall Experience**
- How satisfied are you with Palabra? (1-5 stars)
- Would you recommend Palabra to a friend? (NPS: 0-10)
- What did you like most?
- What frustrated you most?

**Section 2: Features**
- How useful are the 5 review methods? (1-5)
- Are AI-generated examples helpful? (Yes/No/Sometimes)
- Is the spaced repetition algorithm effective? (Yes/No/Not sure)
- Which review method is your favorite? (Radio buttons)

**Section 3: Usability**
- Is the app easy to navigate? (1-5)
- Is the design visually appealing? (1-5)
- Did you encounter any confusing flows? (Text)
- Any features you couldn't figure out? (Text)

**Section 4: Bugs & Issues**
- Did you experience any crashes? (Yes/No - If yes, describe)
- Did you encounter any bugs? (Text)
- Any performance issues (slowness, lag)? (Text)

**Section 5: Feature Requests**
- What features would you add? (Text)
- What would make Palabra better? (Text)

---

### **In-App Feedback Mechanism**

**Add to Settings page:**
```
Settings → Help & Feedback → Send Feedback

[Button] "Send Feedback via Email"
→ Opens email to kbrookes2507@gmail.com
→ Pre-fills: "Palabra Beta Feedback - v1.0.0"
→ Includes device info (iOS 17.2, iPhone 14 Pro, etc.)
```

---

## ✅ **Beta Testing Checklist**

### **iOS TestFlight**
- [ ] Build uploaded to App Store Connect
- [ ] TestFlight configuration complete
- [ ] "What to Test" notes written
- [ ] External testing group created
- [ ] Public link enabled (or email invites sent)
- [ ] 25+ iOS testers recruited
- [ ] TestFlight build approved by Apple
- [ ] Monitoring feedback daily

### **Android Testing**
- [ ] Signed AAB built and uploaded
- [ ] Closed testing track created
- [ ] Release notes written
- [ ] Email list or Google Group created
- [ ] Opt-in URL shared with testers
- [ ] 25+ Android testers recruited
- [ ] Monitoring crashes and reviews daily

### **Feedback Collection**
- [ ] Google Form created
- [ ] Feedback email inbox monitored
- [ ] In-app feedback mechanism added (optional)
- [ ] Weekly status emails sent to testers
- [ ] Bug tracking system set up (Notion, Trello, or GitHub Issues)

### **Launch Readiness**
- [ ] 50+ total testers recruited (25 iOS, 25 Android)
- [ ] 1-2 weeks of testing completed
- [ ] Critical bugs identified and fixed
- [ ] New builds uploaded with fixes
- [ ] 80%+ positive feedback (4+ stars)
- [ ] Testimonials collected (for marketing)
- [ ] Ready for production submission

---

## 📈 **Success Criteria**

### **Quantitative Metrics**
- **50+ testers** signed up (target achieved)
- **80%+ engagement** (testers who actually use app)
- **<5% crash rate** (P0 - must fix before launch)
- **4+ star average** rating from testers
- **20+ feedback submissions** (detailed responses)

### **Qualitative Feedback**
- "Easy to use" mentioned frequently
- "Love the design" or "beautiful app"
- "Actually helps me learn" or "retention improved"
- Few complaints about confusing UX
- Feature requests are reasonable (not critical missing features)

---

## 🚀 **Timeline**

**Week 1: Setup**
- Day 1-2: Upload builds, configure TestFlight/Google Play
- Day 3-4: Recruit testers (Reddit, social media)
- Day 5-7: First 50 testers onboarded, testing begins

**Week 2: Active Testing**
- Monitor feedback daily
- Fix critical bugs
- Release Build 2 (if needed)
- Send mid-week update to testers

**Week 3: Iteration**
- Analyze feedback
- Prioritize fixes vs. future features
- Release Build 3 (final beta)
- Thank testers, collect testimonials

**Week 4: Production Prep**
- Finalize production build
- Update App Store/Play Store listings
- Prepare launch marketing
- Submit for production review

---

## 📚 **Resources**

### **TestFlight**
- [TestFlight Help](https://developer.apple.com/testflight/)
- [App Store Connect Guide](https://help.apple.com/app-store-connect/#/dev2cd126805)

### **Google Play Testing**
- [Google Play Testing Docs](https://support.google.com/googleplay/android-developer/answer/9845334)
- [Closed Testing Guide](https://support.google.com/googleplay/android-developer/answer/9303479)

### **Feedback Tools**
- [Google Forms](https://forms.google.com/) - Free feedback surveys
- [Typeform](https://typeform.com/) - Beautiful survey alternative
- [GitHub Issues](https://github.com/) - Bug tracking (if open source)

---

**Status:** Ready to begin beta testing  
**Estimated Duration:** 3-4 weeks (recruitment → testing → fixes → launch)  
**Next Steps:**
1. Upload TestFlight and Google Play builds
2. Create recruitment posts for Reddit/social media
3. Set up feedback collection (Google Form + email)
4. Monitor feedback daily and fix critical bugs
5. Collect testimonials for launch marketing
