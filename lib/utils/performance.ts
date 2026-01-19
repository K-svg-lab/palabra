/**
 * Performance Utilities
 * 
 * Tools for optimizing application performance
 * 
 * @module lib/utils/performance
 */

/**
 * Debounce function
 * Delays execution until after wait period has elapsed since last call
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * Ensures function is called at most once per specified time period
 * 
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load function
 * Delays execution until element is visible in viewport
 * 
 * @param callback - Function to call when element is visible
 * @param options - Intersection observer options
 * @returns Cleanup function
 */
export function lazyLoad(
  element: Element,
  callback: () => void,
  options: IntersectionObserverInit = {}
): () => void {
  if (typeof window === 'undefined') {
    callback();
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  }, options);

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Measure performance
 * Logs execution time of a function (development only)
 * 
 * @param name - Name of the operation
 * @param func - Function to measure
 * @returns Function result
 */
export async function measurePerformance<T>(
  name: string,
  func: () => T | Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return func();
  }

  const start = performance.now();
  const result = await func();
  const end = performance.now();

  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);

  return result;
}

/**
 * Check if device is low-end
 * Detects devices with limited resources for performance optimization
 * 
 * @returns True if device appears to be low-end
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for navigator.deviceMemory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) return true;

  // Check for navigator.hardwareConcurrency
  const cpuCores = navigator.hardwareConcurrency;
  if (cpuCores && cpuCores < 4) return true;

  // Check connection speed (if available)
  const connection = (navigator as any).connection;
  if (connection && connection.effectiveType) {
    return ['slow-2g', '2g', '3g'].includes(connection.effectiveType);
  }

  return false;
}

/**
 * Preload critical resources
 * Improves perceived performance by preloading key assets
 * 
 * @param resources - Array of resource URLs to preload
 * @param type - Resource type (script, style, image, etc.)
 */
export function preloadResources(
  resources: string[],
  type: 'script' | 'style' | 'image' | 'font' = 'script'
): void {
  if (typeof window === 'undefined') return;

  resources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = type;
    link.href = resource;

    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  });
}

/**
 * Request idle callback wrapper
 * Executes low-priority tasks during browser idle time
 * 
 * @param callback - Function to execute during idle time
 * @param options - Idle callback options
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 1);
  }
}

/**
 * Optimize images
 * Returns optimal image URL based on device capabilities
 * 
 * @param src - Original image source
 * @param options - Optimization options
 * @returns Optimized image URL
 */
export function optimizeImage(
  src: string,
  options: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
): string {
  // For MVP, return original src
  // In future, integrate with image CDN or Next.js Image Optimization
  return src;
}

