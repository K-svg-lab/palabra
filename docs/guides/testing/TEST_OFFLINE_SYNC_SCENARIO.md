# Test Scenario: Offline Review Sync Bug

## Simplified Test (Single Browser Window)

Since you can't log in via incognito, we'll do a simpler diagnostic approach to understand what's happening with your data from this morning.

---

## Part 1: Check Current State (What happened this morning?)

1. **First, check if there are pending offline items from this morning:**
   - Make sure you're logged in at: http://localhost:3000
   - In a NEW TAB, open: http://localhost:3000/debug-check-queue.html
   - Click "Check Offline Queue"
   - **REPORT**: How many items are in the queue?
   - Click "Check Today's Stats"  
   - **REPORT**: What does it show for cardsReviewed, accuracy?
   - Click "Check Reviews"
   - **REPORT**: How many reviews were done today?

## Part 2: Check What Dashboard Shows

2. **On the main dashboard tab (localhost:3000):**
   - What does your dashboard show right now?
   - **REPORT**: Words reviewed today, accuracy, words to review

3. **Open Browser DevTools Console:**
   - Press F12 → Console tab
   - Look for any logs that start with `📊` or `[Sync]`
   - **REPORT**: Any relevant messages?

## Part 3: Reproduce the Offline Scenario (Optional - if we don't find the issue above)

4. **Let's simulate what happened this morning:**
   - Stay on http://localhost:3000 (logged in)
   - Press F12 → Network tab → Change to "Offline"
   - Offline indicator should appear in header

5. **Complete a few reviews offline:**
   - Click "Start Review"
   - Complete 3-5 flashcards
   - Finish the session
   - Dashboard should update

6. **Check what was queued:**
   - Open new tab: http://localhost:3000/debug-check-queue.html
   - Click "Check Offline Queue"
   - **REPORT**: What's in the queue?
   - Click "Check Today's Stats"
   - **REPORT**: What do local stats show?

7. **Go back online:**
   - F12 → Network → Change "Offline" to "No throttling"
   - Wait 10 seconds for auto-sync
   - Refresh the dashboard

8. **Check if stats changed:**
   - Did the stats stay correct?
   - Or did they reset to 0?

## Part 4: Get the Debug Logs

9. **Check the debug log file:**
   - Open `.cursor/debug.log` from your project root
   - Copy the entire contents
   - **REPORT**: Send me the log contents

---

## What to Report Back

Please provide:

1. **Initial state** (Part 1): Queue count and today's stats
2. **After offline reviews** (Part 2, step 5): Queue status and stats
3. **Desktop state** (Part 3, step 8): What dashboard shows
4. **After bringing mobile online** (Part 4, step 10): Stats on both browsers
5. **The complete `.cursor/debug.log` file contents**

---

## Expected Bug Behavior

If the bug is reproduced:
- Mobile completes 10 reviews offline → stats show 10 reviewed
- Desktop opens and syncs → uploads empty/stale stats
- Mobile comes online and syncs → downloads wrong stats from server
- Result: Both devices show 0 reviews (data lost)

---

## Alternative Quick Test (If you want to skip the full scenario)

If you just want to check the current state:

1. Open http://localhost:3000/debug-check-queue.html
2. Click all three buttons to see:
   - Offline queue status
   - Today's stats
   - Today's reviews
3. Share screenshot or copy the output
4. This will tell us if there are pending items from this morning

