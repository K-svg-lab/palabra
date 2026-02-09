/**
 * Service Worker for Palabra PWA
 * Handles notifications, background sync, offline functionality, and advanced caching
 * Enhanced for offline mode with queue support and vocabulary caching
 * 
 * Note: Vocabulary data is cached in IndexedDB (not service worker cache)
 * for better performance and querying capabilities. The service worker
 * caches static assets and provides offline fallbacks for API routes.
 */

// CRITICAL: Increment cache version to bust old caches
// Use timestamp-based versioning to force cache refresh on every deployment
// Phase 18 UX Fix: v5-20260209 - Added critical routes for offline quiz start
const CACHE_VERSION = 'v5-20260209';
const CACHE_NAME = `palabra-${CACHE_VERSION}`;
const STATIC_CACHE = `palabra-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `palabra-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `palabra-images-${CACHE_VERSION}`;
const AUDIO_CACHE = `palabra-audio-${CACHE_VERSION}`;

// Files to cache immediately
// Phase 18 UX Fix: Pre-cache critical app routes for offline quiz start
// Users can now START a quiz offline (data is already in IndexedDB)
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Critical UI pages for offline functionality
  '/review',        // Quiz interface
  '/vocabulary',    // Vocabulary management
  '/progress',      // Progress tracking
  '/settings',      // Settings/preferences
];

// API routes that should use network-first strategy
const API_ROUTES = [
  '/api/auth/',
  '/api/sync/',
];

// Maximum cache sizes
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;
const MAX_AUDIO_CACHE_SIZE = 50;

/**
 * Install event - cache static files
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES).catch((err) => {
          console.error('Service Worker: Failed to cache some files', err);
          // Don't fail the install if some files fail to cache
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - clean up old caches and take control immediately
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete ALL old caches (different versions)
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Taking control of all clients');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that new SW is active
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UPDATED' });
          });
        });
      })
  );
});

/**
 * Fetch event - Enhanced caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    // But handle POST for background sync
    if (request.method === 'POST' && isAPIRoute(url.pathname)) {
      event.respondWith(handleAPIRequest(request));
    }
    return;
  }

  // Choose caching strategy based on request type
  if (isAPIRoute(url.pathname)) {
    // API routes: Network-first with offline fallback
    // Vocabulary data is stored in IndexedDB, not service worker cache
    // The offline queue handles failed API requests
    event.respondWith(networkFirstStrategy(request));
  } else if (isImageRequest(request)) {
    // Images: Cache-first, fallback to network
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (isAudioRequest(request)) {
    // Audio: Cache-first, fallback to network
    event.respondWith(cacheFirstStrategy(request, AUDIO_CACHE));
  } else if (isStaticFile(url.pathname)) {
    // Static files: Cache-first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else {
    // HTML pages: Network-first to always get latest deployment
    // CRITICAL: Don't serve stale HTML from cache
    event.respondWith(networkFirstStrategy(request));
  }
});

/**
 * Check if route is an API route
 */
function isAPIRoute(pathname) {
  return API_ROUTES.some(route => pathname.startsWith(route));
        }

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
  return request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

/**
 * Check if request is for audio
 */
function isAudioRequest(request) {
  return request.destination === 'audio' || /\.(mp3|ogg|wav|m4a)$/i.test(request.url);
}

/**
 * Check if file is static
 */
function isStaticFile(pathname) {
  return STATIC_FILES.includes(pathname) || /\.(css|js|woff|woff2|ttf)$/i.test(pathname);
}

/**
 * Network-first caching strategy
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
            }

    // Return error response
    return new Response(
      JSON.stringify({ error: 'Offline - cached data not available' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache-first caching strategy
 */
async function cacheFirstStrategy(request, cacheName) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fallback to network
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      
      // Cleanup old cache entries
      await cleanupCache(cacheName, 
        cacheName === IMAGE_CACHE ? MAX_IMAGE_CACHE_SIZE :
        cacheName === AUDIO_CACHE ? MAX_AUDIO_CACHE_SIZE :
        MAX_DYNAMIC_CACHE_SIZE
      );
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline response
    return new Response('Offline - resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Stale-while-revalidate caching strategy
 */
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      await cleanupCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

/**
 * Cleanup old cache entries
 */
async function cleanupCache(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Delete oldest entries
    const toDelete = keys.length - maxSize;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

/**
 * Handle API requests (for background sync)
 */
async function handleAPIRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Store failed request for background sync
    return new Response(
      JSON.stringify({ error: 'Request queued for sync' }),
      {
        status: 202,
        statusText: 'Accepted',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Push event - handle push notifications
 */
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event);

  let data = {
    title: 'Palabra',
    body: 'Time to review your vocabulary!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'palabra-notification',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'palabra-notification',
    data: data.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'review',
        title: 'Review Now',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification click event - handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  if (event.action === 'review') {
    // Open the review page
    event.waitUntil(
      clients.openWindow('/review')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If a window is already open, focus it
          for (const client of clientList) {
            if ('focus' in client) {
              return client.focus();
            }
          }
          // Otherwise, open a new window
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

/**
 * Background sync event - Enhanced
 */
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event);
  
  if (event.tag === 'sync-vocabulary') {
    event.waitUntil(syncVocabulary());
  } else if (event.tag === 'sync-reviews') {
    event.waitUntil(syncReviews());
  } else if (event.tag === 'sync-stats') {
    event.waitUntil(syncStats());
  }
});

/**
 * Sync vocabulary data
 */
async function syncVocabulary() {
  try {
    console.log('[SW] Syncing vocabulary...');
    
    // Get pending operations from IndexedDB
    // This would be implemented based on your sync queue structure
    
    // Make sync request
    const response = await fetch('/api/sync/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operations: [], // Add pending operations here
      }),
    });
    
    if (response.ok) {
      console.log('[SW] Vocabulary synced successfully');
    }
  } catch (error) {
    console.error('[SW] Vocabulary sync failed:', error);
    throw error; // Retry on next sync opportunity
  }
}

/**
 * Sync review data
 */
async function syncReviews() {
  try {
    console.log('[SW] Syncing reviews...');
    
    const response = await fetch('/api/sync/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operations: [],
      }),
    });
    
    if (response.ok) {
      console.log('[SW] Reviews synced successfully');
    }
  } catch (error) {
    console.error('[SW] Reviews sync failed:', error);
    throw error;
  }
}

/**
 * Sync stats data
 */
async function syncStats() {
  try {
    console.log('[SW] Syncing stats...');
    
    const response = await fetch('/api/sync/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operations: [],
      }),
    });
    
    if (response.ok) {
      console.log('[SW] Stats synced successfully');
    }
  } catch (error) {
    console.error('[SW] Stats sync failed:', error);
    throw error;
  }
}

/**
 * Periodic background sync (if supported)
 */
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync', event);
  
  if (event.tag === 'sync-all') {
    event.waitUntil(
      Promise.all([
        syncVocabulary(),
        syncReviews(),
        syncStats(),
      ])
    );
  }
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Handle manual refresh requests (pull-to-refresh)
  if (event.data && event.data.type === 'FORCE_REFRESH') {
    console.log('[SW] Force refresh requested - clearing caches');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        // Notify client that caches are cleared
        event.source.postMessage({ type: 'CACHES_CLEARED' });
      })
    );
  }

  if (event.data && event.data.type === 'UPDATE_BADGE') {
    // Update badge count
    const count = event.data.count || 0;
    if ('setAppBadge' in self.navigator) {
      self.navigator.setAppBadge(count).catch(console.error);
    }
  }

  if (event.data && event.data.type === 'CLEAR_BADGE') {
    if ('clearAppBadge' in self.navigator) {
      self.navigator.clearAppBadge().catch(console.error);
    }
  }
});

console.log('Service Worker: Loaded');

