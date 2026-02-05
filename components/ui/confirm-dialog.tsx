"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";

/**
 * ConfirmDialog Component - Phase 16.4
 * 
 * Beautiful confirmation dialog with smooth animations.
 * 
 * Features:
 * - Clean modal design
 * - Type-based styling (danger/info)
 * - Custom actions
 * - Backdrop blur
 * - Keyboard shortcuts (Enter/Escape)
 */

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Dialog type */
  type?: "danger" | "info";
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  type = "info",
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const config = {
    danger: {
      icon: AlertTriangle,
      iconColor: "text-red-600",
      iconBg: "bg-red-100 dark:bg-red-900/20",
      confirmClass:
        "bg-red-600 hover:bg-red-700 text-white",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      confirmClass:
        "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const currentConfig = config[type];
  const Icon = currentConfig.icon;

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

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
            onClick={onCancel}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onKeyDown={handleKeyDown}
              className="
                bg-white dark:bg-gray-900
                rounded-2xl
                shadow-2xl
                max-w-md
                w-full
                p-6
              "
            >
              {/* Icon */}
              <div
                className={`
                  w-12 h-12
                  rounded-full
                  ${currentConfig.iconBg}
                  flex items-center justify-center
                  mb-4
                `}
              >
                <Icon className={`w-6 h-6 ${currentConfig.iconColor}`} />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h2>

              {/* Message */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="
                    flex-1
                    px-4 py-3
                    bg-gray-100 dark:bg-gray-800
                    text-gray-900 dark:text-white
                    font-semibold
                    rounded-xl
                    hover:bg-gray-200 dark:hover:bg-gray-700
                    transition-colors
                  "
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`
                    flex-1
                    px-4 py-3
                    font-semibold
                    rounded-xl
                    transition-colors
                    ${currentConfig.confirmClass}
                  `}
                  autoFocus
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
