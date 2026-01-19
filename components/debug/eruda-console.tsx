"use client";

import { useEffect } from 'react';

/**
 * Eruda Mobile Debug Console
 * 
 * Provides a mobile-friendly developer console overlay
 * that can be accessed on any device without USB debugging.
 * 
 * Features:
 * - Console logging
 * - Network monitoring
 * - Element inspection
 * - Local storage viewer
 * 
 * Usage: Click the green icon in bottom-right corner to open
 */
export function ErudaConsole() {
  useEffect(() => {
    // Only load Eruda on mobile devices or if explicitly enabled
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const shouldLoadEruda = isMobile || localStorage.getItem('debug_mode') === 'true';
    
    if (shouldLoadEruda) {
      import('eruda').then(eruda => {
        eruda.default.init();
        console.log('🔍 Eruda console initialized - tap the green button in bottom-right corner');
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
