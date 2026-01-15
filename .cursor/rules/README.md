# Cursor Rules Documentation
Spanish Vocabulary Learning Application

## Overview
This directory contains comprehensive cursor rules for developing a Next.js-based Spanish vocabulary learning app with Apple-level design aesthetics.

## Files Structure

### 00-global.mdc (162 lines)
**Overarching development principles and standards**
- Core philosophy and critical rules (500 LOC max, thorough investigation, simple solutions)
- Documentation and commenting standards (JSDoc3, preserve useful comments)
- Research requirements (Context7 MCP for latest docs, check README_PRD.txt)
- Tech stack (Next.js 15, React 19, TypeScript 5, Supabase, TanStack Query)
- Project structure and file organization
- Development workflow (before/during/after coding)
- Error handling, security, performance targets
- Accessibility standards and git practices

### 01-architecture-patterns.mdc (169 lines)
**System architecture and design patterns**
- Application layers (Presentation, Data, Backend)
- Component patterns (Compound, Custom Hooks, HOCs, Render Props)
- Data patterns (Optimistic updates, Stale-while-revalidate, Progressive loading)
- State management strategy (Server/Client/Form/URL state)
- Spaced repetition algorithm architecture (SM-2)
- API design principles (Server Actions, Route Handlers)
- Security architecture (Authentication flow, RLS policies)
- Offline/PWA architecture
- Performance architecture (Code splitting, Image optimization)
- Testing strategy (Unit, Integration, E2E)

### 02-code-style.mdc (196 lines)
**Code style and best practices**
- TypeScript standards (Strict mode, type discipline, naming)
- React/Next.js style (Component structure, naming, props)
- Function design (Size, structure, naming, async patterns)
- Data handling (State updates, forms, API calls)
- Styling approach (Tailwind CSS, animations)
- Error handling (Boundaries, API errors, user messages)
- Commenting best practices (When/how to comment, JSDoc3)
- File organization (Imports, exports)
- Performance best practices (React, bundle, accessibility)
- Git practices (Commit messages, atomic commits)

### 03-ui-ux-apple-design.mdc (167 lines)
**Apple-inspired design aesthetics**
- Design philosophy (Clarity, Deference, Depth)
- Visual design system (Colors, Typography, Spacing, Layout)
- Iconography (Outlined style, Lucide React)
- Cards and containers (12px radius, subtle shadows)
- Animation and motion (Meaningful, Subtle, Quick, Natural)
- Component-specific design (Navigation, Buttons, Forms, Flashcard, Stats)
- Accessibility integration (Color, Focus, Screen readers, Motion)
- Dark mode implementation
- Responsive breakpoints (Mobile/Tablet/Desktop)
- Design validation checklist

### 04-performance-security.mdc (186 lines)
**Performance optimization and security**
- Performance targets (Core Web Vitals, Lighthouse scores)
- Loading performance (Critical path, Code splitting, Image/Font optimization)
- Runtime performance (React, JavaScript, Network)
- Caching strategy (Browser, TanStack Query, Service Worker)
- Database performance (Query optimization, indexing)
- PWA performance (Offline strategy, install experience)
- Security principles (Authentication, Authorization, RLS)
- Input validation (Client/Server, XSS, CSRF prevention)
- Data privacy and encryption
- API security (Rate limiting, CORS)
- Dependency security and monitoring
- Pre-deploy checklist

## Key Constraints & Requirements

### Apple Design Standard
Every design decision must pass the "Would Steve Jobs and Jony Ive approve?" test:
- Minimalist and refined
- Intuitive and delightful
- Content over chrome
- Purposeful animations
- Premium feel

### Code Quality Standards
- **500 LOC Maximum**: All code files must be under 500 lines
- **Always Comment**: Meaningful comments explaining "why" and "how"
- **JSDoc3 Standard**: Consistent documentation format
- **No Erasure of Useful Comments**: Preserve context from previous work

### Development Practices
- **Thorough Investigation**: Use all available tools (search, grep, codebase exploration)
- **Context7 MCP**: Always use for latest documentation (AI training data is outdated)
- **Check README_PRD.txt**: Regular reference for requirements and progress tracking
- **Simple & Elegant**: Favor clarity over cleverness

### Tech Stack (January 2026)
- **Frontend**: Next.js 15.x (App Router), React 19, TypeScript 5.x
- **Styling**: Tailwind CSS 4.x, Framer Motion 11.x, Radix UI/shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State**: TanStack Query v5 (server), Zustand (client)
- **PWA**: next-pwa, Service Workers, Offline support
- **Testing**: Vitest, Playwright, ESLint, Prettier

## Usage Guidelines

1. **Read in Order**: Start with 00-global.mdc for foundational principles
2. **Reference as Needed**: Use specific files when working on particular aspects
3. **Adapt When Necessary**: Inform user if rules need updating due to project pivots
4. **Stay Under 200 Lines**: Each rules file is intentionally concise and principle-oriented
5. **Focus on Principles**: Avoid detailed code examples; principles guide implementation

## Progressive Development

### Phase 1: MVP
- Vocabulary entry and management
- Basic spaced repetition (SM-2 algorithm)
- Flashcard learning interface
- Progress tracking
- PWA with offline support

### Phase 2: Enhancement
- Audio pronunciation
- Advanced statistics and analytics
- Custom tags and categories
- Import/export functionality

### Phase 3: Scale
- Push notifications
- Social features (optional)
- Native app considerations
- Performance optimization at scale

## Maintenance

These rules should evolve with the project. When significant changes occur:
1. Inform the user that rules need updating
2. Update relevant sections while maintaining <200 line limit
3. Keep README.md synchronized with changes
4. Document rationale for changes

## Design Resources

### Apple Human Interface Guidelines
Reference for maintaining Apple-level design standards

### Inspiration
- iOS native apps (especially Apple's own)
- macOS applications
- iPad productivity apps
- Apple.com design patterns

## Success Metrics

**Technical**:
- Lighthouse score 90+ across all categories
- Core Web Vitals all green
- Zero critical security vulnerabilities
- <2s page load on 3G

**User Experience**:
- Intuitive (no tutorial needed)
- Fast (feels instant)
- Accessible (WCAG 2.1 AA)
- Beautiful (Apple-approved aesthetics)

**Code Quality**:
- All files <500 LOC
- Comprehensive comments
- Type-safe (no `any`)
- Test coverage on critical paths

---

**Last Updated**: January 12, 2026
**Version**: 1.0
**Project**: Spanish Vocabulary Learning Application

