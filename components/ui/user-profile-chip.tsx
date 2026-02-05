"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

/**
 * UserProfileChip Component - Phase 16.4
 * 
 * Consistent user profile widget across all pages.
 * 
 * Features:
 * - Avatar with fallback initials
 * - Dropdown menu
 * - Quick actions (Profile, Settings, Logout)
 * - Smooth animations
 * - Click outside to close
 */

interface UserProfileChipProps {
  /** Make transparent for hero sections */
  transparent?: boolean;
}

export function UserProfileChip({ transparent = false }: UserProfileChipProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mock user data - replace with actual user context
  const user = {
    name: "Kalvin",
    email: "kbrookes2507@gmail.com",
    avatar: null, // Set to URL if available
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const menuItems = [
    {
      icon: User,
      label: "Profile",
      onClick: () => {
        setIsOpen(false);
        // Navigate to profile page when implemented
      },
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => {
        setIsOpen(false);
        router.push("/settings");
      },
    },
    {
      icon: LogOut,
      label: "Sign Out",
      onClick: () => {
        setIsOpen(false);
        // Implement logout logic
        console.log("Logout clicked");
      },
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2
          px-3 py-2
          rounded-full
          transition-all duration-200
          ${transparent
            ? "bg-white/20 hover:bg-white/30 backdrop-blur-md text-white"
            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          }
          ${isOpen ? "ring-2 ring-blue-500" : ""}
        `}
      >
        {/* Avatar */}
        <div
          className={`
            w-8 h-8
            rounded-full
            flex items-center justify-center
            text-sm font-semibold
            ${transparent
              ? "bg-white/30 text-white"
              : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
            }
          `}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(user.name)
          )}
        </div>

        {/* Name (desktop only) */}
        <span className="hidden md:block text-sm font-medium">
          {user.name}
        </span>

        {/* Dropdown arrow */}
        <ChevronDown
          className={`
            w-4 h-4
            transition-transform duration-200
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="
            absolute top-full right-0 mt-2
            w-56
            bg-white dark:bg-gray-900
            rounded-2xl
            shadow-2xl
            border border-gray-200 dark:border-gray-800
            overflow-hidden
            animate-in fade-in slide-in-from-top-2
            duration-200
          "
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-left
                    transition-colors
                    ${item.danger
                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
