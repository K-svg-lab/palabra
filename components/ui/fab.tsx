"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";

/**
 * FAB (Floating Action Button) - Phase 16.4
 * 
 * Material Design-inspired floating action button with smooth animations.
 * 
 * Features:
 * - Fixed positioning
 * - Gradient background
 * - Scale on hover/press
 * - Optional label
 * - Shadow and glow
 */

interface FABProps {
  /** Click handler */
  onClick: () => void;
  /** Optional icon (defaults to Plus) */
  icon?: React.ReactNode;
  /** Optional label */
  label?: string;
  /** Optional className */
  className?: string;
}

export function FAB({
  onClick,
  icon = <Plus className="w-6 h-6" />,
  label,
  className = "",
}: FABProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        fixed bottom-6 right-6
        flex items-center gap-3
        px-6 py-4
        bg-gradient-to-r from-blue-600 to-purple-600
        text-white
        rounded-full
        shadow-2xl
        hover:shadow-blue-500/50
        transition-shadow
        z-40
        ${className}
      `}
      aria-label={label || "Add"}
    >
      {icon}
      {label && (
        <span className="font-semibold text-base hidden sm:inline">
          {label}
        </span>
      )}
    </motion.button>
  );
}
