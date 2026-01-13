/**
 * Onboarding utilities
 * 
 * Handles first-time user experience and onboarding state
 * 
 * @module lib/utils/onboarding
 */

const ONBOARDING_STORAGE_KEY = 'palabra_onboarding_completed';

/**
 * Check if user has completed onboarding
 * 
 * @returns True if onboarding has been completed
 */
export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return true; // SSR
  
  try {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return completed === 'true';
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    return true; // Default to completed to avoid blocking users
  }
}

/**
 * Mark onboarding as completed
 */
export function completeOnboarding(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  } catch (error) {
    console.error('Failed to save onboarding status:', error);
  }
}

/**
 * Reset onboarding status (for testing)
 */
export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset onboarding status:', error);
  }
}

