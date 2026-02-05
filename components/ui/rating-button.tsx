"use client";

/**
 * RatingButton Component - Phase 16.4
 * 
 * Enhanced flashcard rating button with emoji, gradient, and smooth animations.
 * 
 * Features:
 * - Large, emoji-based design
 * - Gradient backgrounds
 * - Keyboard shortcut indicator
 * - Hover glow effect
 * - Haptic-style feedback
 */

interface RatingButtonProps {
  /** Emoji to display */
  emoji: string;
  /** Button label */
  label: string;
  /** Gradient colors */
  gradient: {
    from: string;
    to: string;
  };
  /** Click handler */
  onClick: () => void;
  /** Optional keyboard shortcut */
  shortcut?: string;
  /** Optional className */
  className?: string;
}

export function RatingButton({
  emoji,
  label,
  gradient,
  onClick,
  shortcut,
  className = "",
}: RatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative
        flex flex-col items-center justify-center gap-2
        p-6
        rounded-2xl
        text-white
        hover:scale-105 active:scale-95
        transition-all duration-300
        shadow-lg hover:shadow-xl
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
      }}
    >
      {/* Emoji */}
      <div className="text-4xl mb-1">{emoji}</div>

      {/* Label */}
      <div className="font-semibold text-base">{label}</div>

      {/* Keyboard shortcut badge */}
      {shortcut && (
        <div className="absolute top-2 right-2 text-xs bg-white/20 backdrop-blur-sm rounded px-2 py-1 font-mono">
          {shortcut}
        </div>
      )}

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}
