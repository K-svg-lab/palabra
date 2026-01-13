/**
 * Bottom navigation bar component
 * Mobile-first navigation following Apple's tab bar design
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Navigation item configuration
 */
const navItems = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    label: 'Vocabulary',
    href: '/vocabulary',
    icon: BookOpen,
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
] as const;

/**
 * Bottom navigation bar component
 * Provides main app navigation with active state indication
 * 
 * @returns Bottom navigation component
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-t border-border safe-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-[49px] max-w-3xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                isActive 
                  ? 'text-accent' 
                  : 'text-secondary hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className={cn(
                  'w-6 h-6 transition-all duration-150',
                  isActive && 'scale-110'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

