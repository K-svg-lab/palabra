/**
 * Footer Component
 * Landing page footer with links and social media
 * Phase 17 Design: Clean, organized, accessible
 */

'use client';

import Link from 'next/link';
import { Twitter, Mail, MessageCircle } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Features', href: '#how-it-works' },
    { name: 'Pricing', href: '/settings/subscription' },
    { name: 'Sign In', href: '/signin' },
    { name: 'Sign Up', href: '/signup' },
  ],
  resources: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact', href: 'mailto:kbrookes2507@gmail.com' },
  ],
  social: [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/palabra_app' },
    { name: 'Discord', icon: MessageCircle, href: '#' }, // To be updated
    { name: 'Email', icon: Mail, href: 'mailto:kbrookes2507@gmail.com' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Palabra
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Master Spanish vocabulary with AI-powered learning and spaced repetition.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {footerLinks.social.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 flex items-center justify-center transition-all duration-300 group"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Product
            </h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('#') ? (
                    <button
                      onClick={() => {
                        const element = document.querySelector(link.href);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Get Started
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Start learning Spanish vocabulary for free today.
            </p>
            <Link href="/">
              <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm hover:shadow-lg transition-shadow">
                Start Free
              </button>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              © {new Date().getFullYear()} Palabra. All rights reserved.
            </p>
            <p>
              Made with ❤️ for Spanish learners everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
