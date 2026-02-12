"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { performLogout } from "@/lib/utils/logout";

/**
 * UserProfileChip Component - Phase 16.4 + Security Fix (Feb 8, 2026)
 * 
 * Consistent user profile widget across all pages.
 * 
 * Features:
 * - Avatar with fallback initials
 * - Dropdown menu
 * - Quick actions (Profile, Settings, Logout)
 * - Smooth animations
 * - Click outside to close
 * - **SECURITY FIX**: Real authentication check, proper logout implementation
 */

interface UserProfileChipProps {
  /** Make transparent for hero sections */
  transparent?: boolean;
}

interface UserData {
  name: string;
  email: string;
  avatar?: string | null;
}

export function UserProfileChip({ transparent = false }: UserProfileChipProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch real user data from API
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser({
              name: data.user.name || 'User',
              email: data.user.email || '',
              avatar: null,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

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
      icon: Settings,
      label: "Settings",
      onClick: () => {
        setIsOpen(false);
        router.push("/dashboard/settings");
      },
    },
    {
      icon: LogOut,
      label: "Sign Out",
      onClick: async () => {
        setIsOpen(false);
        // Perform complete logout (clears all data)
        await performLogout();
      },
      danger: true,
    },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
    );
  }

  // Guest Mode: Show "Sign In" button if no user
  if (!user) {
    return (
      <Link
        href="/signin"
        className={`
          flex items-center gap-2
          px-4 py-2
          rounded-full
          transition-all duration-200
          font-medium text-sm
          ${transparent
            ? "bg-white/20 hover:bg-white/30 backdrop-blur-md text-white"
            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30"
          }
        `}
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    );
  }

  // Authenticated: Show full profile chip
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
