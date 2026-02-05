"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

/**
 * SearchBarEnhanced Component - Phase 16.4
 * 
 * Apple-inspired pill-shaped search bar with smooth interactions.
 * 
 * Features:
 * - Pill-shaped design
 * - Expand on focus
 * - Clear button when has value
 * - Keyboard shortcuts (Cmd+K)
 * - Smooth animations
 * - Auto-focus support
 */

interface SearchBarEnhancedProps {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Callback when search is submitted */
  onSubmit?: (value: string) => void;
  /** Optional className */
  className?: string;
}

export function SearchBarEnhanced({
  value,
  onChange,
  placeholder = "Search...",
  autoFocus = false,
  onSubmit,
  className = "",
}: SearchBarEnhancedProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        relative
        transition-all duration-300
        ${className}
      `}
    >
      <div
        className={`
          relative
          flex items-center
          bg-gray-100 dark:bg-gray-800
          rounded-full
          transition-all duration-300
          ${isFocused
            ? "ring-2 ring-blue-500 bg-white dark:bg-gray-900"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
          }
        `}
      >
        {/* Search icon */}
        <div className="absolute left-4 pointer-events-none">
          <Search
            className={`
              w-5 h-5
              transition-colors duration-200
              ${isFocused
                ? "text-blue-600"
                : "text-gray-400"
              }
            `}
          />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="
            w-full
            py-3 pl-12 pr-12
            bg-transparent
            text-gray-900 dark:text-white
            placeholder-gray-500
            outline-none
            text-base
          "
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="
              absolute right-3
              p-1.5
              rounded-full
              bg-gray-200 dark:bg-gray-700
              hover:bg-gray-300 dark:hover:bg-gray-600
              transition-all duration-200
              hover:scale-110
            "
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Keyboard shortcut hint (when not focused and empty) */}
        {!isFocused && !value && (
          <div className="absolute right-4 pointer-events-none hidden sm:block">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700 rounded">
              ⌘K
            </kbd>
          </div>
        )}
      </div>
    </form>
  );
}
