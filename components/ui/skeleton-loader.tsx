"use client";

/**
 * SkeletonLoader Component - Phase 16.4
 * 
 * Smooth skeleton loading states for better perceived performance.
 * 
 * Features:
 * - Animated shimmer effect
 * - Multiple variants (text, card, circle)
 * - Responsive sizing
 * - Dark mode support
 */

interface SkeletonLoaderProps {
  /** Variant type */
  variant?: "text" | "card" | "circle" | "rect";
  /** Width (CSS value or preset) */
  width?: string | "full" | "1/2" | "1/3" | "2/3";
  /** Height (CSS value or preset) */
  height?: string;
  /** Optional className */
  className?: string;
  /** Number of lines (for text variant) */
  lines?: number;
}

export function SkeletonLoader({
  variant = "text",
  width = "full",
  height,
  className = "",
  lines = 1,
}: SkeletonLoaderProps) {
  // Width presets
  const widthClasses = {
    full: "w-full",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "2/3": "w-2/3",
  };

  const widthClass =
    typeof width === "string" && width in widthClasses
      ? widthClasses[width as keyof typeof widthClasses]
      : "";

  const widthStyle = !widthClass && width ? { width } : {};

  // Height handling
  const heightStyle = height ? { height } : {};

  // Variant-specific classes
  const variantClasses = {
    text: "h-4 rounded",
    card: "h-32 rounded-xl",
    circle: "rounded-full aspect-square",
    rect: "h-24 rounded-lg",
  };

  // Multiple lines for text variant
  if (variant === "text" && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`
              ${widthClass || "w-full"}
              ${variantClasses.text}
              bg-gray-200 dark:bg-gray-800
              animate-pulse
            `}
            style={{
              ...widthStyle,
              ...heightStyle,
              ...(index === lines - 1 ? { width: "60%" } : {}),
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        ${widthClass}
        ${variantClasses[variant]}
        bg-gray-200 dark:bg-gray-800
        animate-pulse
        relative
        overflow-hidden
        ${className}
      `}
      style={{ ...widthStyle, ...heightStyle }}
    >
      {/* Shimmer effect */}
      <div
        className="
          absolute inset-0
          -translate-x-full
          animate-shimmer
          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
        "
        style={{
          animationDuration: "2s",
          animationIterationCount: "infinite",
        }}
      />
    </div>
  );
}

// Add to globals.css:
// @keyframes shimmer {
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer { animation: shimmer 2s infinite; }
