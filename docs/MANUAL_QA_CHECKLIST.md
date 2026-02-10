# Manual QA Checklist - Phase 18.1
**Date**: February 9, 2026  
**Tester**: _______________  
**Build Version**: _______________  
**Environment**: Production / Staging / Local

---

## 📱 **Mobile Testing** (iOS/Android)

### iOS Testing
- [ ] App loads correctly on iPhone (Safari)
- [ ] Touch interactions work smoothly
- [ ] Swipe gestures function correctly
- [ ] Keyboard appears/dismisses properly
- [ ] Orientation changes handled correctly
- [ ] Performance is smooth (no lag)
- [ ] Offline mode works after initial sync

### Android Testing
- [ ] App loads correctly on Android (Chrome)
- [ ] Touch interactions work smoothly
- [ ] Swipe gestures function correctly
- [ ] Keyboard appears/dismisses properly
- [ ] Orientation changes handled correctly
- [ ] Performance is smooth (no lag)
- [ ] Offline mode works after initial sync

---

## 🎯 **Task 18.1.1: Intelligent Method Selection**

### Method Selection Behavior
- [ ] Difficult words (low ease factor) receive engaging methods
- [ ] Easy words receive appropriate review methods
- [ ] Words without examples fall back to compatible methods
- [ ] First-time words use appropriate introduction methods
- [ ] Method selection adapts to user performance

### Method Distribution
- [ ] No single method dominates a session
- [ ] Methods vary throughout review
- [ ] Context Selection appears for words with examples
- [ ] Traditional flashcard always available

---

## 🔄 **Task 18.1.2: Review Method Interleaving**

### Method Variety
- [ ] No two consecutive cards use the same method
- [ ] Methods are well-distributed in a 20-card session
- [ ] Recent method history influences selection
- [ ] Cooldown periods respected between method uses

### User Experience
- [ ] Method transitions feel smooth and natural
- [ ] No jarring jumps between similar methods
- [ ] Variety keeps user engaged

---

## 🤖 **Task 18.1.3: AI-Enhanced Examples**

### Example Generation
- [ ] AI examples generate successfully
- [ ] Examples are contextually relevant
- [ ] CEFR level-appropriate examples shown
- [ ] Examples cached after first generation
- [ ] Cache significantly improves response time

### Cost Control
- [ ] Budget limits respected
- [ ] Cost tracking accurate
- [ ] Monthly spending visible
- [ ] Warning when approaching budget limit

### Error Handling
- [ ] Graceful fallback when AI unavailable
- [ ] Template examples shown on API failure
- [ ] User not blocked by AI issues

---

## 📊 **Task 18.1.4: Retention Analytics**

### Dashboard Display
- [ ] Retention rate calculated correctly
- [ ] Charts display accurately
- [ ] Performance trends visible
- [ ] Struggling words identified
- [ ] Insights are actionable

### Data Accuracy
- [ ] Calculations match expected values
- [ ] Historical data preserved correctly
- [ ] Date ranges filter correctly

---

## 🎭 **Task 18.1.5: Context Selection Method**

### ES→EN Direction
- [ ] Full Spanish sentence displayed
- [ ] English translation shown as hint
- [ ] Spanish word options presented
- [ ] Correct answer validates properly
- [ ] Incorrect answer provides feedback

### EN→ES Direction
- [ ] Full English sentence displayed
- [ ] Spanish translation shown as hint
- [ ] Spanish word options presented
- [ ] Correct answer validates properly
- [ ] Incorrect answer provides feedback

### Distractor Quality
- [ ] Distractors are plausible
- [ ] Distractors match part of speech
- [ ] No obviously wrong choices

---

## 📴 **Task 18.1.6: Offline Capabilities**

### Initial Sync
- [ ] Vocabulary syncs automatically after login
- [ ] Sync completes within reasonable time
- [ ] Progress indicator shown during sync
- [ ] Sync error handling works

### Offline Mode
- [ ] App works fully offline after sync
- [ ] Review sessions complete offline
- [ ] Progress saved locally
- [ ] No error messages about connectivity

### Online Sync
- [ ] Changes sync when reconnected
- [ ] Conflict resolution works
- [ ] No data loss on reconnection
- [ ] Sync status visible to user

---

## 🗄️ **Task 18.1.7: Pre-Generation Strategy**

### Database Population
- [ ] Pre-generated examples accessible
- [ ] Cache hit rate high for common words
- [ ] Response time fast for cached words
- [ ] Database entries complete (all fields)

### Cost Efficiency
- [ ] Pre-generation cost within budget
- [ ] Cache saves significant API costs
- [ ] Coverage report accurate

---

## 🐛 **Critical Bug Fixes**

### Performance Fix
- [ ] Session completion instant (<100ms)
- [ ] No freezing after completing review
- [ ] Background processing doesn't block UI
- [ ] Progress saves correctly

### Direction Badge
- [ ] ES→EN badge visible throughout session
- [ ] EN→ES badge visible throughout session
- [ ] Badge persists across all review methods
- [ ] Badge styling clear and readable

### Context Selection Immersion
- [ ] Spanish sentence shows in ES→EN mode
- [ ] English sentence shows in EN→ES mode
- [ ] Translation hint appropriate
- [ ] Full immersion maintained

### Offline Capabilities
- [ ] Quiz starts offline successfully
- [ ] Critical routes cached
- [ ] Service worker functioning
- [ ] No console errors offline

---

## ⚡ **Performance Testing**

### Load Times
- [ ] Dashboard loads in <1 second
- [ ] Review session starts in <1 second
- [ ] Vocabulary list loads in <1 second
- [ ] Analytics page loads in <2 seconds

### Interaction Times
- [ ] Card flip animation smooth (60fps)
- [ ] Method selection instant (<50ms)
- [ ] Score calculation instant (<100ms)
- [ ] Navigation transitions smooth

### Resource Usage
- [ ] Memory usage stable during long session
- [ ] No memory leaks detected
- [ ] CPU usage reasonable
- [ ] Network requests optimized

---

## 🔐 **Security & Data**

### Authentication
- [ ] Login/logout works correctly
- [ ] Session persists appropriately
- [ ] Logged out users redirected
- [ ] Guest mode functions correctly

### Data Integrity
- [ ] User progress saves correctly
- [ ] No data loss on error
- [ ] Backup/restore works
- [ ] Export data accurate

---

## 🎨 **UI/UX**

### Visual Design
- [ ] Consistent styling across pages
- [ ] Responsive on all screen sizes
- [ ] Icons render correctly
- [ ] Colors accessible (contrast)
- [ ] Dark mode (if applicable)

### User Experience
- [ ] Clear navigation
- [ ] Helpful error messages
- [ ] Loading states visible
- [ ] Success feedback clear
- [ ] Tooltips helpful

---

## 🔄 **Regression Testing**

### Previously Working Features
- [ ] User registration/login still works
- [ ] Vocabulary management unchanged
- [ ] Statistics accurate
- [ ] Settings persist
- [ ] Profile updates work

### Backwards Compatibility
- [ ] Existing user data migrates correctly
- [ ] Old sessions still accessible
- [ ] Historical stats preserved

---

## 📋 **Final Checklist**

- [ ] All critical bugs fixed
- [ ] All Phase 18.1 features working
- [ ] Performance targets met
- [ ] Mobile experience excellent
- [ ] Offline functionality verified
- [ ] No console errors
- [ ] No breaking issues found
- [ ] Ready for Phase 18.2

---

**Sign-Off**

Tester: _______________  
Date: _______________  
Status: ⬜ Pass | ⬜ Pass with Minor Issues | ⬜ Fail

**Notes:**
