/**
 * Action Card Component
 * Apple-inspired action cards with gradients, icons, and smooth interactions
 * 
 * Features:
 * - Gradient or solid color backgrounds
 * - Large icons and clear hierarchy
 * - Badge/counter support
 * - Smooth hover and press animations
 * - Arrow indicator
 */

'use client';

import Link from 'next/link';
import React from 'react';

interface ActionCardProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  badge?: string | number;
  href: string;
  gradient?: { from: string; to: string };
  solid?: string;
  className?: string;
}

export function ActionCard({
  icon,
  title,
  description,
  badge,
  href,
  gradient,
  solid,
  className = '',
}: ActionCardProps) {
  const bgStyle = gradient
    ? { background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }
    : { backgroundColor: solid };

  return (
    <Link
      href={href}
      className={`
        group relative overflow-hidden rounded-2xl p-6
        transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
        shadow-lg hover:shadow-xl
        text-white
        ${className}
      `}
      style={bgStyle}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="mb-3">
          {typeof icon === 'string' ? (
            <span className="text-5xl drop-shadow-md">{icon}</span>
          ) : (
            <div className="text-white drop-shadow-md">{icon}</div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold mb-1">
          {title}
        </h3>

        {/* Description */}
        <p className="text-white/80 text-sm mb-3">
          {description}
        </p>

        {/* Badge */}
        {badge && (
          <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            {badge}
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="absolute top-6 right-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transform transition-all duration-300 text-2xl">
        ›
      </div>
    </Link>
  );
}

/**
 * Compact action button for smaller areas
 */
interface ActionButtonProps {
  icon: string | React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ActionButton({
  icon,
  label,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
}: ActionButtonProps) {
  const baseClasses = `
    inline-flex items-center gap-3
    rounded-xl font-semibold
    transform hover:scale-105 active:scale-95 transition-all duration-300
  `;

  const variantClasses = {
    primary: 'bg-blue-500 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const content = (
    <>
      {typeof icon === 'string' ? (
        <span className="text-xl">{icon}</span>
      ) : (
        icon
      )}
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

/**
 * Action card list for multiple actions
 */
interface ActionCardListProps {
  actions: Array<{
    icon: string | React.ReactNode;
    title: string;
    description: string;
    badge?: string | number;
    href: string;
    gradient?: { from: string; to: string };
    solid?: string;
  }>;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function ActionCardList({
  actions,
  columns = 1,
  className = '',
}: ActionCardListProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {actions.map((action, index) => (
        <ActionCard key={index} {...action} />
      ))}
    </div>
  );
}
