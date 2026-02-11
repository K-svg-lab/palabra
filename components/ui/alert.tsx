/**
 * Alert Component
 * 
 * Displays contextual feedback messages with different variants.
 */

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

export interface AlertProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'default', children, className }: AlertProps) {
  const Icon = {
    default: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
    info: Info,
  }[variant];

  return (
    <div
      className={clsx(
        'rounded-lg border-2 p-4 flex gap-3',
        {
          'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100':
            variant === 'default',
          'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100':
            variant === 'success',
          'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100':
            variant === 'warning',
          'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100':
            variant === 'error',
          'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100':
            variant === 'info',
        },
        className
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export interface AlertTitleProps {
  children: ReactNode;
  className?: string;
}

export function AlertTitle({ children, className }: AlertTitleProps) {
  return (
    <h5 className={clsx('font-semibold mb-1', className)}>
      {children}
    </h5>
  );
}

export interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return (
    <div className={clsx('text-sm opacity-90', className)}>
      {children}
    </div>
  );
}
