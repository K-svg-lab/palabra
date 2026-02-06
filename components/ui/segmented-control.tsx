"use client";

import { motion } from "framer-motion";

/**
 * SegmentedControl Component - Phase 16.4 (Redesigned)
 * 
 * iOS-style tab navigation with animated underline.
 * Simpler, more reliable than sliding background approach.
 * 
 * Features:
 * - Smooth sliding underline animation
 * - Clean, minimal design
 * - Perfect alignment (no background box issues)
 * - Keyboard accessible
 */

export interface SegmentedTab {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  /** Array of tabs */
  tabs: SegmentedTab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onChange: (tabId: string) => void;
  /** Optional className */
  className?: string;
}

export function SegmentedControl({
  tabs,
  activeTab,
  onChange,
  className = "",
}: SegmentedControlProps) {
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  return (
    <div
      className={`
        relative
        flex
        bg-transparent
        border-b border-gray-200 dark:border-gray-700
        ${className}
      `}
      role="tablist"
    >
      {/* Tabs */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative
              flex items-center justify-center gap-1.5
              px-4 py-3
              flex-1
              text-xs sm:text-sm font-medium
              transition-colors duration-200
              ${isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }
            `}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
          >
            {tab.icon && (
              <span className="text-base sm:text-lg flex-shrink-0">
                {tab.icon}
              </span>
            )}
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}

      {/* Animated underline indicator */}
      <motion.div
        className="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400"
        initial={false}
        animate={{
          left: `${activeIndex * (100 / tabs.length)}%`,
          width: `${100 / tabs.length}%`,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      />
    </div>
  );
}
