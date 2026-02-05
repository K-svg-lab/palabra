"use client";

/**
 * SettingsCard & SettingsRow Components - Phase 16.4
 * 
 * Beautiful card-based settings UI inspired by iOS Settings.
 * 
 * Features:
 * - Clean card design
 * - Grouped sections
 * - Clear visual hierarchy
 * - Responsive layout
 */

interface SettingsCardProps {
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Card content */
  children: React.ReactNode;
  /** Optional className */
  className?: string;
}

export function SettingsCard({
  title,
  description,
  children,
  className = "",
}: SettingsCardProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Title & Description */}
      {(title || description) && (
        <div className="px-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );
}

interface SettingsRowProps {
  /** Row icon */
  icon?: React.ReactNode;
  /** Row label */
  label: string;
  /** Row description */
  description?: string;
  /** Row value/control */
  value?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Show border at bottom */
  showBorder?: boolean;
  /** Optional className */
  className?: string;
}

export function SettingsRow({
  icon,
  label,
  description,
  value,
  onClick,
  showBorder = true,
  className = "",
}: SettingsRowProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={`
        flex items-center gap-4
        px-4 py-4
        ${showBorder ? "border-b border-gray-200 dark:border-gray-800 last:border-0" : ""}
        ${isClickable ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-750 transition-colors" : ""}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 text-2xl">
          {icon}
        </div>
      )}

      {/* Label & Description */}
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-gray-900 dark:text-white">
          {label}
        </div>
        {description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {description}
          </div>
        )}
      </div>

      {/* Value/Control */}
      {value && (
        <div className="flex-shrink-0">
          {value}
        </div>
      )}
    </div>
  );
}
