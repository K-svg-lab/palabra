# Phase 10: Quick Start Guide

## What's New in Phase 10? 🎉

Palabra is now a **Progressive Web App** with notifications and reminders!

### Key Features

1. **📱 Install as App** - Add Palabra to your home screen
2. **🔔 Daily Reminders** - Get notified when it's time to review
3. **⚙️ Custom Settings** - Configure when and how often you're reminded
4. **🌙 Quiet Hours** - No notifications during sleep hours
5. **🔢 Badge Indicators** - See pending review count on app icon
6. **✨ Offline Support** - Service worker enables offline functionality

---

## Getting Started (For Users)

### Step 1: Enable Notifications

1. Open Palabra app
2. Go to **Settings** (bottom navigation)
3. Click **Notifications** tab
4. Click **Enable Notifications** button
5. Click **Allow** when browser asks

### Step 2: Configure Your Preferences

**Set Your Reminder Time**
- Choose when you want daily reminders
- Default is 9:00 AM
- Use 24-hour format

**Choose Frequency**
- **Daily**: Every single day
- **Weekdays**: Monday-Friday only
- **Custom**: Pick specific days

**Optional: Set Quiet Hours**
- Enable quiet hours
- Set start time (e.g., 10:00 PM)
- Set end time (e.g., 8:00 AM)
- No notifications during this window

### Step 3: Test It Out

1. Click **Send Test Notification**
2. You should see a notification appear
3. Click it to open the app

### Step 4: Install the App (Optional)

**On Desktop**
- Look for install icon in address bar
- Click "Install Palabra"
- App opens in its own window

**On Mobile**
- iOS Safari: Share button → Add to Home Screen
- Android Chrome: Menu → Install App
- Icon appears on home screen

---

## For Developers

### Implementation Overview

```
Phase 10 Files Created:
├── lib/
│   ├── types/notifications.ts
│   ├── db/settings.ts
│   ├── services/notifications.ts
│   ├── hooks/use-notifications.ts
│   └── providers/notification-provider.tsx
├── components/features/
│   └── notification-settings.tsx
└── public/
    └── sw.js

Modified Files:
├── lib/constants/app.ts (DB version 2→3)
├── lib/db/schema.ts (added settings store)
├── app/layout.tsx (added NotificationProvider)
├── app/(dashboard)/settings/page.tsx (added notification tab)
└── app/(dashboard)/review/page.tsx (added badge updates)
```

### Quick API Reference

```typescript
// Initialize notifications
import { initializeNotifications } from '@/lib/services/notifications';
await initializeNotifications();

// Request permission
import { requestNotificationPermission } from '@/lib/services/notifications';
const permission = await requestNotificationPermission();

// Send notification
import { sendNotification } from '@/lib/services/notifications';
await sendNotification({
  title: 'Palabra',
  body: 'Time to review!',
  icon: '/icon-192.png'
});

// Update badge
import { updateBadge } from '@/lib/services/notifications';
await updateBadge();

// Get/save preferences
import { getNotificationPreferences, saveNotificationPreferences } from '@/lib/db/settings';
const prefs = await getNotificationPreferences();
await saveNotificationPreferences(updatedPrefs);

// Use hook
import { useNotifications } from '@/lib/hooks/use-notifications';
const { permission, requestPermission, refreshBadge } = useNotifications();
```

### Database Schema

```typescript
settings: {
  key: 'notification_preferences',
  value: {
    enabled: boolean;
    dailyReminder: boolean;
    reminderTime: string;          // "HH:MM"
    quietHoursEnabled: boolean;
    quietHoursStart: string;       // "HH:MM"
    quietHoursEnd: string;         // "HH:MM"
    frequency: 'daily' | 'weekdays' | 'custom';
    customDays?: number[];         // [0-6]
    showBadge: boolean;
    reminderMessage: string;
  },
  updatedAt: number
}
```

---

## Troubleshooting

### Notifications Not Showing Up?

**Check Permission**
- Settings > Notifications
- Should show active settings interface
- If not, permission wasn't granted

**Check Browser Settings**
- Browser might block notifications
- Check system notification settings
- Disable Do Not Disturb mode

**Check Service Worker**
- DevTools > Application > Service Workers
- Should show sw.js as "activated"
- Try hard refresh (Ctrl+Shift+R)

### Badge Not Showing?

**Browser Support**
- Chrome 81+ ✅
- Edge 81+ ✅
- Safari 16.4+ ✅
- Firefox ❌ (not yet supported)

**Must Be Installed**
- Badge only shows on installed PWAs
- Install app from browser menu
- Badge appears on app icon

**Check Setting**
- Settings > Notifications
- "Show Badge Count" must be enabled

### Service Worker Issues?

**Not Registering**
- Must use HTTPS (or localhost)
- Check console for errors
- Verify sw.js is accessible

**Update Not Applying**
- Close all app tabs
- DevTools > Application > Service Workers
- Click "skipWaiting"
- Reload page

---

## Testing Checklist

### Basic Functionality
- [ ] Notifications permission can be granted
- [ ] Settings save and persist
- [ ] Test notification works
- [ ] Daily reminder sends at correct time
- [ ] Badge shows correct count
- [ ] Badge updates after reviews

### Advanced Features
- [ ] Quiet hours work correctly
- [ ] Frequency settings respected
- [ ] Custom message appears in notifications
- [ ] Service worker caching works offline
- [ ] App installable as PWA

### Cross-Browser
- [ ] Tested in Chrome
- [ ] Tested in Safari
- [ ] Tested in Firefox
- [ ] Tested in Edge

---

## Next Steps

### For Users
1. ✅ Enable notifications
2. ✅ Configure preferences
3. ✅ Install as app (optional)
4. 🎯 Build your vocabulary
5. 📚 Review consistently

### For Developers
1. ✅ Create proper icon files (icon-192.png, icon-512.png)
2. 🔄 Test thoroughly across browsers
3. 🚀 Deploy to production with HTTPS
4. 📊 Monitor notification engagement
5. 🎨 Consider Phase 11 (Enhanced Statistics)

---

## Resources

**Documentation**
- `PHASE10_COMPLETE.md` - Full implementation details
- `NOTIFICATIONS_TESTING.md` - Comprehensive testing guide
- `ICON_GUIDE.md` - Icon creation instructions

**External Links**
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Badge API](https://developer.mozilla.org/en-US/docs/Web/API/Badging_API)

---

## Support

**Questions?**
- Check documentation files
- Review code comments
- Test with debugging enabled

**Found a Bug?**
- Check console for errors
- Review testing guide
- Document steps to reproduce

---

**Phase 10 Status**: ✅ **COMPLETE**

**What's Next**: Phase 11 - Enhanced Progress & Statistics

---

*Built with ❤️ for consistent Spanish vocabulary learning*

