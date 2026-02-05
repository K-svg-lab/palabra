"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

/**
 * ToastNotification Component - Phase 16.4
 * 
 * Beautiful toast notifications with auto-dismiss and smooth animations.
 * 
 * Features:
 * - Type-based styling (success/error/warning/info)
 * - Auto-dismiss with configurable duration
 * - Manual dismiss button
 * - Slide in from top
 * - Icon-based feedback
 */

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastNotificationProps {
  /** Whether the toast is visible */
  isVisible: boolean;
  /** Toast type */
  type: ToastType;
  /** Toast message */
  message: string;
  /** Optional description */
  description?: string;
  /** Callback when dismissed */
  onDismiss: () => void;
  /** Auto-dismiss duration in ms (0 to disable) */
  duration?: number;
}

export function ToastNotification({
  isVisible,
  type,
  message,
  description,
  onDismiss,
  duration = 5000,
}: ToastNotificationProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-500",
      iconColor: "text-green-600 dark:text-green-400",
      textColor: "text-green-900 dark:text-green-100",
    },
    error: {
      icon: XCircle,
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-500",
      iconColor: "text-red-600 dark:text-red-400",
      textColor: "text-red-900 dark:text-red-100",
    },
    warning: {
      icon: AlertCircle,
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-500",
      iconColor: "text-orange-600 dark:text-orange-400",
      textColor: "text-orange-900 dark:text-orange-100",
    },
    info: {
      icon: Info,
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-500",
      iconColor: "text-blue-600 dark:text-blue-400",
      textColor: "text-blue-900 dark:text-blue-100",
    },
  };

  const currentConfig = config[type];
  const Icon = currentConfig.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div
            className={`
              ${currentConfig.bg}
              ${currentConfig.border}
              border-l-4
              rounded-xl
              shadow-lg
              backdrop-blur-sm
              p-4
              flex items-start gap-3
            `}
          >
            {/* Icon */}
            <Icon className={`w-6 h-6 flex-shrink-0 ${currentConfig.iconColor}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${currentConfig.textColor}`}>
                {message}
              </p>
              {description && (
                <p
                  className={`text-sm mt-1 ${currentConfig.textColor} opacity-80`}
                >
                  {description}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onDismiss}
              className={`
                p-1 rounded-lg
                hover:bg-black/5 dark:hover:bg-white/5
                transition-colors
                flex-shrink-0
                ${currentConfig.iconColor}
              `}
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
