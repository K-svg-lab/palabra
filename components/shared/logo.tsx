/**
 * Logo component for the Palabra app
 * Displays the app logo in various sizes and contexts
 */

import Image from 'next/image';

interface LogoProps {
  /**
   * Size variant of the logo
   */
  size?: 'small' | 'medium' | 'large' | number;
  /**
   * Whether to show the text alongside the logo
   */
  showText?: boolean;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Use SVG version (scalable) or PNG (raster)
   */
  variant?: 'svg' | 'png';
}

const SIZE_MAP = {
  small: 32,
  medium: 48,
  large: 64,
};

/**
 * Logo component
 * 
 * @param props - Component props
 * @returns Logo component
 */
export function Logo({ 
  size = 'medium', 
  showText = false, 
  className = '',
  variant = 'png'
}: LogoProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const src = variant === 'svg' ? '/logo.svg' : '/logo.png';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src={src}
        alt="Palabra Logo"
        width={pixelSize}
        height={pixelSize}
        className="object-contain rounded-[22%]"
        priority
      />
      {showText && (
        <span 
          className="font-semibold text-gray-900"
          style={{ fontSize: `${pixelSize * 0.4}px` }}
        >
          Palabra
        </span>
      )}
    </div>
  );
}

/**
 * Logo icon only (for use in favicons, etc.)
 */
export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Palabra"
      width={size}
      height={size}
      className="object-contain rounded-[22%]"
    />
  );
}
