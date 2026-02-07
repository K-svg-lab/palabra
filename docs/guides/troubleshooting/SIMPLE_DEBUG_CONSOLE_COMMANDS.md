# Simple Debug Commands - Use Browser Console Directly

Instead of the debug tool (which causes version conflicts), just paste these commands directly into your browser console.

## Step 1: Check Offline Queue

Open browser console (F12 → Console tab) and paste this:

```javascript
// Check offline queue
(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('palabra_db');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const tx = db.transaction('offlineQueue', 'readonly');
  const store = tx.objectStore('offlineQueue');
  const queue = await new Promise(resolve => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
  
  console.log('=== OFFLINE QUEUE ===');
  console.log('Total items:', queue.length);
  console.log('Queue items:', queue);
  
  db.close();
  return queue;
})();
```

## Step 2: Check Today's Stats

```javascript
// Check today's stats
(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('palabra_db');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const tx = db.transaction('stats', 'readonly');
  const store = tx.objectStore('stats');
  const allStats = await new Promise(resolve => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
  
  const today = new Date().toISOString().split('T')[0];
  const todayStats = allStats.find(s => s.date === today);
  
  console.log('=== TODAY STATS ===');
  console.log('Date:', today);
  console.log('Stats:', todayStats);
  
  db.close();
  return todayStats;
})();
```

## Step 3: Check Today's Reviews

```javascript
// Check today's reviews
(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('palabra_db');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const tx = db.transaction('reviews', 'readonly');
  const store = tx.objectStore('reviews');
  const allReviews = await new Promise(resolve => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayReviews = allReviews.filter(r => {
    if (!r.lastReviewDate) return false;
    const reviewDate = new Date(r.lastReviewDate);
    return reviewDate >= today;
  });
  
  console.log('=== TODAY REVIEWS ===');
  console.log('Total reviews today:', todayReviews.length);
  console.log('Review records:', todayReviews.slice(0, 5)); // First 5
  
  db.close();
  return todayReviews;
})();
```

## What to Report

After running each command, send me:
1. The output from "=== OFFLINE QUEUE ===" 
2. The output from "=== TODAY STATS ==="
3. The output from "=== TODAY REVIEWS ==="

Also tell me:
- What does your dashboard currently show for words reviewed today?
- What does it show for accuracy?
- What does it show for words to review?
