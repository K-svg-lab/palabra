/**
 * Account Settings Component
 * Manages user authentication and account preferences
 */

'use client';

import { useEffect, useState } from 'react';
import { User, LogOut, Cloud, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { clearAllUserData } from '@/lib/db/schema';

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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
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
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-semibold">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {user.name || 'User'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
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

