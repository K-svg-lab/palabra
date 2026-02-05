"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { UserProfileChip } from "./user-profile-chip";

/**
 * AppHeader Component - Phase 16.4
 * 
 * Unified header system for all pages with Apple-inspired design.
 * 
 * Features:
 * - Sticky positioning with backdrop blur
 * - Dynamic shadow on scroll
 * - Optional back button
 * - User profile chip
 * - Custom actions
 * - Transparent mode for hero sections
 * - Responsive layout
 */

interface AppHeaderProps {
  /** Emoji icon for the page */
  icon?: string;
  /** Main title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Show back button */
  showBack?: boolean;
  /** Custom back action */
  onBack?: () => void;
  /** Custom action buttons (right side) */
  actions?: React.ReactNode;
  /** Start transparent (for hero sections) */
  transparent?: boolean;
  /** Show user profile chip */
  showProfile?: boolean;
}

export function AppHeader({
  icon,
  title,
  subtitle,
  showBack = false,
  onBack,
  actions,
  transparent = false,
  showProfile = true,
}: AppHeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isTransparent, setIsTransparent] = useState(transparent);

  // Track scroll position for dynamic styling
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 10);
      
      // If transparent mode, become opaque after scrolling
      if (transparent) {
        setIsTransparent(offset < 50);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transparent]);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header
      className={`
        sticky top-0 z-40
        transition-all duration-300
        ${isTransparent
          ? "bg-transparent"
          : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl"
        }
        ${scrolled && !isTransparent
          ? "shadow-sm border-b border-gray-200 dark:border-gray-800"
          : ""
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left side: Back button or Icon + Title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {showBack && (
              <button
                onClick={handleBackClick}
                className="
                  p-2 -ml-2
                  rounded-full
                  hover:bg-black/5 dark:hover:bg-white/5
                  active:bg-black/10 dark:active:bg-white/10
                  transition-colors
                "
                aria-label="Go back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="flex items-center gap-3 min-w-0">
              {icon && !showBack && (
                <div
                  className="
                    text-3xl sm:text-4xl
                    flex-shrink-0
                  "
                >
                  {icon}
                </div>
              )}

              <div className="min-w-0">
                <h1
                  className={`
                    font-bold
                    ${isTransparent
                      ? "text-white drop-shadow-lg"
                      : "text-gray-900 dark:text-white"
                    }
                    ${subtitle ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}
                    truncate
                  `}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p
                    className={`
                      text-sm sm:text-base
                      ${isTransparent
                        ? "text-white/80 drop-shadow"
                        : "text-gray-600 dark:text-gray-400"
                      }
                      truncate
                    `}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Actions + Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Custom actions */}
            {actions && (
              <div className="flex items-center gap-1 sm:gap-2">
                {actions}
              </div>
            )}

            {/* User profile chip */}
            {showProfile && (
              <div className="hidden sm:block">
                <UserProfileChip transparent={isTransparent} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
