'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DebugLayoutProps {
  children: React.ReactNode;
}

/**
 * Password-protected layout for SM-2 debug panel
 * Prevents unauthorized access while keeping debug tools available for developers
 */
export default function DebugLayout({ children }: DebugLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Check session storage on mount
  useEffect(() => {
    const debugAuth = sessionStorage.getItem('debug_auth');
    if (debugAuth === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  // Handle password submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check against environment variable or default password
    const correctPassword = process.env.NEXT_PUBLIC_DEBUG_PASSWORD || 'Reaper789';

    if (password === correctPassword) {
      sessionStorage.setItem('debug_auth', 'authenticated');
      setIsAuthenticated(true);
      setPassword('');
    } else {
      setAttempts(prev => prev + 1);
      setError('Incorrect password');
      setPassword('');

      // After 5 failed attempts, redirect to dashboard
      if (attempts >= 4) {
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('debug_auth');
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Warning Banner */}
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Developer Access Only
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  This area contains debugging tools for testing the spaced repetition algorithm. 
                  Unauthorized access is not permitted.
                </p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                SM-2 Debug Panel
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter password to access debugging tools
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter debug password"
                  autoFocus
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                  {attempts >= 3 && (
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining before redirect
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Access Debug Panel
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => router.push('/')}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                ← Return to Dashboard
              </button>
            </div>

            {/* Developer Note */}
            <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                <strong>For developers:</strong> Set password in <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">NEXT_PUBLIC_DEBUG_PASSWORD</code> env variable
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show debug panel with logout option
  return (
    <div className="relative">
      {/* Logout Button - Fixed Top Right */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-lg transition-colors flex items-center gap-2"
        title="Exit debug panel"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Exit Debug
      </button>
      
      {children}
    </div>
  );
}
