# Notification System Testing Guide

## Overview

This guide provides comprehensive testing procedures for Phase 10's notification system implementation.

---

## Prerequisites

### Development Environment

1. **Local Server**: Run app with `npm run dev`
2. **HTTPS**: Service workers require HTTPS (localhost is exempt)
3. **Modern Browser**: Chrome 81+, Firefox 44+, Safari 16+, or Edge 81+
4. **Database Reset**: Clear IndexedDB if testing migration

### Browser Setup

1. **Enable Notifications**
   - Ensure browser allows notifications
   - Check system notification settings
   - Clear any previous permission blocks

2. **Developer Tools**
   - Open DevTools (F12)
   - Navigate to Application tab
   - Monitor Service Workers and Storage

---

## Test Suite

### 1. Service Worker Registration

**Objective**: Verify service worker registers correctly

**Steps**:
1. Open app in browser
2. Open DevTools > Application > Service Workers
3. Verify `sw.js` is registered
4. Check status shows "activated and running"

**Expected Results**:
- ✅ Service worker appears in list
- ✅ Status is "activated"
- ✅ Scope is "/" or app root
- ✅ No errors in console

**Common Issues**:
- Service worker not registering → Check HTTPS
- Scope mismatch → Verify sw.js location
- Update pending → Click "skipWaiting" button

---

### 2. Notification Permission Flow

**Test 2.1: Fresh User (No Permission)**

**Steps**:
1. Clear site data (DevTools > Application > Clear storage)
2. Navigate to Settings > Notifications
3. Verify permission request card shows
4. Click "Enable Notifications"
5. Click "Allow" in browser prompt

**Expected Results**:
- ✅ Permission card displays with explanation
- ✅ Browser native prompt appears
- ✅ Settings UI activates after grant
- ✅ Permission state saves to preferences

**Test 2.2: Permission Denied**

**Steps**:
1. Clear site data
2. Navigate to Settings > Notifications
3. Click "Enable Notifications"
4. Click "Block" in browser prompt

**Expected Results**:
- ✅ Warning message displays
- ✅ Instructions to enable in browser settings
- ✅ Settings UI remains inactive
- ✅ No errors in console

**Test 2.3: Previously Granted**

**Steps**:
1. With permission already granted
2. Navigate to Settings > Notifications
3. Verify settings UI is active

**Expected Results**:
- ✅ No permission request card
- ✅ All settings are editable
- ✅ Master toggle is checked
- ✅ Test button is available

---

### 3. Daily Reminder Configuration

**Test 3.1: Enable Daily Reminder**

**Steps**:
1. Grant notification permission
2. Toggle "Enable Notifications" ON
3. Toggle "Daily Reminder" ON
4. Set reminder time (e.g., current time + 2 minutes)
5. Click outside time picker
6. Wait for scheduled time

**Expected Results**:
- ✅ Settings save successfully
- ✅ Notification appears at scheduled time
- ✅ Notification includes app name
- ✅ Body shows due count or custom message

**Test 3.2: Change Reminder Time**

**Steps**:
1. Set reminder time to 09:00
2. Wait for save indicator
3. Reload page
4. Verify time persists

**Expected Results**:
- ✅ Time saves correctly
- ✅ Time persists after reload
- ✅ New reminder scheduled
- ✅ Old reminder cancelled

**Test 3.3: Disable Daily Reminder**

**Steps**:
1. Toggle "Daily Reminder" OFF
2. Wait past previous reminder time
3. Verify no notification appears

**Expected Results**:
- ✅ Reminder setting saves
- ✅ No notification sent
- ✅ Can re-enable later

---

### 4. Frequency Settings

**Test 4.1: Daily Frequency**

**Steps**:
1. Set frequency to "Daily"
2. Set reminder time
3. Test on multiple days including weekends

**Expected Results**:
- ✅ Notification appears every day
- ✅ Includes weekends
- ✅ No gaps in delivery

**Test 4.2: Weekdays Only**

**Steps**:
1. Set frequency to "Weekdays only"
2. Test on Monday-Friday (should send)
3. Test on Saturday-Sunday (should not send)

**Expected Results**:
- ✅ Sends Monday-Friday
- ✅ Skips Saturday-Sunday
- ✅ Resumes on Monday

**Test 4.3: Custom Days**

**Steps**:
1. Set frequency to "Custom days"
2. Select Mon, Wed, Fri only
3. Test each day of week

**Expected Results**:
- ✅ Sends only on selected days
- ✅ Skips non-selected days
- ✅ Day selection persists

---

### 5. Quiet Hours

**Test 5.1: Same-Day Quiet Hours**

**Steps**:
1. Enable quiet hours
2. Set start: 13:00, end: 15:00
3. Set reminder time: 14:00
4. Verify notification postponed

**Expected Results**:
- ✅ Notification not sent at 14:00
- ✅ Notification scheduled for 15:00
- ✅ Notification arrives after quiet hours

**Test 5.2: Overnight Quiet Hours**

**Steps**:
1. Enable quiet hours
2. Set start: 22:00, end: 08:00
3. Set reminder time: 23:00
4. Verify notification postponed to 08:00

**Expected Results**:
- ✅ Notification not sent at 23:00
- ✅ Notification scheduled for 08:00 next day
- ✅ Quiet hours calculation correct

**Test 5.3: Disable Quiet Hours**

**Steps**:
1. Toggle quiet hours OFF
2. Set reminder during previous quiet time
3. Verify notification sends immediately

**Expected Results**:
- ✅ Quiet hours ignored
- ✅ Notification sends at set time
- ✅ No postponement

---

### 6. Badge Indicators

**Test 6.1: Badge Appears**

**Steps**:
1. Add 5 vocabulary words
2. Enable badge indicators
3. Check app icon (install app if needed)

**Expected Results**:
- ✅ Badge shows count (5)
- ✅ Badge visible on app icon
- ✅ Badge updates automatically

**Test 6.2: Badge Updates After Review**

**Steps**:
1. Note current badge count
2. Complete a review session
3. Return to home screen
4. Check badge count

**Expected Results**:
- ✅ Badge count decreases
- ✅ Update happens automatically
- ✅ Count reflects remaining due words

**Test 6.3: Badge Clears**

**Steps**:
1. Complete all due reviews
2. Check app icon

**Expected Results**:
- ✅ Badge disappears
- ✅ No count shown
- ✅ Reappears when reviews due

**Test 6.4: Disable Badge**

**Steps**:
1. Toggle "Show Badge Count" OFF
2. Check app icon
3. Complete review session

**Expected Results**:
- ✅ Badge clears immediately
- ✅ Stays off after reviews
- ✅ Setting persists

---

### 7. Custom Message

**Test 7.1: Set Custom Message**

**Steps**:
1. Navigate to notification settings
2. Enter custom message: "¡Hora de practicar español!"
3. Save settings
4. Send test notification

**Expected Results**:
- ✅ Message saves correctly
- ✅ Test notification shows custom message
- ✅ Future reminders use custom message
- ✅ Character limit enforced (100)

**Test 7.2: Empty Message**

**Steps**:
1. Clear custom message field
2. Save (should use default)
3. Send test notification

**Expected Results**:
- ✅ Reverts to default message
- ✅ No empty notifications sent

---

### 8. Test Notification Button

**Test 8.1: Send Test Notification**

**Steps**:
1. Configure notification settings
2. Click "Send Test Notification"
3. Wait for notification

**Expected Results**:
- ✅ Button shows loading state
- ✅ Notification appears within seconds
- ✅ Test notification distinct from reminders
- ✅ Button re-enables after send

**Test 8.2: Multiple Test Notifications**

**Steps**:
1. Send test notification
2. Wait 10 seconds
3. Send another test notification

**Expected Results**:
- ✅ Both notifications appear
- ✅ No rate limiting issues
- ✅ Each notification unique

---

### 9. Settings Persistence

**Test 9.1: Page Reload**

**Steps**:
1. Configure all settings
2. Reload page (Ctrl+R)
3. Navigate to Settings > Notifications
4. Verify all settings preserved

**Expected Results**:
- ✅ Master toggle state preserved
- ✅ Reminder time preserved
- ✅ Frequency preserved
- ✅ Quiet hours preserved
- ✅ Custom message preserved

**Test 9.2: Browser Restart**

**Steps**:
1. Configure settings
2. Close browser completely
3. Reopen browser and app
4. Check settings

**Expected Results**:
- ✅ All settings persist
- ✅ No data loss
- ✅ Reminders still scheduled

**Test 9.3: Device Switch**

**Steps**:
1. Configure on Device A
2. (If using cloud sync) Switch to Device B
3. Check settings

**Expected Results**:
- ⚠️ Settings are device-local (no sync yet)
- ✅ Each device has independent settings

---

### 10. Notification Actions

**Test 10.1: Click Notification**

**Steps**:
1. Receive notification
2. Click notification body
3. Observe app behavior

**Expected Results**:
- ✅ App opens/focuses
- ✅ If closed, new window opens
- ✅ If open, existing window focuses
- ✅ Notification closes

**Test 10.2: Review Now Action**

**Steps**:
1. Receive notification with actions
2. Click "Review Now" button
3. Observe navigation

**Expected Results**:
- ✅ App navigates to /review
- ✅ Review session can start
- ✅ Notification closes

**Test 10.3: Dismiss Action**

**Steps**:
1. Receive notification
2. Click "Dismiss" button

**Expected Results**:
- ✅ Notification closes
- ✅ No app action taken
- ✅ Can receive future notifications

---

### 11. Edge Cases

**Test 11.1: Browser Closed During Reminder Time**

**Setup**: Browser completely closed at reminder time

**Expected Behavior**:
- ⚠️ Client-side scheduling: notification missed
- 🔄 Future enhancement: server-side push

**Test 11.2: Device Offline**

**Steps**:
1. Disable network
2. Wait for reminder time
3. Re-enable network

**Expected Results**:
- ⚠️ Notification may be missed
- ✅ App continues to function offline
- ✅ Notifications resume when online

**Test 11.3: Rapid Setting Changes**

**Steps**:
1. Quickly toggle multiple settings
2. Change time multiple times
3. Reload page

**Expected Results**:
- ✅ Last setting saved
- ✅ No race conditions
- ✅ No duplicate notifications

**Test 11.4: Maximum Badge Count**

**Steps**:
1. Add 999+ vocabulary words
2. Check badge display

**Expected Results**:
- ✅ Badge shows count (may show 99+ on some platforms)
- ✅ No overflow errors
- ✅ Performance remains good

---

### 12. Browser Compatibility

**Test on Each Browser**:

**Chrome**
- [ ] Service worker registers
- [ ] Notifications work
- [ ] Badge API functions
- [ ] PWA installable

**Firefox**
- [ ] Service worker registers
- [ ] Notifications work
- [ ] Badge API (expected not supported)
- [ ] PWA installable

**Safari (macOS)**
- [ ] Service worker registers
- [ ] Notifications work
- [ ] Badge API functions (16.4+)
- [ ] Add to Dock works

**Safari (iOS)**
- [ ] Service worker registers
- [ ] Notifications work
- [ ] Badge API functions
- [ ] Add to Home Screen works

**Edge**
- [ ] Service worker registers
- [ ] Notifications work
- [ ] Badge API functions
- [ ] PWA installable

---

### 13. Performance Testing

**Test 13.1: Initial Load**

**Metric**: Time to interactive
- Target: < 3 seconds
- Notification system should not block rendering

**Test 13.2: Settings Page Load**

**Metric**: Time to display settings
- Target: < 500ms
- Settings should load from IndexedDB quickly

**Test 13.3: Badge Update Performance**

**Steps**:
1. Complete review with 50+ words
2. Monitor badge update time

**Expected**:
- ✅ Update completes < 100ms
- ✅ No UI blocking
- ✅ Smooth user experience

---

### 14. Database Testing

**Test 14.1: Settings Store Creation**

**Steps**:
1. Clear IndexedDB
2. Open app
3. Check IndexedDB in DevTools

**Expected Results**:
- ✅ `settings` store created
- ✅ Database version is 3
- ✅ No migration errors

**Test 14.2: Default Preferences**

**Steps**:
1. Clear settings
2. Load notification settings
3. Check values

**Expected Results**:
- ✅ All fields have defaults
- ✅ No undefined values
- ✅ App doesn't crash

**Test 14.3: Preference Updates**

**Steps**:
1. Change setting
2. Check IndexedDB entry
3. Verify structure

**Expected Results**:
- ✅ Key: `notification_preferences`
- ✅ Value contains all settings
- ✅ `updatedAt` timestamp present

---

## Automated Testing (Future)

### Unit Tests

```typescript
// Example test structure
describe('Notification Service', () => {
  test('isQuietHours returns true during quiet hours', () => {
    // Test logic
  });
  
  test('shouldNotifyToday respects frequency setting', () => {
    // Test logic
  });
});
```

### Integration Tests

```typescript
// Example integration test
describe('Notification Settings Component', () => {
  test('saves preferences to database', async () => {
    // Test user interaction flow
  });
});
```

---

## Troubleshooting

### Service Worker Issues

**Problem**: Service worker not registering
**Solution**:
- Check console for errors
- Verify HTTPS (or localhost)
- Clear browser cache
- Check service worker scope

**Problem**: Service worker update not applying
**Solution**:
- Close all tabs with the app
- Click "skipWaiting" in DevTools
- Hard refresh (Ctrl+Shift+R)

### Notification Issues

**Problem**: Notifications not appearing
**Solution**:
- Check permission status
- Verify system notifications enabled
- Check Do Not Disturb mode
- Test with test notification button

**Problem**: Notifications appear but actions don't work
**Solution**:
- Check service worker is active
- Verify notification click handler
- Check console for errors

### Badge Issues

**Problem**: Badge not showing
**Solution**:
- Check browser support (Chrome 81+, Safari 16.4+)
- Verify app is installed as PWA
- Check "Show Badge Count" setting
- Verify due reviews exist

---

## Testing Checklist Summary

### Critical Path

- [ ] Service worker registers successfully
- [ ] Permission can be granted
- [ ] Settings save and persist
- [ ] Test notification works
- [ ] Daily reminder sends
- [ ] Badge updates after reviews
- [ ] All settings load correctly

### Full Test Coverage

- [ ] All 14 test sections completed
- [ ] Tested on 3+ browsers
- [ ] Tested on mobile and desktop
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Edge cases handled gracefully

---

## Reporting Issues

When reporting bugs, include:

1. **Browser**: Name and version
2. **Steps**: Exact steps to reproduce
3. **Expected**: What should happen
4. **Actual**: What actually happened
5. **Console**: Any error messages
6. **Screenshots**: Visual evidence

---

## Resources

- [Chrome DevTools - Service Workers](https://developers.google.com/web/tools/chrome-devtools/progressive-web-apps)
- [Testing Web Push](https://web.dev/push-notifications-overview/)
- [Debugging PWAs](https://web.dev/pwa-checklist/)

---

**Last Updated**: January 12, 2026  
**Phase**: 10 - Notifications & Reminders

