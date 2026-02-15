/**
 * PWA Provider
 * Handles PWA initialization, service worker registration, and offline detection
 */

'use client';

import { useEffect, createContext, useContext, useState, ReactNode } from 'react';
import { registerServiceWorker, requestPersistentStorage } from '@/lib/utils/pwa';
import { OfflineIndicator } from '@/components/features/offline-indicator';
import { IOSInstallPrompt } from '@/components/features/ios-install-prompt';

interface PWAContextValue {
  isOnline: boolean;
  isInstalled: boolean;
  registration: ServiceWorkerRegistration | null;
}

const PWAContext = createContext<PWAContextValue>({
  isOnline: true,
  isInstalled: false,
  registration: null,
});

export function usePWA() {
  return useContext(PWAContext);
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  useEffect(() => {
    // Initialize PWA features
    async function initializePWA() {
      // Check if installed (supports both standard and iOS-specific detection)
      const installed = window.matchMedia('(display-mode: standalone)').matches
                        || (navigator as any).standalone === true; // iOS-specific property
      setIsInstalled(installed);
      
      // Register service worker
      const reg = await registerServiceWorker();
      if (reg) {
        setRegistration(reg);
      }
      
      // Request persistent storage
      await requestPersistentStorage();
      
      // Setup online/offline listeners
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    
    initializePWA();
  }, []);
  
  const value: PWAContextValue = {
    isOnline,
    isInstalled,
    registration,
  };
  
  return (
    <PWAContext.Provider value={value}>
      {children}
      <OfflineIndicator />
      <IOSInstallPrompt />
    </PWAContext.Provider>
  );
}

