/**
 * Account Settings Component
 * Manages user authentication and account preferences
 */

'use client';

import { useEffect, useState } from 'react';
import { User, LogOut, Cloud, Smartphone, GraduationCap, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { clearAllUserData } from '@/lib/db/schema';
import { type CEFRLevel, CEFR_LEVELS, getLevelDescription } from '@/lib/types/proficiency';
import { useReviewPreferences } from '@/lib/hooks/use-review-preferences';

interface AccountSettingsProps {
  onAuthChanged?: () => void;
}

/**
 * Account Settings Component
 * Displays authentication status and provides sign in/sign up/sign out options
 */
export function AccountSettings({ onAuthChanged }: AccountSettingsProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] = useState<CEFRLevel>('B1');
  const [updatingLevel, setUpdatingLevel] = useState(false);
  
  // Phase 18.1.5: Interleaving preferences
  const { preferences, setPreferences } = useReviewPreferences();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        if (data.user?.languageLevel) {
          setProficiencyLevel(data.user.languageLevel as CEFRLevel);
        }
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProficiency = async (newLevel: CEFRLevel) => {
    if (!user) return;
    
    try {
      setUpdatingLevel(true);
      const response = await fetch('/api/user/proficiency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languageLevel: newLevel }),
      });
      
      if (response.ok) {
        setProficiencyLevel(newLevel);
        setUser({ ...user, languageLevel: newLevel });
        onAuthChanged?.();
      }
    } catch (error) {
      console.error('Failed to update proficiency:', error);
    } finally {
      setUpdatingLevel(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      
      // Sign out from server
      await fetch('/api/auth/signout', { method: 'POST' });
      
      // Clear all local data (important for privacy!)
      console.log('🗑️ Clearing local data after sign out...');
      try {
        await clearAllUserData();
        console.log('✅ Local data cleared!');
      } catch (clearError) {
        console.error('⚠️ Failed to clear local data:', clearError);
      }
      
      // Force hard reload to show clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
      // Even if sign out fails, try to clear local data and reload
      try {
        await clearAllUserData();
      } catch (clearError) {
        console.error('Failed to clear local data:', clearError);
      }
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Account Status
        </h2>
        
        {user ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {/* User Info Section */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-semibold">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {user.name || 'User'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Cloud className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Cloud Sync Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Out Row - iOS Style */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="
                w-full px-4 py-3.5
                flex items-center justify-between
                hover:bg-gray-50 dark:hover:bg-gray-800
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                border-t border-gray-200 dark:border-gray-700
              "
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </span>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Not signed in
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sign in to sync your vocabulary across all your devices and never lose your progress.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Link
                  href="/signin"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-center"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proficiency Level - Phase 18.1.1 */}
      {user && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Language Proficiency
          </h2>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
              Your Spanish level helps us personalize your learning experience. We'll adjust automatically based on your performance.
            </p>
            
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Level: <span className="text-blue-600 dark:text-blue-400 font-semibold">{proficiencyLevel}</span>
              </label>
              
              <select
                value={proficiencyLevel}
                onChange={(e) => handleUpdateProficiency(e.target.value as CEFRLevel)}
                disabled={updatingLevel}
                className="w-full px-3 py-2.5 text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level} - {getLevelDescription(level)}
                  </option>
                ))}
              </select>
              
              {updatingLevel && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </p>
              )}
            </div>
            
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 dark:text-blue-400 text-sm flex-shrink-0">💡</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Tip:</strong> Don't worry about getting it perfect. We'll suggest adjustments after analyzing your reviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Preferences - Phase 18.1.5 */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <Shuffle className="w-5 h-5" />
          Learning Preferences
        </h2>
        
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
          {/* Interleaving Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Interleaved Practice
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Mix words by type, age, and difficulty during review sessions for better retention (recommended)
              </p>
            </div>
            
            <button
              onClick={() => setPreferences({ interleavingEnabled: !preferences.interleavingEnabled })}
              className={`
                relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${preferences.interleavingEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
              `}
              role="switch"
              aria-checked={preferences.interleavingEnabled}
              aria-label="Toggle interleaved practice"
            >
              <span
                className={`
                  pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${preferences.interleavingEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
          
          {/* Info Box */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 dark:text-blue-400 text-sm flex-shrink-0">🧠</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Research-backed:</strong> Interleaving improves long-term retention by 43% compared to blocked practice. 
                Words are mixed by part of speech, age (new/mature), and difficulty level.
              </p>
            </div>
          </div>
        </div>
        
        {/* Phase 18.2.2: Deep Learning Mode */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 mt-4">
          {/* Deep Learning Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Deep Learning Mode
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Occasionally asks "why/how" questions to encourage deeper thinking (every 12 cards)
              </p>
            </div>
            
            <button
              onClick={() => setPreferences({ deepLearningEnabled: !preferences.deepLearningEnabled })}
              className={`
                relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                ${preferences.deepLearningEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}
              `}
              role="switch"
              aria-checked={preferences.deepLearningEnabled}
              aria-label="Toggle deep learning mode"
            >
              <span
                className={`
                  pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${preferences.deepLearningEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
          
          {/* Frequency Selector (only when enabled) */}
          {preferences.deepLearningEnabled && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Frequency
              </label>
              <select
                value={preferences.deepLearningFrequency || 12}
                onChange={(e) => setPreferences({ deepLearningFrequency: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={10}>Every 10 cards</option>
                <option value={12}>Every 12 cards (recommended)</option>
                <option value={15}>Every 15 cards</option>
                <option value={20}>Every 20 cards</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How often to pause for deeper reflection
              </p>
            </div>
          )}
          
          {/* Info Box */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-start gap-2">
              <div className="text-purple-600 dark:text-purple-400 text-sm flex-shrink-0">✨</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Research-backed:</strong> Elaborative interrogation (asking "why/how" questions) improves retention with a medium-large effect size (d = 0.71). 
                Completely optional and auto-skips after 3 seconds if you're busy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Sync Benefits */}
      <div>
        <h3 className="text-base font-semibold mb-3">Cloud Sync Benefits</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Multi-Device Access
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Access your vocabulary from any device - phone, tablet, or computer
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
              <Cloud className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Automatic Backup
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Your vocabulary is safely backed up in the cloud
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Real-Time Sync
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Changes sync instantly across all your devices
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Privacy:</strong> Your vocabulary data is encrypted and only accessible to you. 
          We never share your data with third parties.
        </p>
      </div>
    </div>
  );
}

