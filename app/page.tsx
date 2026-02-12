/**
 * Landing Page
 * Marketing page for Palabra - Spanish vocabulary learning app
 * Phase 17 Design Quality: Apple-inspired, conversion-optimized
 * 
 * Task 18.3.4: Go-to-Market Strategy Implementation
 */

import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesShowcase } from '@/components/landing/features-showcase';
import { HowItWorks } from '@/components/landing/how-it-works';
import { SocialProof } from '@/components/landing/social-proof';
import { PricingPreview } from '@/components/landing/pricing-preview';
import { FinalCTA } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';
import { PWAInstallPrompt } from '@/components/landing/pwa-install-prompt';
import type { Metadata } from 'next';

/**
 * SEO Metadata
 */
export const metadata: Metadata = {
  title: 'Palabra - Master Spanish Vocabulary with AI',
  description: 'AI-powered Spanish vocabulary learning with 5 review methods, spaced repetition, and beautiful progress tracking. Start learning for free today.',
  keywords: [
    'Spanish learning',
    'vocabulary app',
    'spaced repetition',
    'language learning',
    'Spanish vocabulary',
    'AI learning',
    'flashcards',
    'Spanish practice',
  ],
  authors: [{ name: 'Kalvin Brookes' }],
  openGraph: {
    type: 'website',
    title: 'Palabra - Master Spanish Vocabulary with AI',
    description: 'AI-powered Spanish vocabulary learning with 5 review methods, spaced repetition, and beautiful progress tracking.',
    siteName: 'Palabra',
    images: [
      {
        url: '/og-image.png', // To be created
        width: 1200,
        height: 630,
        alt: 'Palabra - Spanish Vocabulary Learning App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Palabra - Master Spanish Vocabulary with AI',
    description: 'AI-powered Spanish vocabulary learning with 5 review methods, spaced repetition, and beautiful progress tracking.',
    images: ['/twitter-image.png'], // To be created
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/**
 * Landing Page Component
 * 
 * Structure:
 * 1. Hero - Value proposition, primary CTA
 * 2. Features - 5 methods, AI, spaced repetition
 * 3. How It Works - 3-step process
 * 4. Social Proof - Testimonials, stats
 * 5. Pricing - Free tier emphasis
 * 6. Final CTA - Bottom conversion
 * 7. Footer - Links, social
 */
export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Showcase */}
      <FeaturesShowcase />

      {/* How It Works */}
      <HowItWorks />

      {/* Social Proof */}
      <SocialProof />

      {/* Pricing Preview */}
      <PricingPreview />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </main>
  );
}
