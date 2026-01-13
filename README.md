# Palabra - Spanish Vocabulary Learning App

AI-powered Spanish vocabulary learning with intelligent spaced repetition.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📱 Application

- **Dev Server:** http://localhost:3000
- **Framework:** Next.js 16.1.1 (App Router)
- **React:** 19.2.3
- **TypeScript:** 5.x (Strict mode)
- **Styling:** Tailwind CSS 4.x

## 🏗️ Architecture

### Project Structure

```
palabra/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Main app routes
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Base UI components
│   ├── features/          # Feature components
│   ├── layouts/           # Layout components
│   └── shared/            # Shared components
├── lib/
│   ├── db/                # IndexedDB operations
│   ├── hooks/             # Custom React hooks
│   ├── providers/         # Context providers
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   └── constants/         # App constants
├── public/
│   ├── manifest.json      # PWA manifest
│   └── audio/             # Audio files
└── tests/                 # Test files
```

### Key Technologies

- **State Management:**
  - TanStack Query v5 (server state)
  - Zustand (client state)
  - React Hook Form (forms)

- **Database:**
  - IndexedDB (via idb)
  - 4 stores: vocabulary, reviews, sessions, stats

- **UI:**
  - Radix UI primitives
  - Lucide React icons
  - Framer Motion animations
  - Tailwind CSS 4

## 📚 Database

**📖 See `../BACKEND_INFRASTRUCTURE.md` for complete database architecture and API documentation.**

### IndexedDB Stores (Local)

1. **Vocabulary** - Word data, translations, examples
2. **Reviews** - Spaced repetition tracking (SM-2)
3. **Sessions** - Review session history
4. **Stats** - Daily statistics

### Usage Example

```typescript
import { createVocabularyWord, getAllVocabularyWords } from '@/lib/db';

// Add a word
await createVocabularyWord({
  id: crypto.randomUUID(),
  word: 'perro',
  translation: 'dog',
  gender: 'masculine',
  partOfSpeech: 'noun',
  status: 'new',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Get all words
const words = await getAllVocabularyWords();
```

## 🎨 Design System

### Colors

**Light Mode:**
- Background: `#FFFFFF`
- Foreground: `#1D1D1F`
- Accent: `#007AFF`
- Secondary: `#6E6E73`

**Dark Mode:**
- Background: `#000000`
- Foreground: `#FFFFFF`
- Accent: `#0A84FF`
- Secondary: `#98989D`

### Typography

- Font: SF Pro Text/Display (Apple system fonts)
- Scale: 32px, 24px, 20px, 16px, 14px, 12px

### Spacing (4px grid)

- 4, 8, 12, 16, 24, 32, 48, 64, 96px

### Utilities

```typescript
import { cn } from '@/lib/utils/cn';

// Merge Tailwind classes
<div className={cn('base-class', isActive && 'active-class')} />
```

## 🔧 Development Guidelines

### Code Standards

- **Max 500 LOC per file** - Split if exceeded
- **JSDoc3 comments** - Document all functions
- **TypeScript strict mode** - No `any` types
- **Mobile-first** - Design for mobile, enhance for desktop

### Component Pattern

```typescript
/**
 * Component description
 * 
 * @param props - Component props
 * @returns Component
 */
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handleClick = () => {
    // ...
  };
  
  // Early returns
  if (!data) return null;
  
  // Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### Type Imports

```typescript
import type { VocabularyWord, ReviewRecord } from '@/lib/types';
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/          # Unit tests (Vitest)
├── integration/   # Integration tests
└── e2e/          # End-to-end tests (Playwright)
```

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📦 Build

### Production Build

```bash
npm run build
```

### Build Outputs

- Static pages: Pre-rendered at build time
- API routes: Serverless functions
- Assets: Optimized and cached

## 🌐 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Environment Variables

Create `.env.local`:

```env
# API Keys (Phase 2+)
NEXT_PUBLIC_API_URL=
TRANSLATION_API_KEY=
DICTIONARY_API_KEY=
```

## 📱 PWA

### Manifest

Located at `/public/manifest.json`

### Service Worker

To be implemented in Phase 12 (Offline features)

## 🔑 Key Features (Current)

✅ Mobile-first responsive design  
✅ Apple-inspired aesthetics  
✅ Dark mode support (system preference)  
✅ Bottom tab navigation  
✅ IndexedDB local storage  
✅ TypeScript strict mode  
✅ TanStack Query ready  

## 🚧 Coming Soon

- Phase 2: Automated vocabulary entry with AI
- Phase 3: Flashcard review system
- Phase 4: Spaced repetition algorithm
- Phase 5: Progress tracking & statistics
- Phase 6: Polish & MVP launch

## 📖 Documentation

- [Phase 1 Complete Report](../PHASE1_COMPLETE.md)
- [Product Requirements](../README_PRD.txt)
- [Cursor Rules](.cursor/rules/)

## 🤝 Contributing

1. Follow the code standards in `.cursor/rules/`
2. Keep files under 500 LOC
3. Document with JSDoc3 comments
4. Test on mobile viewport
5. Maintain Apple design standards

## 📄 License

Private project - All rights reserved

---

**Version:** 1.0.0  
**Status:** Phase 1 Complete ✅  
**Next:** Phase 2 - Automated Vocabulary Entry
