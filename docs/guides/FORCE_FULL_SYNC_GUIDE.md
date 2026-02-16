# Force Full Sync Guide

**Purpose:** Trigger a full synchronization to download all vocabulary words after fixing the 1000-word limit bug.

**When to Use:**
- After fixing sync limits
- When local vocabulary count doesn't match server count
- After recovering from data corruption
- When setting up a new device

---

## 📱 Method 1: Simple Re-Login (Recommended)

**Steps:**
1. Open Palabra app
2. Click profile icon (top right)
3. Click "Sign Out"
4. Sign back in with your credentials
5. ✅ Full sync triggered automatically

**Why This Works:**
- Fresh login triggers full sync (no lastSyncTime)
- All vocabulary downloaded from scratch
- All review records downloaded
- Local database rebuilt

---

## 💻 Method 2: Clear Browser Data (More Thorough)

**Steps:**
1. Open browser developer tools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Find "IndexedDB" in left sidebar
4. Right-click "palabra-db" → Delete
5. Refresh page
6. Sign in again
7. ✅ Complete fresh sync

**Why This Works:**
- Removes all local data
- Forces complete re-download
- Guaranteed fresh start

---

## 🔧 Method 3: Developer Console (Advanced)

**For Testing/Verification:**

1. Open browser console (F12 → Console tab)
2. Run this command:

```javascript
// Clear last sync time to force full sync
localStorage.removeItem('lastSyncTime');

// Trigger sync manually
const { getSyncService } = await import('/lib/services/sync.js');
const syncService = getSyncService();
await syncService.sync('full');
```

3. Check console for sync logs
4. Verify word count matches expected

---

## ✅ Verification Steps

After sync, verify all words are present:

### Check Word Count
1. Go to Vocabulary page
2. Look at subtitle: "X of Y words"
3. **Expected:** "1231 of 1231 words" (or your total)

### Check Specific Words
Search for words that should be present:
- "pincha de sal"
- "rabia"
- "líder"
- "trucar"
- "vela"

These were among the 231 excluded words.

### Check Browser Console
1. Open developer tools (F12)
2. Look for sync logs:
   ```
   ✅ Authenticated, proceeding with sync
   📅 Performing FULL sync (no local data detected)
   📥 Applying 1231 remote vocabulary items...
   ```

---

## 🐛 Troubleshooting

### Sync Shows Less Than Expected

**Problem:** Vocabulary count still shows <1231 words

**Solutions:**
1. Check network connection
2. Check browser console for errors
3. Try Method 2 (Clear Browser Data)
4. Contact support with console logs

### Sync Takes Long Time

**Expected Behavior:** Full sync with 1231 words takes ~20-25 seconds

**If Longer:**
- Check network speed
- Wait patiently (large sync in progress)
- Don't interrupt the sync

### Sync Fails

**Check:**
1. Are you authenticated? (logged in)
2. Any errors in console?
3. Is server responding? (Check network tab)

**Fix:**
- Refresh page and try again
- Clear browser cache
- Try different browser

---

## 📊 Expected Results

### Before Fix
- Vocabulary count: ~1000 words (incomplete)
- Missing oldest 231 words
- Sync cutoff at "enfatizar"

### After Fix + Full Sync
- Vocabulary count: 1231 words (complete)
- All words present (including oldest)
- No sync cutoff

### Performance
- Full sync time: ~20-25 seconds (one-time)
- Incremental sync: ~0.5-1 seconds (daily)
- Response size: ~1 MB (acceptable)

---

## 🔐 Data Safety

**Is this safe?**
- ✅ Yes, completely safe
- ✅ No data loss (server has all words)
- ✅ Local data rebuilt from server
- ✅ Review progress preserved
- ✅ Statistics preserved

**What if something goes wrong?**
- All data stored safely on server
- Can re-sync anytime
- Multiple sync attempts allowed
- Contact support if issues persist

---

## 📝 For Developers

### Manually Trigger Sync via API

```bash
# Get auth token
curl http://localhost:3000/api/auth/me \
  --cookie "authToken=YOUR_TOKEN"

# Trigger vocabulary sync
curl http://localhost:3000/api/sync/vocabulary \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"operations": [], "deviceId": "test-device"}' \
  --cookie "authToken=YOUR_TOKEN"
```

### Check Sync Logs in Vercel

1. Go to Vercel dashboard
2. Select project
3. Go to "Logs" tab
4. Filter for:
   - `Sync returning X vocabulary items`
   - `Applying X remote vocabulary items`

### Monitor Sync Performance

Check `app/api/sync/vocabulary/route.ts` logs:
```
⚠️ Sync returning 1231 vocabulary items for user XXX
   This is normal for users with large vocabularies, but may impact response time.
```

---

**Last Updated:** February 16, 2026  
**Related:** BUG_FIX_2026_02_16_VOCABULARY_SYNC_LIMIT.md  
**Status:** ✅ Ready to use after fix deployment
