"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ModalSheet Component - Phase 16.4
 * 
 * iOS-style bottom sheet modal with smooth animations.
 * 
 * Features:
 * - Slides up from bottom
 * - Backdrop blur
 * - Drag handle
 * - Click outside to close
 * - Escape key to close
 * - Responsive sizing
 * - Smooth animations
 */

interface ModalSheetProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional subtitle */
  subtitle?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "full";
  /** Show close button */
  showClose?: boolean;
}

export function ModalSheet({
  isOpen,
  onClose,
  title,
  children,
  subtitle,
  size = "md",
  showClose = true,
}: ModalSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Size configurations
  const sizeClasses = {
    sm: "max-h-[50vh]",
    md: "max-h-[70vh]",
    lg: "max-h-[85vh]",
    full: "h-[95vh]",
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50"
          >
            <div
              ref={contentRef}
              className={`
                bg-white dark:bg-gray-900
                rounded-t-3xl
                shadow-2xl
                ${sizeClasses[size]}
                overflow-hidden
                flex flex-col
              `}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>

                {showClose && (
                  <button
                    onClick={onClose}
                    className="
                      p-2 -mr-2
                      rounded-full
                      hover:bg-gray-100 dark:hover:bg-gray-800
                      transition-colors
                      flex-shrink-0
                    "
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
