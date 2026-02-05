"use client";

import { motion } from "framer-motion";

/**
 * ToggleSwitch Component - Phase 16.4
 * 
 * iOS-style toggle switch with smooth animations.
 * 
 * Features:
 * - Smooth sliding animation
 * - Color transition
 * - Haptic-style feedback (visual)
 * - Keyboard accessible
 * - Disabled state
 */

interface ToggleSwitchProps {
  /** Whether the toggle is on */
  checked: boolean;
  /** Callback when toggle changes */
  onChange: (checked: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Optional className */
  className?: string;
  /** Optional label */
  label?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  className = "",
  label,
}: ToggleSwitchProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          relative
          inline-flex
          w-12 h-7
          rounded-full
          transition-colors duration-200
          ${disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
          }
          ${checked
            ? "bg-blue-600"
            : "bg-gray-300 dark:bg-gray-700"
          }
        `}
      >
        {/* Sliding knob */}
        <motion.div
          className={`
            absolute top-0.5
            w-6 h-6
            bg-white
            rounded-full
            shadow-md
          `}
          initial={false}
          animate={{
            x: checked ? 20 : 2,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>

      {label && (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </div>
  );
}
