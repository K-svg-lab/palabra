"use client";

import { Grid, List } from "lucide-react";

/**
 * ViewToggle Component - Phase 16.4
 * 
 * Toggle between grid and list views with smooth animations.
 * 
 * Features:
 * - iOS-style segmented control
 * - Smooth sliding indicator
 * - Clear visual feedback
 * - Keyboard accessible
 */

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  /** Current view mode */
  value: ViewMode;
  /** Callback when view changes */
  onChange: (mode: ViewMode) => void;
  /** Optional className */
  className?: string;
}

export function ViewToggle({
  value,
  onChange,
  className = "",
}: ViewToggleProps) {
  return (
    <div
      className={`
        inline-flex
        bg-gray-100 dark:bg-gray-800
        rounded-lg
        p-1
        ${className}
      `}
      role="group"
      aria-label="View mode"
    >
      <button
        onClick={() => onChange("grid")}
        className={`
          relative
          flex items-center gap-2
          px-4 py-2
          rounded-md
          text-sm font-medium
          transition-all duration-200
          ${value === "grid"
            ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }
        `}
        aria-pressed={value === "grid"}
      >
        <Grid className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
      </button>

      <button
        onClick={() => onChange("list")}
        className={`
          relative
          flex items-center gap-2
          px-4 py-2
          rounded-md
          text-sm font-medium
          transition-all duration-200
          ${value === "list"
            ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }
        `}
        aria-pressed={value === "list"}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
}
