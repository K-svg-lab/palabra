import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Palabra',
  description: 'Terms of Service for Palabra - Spanish Vocabulary Learning App',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: February 12, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          
          {/* Agreement to Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and Kalvin Brookes (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) concerning your access to and use of the Palabra Spanish vocabulary learning application (the &quot;App&quot; or &quot;Service&quot;).
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              By accessing or using the App, you agree that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the App.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to change or modify these Terms at any time. We will notify you of material changes by updating the &quot;Last updated&quot; date and, where appropriate, providing notice through the App or via email. Your continued use of the App after such changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Eligibility */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. Eligibility
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To use the App, you must:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Be at least 13 years of age</li>
              <li className="mb-2">Have the legal capacity to enter into a binding agreement</li>
              <li className="mb-2">Not be prohibited from using the App under applicable laws</li>
              <li className="mb-2">Provide accurate and complete registration information</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users under 18 should use the App with parental consent and supervision. If you are a parent or guardian and discover your child under 13 has created an account without permission, please contact us immediately at kbrookes2507@gmail.com.
            </p>
          </section>

          {/* Account Registration */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. Account Registration & Security
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              3.1 Account Creation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To access certain features (cloud sync, premium features), you must create an account by providing:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">A valid email address</li>
              <li className="mb-2">A secure password</li>
              <li className="mb-2">Optional display name</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              3.2 Account Responsibilities
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Maintaining the confidentiality of your password</li>
              <li className="mb-2">All activities that occur under your account</li>
              <li className="mb-2">Notifying us immediately of any unauthorized access</li>
              <li className="mb-2">Providing accurate and up-to-date information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              3.3 One Account Per User
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You may only create one account. Creating multiple accounts to abuse free trials, promotional offers, or circumvent limitations is prohibited and may result in account termination.
            </p>
          </section>

          {/* License & Access */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. License & Access Rights
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              4.1 Limited License
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the App for your personal, non-commercial use.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              4.2 Restrictions
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You may not:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Copy, modify, or create derivative works of the App</li>
              <li className="mb-2">Reverse engineer, decompile, or disassemble the App</li>
              <li className="mb-2">Rent, lease, sell, or sublicense the App</li>
              <li className="mb-2">Remove or modify any copyright, trademark, or proprietary notices</li>
              <li className="mb-2">Use the App for any illegal or unauthorized purpose</li>
              <li className="mb-2">Interfere with or disrupt the App or its servers</li>
              <li className="mb-2">Attempt to gain unauthorized access to the App or its systems</li>
              <li className="mb-2">Use automated means (bots, scrapers) to access the App</li>
              <li className="mb-2">Resell or redistribute AI-generated content</li>
            </ul>
          </section>

          {/* Free & Premium Features */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. Free & Premium Features
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              5.1 Free Tier
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The following features are available for free, forever:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Unlimited vocabulary words</li>
              <li className="mb-2">All 5 review methods (Traditional, Fill-Blank, Multiple Choice, Audio, Context Selection)</li>
              <li className="mb-2">Basic AI-generated example sentences</li>
              <li className="mb-2">Full spaced repetition algorithm</li>
              <li className="mb-2">Progress tracking and achievements</li>
              <li className="mb-2">Cloud sync across devices</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              5.2 Premium Features
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Premium subscription (€4.99/month, €39.99/year, or €79.99 lifetime) includes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Deep Learning Mode with elaborative interrogation prompts</li>
              <li className="mb-2">Priority AI generation (faster, better quality examples)</li>
              <li className="mb-2">Interference detection and comparative review</li>
              <li className="mb-2">Export vocabulary to CSV</li>
              <li className="mb-2">Advanced analytics dashboard</li>
              <li className="mb-2">Offline mode with full functionality</li>
              <li className="mb-2">Ad-free experience (if ads are introduced in the future)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              5.3 Feature Changes
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to modify, add, or remove features at any time. However, we commit to maintaining the generous free tier and will provide 30 days notice before reducing features included in the free tier.
            </p>
          </section>

          {/* Subscription Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Subscription Terms & Billing
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              6.1 Subscription Pricing
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4">
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Premium Monthly:</strong> €4.99 per month, billed monthly</li>
                <li><strong>Premium Yearly:</strong> €39.99 per year, billed annually (save €20/year)</li>
                <li><strong>Lifetime Premium:</strong> €79.99 one-time payment, access forever</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              6.2 Billing & Renewal
            </h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Automatic Renewal:</strong> Subscriptions (monthly/yearly) automatically renew unless you cancel before the renewal date</li>
              <li className="mb-2"><strong>Payment Processing:</strong> Handled securely by Stripe (we never store your credit card information)</li>
              <li className="mb-2"><strong>Price Changes:</strong> We will notify you 30 days before any price increases. You may cancel before the increase takes effect.</li>
              <li className="mb-2"><strong>Failed Payments:</strong> If payment fails, we will attempt to charge your card again. Premium access may be suspended until payment is successful.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              6.3 Cancellation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You may cancel your subscription at any time:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>How to Cancel:</strong> Settings → Subscription → Manage Billing → Cancel Subscription</li>
              <li className="mb-2"><strong>Access After Cancellation:</strong> You retain premium access until the end of your current billing period</li>
              <li className="mb-2"><strong>Data Retention:</strong> Your data is not deleted. You can resubscribe at any time to regain premium features.</li>
              <li className="mb-2"><strong>No Partial Refunds:</strong> Cancellation does not entitle you to a refund for the current billing period (see Section 7 for refund policy)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              6.4 Lifetime Subscription
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Lifetime Premium (€79.99) is a one-time payment that provides permanent access to premium features for the lifetime of the App. &quot;Lifetime&quot; means as long as the App is operational and you maintain an active account. If the App is discontinued, no refunds will be provided.
            </p>
          </section>

          {/* Refund Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Refund Policy
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              7.1 14-Day Money-Back Guarantee
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We offer a 14-day money-back guarantee for all subscriptions:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Eligibility:</strong> First-time subscribers within 14 days of initial purchase</li>
              <li className="mb-2"><strong>Process:</strong> Email kbrookes2507@gmail.com with &quot;Refund Request&quot; in the subject line</li>
              <li className="mb-2"><strong>Timeline:</strong> Refunds processed within 5-7 business days to your original payment method</li>
              <li className="mb-2"><strong>Access:</strong> Premium access is revoked immediately upon refund</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              7.2 No Refunds After 14 Days
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              After the 14-day guarantee period:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">No refunds for partial months/years</li>
              <li className="mb-2">No refunds for account termination or suspension due to Terms violations</li>
              <li className="mb-2">No refunds if you stop using the App</li>
              <li className="mb-2">Cancellation only prevents future charges; no refunds for current period</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              7.3 Exceptions
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may provide refunds on a case-by-case basis for extenuating circumstances (e.g., technical issues preventing app use, duplicate charges). Contact us at kbrookes2507@gmail.com to request consideration.
            </p>
          </section>

          {/* User Content */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. User Content & Intellectual Property
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              8.1 Your Content
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You retain all rights to the vocabulary words, translations, and notes you create (&quot;User Content&quot;). By using the App, you grant us a limited license to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Store your User Content on our servers (for cloud sync)</li>
              <li className="mb-2">Display your User Content back to you in the App</li>
              <li className="mb-2">Create anonymized, aggregated statistics (e.g., &quot;most common words learned&quot;)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Important:</strong> We will never share, sell, or publicly display your personal vocabulary lists without your explicit consent.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              8.2 AI-Generated Content
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              AI-generated example sentences are provided for educational purposes. Ownership of AI-generated content is complex:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">We do not claim copyright over AI-generated examples</li>
              <li className="mb-2">You may use them for personal learning purposes</li>
              <li className="mb-2">You may not resell, redistribute, or use them commercially without permission</li>
              <li className="mb-2">AI examples are cached and may be shown to other users learning the same word</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              8.3 Our Intellectual Property
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The App, including its design, code, algorithms, and branding, is owned by us and protected by copyright, trademark, and other intellectual property laws. You may not:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Use our trademarks, logos, or branding without written permission</li>
              <li className="mb-2">Copy our spaced repetition algorithm or review method implementations</li>
              <li className="mb-2">Create a competing product using our code or design</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              8.4 Third-Party Content
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Translations and dictionary definitions may be sourced from third-party APIs (e.g., Wiktionary, Tatoeba). These are used in accordance with their respective licenses (CC BY-SA, public domain, etc.). We do not claim ownership of third-party content.
            </p>
          </section>

          {/* Prohibited Conduct */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. Prohibited Conduct
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Violating any laws, regulations, or third-party rights</li>
              <li className="mb-2">Creating accounts using false or misleading information</li>
              <li className="mb-2">Sharing your account credentials with others</li>
              <li className="mb-2">Using the App to store or transmit illegal content</li>
              <li className="mb-2">Interfering with other users&apos; use of the App</li>
              <li className="mb-2">Attempting to circumvent security measures or access restrictions</li>
              <li className="mb-2">Using automated systems (bots, scrapers) to access the App</li>
              <li className="mb-2">Reverse engineering or decompiling the App</li>
              <li className="mb-2">Reselling or redistributing App features or content</li>
              <li className="mb-2">Abusing free trials or promotional offers through multiple accounts</li>
              <li className="mb-2">Submitting false or fraudulent payment information</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Violation of these rules may result in immediate account termination without refund.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. Termination
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              10.1 Your Right to Terminate
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You may terminate your account at any time by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Going to Settings → Account → Delete Account</li>
              <li className="mb-2">Emailing us at kbrookes2507@gmail.com with &quot;Delete Account&quot; in the subject line</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Upon account deletion:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Your personal data and vocabulary are permanently deleted</li>
              <li className="mb-2">Subscriptions are cancelled (no refunds for current billing period)</li>
              <li className="mb-2">Deletion is immediate and irreversible</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              10.2 Our Right to Terminate
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your account if:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">You violate these Terms</li>
              <li className="mb-2">You engage in fraudulent or illegal activity</li>
              <li className="mb-2">Your account has been inactive for more than 2 years (after email warning)</li>
              <li className="mb-2">We are required to do so by law</li>
              <li className="mb-2">Continued operation poses security or technical risks</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We will provide notice when possible, but reserve the right to terminate accounts immediately for severe violations.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              10.3 Effect of Termination
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Upon termination, all rights granted to you under these Terms immediately cease. Sections that by their nature should survive termination (e.g., intellectual property, liability limitations, dispute resolution) will continue to apply.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              11. Disclaimers & Warranties
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              11.1 &quot;As Is&quot; Basis
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 uppercase font-semibold">
              THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Implied warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
              <li className="mb-2">Accuracy, reliability, or completeness of content (AI-generated examples, translations, etc.)</li>
              <li className="mb-2">Uninterrupted, secure, or error-free operation</li>
              <li className="mb-2">Results or outcomes from using the App (e.g., language proficiency improvements)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              11.2 AI-Generated Content Disclaimer
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              AI-generated example sentences are provided for educational purposes only. While we strive for accuracy:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">AI may occasionally generate incorrect, nonsensical, or inappropriate content</li>
              <li className="mb-2">Examples may contain cultural biases inherent in AI training data</li>
              <li className="mb-2">We are not responsible for reliance on AI-generated content</li>
              <li className="mb-2">Always verify critical information with authoritative sources</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              11.3 Educational Tool Disclaimer
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Palabra is a vocabulary learning tool, not a comprehensive Spanish language course. We make no guarantees regarding:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Speed of learning or proficiency improvement</li>
              <li className="mb-2">Passing Spanish exams or achieving specific CEFR levels</li>
              <li className="mb-2">Fluency or conversational ability</li>
              <li className="mb-2">Suitability for academic or professional Spanish requirements</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              12. Limitation of Liability
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 uppercase font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Your access to or use of (or inability to access or use) the App</li>
              <li className="mb-2">Any conduct or content of third parties on the App</li>
              <li className="mb-2">Unauthorized access, use, or alteration of your content</li>
              <li className="mb-2">Errors, bugs, or security vulnerabilities in the App</li>
              <li className="mb-2">Loss of vocabulary data or progress due to technical issues</li>
              <li className="mb-2">Reliance on AI-generated content or translations</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Our total liability to you for all claims arising from or relating to the App shall not exceed:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Free Users:</strong> €10</li>
              <li className="mb-2"><strong>Paid Users:</strong> The amount you paid in the 12 months prior to the claim</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              13. Indemnification
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You agree to indemnify, defend, and hold harmless Kalvin Brookes and our affiliates, officers, agents, and partners from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorney fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Your violation of these Terms</li>
              <li className="mb-2">Your violation of any third-party rights</li>
              <li className="mb-2">Your use or misuse of the App</li>
              <li className="mb-2">Your User Content</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              14. Dispute Resolution & Governing Law
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              14.1 Informal Resolution
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Before filing a claim, you agree to contact us at kbrookes2507@gmail.com to attempt to resolve the dispute informally. We will attempt to resolve disputes in good faith within 30 days.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              14.2 Governing Law
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              14.3 Arbitration (US Users)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              For users in the United States, disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association&apos;s Consumer Arbitration Rules. Arbitration will take place in California. You waive the right to a jury trial or class action.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Exception:</strong> Small claims court actions (claims under $10,000) may be brought in either party&apos;s local small claims court.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              14.4 International Users
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              For users outside the United States, any disputes shall be subject to the exclusive jurisdiction of the courts in California, United States, except where prohibited by local law (e.g., EU consumers may bring claims in their country of residence).
            </p>
          </section>

          {/* Changes to Service */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              15. Changes to the App
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We reserve the right to modify, suspend, or discontinue the App (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the App.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              In the event we discontinue the App permanently, we will provide 90 days notice and allow users to export their data.
            </p>
          </section>

          {/* Miscellaneous */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              16. Miscellaneous
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              16.1 Entire Agreement
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the App.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              16.2 Severability
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              16.3 No Waiver
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              16.4 Assignment
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You may not assign or transfer these Terms or your account without our written consent. We may assign or transfer these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              16.5 Force Majeure
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We shall not be liable for any failure to perform due to causes beyond our reasonable control (e.g., natural disasters, war, terrorism, riots, pandemic, internet failures, third-party service outages).
            </p>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              17. Contact Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Email:</strong> <a href="mailto:kbrookes2507@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">kbrookes2507@gmail.com</a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Subject Line:</strong> &quot;Terms of Service Question&quot;
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Response Time:</strong> Within 5 business days
              </p>
            </div>
          </section>

          {/* Footer Note */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              These Terms of Service were last updated on February 12, 2026.
              <br />
              By using Palabra, you agree to these Terms.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
