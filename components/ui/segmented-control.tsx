"use client";

import { motion } from "framer-motion";

/**
 * SegmentedControl Component - Phase 16.4
 * 
 * iOS-style segmented control for tab switching.
 * 
 * Features:
 * - Smooth sliding animation
 * - Clean visual design
 * - Flexible tab configuration
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
        inline-flex
        bg-gray-100 dark:bg-gray-800
        rounded-xl
        p-1
        ${className}
      `}
      role="tablist"
    >
      {/* Sliding background */}
      <motion.div
        className="absolute top-1 bottom-1 bg-white dark:bg-gray-900 rounded-lg shadow-sm"
        initial={false}
        animate={{
          left: `calc(${activeIndex * (100 / tabs.length)}% + 0.25rem)`,
          width: `calc(${100 / tabs.length}% - 0.5rem)`,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      />

      {/* Tabs */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative z-10
              flex items-center justify-center gap-2
              px-4 py-2
              min-w-[80px]
              text-sm font-medium
              transition-colors duration-200
              ${isActive
                ? "text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }
            `}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
          >
            {tab.icon && <span className="text-lg">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
