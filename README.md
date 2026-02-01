# Palabra - Spanish Vocabulary Learning App 🇪🇸

> An intelligent vocabulary learning application with AI-powered translation, spaced repetition, and progress tracking.

[![Status](https://img.shields.io/badge/Status-Phase%2015%20Complete-success)](./PHASE15_ENHANCED_TRANSLATIONS.md)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-orange)](./PHASE12_COMPLETE.md)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

## 🎯 Overview

Palabra is a modern, mobile-first Spanish vocabulary learning application that helps users build and maintain their Spanish vocabulary through:

- **AI-Powered Entry**: Automatically fetches translations, examples, and pronunciation
- **Smart Spaced Repetition**: Optimizes review schedules using the SM-2 algorithm
- **Progress Tracking**: Comprehensive statistics, charts, and achievement milestones
- **Beautiful Design**: Apple-inspired UI with dark mode support
- **Accessible**: WCAG AA compliant with full keyboard navigation

## ✨ Features

### Core Features (Phase 1-6: MVP Complete ✅)

- ✅ **Automated Vocabulary Entry** - Just type the Spanish word, we handle the rest
- ✅ **Spell Checking** - Catches typos with suggestions
- ✅ **Audio Pronunciation** - Native speaker audio for every word
- ✅ **Flashcard Review** - Engaging card-flip interface
- ✅ **Spaced Repetition** - SM-2 algorithm for optimal retention
- ✅ **Progress Dashboard** - Track your learning journey
- ✅ **Study Streaks** - Stay motivated with daily goals
- ✅ **Mobile Optimized** - Works perfectly on phones and tablets
- ✅ **Offline Support** - All data stored locally (IndexedDB)
- ✅ **Dark Mode** - Easy on the eyes, day or night

### Advanced Features (Phase 7-15: Complete ✅)

- ✅ **Multiple Example Sentences** - Context-rich learning
- ✅ **Bidirectional Flashcards** - Spanish→English & English→Spanish
- ✅ **Multiple Review Modes** - Recognition, Recall, Listening
- ✅ **Custom Tags & Categories** - Organize your way
- ✅ **Cloud Sync** - Seamless multi-device experience
- ✅ **User Authentication** - Secure account system
- ✅ **Import/Export** - CSV backup and restore
- ✅ **Advanced Analytics** - Detailed progress tracking
- ✅ **Push Notifications** - Daily review reminders
- ✅ **PWA Support** - Install as native app
- ✅ **Background Sync** - Automatic data synchronization
- ✅ **Voice Input** - Speak words instead of typing (Phase 14)
- ✅ **Enhanced Translations** - Multiple precise translations with context (Phase 15)

### Future Enhancements (Phase 13+)

- 🔜 Social features (share vocabulary lists)
- 🔜 Study groups and collaboration
- 🔜 Gamification (achievements, leaderboards)
- 🔜 Multiple language support
- 🔜 Native mobile apps (iOS/Android)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- **DeepL API Key** (recommended for high-quality translations) - [Setup Guide](./TRANSLATION_API_SETUP.md)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Spanish_Vocab/palabra

# Install dependencies
npm install

# Configure translation API (IMPORTANT!)
# See TRANSLATION_API_SETUP.md for details
# 1. Get free DeepL API key: https://www.deepl.com/pro-api
# 2. Create .env.local file with: NEXT_PUBLIC_DEEPL_API_KEY=your-key-here:fx
# 3. This improves translation quality from ~70% to ~95% accuracy

# Run development server
npm run dev

# Open http://localhost:3000
```

### ⚠️ Translation Quality Setup

**Without DeepL**: The app uses MyMemory API (free, lower quality ~70% accuracy)
- Example: "desviar" → "avoid evade" ❌ (WRONG)

**With DeepL**: Professional translations (~95% accuracy)
- Example: "desviar" → "divert" ✅ (CORRECT)

**See [TRANSLATION_API_SETUP.md](./TRANSLATION_API_SETUP.md) for complete setup instructions.**

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm run start
```

## 📱 Screenshots

### Home Dashboard
Beautiful overview of your learning progress with today's stats and quick actions.

### Vocabulary Entry
AI-powered form that automatically fetches translations, examples, and pronunciation.

### Flashcard Review
Engaging card-flip interface with spaced repetition scheduling.

### Progress Tracking
Comprehensive statistics with charts, streaks, and milestones.

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form
- **Icons**: Lucide React

### Backend & Data Storage
- **Local Storage**: IndexedDB (via idb library)
- **Cloud Database**: PostgreSQL (Prisma ORM)
- **Authentication**: JWT with HTTP-only cookies
- **Sync Service**: Bidirectional cloud synchronization

### APIs & Services
- **Translation**: LibreTranslate API
- **Dictionary**: Wiktionary API
- **Examples**: Tatoeba API
- **Audio**: Browser Web Speech API (TTS)

### Development
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm

## 📚 Documentation

### 🎯 Start Here

- **[Documentation Index](./DOCUMENTATION_INDEX.md)** 📖 - Master index of all documentation (start here!)
- **[Backend Infrastructure](./BACKEND_INFRASTRUCTURE.md)** ⭐ - Complete backend architecture (single source of truth)
- **[Backend Quick Reference](./BACKEND_QUICK_REFERENCE.md)** - Quick reference card for developers
- **[Backend Evolution](./BACKEND_EVOLUTION.md)** - How the backend evolved across all phases
- **[Product Requirements](./README_PRD.txt)** - Full feature roadmap and specifications
- **[Deployment Guide](./palabra/DEPLOYMENT.md)** - How to deploy to production

### 📋 Phase Completion Status

| Phase | Status | Documentation |
|-------|--------|---------------|
| Phase 1: Foundation & Setup | ✅ Complete | [PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md) |
| Phase 2: Automated Vocabulary Entry | ✅ Complete | [PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md) |
| Phase 3: Basic Flashcard System | ✅ Complete | [PHASE3_COMPLETE.md](./PHASE3_COMPLETE.md) |
| Phase 4: Simple Spaced Repetition | ✅ Complete | [PHASE4_COMPLETE.md](./PHASE4_COMPLETE.md) |
| Phase 5: Basic Progress Tracking | ✅ Complete | [PHASE5_COMPLETE.md](./PHASE5_COMPLETE.md) |
| Phase 6: Polish & MVP Launch Prep | ✅ Complete | [PHASE6_COMPLETE.md](./PHASE6_COMPLETE.md) |
| Phase 7: Enhanced Vocabulary Features | ✅ Complete | [PHASE7_COMPLETE.md](./PHASE7_COMPLETE.md) |
| Phase 8: Advanced Learning Features | ✅ Complete | [PHASE8_COMPLETE.md](./PHASE8_COMPLETE.md) |
| Phase 9: Data Organization & Management | ✅ Complete | [PHASE9_COMPLETE.md](./PHASE9_COMPLETE.md) |
| Phase 10: Notifications & Reminders | ✅ Complete | [PHASE10_COMPLETE.md](./PHASE10_COMPLETE.md) |
| Phase 11: Enhanced Progress & Statistics | ✅ Complete | [PHASE11_COMPLETE.md](./PHASE11_COMPLETE.md) |
| Phase 12: Cloud Sync & Full Backend | ✅ Complete | [PHASE12_COMPLETE.md](./PHASE12_COMPLETE.md) |
| Phase 13+: Future Enhancements | 📋 Planned | [README_PRD.txt](./README_PRD.txt) |

## 🎨 Design Philosophy

Palabra follows Apple's design principles:

- **Clarity**: Clear typography, intuitive icons, purposeful adornments
- **Deference**: Content is king, UI elements don't compete with content
- **Depth**: Visual layers and motion convey hierarchy and vitality

### Key Design Features

- Mobile-first responsive design
- Dark mode support (automatic based on system preference)
- Smooth animations (respects `prefers-reduced-motion`)
- High contrast for accessibility
- Touch-friendly interactions (44x44px minimum)
- Safe area insets for notched devices

## ♿ Accessibility

Palabra is committed to accessibility:

- ✅ WCAG AA compliant
- ✅ Full keyboard navigation
- ✅ Screen reader support
- ✅ Skip to main content link
- ✅ ARIA labels and roles
- ✅ Focus indicators
- ✅ Color contrast meets standards
- ✅ Motion preferences respected

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

### Manual Testing Checklist

- [ ] Add new vocabulary word
- [ ] Search and filter vocabulary
- [ ] Start flashcard review
- [ ] Complete review session
- [ ] View progress statistics
- [ ] Test on mobile device
- [ ] Test keyboard navigation
- [ ] Test with screen reader

## 📦 Project Structure

```
palabra/
├── app/                      # Next.js app directory
│   ├── (dashboard)/         # Dashboard pages
│   │   ├── page.tsx         # Home page
│   │   ├── vocabulary/      # Vocabulary list
│   │   ├── review/          # Flashcard review
│   │   ├── progress/        # Statistics
│   │   └── settings/        # Settings
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── features/           # Feature components
│   ├── layouts/            # Layout components
│   ├── shared/             # Shared components
│   └── ui/                 # UI primitives
├── lib/                     # Utilities and logic
│   ├── db/                 # Database operations
│   ├── hooks/              # Custom React hooks
│   ├── services/           # External services
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
└── public/                  # Static assets
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd palabra
vercel --prod
```

See [DEPLOYMENT.md](./palabra/DEPLOYMENT.md) for detailed instructions.

### Alternative Platforms

- **Netlify**: Similar to Vercel
- **Docker**: Self-hosted option
- **AWS/GCP/Azure**: Enterprise deployment

## 🤝 Contributing

This is currently a personal project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js Team** - Amazing framework
- **Vercel** - Hosting and deployment
- **Tailwind CSS** - Utility-first CSS
- **Lucide** - Beautiful icons
- **LibreTranslate** - Free translation API
- **Wiktionary** - Dictionary data

## 📞 Contact

- **Author**: Kalvin Brookes
- **Email**: kbrookes2507@gmail.com
- **Project Link**: [GitHub Repository](#)

## 🗺️ Roadmap

See [README_PRD.txt](./README_PRD.txt) for the complete product roadmap.

### ✅ Completed (Phases 1-12)

- ✅ Foundation and core features (MVP)
- ✅ Enhanced vocabulary features
- ✅ Advanced learning algorithms
- ✅ Data organization and management
- ✅ Notifications and reminders
- ✅ Enhanced analytics
- ✅ **Full backend with cloud sync** 🎉
- ✅ **Multi-device support** 🎉
- ✅ **PWA capabilities** 🎉

### 🔮 Future (Phase 13+)

1. **Social Features**
   - Share vocabulary lists
   - Study groups
   - Community word lists
   - Leaderboards

2. **Gamification**
   - Achievement system
   - XP and levels
   - Daily challenges
   - Competitive features

3. **Platform Expansion**
   - Native mobile apps (iOS/Android)
   - Browser extensions
   - Desktop applications

4. **AI Enhancements**
   - Automatic example sentence generation
   - Context-aware suggestions
   - Pronunciation analysis
   - Personalized learning paths

---

**Made with ❤️ for Spanish learners everywhere**

*Start building your vocabulary today!* 🚀

