/**
 * Proficiency Types and Constants (Phase 18.1.1)
 * Shared between client and server
 */

// CEFR Levels (Common European Framework of Reference for Languages)
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CEFRLevel = typeof CEFR_LEVELS[number];

/**
 * Get human-readable description for a CEFR level
 */
export function getLevelDescription(level: CEFRLevel): string {
  const descriptions: Record<CEFRLevel, string> = {
    A1: 'Beginner - Can understand and use basic phrases',
    A2: 'Elementary - Can communicate in simple, routine tasks',
    B1: 'Intermediate - Can handle most situations while traveling',
    B2: 'Upper Intermediate - Can interact with fluency and spontaneity',
    C1: 'Advanced - Can express ideas fluently and spontaneously',
    C2: 'Proficient - Can understand everything with ease',
  };
  return descriptions[level];
}

/**
 * Get short description for a CEFR level
 */
export function getLevelShortDescription(level: CEFRLevel): string {
  const descriptions: Record<CEFRLevel, string> = {
    A1: 'Beginner',
    A2: 'Elementary',
    B1: 'Intermediate',
    B2: 'Upper Intermediate',
    C1: 'Advanced',
    C2: 'Proficient',
  };
  return descriptions[level];
}
