/**
 * Utility functions
 */

import { clsx, ClassValue } from 'clsx';

/**
 * Merge class names with clsx
 * Used throughout the app for conditional className merging
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
