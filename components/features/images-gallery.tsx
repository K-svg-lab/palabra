/**
 * Images Gallery Component
 * 
 * Displays visual associations for vocabulary words
 * with carousel navigation.
 * 
 * @module components/features/images-gallery
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import type { VisualAssociation } from '@/lib/types/vocabulary';

interface ImagesGalleryProps {
  /** Array of images */
  images?: VisualAssociation[];
  /** Allow image upload */
  allowUpload?: boolean;
  /** Callback when image is uploaded */
  onImageUpload?: (file: File) => void;
  /** Callback when image is removed */
  onImageRemove?: (index: number) => void;
}

export function ImagesGallery({
  images = [],
  allowUpload = false,
  onImageUpload,
  onImageRemove,
}: ImagesGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    if (!allowUpload) return null;

    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
          Visual Associations
        </label>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          <Upload className="w-6 h-6 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Click to upload image
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageUpload?.(file);
            }}
          />
        </label>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
        Visual Associations
      </label>

      {/* Image display */}
      <div className="relative">
        <div
          className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={currentImage.url}
            alt={currentImage.altText || 'Visual association'}
            className="w-full h-full object-cover"
          />

          {/* Remove button */}
          {allowUpload && onImageRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onImageRemove(currentIndex);
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Navigation arrows (if multiple images) */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Attribution */}
        {currentImage.attribution && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {currentImage.attribution}
          </p>
        )}

        {/* Thumbnails */}
        {hasMultiple && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentIndex
                    ? 'border-accent'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.altText || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            
            {/* Upload button */}
            {allowUpload && onImageUpload && (
              <label className="flex-shrink-0 w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageUpload?.(file);
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setIsFullscreen(false)}
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentImage.url}
            alt={currentImage.altText || 'Visual association'}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

