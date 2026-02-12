import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Palabra',
  description: 'Privacy Policy for Palabra - Spanish Vocabulary Learning App',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: February 12, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Welcome to Palabra (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your privacy and ensuring you have a positive experience while using our Spanish vocabulary learning application (the &quot;App&quot;).
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the App.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to make changes to this Privacy Policy at any time. We will notify you of any changes by updating the &quot;Last updated&quot; date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Information We Collect
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Personal Information You Provide to Us
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We collect the following personal information that you voluntarily provide when you register for an account:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Email Address:</strong> Used for account creation, authentication, and communication</li>
              <li className="mb-2"><strong>Password:</strong> Stored securely using industry-standard bcrypt hashing (we never store plain-text passwords)</li>
              <li className="mb-2"><strong>Display Name:</strong> Optional, used to personalize your experience</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Learning Data
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To provide our core vocabulary learning service, we collect and store:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Vocabulary Words:</strong> Spanish words you add to your vocabulary list</li>
              <li className="mb-2"><strong>Translations and Examples:</strong> English translations and example sentences</li>
              <li className="mb-2"><strong>Review History:</strong> Your review attempts, ratings, and performance data</li>
              <li className="mb-2"><strong>Study Statistics:</strong> Cards reviewed, accuracy rates, study time, streaks</li>
              <li className="mb-2"><strong>Proficiency Level:</strong> Your self-selected CEFR level (A1-C2)</li>
              <li className="mb-2"><strong>Preferences:</strong> App settings, notification preferences, and learning preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Automatically Collected Information
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              When you use the App, we automatically collect certain information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Device Information:</strong> Browser type, operating system, device type</li>
              <li className="mb-2"><strong>Usage Data:</strong> Pages visited, features used, time spent in app</li>
              <li className="mb-2"><strong>Performance Data:</strong> App performance metrics, error logs</li>
              <li className="mb-2"><strong>Log Data:</strong> IP address (anonymized), timestamps, referrer URL</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Payment Information
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you subscribe to Premium features:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Payment Processing:</strong> Handled entirely by Stripe (we never see or store your credit card information)</li>
              <li className="mb-2"><strong>Subscription Data:</strong> We store your subscription tier, status, and dates</li>
              <li className="mb-2"><strong>Stripe Customer ID:</strong> Used to manage your subscription and billing</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Provide Core Functionality:</strong> Enable vocabulary learning, spaced repetition, and progress tracking</li>
              <li className="mb-2"><strong>Personalization:</strong> Adapt content to your proficiency level and learning patterns</li>
              <li className="mb-2"><strong>AI-Generated Content:</strong> Generate contextual examples tailored to your level</li>
              <li className="mb-2"><strong>Cloud Synchronization:</strong> Sync your data across devices (optional)</li>
              <li className="mb-2"><strong>Account Management:</strong> Create and manage your account</li>
              <li className="mb-2"><strong>Subscription Management:</strong> Process payments and manage premium features</li>
              <li className="mb-2"><strong>Analytics & Improvement:</strong> Understand usage patterns and improve the App</li>
              <li className="mb-2"><strong>A/B Testing:</strong> Test new features to improve learning effectiveness</li>
              <li className="mb-2"><strong>Customer Support:</strong> Respond to your inquiries and provide assistance</li>
              <li className="mb-2"><strong>Security:</strong> Protect against fraud, abuse, and unauthorized access</li>
              <li className="mb-2"><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          {/* Data Storage & Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Data Storage & Security
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Local Storage (Your Device)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Palabra is an <strong>offline-first</strong> application. Your vocabulary data is primarily stored locally on your device using:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>IndexedDB:</strong> Stores vocabulary, review history, and progress data</li>
              <li className="mb-2"><strong>LocalStorage:</strong> Stores preferences and app settings</li>
              <li className="mb-2"><strong>Service Worker Cache:</strong> Enables offline functionality</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Important:</strong> This local data is not automatically backed up. If you delete the app or clear browser data, your local vocabulary will be lost unless you have enabled cloud sync.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Cloud Storage (Optional)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you create an account, your data is synchronized to our cloud database:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Database:</strong> Neon PostgreSQL (hosted in the US)</li>
              <li className="mb-2"><strong>Encryption:</strong> Data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li className="mb-2"><strong>Backups:</strong> Automated daily backups with 30-day retention</li>
              <li className="mb-2"><strong>Access Control:</strong> Strict access controls and authentication</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Security Measures
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Password Hashing:</strong> Bcrypt with salt (industry standard)</li>
              <li className="mb-2"><strong>JWT Authentication:</strong> HTTP-only cookies prevent XSS attacks</li>
              <li className="mb-2"><strong>HTTPS:</strong> All data transmission encrypted with TLS 1.3</li>
              <li className="mb-2"><strong>Rate Limiting:</strong> Prevents brute-force and abuse</li>
              <li className="mb-2"><strong>Regular Updates:</strong> Dependencies updated to patch security vulnerabilities</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Third-Party Services
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use the following third-party services to provide and improve the App:
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Stripe (Payment Processing)</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Purpose:</strong> Process subscription payments and manage billing
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Data Shared:</strong> Email address, subscription tier
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a>
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">OpenAI (AI-Generated Examples)</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Purpose:</strong> Generate contextual example sentences
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Data Shared:</strong> Spanish words, proficiency level (no personal information)
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <strong>Privacy Policy:</strong> <a href="https://openai.com/privacy" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://openai.com/privacy</a>
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Vercel (Hosting & CDN)</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Purpose:</strong> Host the App and deliver content globally
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Data Shared:</strong> Request logs, IP addresses (anonymized)
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <strong>Privacy Policy:</strong> <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://vercel.com/legal/privacy-policy</a>
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Neon (Database Hosting)</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Purpose:</strong> Host PostgreSQL database for cloud sync
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Data Shared:</strong> All cloud-synced user data
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <strong>Privacy Policy:</strong> <a href="https://neon.tech/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://neon.tech/privacy-policy</a>
              </p>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-6">
              <strong>Important:</strong> We do not use third-party analytics (Google Analytics, Facebook Pixel, etc.) or advertising networks. Your data is never sold to third parties.
            </p>
          </section>

          {/* Your Rights & Choices */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your Rights & Choices
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You have the following rights regarding your personal information:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Access & Portability
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You can access and export your data at any time:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Export Vocabulary:</strong> Settings → Data Management → Export to CSV</li>
              <li className="mb-2"><strong>View All Data:</strong> Contact us at kbrookes2507@gmail.com for a complete data export</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Correction & Update
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You can update your personal information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Account Settings:</strong> Settings → Account → Update email, name, proficiency level</li>
              <li className="mb-2"><strong>Vocabulary Data:</strong> Edit or delete any vocabulary word at any time</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Deletion (Right to be Forgotten)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You can delete your data:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Account Deletion:</strong> Settings → Account → Delete Account (permanent, cannot be undone)</li>
              <li className="mb-2"><strong>What Gets Deleted:</strong> All personal information, vocabulary, review history, and progress data</li>
              <li className="mb-2"><strong>What Remains:</strong> Anonymized analytics (no personal identifiers), cached AI-generated examples (shared across users)</li>
              <li className="mb-2"><strong>Processing Time:</strong> Immediate deletion from active database, complete removal from backups within 30 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Opt-Out of Cloud Sync
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You can use Palabra without creating an account:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Guest Mode:</strong> Use the App with 100% local storage (no cloud sync)</li>
              <li className="mb-2"><strong>Offline-First:</strong> All features work offline without an account</li>
              <li className="mb-2"><strong>Limitations:</strong> No multi-device sync, data lost if you clear browser data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Marketing Communications
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We do not send marketing emails. You will only receive:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Transactional Emails:</strong> Account creation, password reset, subscription changes (cannot opt out)</li>
              <li className="mb-2"><strong>Push Notifications:</strong> Optional daily review reminders (can be disabled in Settings)</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Children&apos;s Privacy (COPPA Compliance)
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Palabra is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13 years of age.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you are a parent or guardian and believe your child under 13 has provided us with personal information, please contact us at kbrookes2507@gmail.com. We will delete such information from our systems within 48 hours.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users aged 13-17 may use the App but should do so with parental consent and supervision.
            </p>
          </section>

          {/* International Users */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              International Users (GDPR & CCPA)
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              European Users (GDPR)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Legal Basis:</strong> We process your data based on consent (account creation), contract (subscription), and legitimate interest (app improvement)</li>
              <li className="mb-2"><strong>Data Transfers:</strong> Your data may be transferred to the US (where our servers are located). We ensure adequate safeguards through standard contractual clauses.</li>
              <li className="mb-2"><strong>Right to Object:</strong> You can object to processing of your data for direct marketing or legitimate interests</li>
              <li className="mb-2"><strong>Right to Restrict:</strong> You can request restriction of processing in certain circumstances</li>
              <li className="mb-2"><strong>Right to Lodge Complaint:</strong> You can file a complaint with your local data protection authority</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              California Users (CCPA/CPRA)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Right to Know:</strong> Request information about personal data collected, used, and shared</li>
              <li className="mb-2"><strong>Right to Delete:</strong> Request deletion of your personal information</li>
              <li className="mb-2"><strong>Right to Opt-Out:</strong> We do not sell personal information, so no opt-out is necessary</li>
              <li className="mb-2"><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              To exercise your rights, contact us at kbrookes2507@gmail.com with &quot;CCPA Request&quot; in the subject line.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Data Retention
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We retain your data for the following periods:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Active Accounts:</strong> Indefinitely, as long as your account is active</li>
              <li className="mb-2"><strong>Inactive Accounts:</strong> 2 years of inactivity, then we send a warning email. After 30 days, account is deleted.</li>
              <li className="mb-2"><strong>Deleted Accounts:</strong> Immediately removed from active database, purged from backups within 30 days</li>
              <li className="mb-2"><strong>Anonymized Analytics:</strong> Retained indefinitely (no personal identifiers)</li>
              <li className="mb-2"><strong>Payment Records:</strong> 7 years (required by law for tax purposes)</li>
            </ul>
          </section>

          {/* Cookies & Tracking */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Cookies & Tracking Technologies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use the following technologies:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Essential Cookies
            </h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>Authentication Cookie:</strong> HTTP-only cookie storing your JWT token (expires in 30 days)</li>
              <li className="mb-2"><strong>Purpose:</strong> Keep you logged in between sessions</li>
              <li className="mb-2"><strong>Cannot be disabled:</strong> Required for app functionality</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              Functional Storage
            </h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2"><strong>LocalStorage:</strong> Stores app preferences, theme, notification settings</li>
              <li className="mb-2"><strong>IndexedDB:</strong> Stores vocabulary data for offline access</li>
              <li className="mb-2"><strong>Service Worker Cache:</strong> Caches app files for offline functionality</li>
              <li className="mb-2"><strong>Purpose:</strong> Enable offline-first experience</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              No Third-Party Tracking
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We do <strong>not</strong> use:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Google Analytics or similar analytics platforms</li>
              <li className="mb-2">Facebook Pixel or social media tracking</li>
              <li className="mb-2">Advertising cookies or ad networks</li>
              <li className="mb-2">Cross-site tracking or fingerprinting</li>
            </ul>
          </section>

          {/* Changes to This Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
              <li className="mb-2">Updating the &quot;Last updated&quot; date at the top of this policy</li>
              <li className="mb-2">Sending an email to your registered email address (for material changes)</li>
              <li className="mb-2">Displaying a prominent notice in the App</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Your continued use of the App after changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact Us */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Email:</strong> <a href="mailto:kbrookes2507@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">kbrookes2507@gmail.com</a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Subject Line:</strong> &quot;Privacy Policy Question&quot; or &quot;Data Request&quot;
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Response Time:</strong> Within 48 hours for urgent requests, 5 business days for standard requests
              </p>
            </div>
          </section>

          {/* Footer Note */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              This Privacy Policy was last updated on February 12, 2026.
              <br />
              We are committed to transparency and protecting your privacy.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
