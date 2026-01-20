/**
 * PWA Utilities
 * Service worker registration and PWA feature detection
 */

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('[PWA] Service Worker registered:', registration.scope);
    
    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker available (update)
            console.log('[PWA] New version detected - update available');
            
            // CRITICAL FIX: Auto-reload on update instead of prompting
            // This ensures PWA always runs latest version after deployment
            console.log('[PWA] Auto-updating to new version...');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            
            // Show brief notification before reload
            const notification = document.createElement('div');
            notification.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#007aff;color:white;padding:12px;text-align:center;z-index:9999;font-size:14px;';
            notification.textContent = 'New version available! Updating...';
            document.body.appendChild(notification);
            
            // Reload after short delay
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            // First install
            console.log('[PWA] Service Worker installed for first time');
          }
        }
      });
    });
    
    // Handle controller change (SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service Worker controller changed');
      // Don't auto-reload here - let the update flow handle it
    });
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[PWA] Service Worker updated - reloading page');
        window.location.reload();
      }
      
      if (event.data && event.data.type === 'CACHES_CLEARED') {
        console.log('[PWA] Caches cleared successfully');
      }
    });
    
    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log('[PWA] Service Worker unregistered:', success);
    return success;
  } catch (error) {
    console.error('[PWA] Service Worker unregister failed:', error);
    return false;
  }
}

/**
 * Check if PWA is installed
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS standalone
  if ((navigator as any).standalone) {
    return true;
  }
  
  return false;
}

/**
 * Check if device supports PWA install
 */
export function supportsPWAInstall(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for beforeinstallprompt support
  return 'BeforeInstallPromptEvent' in window || isIOSDevice();
}

/**
 * Check if device is iOS
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if browser is Safari
 */
export function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    return false;
  }
  
  try {
    // Check if already persistent
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      console.log('[PWA] Storage is already persistent');
      return true;
    }
    
    // Request persistence
    const granted = await navigator.storage.persist();
    console.log('[PWA] Storage persistence:', granted ? 'granted' : 'denied');
    return granted;
  } catch (error) {
    console.error('[PWA] Failed to request persistent storage:', error);
    return false;
  }
}

/**
 * Get storage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null> {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    return null;
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;
    
    return { usage, quota, percentage };
  } catch (error) {
    console.error('[PWA] Failed to get storage estimate:', error);
    return null;
  }
}

/**
 * Check if browser supports notifications
 */
export function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Check notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!supportsNotifications()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!supportsNotifications()) {
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('[PWA] Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Show notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!supportsNotifications()) {
    console.log('[PWA] Notifications not supported');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    console.log('[PWA] Notification permission not granted');
    return;
  }
  
  try {
    // Try to use service worker notification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
    } else {
      // Fallback to regular notification
      new Notification(title, options);
    }
  } catch (error) {
    console.error('[PWA] Failed to show notification:', error);
  }
}

/**
 * Update app badge
 */
export async function updateBadge(count: number): Promise<void> {
  if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) {
    return;
  }
  
  try {
    if (count > 0) {
      await (navigator as any).setAppBadge(count);
    } else {
      await (navigator as any).clearAppBadge();
    }
  } catch (error) {
    console.error('[PWA] Failed to update badge:', error);
  }
}

/**
 * Clear app badge
 */
export async function clearBadge(): Promise<void> {
  if (typeof navigator === 'undefined' || !('clearAppBadge' in navigator)) {
    return;
  }
  
  try {
    await (navigator as any).clearAppBadge();
  } catch (error) {
    console.error('[PWA] Failed to clear badge:', error);
  }
}

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
    } else {
      console.log('[PWA] Background sync not supported');
    }
  } catch (error) {
    console.error('[PWA] Failed to register background sync:', error);
  }
}

/**
 * Share content (Web Share API)
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('share' in navigator)) {
    return false;
  }
  
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // User cancelled or error occurred
    return false;
  }
}

/**
 * Check if browser supports Web Share API
 */
export function supportsWebShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Get device info
 */
export function getDeviceInfo(): {
  type: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  browser: string;
  isStandalone: boolean;
} {
  const ua = navigator.userAgent;
  
  // Device type
  let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/mobile/i.test(ua)) {
    type = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    type = 'tablet';
  }
  
  // Platform
  let platform = 'unknown';
  if (/windows/i.test(ua)) platform = 'Windows';
  else if (/mac/i.test(ua)) platform = 'macOS';
  else if (/linux/i.test(ua)) platform = 'Linux';
  else if (/android/i.test(ua)) platform = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) platform = 'iOS';
  
  // Browser
  let browser = 'unknown';
  if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/edge/i.test(ua)) browser = 'Edge';
  
  return {
    type,
    platform,
    browser,
    isStandalone: isPWAInstalled(),
  };
}

