/**
 * Client-Safe Deep Learning Prompt Generator
 * 
 * Template-based elaborative prompts for browser use.
 * Does not require Prisma, OpenAI, or Node.js globals.
 * 
 * @module deep-learning-client
 */

export type ElaborativePromptType = 
  | 'etymology'
  | 'connection'
  | 'usage'
  | 'comparison'
  | 'personal';

export interface ElaborativePrompt {
  type: ElaborativePromptType;
  question: string;
  hints?: string[];
  idealAnswer?: string;
  wordId: string;
  wordSpanish: string;
  wordEnglish: string;
}

/**
 * Generate template-based elaborative prompt (client-safe)
 * 
 * Uses templates that work in browser without server dependencies.
 * Fast, no API calls, always available.
 * 
 * @param word - Vocabulary word
 * @returns Elaborative prompt
 */
export function generateTemplatePrompt(word: {
  id: string;
  spanish: string;
  english: string;
  partOfSpeech?: string | null;
}): ElaborativePrompt {
  // Template options (randomized)
  const templates = [
    {
      type: 'connection' as ElaborativePromptType,
      question: `How might you remember "${word.spanish}"?`,
    },
    {
      type: 'personal' as ElaborativePromptType,
      question: `Can you think of a situation where you'd use "${word.spanish}"?`,
    },
    {
      type: 'etymology' as ElaborativePromptType,
      question: `Does "${word.spanish}" remind you of any English words?`,
    },
    {
      type: 'usage' as ElaborativePromptType,
      question: `When would you use "${word.spanish}" in conversation?`,
    },
  ];

  // Select random template
  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    type: template.type,
    question: template.question,
    wordId: word.id,
    wordSpanish: word.spanish,
    wordEnglish: word.english,
  };
}
