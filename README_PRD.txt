PRODUCT REQUIREMENTS DOCUMENT
Spanish Vocabulary Learning Application
=======================================

VERSION: 1.0
LAST UPDATED: January 12, 2026
PROJECT STATUS: Planning Phase


════════════════════════════════════════════════════════════════════════════════
PROBLEM STATEMENT
════════════════════════════════════════════════════════════════════════════════

Spanish language learners encounter new vocabulary from various sources (classes, 
conversations, media, apps, books) but lack a centralized system to capture, 
organize, and systematically review this vocabulary.

PAIN POINTS:
- Vocabulary scattered across notebooks, apps, and loose papers
- No systematic approach to reviewing learned words leads to forgetting
- Lack of context (gender, usage, pronunciation) when reviewing vocabulary later
- Missing personalized review schedules based on individual retention patterns
- Difficulty accessing vocabulary across different devices and contexts
- Manual vocabulary entry is tedious and time-consuming
- Risk of incorrect translations or missing example sentences when entering manually

OUR SOLUTION:
AI-powered vocabulary capture that automatically generates translations, example 
sentences, and pronunciation with user confirmation. Combined with intelligent 
spaced repetition, this creates the fastest and most effective way to build and 
maintain Spanish vocabulary.


════════════════════════════════════════════════════════════════════════════════
TARGET USERS
════════════════════════════════════════════════════════════════════════════════

PRIMARY AUDIENCE:
Adult Spanish language learners (ages 18-45) who:
- Are self-directed in their learning journey
- Encounter vocabulary from multiple sources
- Use mobile devices as their primary computing device
- Want to optimize their learning efficiency
- Are motivated to maintain consistent study habits

PROFICIENCY LEVELS:
- Beginner (A1-A2): Building foundational vocabulary
- Intermediate (B1-B2): Expanding practical vocabulary
- Advanced (C1-C2): Refining and maintaining vocabulary


════════════════════════════════════════════════════════════════════════════════
MVP DELIVERABLES (Minimum Viable Product)
════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: FOUNDATION & SETUP                                     STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 1.1 - Project initialization and dependencies setup
  [ ] 1.2 - Database schema design (local storage)
  [ ] 1.3 - Basic routing and navigation structure
  [ ] 1.4 - Responsive layout and mobile-first design system
  [ ] 1.5 - TypeScript types and interfaces definition

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: AUTOMATED VOCABULARY ENTRY                             STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 2.1 - Translation API integration
          ├─ Research and select translation service (Google Translate, DeepL, etc.)
          ├─ Set up API keys and rate limiting
          ├─ Create translation service module
          └─ Handle API errors and fallbacks
  
  [ ] 2.2 - Dictionary/Example API integration
          ├─ Research Spanish dictionary APIs (WordReference, SpanishDict, etc.)
          ├─ Fetch example sentences automatically
          └─ Parse and format example data
  
  [ ] 2.3 - Audio pronunciation integration
          ├─ Research audio sources (Forvo API, Google TTS, etc.)
          ├─ Fetch/generate pronunciation audio
          └─ Cache audio files for offline use
  
  [ ] 2.4 - Smart vocabulary entry form UI
          ├─ Spanish word input (primary field)
          ├─ Auto-fetch translation on blur/submit
          ├─ Display suggested translation with edit capability
          ├─ Show confidence indicator for translation quality
          ├─ Auto-detect gender and part of speech
          ├─ Display suggested example sentences (user can select or skip)
          ├─ Auto-load pronunciation audio with play button
          └─ "Confirm & Save" button to approve all auto-generated content
  
  [ ] 2.5 - Validation & confirmation workflow
          ├─ Show loading states during API calls
          ├─ Allow user to edit any auto-generated field
          ├─ Highlight fields that need user review
          ├─ "Looks good" quick confirm button
          └─ Manual override for all fields
  
  [ ] 2.6 - Local storage implementation (browser localStorage/IndexedDB)
          └─ Cache API responses to reduce repeated calls
  
  [ ] 2.7 - Vocabulary list view
          ├─ Display all saved words
          ├─ Show word details (translation, gender, part of speech)
          ├─ Indicate auto-generated vs manually edited fields
          └─ Basic sorting functionality
  
  [ ] 2.8 - Edit vocabulary functionality
          ├─ Allow re-fetching of auto-generated content
          └─ Manual editing of any field
  
  [ ] 2.9 - Delete vocabulary functionality with confirmation
  
  [ ] 2.10 - Basic search/filter by Spanish or English text

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: BASIC FLASHCARD SYSTEM                                 STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 3.1 - Flashcard UI component (Spanish → English only)
          ├─ Front side: Spanish word
          ├─ Back side: English translation + metadata
          └─ Flip animation
  
  [ ] 3.2 - Review session interface
          ├─ Start review button
          ├─ Card navigation (next/previous)
          └─ Session progress indicator
  
  [ ] 3.3 - Self-assessment buttons (Forgot, Hard, Good, Easy)
  
  [ ] 3.4 - Basic randomization of card order

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: SIMPLE SPACED REPETITION                               STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 4.1 - Implement basic spaced repetition algorithm (SM-2 or similar)
          ├─ Track last review date
          ├─ Track next review date
          ├─ Track difficulty level per word
          └─ Calculate review intervals based on performance
  
  [ ] 4.2 - "Due for review" filtering logic
  
  [ ] 4.3 - Review queue management
          └─ Show only cards due for review in flashcard sessions

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: BASIC PROGRESS TRACKING                                STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 5.1 - Simple statistics dashboard
          ├─ Total vocabulary count
          ├─ Cards due today
          ├─ Cards reviewed today
          └─ New words added today
  
  [ ] 5.2 - Basic progress visualization (simple charts/graphs)
  
  [ ] 5.3 - Vocabulary status categories (New, Learning, Mastered)

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: POLISH & MVP LAUNCH PREP                               STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 6.1 - Responsive design refinement for mobile
  [ ] 6.2 - Loading states and error handling
  [ ] 6.3 - User onboarding/welcome screen
  [ ] 6.4 - Empty states for new users
  [ ] 6.5 - Basic accessibility improvements (keyboard navigation, ARIA labels)
  [ ] 6.6 - Performance optimization
  [ ] 6.7 - MVP testing and bug fixes
  [ ] 6.8 - Deploy MVP to production


════════════════════════════════════════════════════════════════════════════════
POST-MVP ENHANCEMENTS
════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: ENHANCED VOCABULARY FEATURES                           STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 7.1 - Multiple example sentences
          ├─ Fetch multiple examples per word
          ├─ User can save multiple examples
          ├─ Context-based example filtering (formal/informal)
          └─ Carousel view of examples in flashcards
  
  [ ] 7.2 - Enhanced audio features
          ├─ Multiple pronunciation sources (different accents/regions)
          ├─ Speed control (slow/normal/fast)
          ├─ User can record their own pronunciation
          └─ Compare user pronunciation with native speaker
  
  [ ] 7.3 - Auto-generated word relationships
          ├─ Synonyms and antonyms
          ├─ Related words and word families
          ├─ Common collocations
          └─ Conjugation tables for verbs
  
  [ ] 7.4 - Personal notes and mnemonics field
          └─ Rich text editor for custom notes
  
  [ ] 7.5 - Word images/visual associations
          ├─ Auto-fetch relevant images from APIs
          ├─ User can upload custom images
          └─ Image display in flashcard review

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 8: ADVANCED LEARNING FEATURES                             STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 8.1 - Bidirectional flashcards (English → Spanish mode)
  
  [ ] 8.2 - Multiple review modes
          ├─ Recognition mode (current)
          ├─ Recall mode (type the answer)
          └─ Listening comprehension mode
  
  [ ] 8.3 - Custom study sessions
          ├─ Session size selection
          ├─ Focus on specific categories
          └─ Practice weak words only
  
  [ ] 8.4 - Advanced spaced repetition
          ├─ Forgetting curve tracking
          ├─ Personalized difficulty adjustments
          └─ Retention prediction

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 9: DATA ORGANIZATION & MANAGEMENT                         STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 9.1 - Custom tags and categories
  
  [ ] 9.2 - Advanced filtering and search
          ├─ Filter by tags, categories, difficulty
          ├─ Filter by date added
          └─ Combined filter criteria
  
  [ ] 9.3 - Bulk operations
          ├─ Bulk edit
          ├─ Bulk delete
          └─ Bulk export
  
  [ ] 9.4 - Import/Export functionality
          ├─ CSV import
          ├─ CSV export
          └─ Backup/restore entire database

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 10: NOTIFICATIONS & REMINDERS                             STATUS: [✓]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [✓] 10.1 - Push notification setup (PWA)
  
  [✓] 10.2 - Daily review reminders
  
  [✓] 10.3 - Customizable notification preferences
          ├─ Timing preferences
          ├─ Frequency settings
          └─ Quiet hours
  
  [✓] 10.4 - Badge indicators for pending reviews

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 11: ENHANCED PROGRESS & STATISTICS                        STATUS: [✓]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [✓] 11.1 - Advanced statistics dashboard
          ├─ Review accuracy trends
          ├─ Learning velocity
          ├─ Retention rate over time
          └─ Study time tracking
  
  [✓] 11.2 - Streak tracking
          ├─ Consecutive days of practice
          ├─ Streak milestones
          └─ Streak preservation features
  
  [✓] 11.3 - Historical performance data
          ├─ Weekly/monthly reports
          ├─ Year in review
          └─ Personal records
  
  [✓] 11.4 - Data visualization improvements
          ├─ Interactive charts
          ├─ Progress graphs
          └─ Heat maps

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 12: CROSS-DEVICE & OFFLINE FEATURES                       STATUS: [✓]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [✓] 12.1 - Backend API development
          ├─ User authentication
          ├─ RESTful API endpoints
          └─ Database setup (PostgreSQL/MongoDB)
  
  [✓] 12.2 - Cloud synchronization
          ├─ Sync vocabulary across devices
          ├─ Conflict resolution
          └─ Real-time updates
  
  [✓] 12.3 - Progressive Web App enhancements
          ├─ Service worker implementation
          ├─ Offline functionality
          ├─ App manifest
          └─ Install prompt
  
  [✓] 12.4 - Background sync for review data

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 13: POLISH & FUTURE ENHANCEMENTS                          STATUS: [ ]  │
└─────────────────────────────────────────────────────────────────────────────┘
  [ ] 13.1 - Social features
          ├─ Share vocabulary lists
          ├─ Community word lists
          └─ Study groups
  
  [ ] 13.2 - Gamification
          ├─ Achievement system
          ├─ Leaderboards
          └─ XP and levels
  
  [ ] 13.3 - Multiple language support (beyond Spanish)
  
  [ ] 13.4 - Native mobile apps (iOS/Android)
  
  [ ] 13.5 - AI-powered features
          ├─ Automatic example sentence generation
          ├─ Context-aware suggestions
          └─ Pronunciation analysis


════════════════════════════════════════════════════════════════════════════════
TECHNICAL STACK
════════════════════════════════════════════════════════════════════════════════

⚠️ NOTE: For complete backend architecture details, see BACKEND_INFRASTRUCTURE.md

FRONTEND:
- Next.js 16+ (React framework)
- React 19
- TypeScript
- Tailwind CSS (styling)
- React Hook Form (forms)
- Recharts (data visualization)

BACKEND & INFRASTRUCTURE (Phase 12+):
- PostgreSQL (Prisma ORM) - Cloud database
- IndexedDB (idb) - Local storage
- JWT Authentication - Session management
- Next.js API routes - Serverless endpoints
- Cloud Sync Service - Multi-device support

EXTERNAL API INTEGRATIONS (Phase 2+):
- Translation: LibreTranslate (free, open-source)
- Dictionary: Wiktionary API + Tatoeba API
- Audio: Browser Web Speech API (TTS)
- Future options: Google Translate, Forvo, DeepL

API MANAGEMENT:
- Next.js API routes (serverless functions)
- Rate limiting and caching
- Environment variables for API keys
- Error handling and fallback strategies

DATA STORAGE:
- Current: Hybrid IndexedDB (local) + PostgreSQL (cloud)
- Offline-first architecture with cloud sync
- Multi-device synchronization
- Conflict resolution

DEPLOYMENT:
- Platform: Vercel (recommended)
- Database: Vercel Postgres / Supabase
- CDN: Vercel Edge Network
- PWA: Service Workers, offline support

PWA CAPABILITIES:
- Service Workers (implemented Phase 12)
- Offline functionality (full app)
- Install prompts (iOS/Android)
- Push notifications (Phase 10)
- Background sync

COST CONSIDERATIONS:
- Free tier available for all services
- Vercel: Free for personal/hobby projects
- Database: Free tier sufficient for MVP
- External APIs: Mostly free with rate limits
- Caching minimizes API calls


════════════════════════════════════════════════════════════════════════════════
AUTOMATED VOCABULARY ENTRY WORKFLOW
════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                        STEP 1: USER INPUT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  User types Spanish word: "perro"                                           │
│  [                perro                ] <-- Single input field             │
│                                                                              │
│  User clicks "Fetch Details" or presses Enter                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STEP 2: AUTO-GENERATION (Loading...)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Parallel API Calls:                                                        │
│  ├─ Translation API    → English: "dog"                                    │
│  ├─ Dictionary API     → Gender: masculine, Part of Speech: noun           │
│  ├─ Examples API       → "El perro ladra fuerte" / "The dog barks loudly"  │
│  └─ Audio API          → [audio file of native pronunciation]              │
│                                                                              │
│  ⏳ Loading state with progress indicators                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   STEP 3: REVIEW & CONFIRM INTERFACE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Spanish Word: perro                                                        │
│                                                                              │
│  ✓ Translation: [dog           ] ✏️ Edit                                   │
│  ✓ Gender: [Masculine ▼] ✏️ Edit                                           │
│  ✓ Part of Speech: [Noun ▼] ✏️ Edit                                        │
│                                                                              │
│  ✓ Example: "El perro ladra fuerte"                                        │
│    Translation: "The dog barks loudly" ✏️ Edit | ❌ Remove                 │
│                                                                              │
│  ✓ Pronunciation: [▶️ Play Audio] 🔄 Regenerate                            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  ✅ Looks Good - Save Word        │  ✏️ Edit Details                │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 4: SAVED TO DATABASE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✅ Word saved successfully!                                                │
│  "perro" has been added to your vocabulary                                 │
│                                                                              │
│  [Add Another Word]  [View All Words]  [Start Review]                      │
└─────────────────────────────────────────────────────────────────────────────┘

FALLBACK HANDLING:
- If API fails: Show manual input fields with helpful error message
- If translation uncertain: Show confidence score and suggest manual review
- If no audio available: Offer text-to-speech alternative
- Always allow manual override of any auto-generated field


════════════════════════════════════════════════════════════════════════════════
PROGRESS TRACKING
════════════════════════════════════════════════════════════════════════════════

CURRENT PHASE: Phase 12 - Cross-Device & Offline Features (COMPLETE)
NEXT MILESTONE: Phase 13 or Polish & Enhancements
BLOCKERS: None - Production deployment pending

COMPLETED PHASES:
- Phase 1: Foundation & Setup ✅
- Phase 2: Automated Vocabulary Entry ✅
- Phase 3: Basic Flashcard System ✅
- Phase 4: Simple Spaced Repetition ✅
- Phase 5: Basic Progress Tracking ✅
- Phase 6: Polish & MVP Launch Prep ✅
- Phase 7: Enhanced Vocabulary Features ✅
- Phase 8: Advanced Learning Features ✅
- Phase 9: Data Organization & Management ✅
- Phase 10: Notifications & Reminders ✅
- Phase 11: Enhanced Progress & Statistics ✅
- Phase 12: Cross-Device & Offline Features ✅

IN PROGRESS:
- Ready for production deployment

NOTES:
- [Add development notes, decisions, and insights here as the project progresses]


════════════════════════════════════════════════════════════════════════════════
KEY DECISIONS LOG
════════════════════════════════════════════════════════════════════════════════

Jan 12, 2026 - AUTOMATED VOCABULARY ENTRY
Decision: Implement AI/API-powered automatic translation, example sentences, and 
audio pronunciation. Users only need to input the Spanish word, then confirm or 
edit the auto-generated content. This significantly reduces friction in vocabulary 
entry and improves accuracy by leveraging professional translation services.

Rationale:
- Faster vocabulary capture (critical for on-the-go learning)
- Higher quality translations from professional APIs
- Consistent pronunciation from native sources
- Lower cognitive load for users
- More likely to include examples and audio (often skipped if manual)

Considerations:
- API costs and rate limits
- Need fallback for offline/API failures
- Must allow manual override for accuracy
- Caching strategy essential to minimize API calls


════════════════════════════════════════════════════════════════════════════════
API EVALUATION CRITERIA
════════════════════════════════════════════════════════════════════════════════

When selecting APIs for implementation, evaluate based on:

TRANSLATION API SELECTION:
Priority Factors:
1. Accuracy for Spanish-English translation
2. Free tier availability and limits
3. Response speed (<500ms preferred)
4. Confidence scores in API response
5. Cost per 1000 characters
6. Rate limits (requests per minute)
7. Ease of integration

DICTIONARY/EXAMPLES API SELECTION:
Priority Factors:
1. Quality of example sentences (natural, modern Spanish)
2. Includes gender and part of speech metadata
3. Free/affordable pricing
4. Reliability and uptime
5. Response format (JSON preferred)

AUDIO/PRONUNCIATION API SELECTION:
Priority Factors:
1. Native speaker quality vs TTS
2. Regional accent options (Spain vs Latin America)
3. File size and format (mp3/ogg preferred)
4. Caching/storage allowed by terms of service
5. Cost per audio generation
6. Offline playback capability

RECOMMENDED STACK (TO BE VALIDATED IN PHASE 2):
- Translation: LibreTranslate (free) or Google Translate API (paid but reliable)
- Dictionary: SpanishDict scraping + Wiktionary API (free)
- Audio: Forvo API (native speakers) with Google TTS fallback


════════════════════════════════════════════════════════════════════════════════
RESOURCES & REFERENCES
════════════════════════════════════════════════════════════════════════════════

PROJECT DOCUMENTATION:
- **BACKEND_INFRASTRUCTURE.md** - Complete backend architecture (single source of truth)
- **DEPLOYMENT.md** - Production deployment guide
- **PHASE*_COMPLETE.md** - Phase-specific implementation details

SPACED REPETITION ALGORITHMS:
- SM-2 Algorithm (Supermemo)
- Anki's algorithm
- Leitner System

DESIGN INSPIRATION:
- Anki
- Duolingo
- Memrise
- Quizlet

API DOCUMENTATION:
- Google Cloud Translation: https://cloud.google.com/translate/docs
- DeepL API: https://www.deepl.com/docs-api
- LibreTranslate: https://libretranslate.com/docs
- Forvo API: https://api.forvo.com/documentation
- Wiktionary API: https://en.wiktionary.org/w/api.php