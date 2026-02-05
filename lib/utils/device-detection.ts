/**
 * Device Detection Utilities
 * 
 * Helps detect device types and screen sizes for responsive design.
 * Phase 16.2 - Task 4: Mobile Experience Polish
 */

'use client';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ScreenSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Detect current device type based on screen width and user agent
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();

  // Check user agent first for more accurate mobile detection
  if (ua.includes('mobile') && !ua.includes('tablet') && !ua.includes('ipad')) {
    return 'mobile';
  }

  // Check for tablet
  if (ua.includes('tablet') || ua.includes('ipad') || (width >= 768 && width < 1024)) {
    return 'tablet';
  }

  // Use breakpoints as fallback
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Get screen size category based on Tailwind breakpoints
 */
export function getScreenSize(): ScreenSize {
  if (typeof window === 'undefined') return 'lg';

  const width = window.innerWidth;

  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
}

/**
 * Check if current device is mobile
 */
export function isMobile(): boolean {
  return detectDeviceType() === 'mobile';
}

/**
 * Check if current device is tablet
 */
export function isTablet(): boolean {
  return detectDeviceType() === 'tablet';
}

/**
 * Check if current device is desktop
 */
export function isDesktop(): boolean {
  return detectDeviceType() === 'desktop';
}

/**
 * Check if screen is touch-enabled
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - Legacy IE support
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get viewport dimensions
 */
export function getViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Check if device is in portrait orientation
 */
export function isPortrait(): boolean {
  if (typeof window === 'undefined') return true;

  return window.innerHeight > window.innerWidth;
}

/**
 * Check if device is in landscape orientation
 */
export function isLandscape(): boolean {
  return !isPortrait();
}

/**
 * Get safe area insets for notched devices (iOS)
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const computed = getComputedStyle(document.documentElement);

  return {
    top: parseInt(computed.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
    right: parseInt(computed.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
    bottom: parseInt(computed.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
    left: parseInt(computed.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
  };
}

/**
 * Hook to detect device type with SSR safety
 */
export function useDeviceDetection() {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop' as DeviceType,
      screenSize: 'lg' as ScreenSize,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      isPortrait: true,
      isLandscape: false,
    };
  }

  const deviceType = detectDeviceType();
  const screenSize = getScreenSize();

  return {
    deviceType,
    screenSize,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isTouchDevice: isTouchDevice(),
    isPortrait: isPortrait(),
    isLandscape: isLandscape(),
  };
}

/**
 * Responsive value selector based on screen size
 * 
 * Usage:
 * ```tsx
 * const padding = responsiveValue({ mobile: 2, tablet: 4, desktop: 6 });
 * ```
 */
export function responsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default?: T;
}): T | undefined {
  const deviceType = detectDeviceType();

  switch (deviceType) {
    case 'mobile':
      return values.mobile ?? values.default;
    case 'tablet':
      return values.tablet ?? values.mobile ?? values.default;
    case 'desktop':
      return values.desktop ?? values.tablet ?? values.mobile ?? values.default;
    default:
      return values.default;
  }
}
