/**
 * Comparative Review Page (Phase 18.2.1)
 * 
 * Targeted comparative review for confused word pairs.
 * Helps users resolve interference between similar words.
 * 
 * @module comparative-review-page
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/backend/auth';
import { prisma } from '@/lib/backend/db';
import { ComparativeReview } from '@/components/features/comparative-review';
import { recordComparativeReview } from '@/lib/services/interference-detection';
import type { ComparativeReviewResult } from '@/lib/services/interference-detection';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Comparative Review | Palabra',
  description: 'Clear up confusion between similar words',
};

interface PageProps {
  searchParams: {
    word1?: string;
    word2?: string;
  };
}

export default async function ComparativeReviewPage({
  searchParams,
}: PageProps) {
  // Require authentication
  const session = await getSession();
  if (!session?.userId) {
    redirect('/auth/signin?callbackUrl=/review/comparative');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  // Validate query parameters
  if (!searchParams.word1 || !searchParams.word2) {
    return (
      <div className="container max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Missing Words
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please select two words to compare from your vocabulary.
        </p>
        <Link
          href="/vocabulary"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vocabulary
        </Link>
      </div>
    );
  }

  // Fetch both words
  const [word1, word2] = await Promise.all([
    prisma.vocabularyItem.findFirst({
      where: {
        userId: user.id,
        id: searchParams.word1,
        isDeleted: false,
      },
    }),
    prisma.vocabularyItem.findFirst({
      where: {
        userId: user.id,
        id: searchParams.word2,
        isDeleted: false,
      },
    }),
  ]);

  // Validate words exist
  if (!word1 || !word2) {
    return (
      <div className="container max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Words Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          One or both of the selected words could not be found in your vocabulary.
        </p>
        <Link
          href="/vocabulary"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vocabulary
        </Link>
      </div>
    );
  }

  // Transform to component format
  const word1Data = {
    id: word1.id,
    spanish: word1.spanish,
    english: word1.english,
    partOfSpeech: word1.partOfSpeech || undefined,
    examples: word1.examples as Array<{ spanish: string; english: string }> || [],
  };

  const word2Data = {
    id: word2.id,
    spanish: word2.spanish,
    english: word2.english,
    partOfSpeech: word2.partOfSpeech || undefined,
    examples: word2.examples as Array<{ spanish: string; english: string }> || [],
  };

  // Handle completion (server action)
  const handleComplete = async (result: ComparativeReviewResult) => {
    'use server';
    
    const session = await getSession();
    if (!session?.userId) return;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) return;

    // Record the comparative review
    await recordComparativeReview(user.id, result);

    // Redirect to dashboard with success message
    redirect('/?message=confusion-resolved');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container max-w-5xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Comparative Review Component */}
        <ComparativeReview
          word1={word1Data}
          word2={word2Data}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
