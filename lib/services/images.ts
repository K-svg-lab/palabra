/**
 * Visual Associations Service
 * 
 * Provides image fetching and management for visual word associations.
 * Uses Unsplash API for high-quality, free images.
 * 
 * @module lib/services/images
 */

import type { VisualAssociation } from '@/lib/types/vocabulary';

/**
 * Fetches images related to a Spanish word
 * Uses Unsplash API for free, high-quality images
 * 
 * @param word - Spanish word
 * @param englishTranslation - English translation (helps with search)
 * @param limit - Maximum number of images to fetch
 * @returns Array of visual associations
 */
export async function getWordImages(
  word: string,
  englishTranslation?: string,
  limit: number = 3
): Promise<VisualAssociation[]> {
  try {
    // Use the English translation for better image search results
    const searchTerm = englishTranslation || word;
    
    // Unsplash API endpoint (requires API key in production)
    // For MVP, we'll use a fallback image service or generated placeholders
    const images = await fetchImagesFromUnsplash(searchTerm, limit);
    
    return images.map(img => ({
      url: img.url,
      source: 'api',
      altText: `${word} - ${englishTranslation || word}`,
      attribution: img.attribution,
    }));
  } catch (error) {
    console.error('Image fetch error:', error);
    // Return placeholder images as fallback
    return generatePlaceholderImages(word, englishTranslation, limit);
  }
}

/**
 * Fetches images from Unsplash API
 * 
 * @param query - Search query
 * @param limit - Number of images
 * @returns Array of image data
 */
async function fetchImagesFromUnsplash(
  query: string,
  limit: number
): Promise<Array<{ url: string; attribution: string }>> {
  // Note: In production, you'd use a real Unsplash API key
  // For now, we'll use a demo/fallback approach
  
  // Check if we have an API key in environment variables
  const apiKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  
  if (!apiKey) {
    // No API key, return empty array (will use placeholders)
    return [];
  }
  
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=squarish`,
      {
        headers: {
          'Authorization': `Client-ID ${apiKey}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Unsplash API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.results.map((photo: any) => ({
      url: photo.urls.regular,
      attribution: `Photo by ${photo.user.name} on Unsplash`,
    }));
  } catch (error) {
    console.error('Unsplash API error:', error);
    return [];
  }
}

/**
 * Generates placeholder images using emoji and gradients
 * Provides visual associations even without API access
 * 
 * @param word - Spanish word
 * @param translation - English translation
 * @param limit - Number of placeholders
 * @returns Array of placeholder visual associations
 */
function generatePlaceholderImages(
  word: string,
  translation?: string,
  limit: number = 3
): VisualAssociation[] {
  // Map common words to emoji representations
  const emojiMap: Record<string, string> = {
    // Animals
    'perro': '🐕', 'gato': '🐈', 'pájaro': '🐦', 'pez': '🐟', 'caballo': '🐴',
    'vaca': '🐄', 'cerdo': '🐷', 'pollo': '🐔', 'oveja': '🐑', 'conejo': '🐰',
    
    // Food
    'manzana': '🍎', 'plátano': '🍌', 'pan': '🍞', 'leche': '🥛',
    'café': '☕', 'agua': '💧', 'carne': '🥩', 'pescado': '🐟', 'queso': '🧀',
    'pizza': '🍕', 'hamburguesa': '🍔', 'helado': '🍨', 'pastel': '🍰',
    
    // Nature
    'sol': '☀️', 'luna': '🌙', 'estrella': '⭐', 'árbol': '🌳', 'flor': '🌸',
    'montaña': '⛰️', 'mar': '🌊', 'río': '🏞️', 'playa': '🏖️', 'bosque': '🌲',
    
    // Objects
    'libro': '📚', 'teléfono': '📱', 'coche': '🚗', 'casa': '🏠', 'puerta': '🚪',
    'ventana': '🪟', 'reloj': '⌚', 'llave': '🔑', 'bolsa': '👜', 'zapato': '👞',
    
    // People & Body
    'cara': '👤', 'mano': '✋', 'ojo': '👁️', 'corazón': '❤️', 'familia': '👨‍👩‍👧‍👦',
    'amigo': '👥', 'niño': '👶', 'hombre': '👨', 'mujer': '👩',
    
    // Activities
    'estudiar': '📖', 'trabajar': '💼', 'correr': '🏃', 'dormir': '😴', 'comer': '🍽️',
    'beber': '🥤', 'escribir': '✍️', 'leer': '📖', 'jugar': '🎮', 'caminar': '🚶',
    
    // Weather
    'lluvia': '🌧️', 'nieve': '❄️', 'viento': '💨', 'nube': '☁️', 'tormenta': '⛈️',
    
    // Emotions
    'feliz': '😊', 'triste': '😢', 'amor': '💕', 'miedo': '😨', 'sorpresa': '😮',
    
    // Colors
    'rojo': '🔴', 'azul': '🔵', 'verde': '🟢', 'amarillo': '🟡', 'negro': '⚫',
    'blanco': '⚪', 'rosa': '🌸', 'morado': '🟣', 'naranja': '🟠',
    
    // Places
    'escuela': '🏫', 'hospital': '🏥', 'tienda': '🏪', 'restaurante': '🍽️',
    'parque': '🏞️', 'ciudad': '🏙️', 'campo': '🌾',
    
    // Time
    'día': '☀️', 'noche': '🌙', 'hora': '⏰', 'tiempo': '⏱️',
  };
  
  const emoji = emojiMap[word.toLowerCase()] || '📝';
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];
  
  const placeholders: VisualAssociation[] = [];
  
  for (let i = 0; i < Math.min(limit, gradients.length); i++) {
    // Generate SVG placeholder with emoji and gradient
    const svg = generateEmojiPlaceholder(emoji, gradients[i], word, translation);
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    
    placeholders.push({
      url: dataUrl,
      source: 'generated',
      altText: `${word} - ${translation || word}`,
    });
  }
  
  return placeholders;
}

/**
 * Generates an SVG placeholder image with emoji and gradient
 * 
 * @param emoji - Emoji character
 * @param gradient - CSS gradient string
 * @param word - Spanish word
 * @param translation - English translation
 * @returns SVG string
 */
function generateEmojiPlaceholder(
  emoji: string,
  gradient: string,
  word: string,
  translation?: string
): string {
  // Extract gradient colors from CSS gradient string
  const colors = gradient.match(/#[0-9a-fA-F]{6}/g) || ['#667eea', '#764ba2'];
  
  return `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)" />
      <text x="200" y="200" font-size="120" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      <text x="200" y="320" font-size="32" font-weight="600" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif">${word}</text>
      ${translation ? `<text x="200" y="360" font-size="20" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui, -apple-system, sans-serif">${translation}</text>` : ''}
    </svg>
  `.trim();
}

/**
 * Handles image upload from user
 * 
 * @param file - Image file
 * @returns Visual association with uploaded image
 */
export async function uploadCustomImage(
  file: File
): Promise<VisualAssociation | null> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image must be less than 5MB');
    }
    
    // Convert to data URL for storage
    const dataUrl = await fileToDataUrl(file);
    
    return {
      url: dataUrl,
      source: 'upload',
      altText: file.name,
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return null;
  }
}

/**
 * Converts a File to a data URL
 * 
 * @param file - File to convert
 * @returns Promise resolving to data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Gets default placeholder image for a word
 * 
 * @param word - Spanish word
 * @param translation - English translation
 * @returns Visual association
 */
export function getPlaceholderImage(
  word: string,
  translation?: string
): VisualAssociation {
  const placeholders = generatePlaceholderImages(word, translation, 1);
  return placeholders[0];
}

