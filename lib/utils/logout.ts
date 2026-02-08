/**
 * Logout Utilities (Security Fix - Feb 8, 2026)
 * 
 * Comprehensive logout that clears ALL client-side data:
 * - Server session (JWT cookie)
 * - IndexedDB (vocabulary, reviews, stats)
 * - React Query cache
 * - localStorage (onboarding flags, etc.)
 * 
 * CRITICAL: This prevents data leakage when users share devices
 * 
 * @module lib/utils/logout
 */

import { getDB } from '@/lib/db/schema';
import { DB_CONFIG } from '@/lib/constants/app';

/**
 * Perform complete logout - clear ALL client and server data
 * 
 * Steps:
 * 1. Call server signout API (clears JWT cookie)
 * 2. Clear IndexedDB (all user vocabulary data)
 * 3. Clear React Query cache
 * 4. Clear localStorage (onboarding flags, preferences)
 * 5. Clear sessionStorage
 * 6. Redirect to signin page
 * 
 * @throws {Error} If logout fails (should still clear client data)
 */
export async function performLogout(): Promise<void> {
  try {
    // 1. Call server API to clear session cookie
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to clear server session:', error);
      // Continue anyway - clear client data even if server fails
    }

    // 2. Clear IndexedDB (all stores)
    await clearIndexedDB();

    // 3. Clear React Query cache (if available)
    clearReactQueryCache();

    // 4. Clear localStorage
    clearLocalStorage();

    // 5. Clear sessionStorage
    sessionStorage.clear();

    // 6. Redirect to signin page
    window.location.href = '/signin';
  } catch (error) {
    console.error('Logout error:', error);
    // Even if errors occur, redirect to signin
    window.location.href = '/signin';
  }
}

/**
 * Clear ALL IndexedDB stores
 * 
 * Clears:
 * - vocabulary: All vocabulary words
 * - reviews: All review records
 * - sessions: All session data
 * - stats: All progress statistics
 */
async function clearIndexedDB(): Promise<void> {
  try {
    const db = await getDB();

    // Clear all stores
    const stores = Object.values(DB_CONFIG.STORES);
    
    for (const storeName of stores) {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        await tx.objectStore(storeName).clear();
        await tx.done;
        console.log(`✅ Cleared IndexedDB store: ${storeName}`);
      } catch (error) {
        console.error(`Failed to clear store ${storeName}:`, error);
        // Continue clearing other stores even if one fails
      }
    }

    console.log('✅ All IndexedDB stores cleared');
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
    // Try nuclear option: delete entire database
    try {
      indexedDB.deleteDatabase(DB_CONFIG.NAME);
      console.log('✅ IndexedDB database deleted (nuclear option)');
    } catch (deleteError) {
      console.error('Failed to delete IndexedDB:', deleteError);
    }
  }
}

/**
 * Clear React Query cache
 * Removes all cached API responses
 */
function clearReactQueryCache(): void {
  try {
    // Access the global query client if it exists
    const queryClient = (window as any).__REACT_QUERY_CLIENT__;
    if (queryClient) {
      queryClient.clear();
      console.log('✅ React Query cache cleared');
    }
  } catch (error) {
    console.error('Failed to clear React Query cache:', error);
  }
}

/**
 * Clear localStorage
 * Removes all app-specific data including:
 * - Onboarding completion flags
 * - User preferences
 * - A/B test assignments
 * - Any cached user data
 */
function clearLocalStorage(): void {
  try {
    // Get all keys to avoid modifying during iteration
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }

    // Clear app-specific keys
    keys.forEach((key) => {
      // Only clear palabra-related keys to avoid breaking other apps
      if (
        key.startsWith('palabra_') ||
        key.startsWith('tanstack') ||
        key === 'theme' // Optional: keep theme preference
      ) {
        localStorage.removeItem(key);
        console.log(`✅ Cleared localStorage key: ${key}`);
      }
    });

    console.log('✅ localStorage cleared');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Check if user is authenticated
 * Safe to call - won't throw errors
 * 
 * @returns Promise<boolean> True if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/me');
    return response.ok;
  } catch {
    return false;
  }
}
