# Phase 18.2: Advanced Learning Features
**Interference Detection, Deep Learning Mode & A/B Testing**

**Created:** February 7, 2026  
**Status:** 📋 PLANNING  
**Priority:** 🟡 High (Enhancement)  
**Estimated Duration:** 3-4 weeks  
**Dependencies:** Phase 18.1 (Foundation)

---

## 🎯 **Executive Summary**

Phase 18.2 builds on the foundation established in 18.1, adding advanced evidence-based features: interference detection for commonly confused words, optional deep learning mode with elaborative interrogation, and a comprehensive A/B testing framework to validate feature effectiveness.

**Key Focus:** Enhance retention through targeted interventions while maintaining Apple-level UX simplicity.

---

## ════════════════════════════════════════════════════════════════════════════════
## PHASE 18.2: ADVANCED LEARNING FEATURES
## ════════════════════════════════════════════════════════════════════════════════

### **Overview**

This phase implements medium-evidence features that target specific learning challenges (word confusion, shallow processing) and establishes measurement infrastructure to validate all feature decisions with actual user data.

**Core Principle:** Every feature must prove its value through measurable retention improvements.

---

## 📋 **Task 18.2.1: Interference Detection System**

**Duration:** 5-6 days  
**Priority:** High  
**Effort:** High

### **Objective**

Automatically detect when users confuse similar words (e.g., "pero" vs "perro", "banco" meaning "bank" vs "bench") and create targeted comparative review sessions to resolve confusion.

### **Science Background**

**Research:** Interference theory (Underwood, 1957; Postman & Underwood, 1973)
- Similar words compete for retrieval
- Confusion reduces retention by 40-60%
- Comparative learning resolves interference

**Common Spanish Confusions:**
- pero (but) ↔ perro (dog)
- banco (bank) ↔ banco (bench) - polysemy
- ser (to be) ↔ estar (to be) - usage difference
- saber (to know) ↔ conocer (to know) - context difference

### **Confusion Detection Algorithm**

**File:** `lib/services/interference-detection.ts` (NEW)

```typescript
/**
 * Interference Detection Service
 * Identifies confused word pairs and generates targeted remediation
 */

export interface ConfusionPattern {
  word1: string;
  word2: string;
  confusionScore: number; // 0-1, higher = more confused
  occurrences: number;
  lastOccurrence: Date;
  resolved: boolean;
}

/**
 * Detect confusion patterns from user review history
 */
export async function detectConfusionPatterns(
  userId: string
): Promise<ConfusionPattern[]> {
  // Get recent review attempts where user was wrong
  const wrongAttempts = await prisma.reviewAttempt.findMany({
    where: {
      userId,
      correct: false,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    },
    include: {
      word: true,
    },
  });
  
  const confusionMap = new Map<string, ConfusionPattern>();
  
  for (const attempt of wrongAttempts) {
    const userAnswer = attempt.userAnswer?.toLowerCase();
    if (!userAnswer) continue;
    
    // Find words similar to what user typed
    const similarWords = await findSimilarWords(userAnswer, attempt.word.spanish);
    
    for (const similar of similarWords) {
      const key = [attempt.word.spanish, similar.spanish].sort().join('::');
      
      if (!confusionMap.has(key)) {
        confusionMap.set(key, {
          word1: attempt.word.spanish,
          word2: similar.spanish,
          confusionScore: 0,
          occurrences: 0,
          lastOccurrence: attempt.createdAt,
          resolved: false,
        });
      }
      
      const pattern = confusionMap.get(key)!;
      pattern.occurrences++;
      pattern.lastOccurrence = attempt.createdAt;
      pattern.confusionScore = calculateConfusionScore(pattern.occurrences);
    }
  }
  
  return Array.from(confusionMap.values())
    .filter(p => p.confusionScore > 0.3) // Threshold
    .sort((a, b) => b.confusionScore - a.confusionScore);
}

/**
 * Find words similar by spelling (Levenshtein distance)
 */
async function findSimilarWords(
  input: string,
  target: string
): Promise<VocabularyWord[]> {
  // Get all user's words
  const allWords = await getUserWords(userId);
  
  return allWords.filter(word => {
    const distance = levenshteinDistance(input, word.spanish);
    const similarity = 1 - (distance / Math.max(input.length, word.spanish.length));
    return similarity > 0.7; // 70% similar
  });
}

function calculateConfusionScore(occurrences: number): number {
  // More occurrences = higher confusion
  return Math.min(occurrences / 5, 1.0);
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}
```

### **Comparative Review Component**

**File:** `components/features/comparative-review.tsx` (NEW)

```typescript
/**
 * Comparative Review
 * Side-by-side comparison of confused words
 */

interface ComparativeReviewProps {
  word1: VocabularyWord;
  word2: VocabularyWord;
  onComplete: () => void;
}

export function ComparativeReview({
  word1,
  word2,
  onComplete,
}: ComparativeReviewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-sm font-medium text-yellow-600 uppercase">
          ⚠️ Commonly Confused
        </span>
        <h2 className="text-2xl font-semibold">
          Let's clarify these words
        </h2>
      </div>
      
      {/* Side-by-Side Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Word 1 */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-4xl font-bold mb-3">{word1.spanish}</h3>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
            {word1.english}
          </p>
          
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Examples:
            </p>
            {word1.examples.slice(0, 2).map((ex, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium">{ex.spanish}</p>
                <p className="text-gray-500">{ex.english}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Word 2 */}
        <div className="bg-purple-50 dark:bg-purple-950 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
          <h3 className="text-4xl font-bold mb-3">{word2.spanish}</h3>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
            {word2.english}
          </p>
          
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Examples:
            </p>
            {word2.examples.slice(0, 2).map((ex, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium">{ex.spanish}</p>
                <p className="text-gray-500">{ex.english}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Key Differences */}
      <div className="bg-yellow-50 dark:bg-yellow-950 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Key Differences
        </h4>
        <ul className="space-y-2 text-sm">
          {generateKeyDifferences(word1, word2).map((diff, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>{diff}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Practice Quiz */}
      <ComparativeQuiz word1={word1} word2={word2} onComplete={onComplete} />
    </div>
  );
}

/**
 * Quiz component for confused words
 */
function ComparativeQuiz({
  word1,
  word2,
  onComplete,
}: {
  word1: VocabularyWord;
  word2: VocabularyWord;
  onComplete: () => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  const questions = [
    {
      sentence: word1.examples[0].spanish,
      correctWord: word1.spanish,
      options: [word1.spanish, word2.spanish],
    },
    {
      sentence: word2.examples[0].spanish,
      correctWord: word2.spanish,
      options: [word1.spanish, word2.spanish],
    },
    {
      prompt: word1.english,
      correctWord: word1.spanish,
      options: [word1.spanish, word2.spanish],
    },
    {
      prompt: word2.english,
      correctWord: word2.spanish,
      options: [word1.spanish, word2.spanish],
    },
  ];
  
  const handleAnswer = (selected: string) => {
    const correct = selected === questions[currentQuestion].correctWord;
    if (correct) setCorrectCount(prev => prev + 1);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Quiz complete
      const accuracy = correctCount / questions.length;
      recordComparativeReview(word1.id, word2.id, accuracy);
      onComplete();
    }
  };
  
  const question = questions[currentQuestion];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <span className="text-sm font-semibold text-green-600">
          {correctCount} correct
        </span>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border">
        {question.sentence ? (
          <div>
            <p className="text-lg mb-4">Which word fits?</p>
            <p className="text-xl font-medium">{question.sentence}</p>
          </div>
        ) : (
          <div>
            <p className="text-lg mb-4">Translate to Spanish:</p>
            <p className="text-xl font-medium">{question.prompt}</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {question.options.map(option => (
          <Button
            key={option}
            onClick={() => handleAnswer(option)}
            className="py-8 text-2xl"
            variant="outline"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}

function generateKeyDifferences(
  word1: VocabularyWord,
  word2: VocabularyWord
): string[] {
  const differences: string[] = [];
  
  // Spelling difference
  if (word1.spanish !== word2.spanish) {
    differences.push(
      `"${word1.spanish}" vs "${word2.spanish}" - Notice the spelling difference`
    );
  }
  
  // Meaning difference
  differences.push(
    `"${word1.spanish}" means "${word1.english}", while "${word2.spanish}" means "${word2.english}"`
  );
  
  // POS difference
  if (word1.partOfSpeech !== word2.partOfSpeech) {
    differences.push(
      `"${word1.spanish}" is a ${word1.partOfSpeech}, "${word2.spanish}" is a ${word2.partOfSpeech}`
    );
  }
  
  return differences;
}
```

### **Confusion Tracking in Database**

**File:** `lib/backend/prisma/schema.prisma` (UPDATE)

```prisma
model VocabularyWord {
  // ... existing fields
  
  // Confusion tracking
  confusionPartners   Json?     // ["perro", "pelo"] - words user confuses this with
  confusionScore      Float?    // 0-1, how often confused
  lastComparative     DateTime? // Last comparative review
}

model ConfusionPair {
  id                  String   @id @default(cuid())
  userId              String
  word1Id             String
  word2Id             String
  
  // Tracking
  confusionCount      Int      @default(1)
  lastConfusion       DateTime
  comparativeCount    Int      @default(0) // How many comparative reviews done
  lastComparative     DateTime?
  resolved            Boolean  @default(false)
  resolvedAt          DateTime?
  
  // Performance after intervention
  word1Accuracy       Float?   // Accuracy after comparative review
  word2Accuracy       Float?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, word1Id, word2Id])
  @@index([userId])
  @@index([resolved])
}
```

### **Insight Integration**

**File:** `lib/utils/insights.ts` (UPDATE)

```typescript
import { detectConfusionPatterns } from '@/lib/services/interference-detection';

export async function generateInsights(stats: UserStats): Promise<Insight[]> {
  const insights: Insight[] = [];
  
  // ... existing insights ...
  
  // NEW: Confusion detection insights
  const confusions = await detectConfusionPatterns(stats.userId);
  
  if (confusions.length > 0) {
    const topConfusion = confusions[0];
    
    insights.push({
      id: 'confusion-detected',
      type: 'tip',
      icon: '⚠️',
      title: `You often confuse "${topConfusion.word1}" and "${topConfusion.word2}"`,
      description: `Let's review these together to clear up the confusion.`,
      color: { from: 'yellow-500', to: 'orange-500' },
      action: {
        label: 'Review Together',
        href: `/review/comparative?word1=${topConfusion.word1}&word2=${topConfusion.word2}`,
      },
    });
  }
  
  return insights.slice(0, 3);
}
```

### **Comparative Review Page**

**File:** `app/(dashboard)/review/comparative/page.tsx` (NEW)

```typescript
import { ComparativeReview } from '@/components/features/comparative-review';

export default async function ComparativeReviewPage({
  searchParams,
}: {
  searchParams: { word1: string; word2: string };
}) {
  const word1 = await getWord(searchParams.word1);
  const word2 = await getWord(searchParams.word2);
  
  if (!word1 || !word2) {
    return <div>Words not found</div>;
  }
  
  const handleComplete = async () => {
    // Mark confusion as addressed
    await markConfusionAddressed(word1.id, word2.id, session.user.id);
    
    // Redirect to dashboard with success message
    router.push('/?message=confusion-resolved');
  };
  
  return (
    <div className="container max-w-5xl mx-auto p-6">
      <ComparativeReview
        word1={word1}
        word2={word2}
        onComplete={handleComplete}
      />
    </div>
  );
}
```

### **Acceptance Criteria**

- [ ] Algorithm detects confused word pairs (>70% spelling similarity)
- [ ] Confusion score calculated from error frequency
- [ ] Comparative review UI shows side-by-side comparison
- [ ] 4-question quiz validates understanding
- [ ] Insights surface confusion patterns automatically
- [ ] Database tracks confusion pairs and resolution
- [ ] Post-comparative performance measured
- [ ] Apple-quality design (not overwhelming)

---

## 📋 **Task 18.2.2: Deep Learning Mode (Elaborative Interrogation)**

**Duration:** 4-5 days  
**Priority:** Medium  
**Effort:** Medium

### **Objective**

Implement optional "Deep Learning Mode" that presents elaborative interrogation prompts (1 per 10-15 cards) to encourage deeper processing and create richer memory traces.

### **Science Background**

**Research:** Pressley et al. (1988), Woloshyn et al. (1992)
- Elaborative interrogation: Asking "why/how" questions
- Effect size: d = 0.71 (medium-large)
- Works by connecting new info to existing knowledge

**Example:**
- Traditional: "biblioteca" = "library"
- Elaborative: "Why do you think 'biblioteca' sounds similar to 'library' in English?"

### **Deep Learning Service**

**File:** `lib/services/deep-learning.ts` (NEW)

```typescript
/**
 * Deep Learning Service
 * Generates elaborative interrogation prompts
 */

export interface ElaborativePrompt {
  type: 'etymology' | 'connection' | 'usage' | 'comparison';
  question: string;
  hints?: string[];
  idealAnswer?: string;
}

/**
 * Generate elaborative prompt for word
 */
export async function generateElaborativePrompt(
  word: VocabularyWord
): Promise<ElaborativePrompt> {
  // Check cache first
  const cached = await getCachedPrompt(word.spanish);
  if (cached) return cached;
  
  // Generate with AI
  const prompt = await generateWithAI(word);
  
  // Cache for future users
  await cachePrompt(word.spanish, prompt);
  
  return prompt;
}

async function generateWithAI(word: VocabularyWord): Promise<ElaborativePrompt> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a Spanish teacher using elaborative interrogation to help students build deeper understanding of vocabulary.',
      },
      {
        role: 'user',
        content: `Generate an elaborative interrogation question for the Spanish word "${word.spanish}" (meaning: "${word.english}").

The question should:
1. Ask "why" or "how" the word relates to what the student already knows
2. Be simple and answerable without research
3. Encourage making connections
4. Be engaging, not academic

Examples:
- "Why do you think 'biblioteca' sounds similar to the English word 'library'?"
- "How might you remember that 'perro' means 'dog'?"
- "Why might 'banco' mean both 'bank' and 'bench' in Spanish?"

Generate question now:`,
      },
    ],
    temperature: 0.8,
    max_tokens: 150,
  });
  
  const question = response.choices[0].message.content?.trim() || '';
  
  // Determine type from question content
  const type = question.toLowerCase().includes('similar') ? 'etymology' :
               question.toLowerCase().includes('remember') ? 'connection' :
               question.toLowerCase().includes('use') ? 'usage' : 'comparison';
  
  return {
    type,
    question,
    hints: [], // Could add hints if needed
  };
}
```

### **Deep Learning Component**

**File:** `components/features/deep-learning-card.tsx` (NEW)

```typescript
/**
 * Deep Learning Card
 * Appears every 10-15 cards in review session
 * Completely optional - can skip
 */

interface DeepLearningCardProps {
  word: VocabularyWord;
  prompt: ElaborativePrompt;
  onComplete: (skipped: boolean, response?: string) => void;
}

export function DeepLearningCard({
  word,
  prompt,
  onComplete,
}: DeepLearningCardProps) {
  const [response, setResponse] = useState('');
  const [timer, setTimer] = useState(3);
  
  // Auto-skip after 3 seconds if user doesn't interact
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          onComplete(true); // Auto-skip
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleInteraction = () => {
    setTimer(999); // Stop auto-skip timer
  };
  
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-sm font-medium text-purple-600 uppercase">
          🤔 Deep Learning Moment
        </span>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Take a moment to think deeper
        </h2>
      </div>
      
      {/* Word Context */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-2xl p-8 text-center">
        <h3 className="text-5xl font-bold mb-3">{word.spanish}</h3>
        <p className="text-2xl text-gray-700 dark:text-gray-300">{word.english}</p>
      </div>
      
      {/* Elaborative Question */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
        <p className="text-lg leading-relaxed">
          {prompt.question}
        </p>
      </div>
      
      {/* Optional Response */}
      <div className="space-y-3">
        <textarea
          value={response}
          onChange={(e) => {
            setResponse(e.target.value);
            handleInteraction();
          }}
          onClick={handleInteraction}
          placeholder="Your thoughts... (optional)"
          className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-700 min-h-[100px] text-base resize-none focus:ring-2 focus:ring-purple-500"
        />
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onComplete(true)}
            className="flex-1"
          >
            Skip {timer < 999 && `(${timer}s)`}
          </Button>
          <Button
            onClick={() => onComplete(false, response)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
          >
            Continue
          </Button>
        </div>
      </div>
      
      {/* Hint */}
      <p className="text-xs text-center text-gray-500">
        Taking time to think deeper helps you remember longer
      </p>
    </motion.div>
  );
}
```

### **Settings Toggle**

**File:** `app/(dashboard)/settings/page.tsx` (UPDATE)

```typescript
<SettingsCard title="Review Settings">
  <SettingsRow
    label="Deep Learning Mode"
    description="Add occasional 'why/how' questions to deepen understanding (1 per 10-15 cards)"
    action={
      <ToggleSwitch
        checked={settings.deepLearningMode}
        onChange={updateSetting('deepLearningMode')}
      />
    }
  />
  
  {settings.deepLearningMode && (
    <SettingsRow
      label="Frequency"
      description="How often to show deep learning prompts"
      action={
        <Select
          value={settings.deepLearningFrequency}
          onChange={updateSetting('deepLearningFrequency')}
        >
          <option value={10}>Every 10 cards</option>
          <option value={12}>Every 12 cards</option>
          <option value={15}>Every 15 cards</option>
          <option value={20}>Every 20 cards</option>
        </Select>
      }
    />
  )}
</SettingsCard>
```

### **Integration with Review Flow**

**File:** `app/(dashboard)/review/page.tsx` (UPDATE)

```typescript
const [cardsReviewed, setCardsReviewed] = useState(0);
const [showDeepLearning, setShowDeepLearning] = useState(false);

const handleReviewComplete = async (result: AnswerResult) => {
  // ... existing logic ...
  
  setCardsReviewed(prev => prev + 1);
  
  // Check if should show deep learning prompt
  if (
    user.deepLearningMode &&
    cardsReviewed > 0 &&
    cardsReviewed % user.deepLearningFrequency === 0
  ) {
    const prompt = await generateElaborativePrompt(currentWord);
    setShowDeepLearning(true);
    setElaborativePrompt(prompt);
  } else {
    loadNextWord();
  }
};

// Render deep learning card
if (showDeepLearning) {
  return (
    <DeepLearningCard
      word={currentWord}
      prompt={elaborativePrompt}
      onComplete={(skipped, response) => {
        recordElaborativeResponse(currentWord.id, skipped, response);
        setShowDeepLearning(false);
        loadNextWord();
      }}
    />
  );
}
```

### **Acceptance Criteria**

- [ ] Deep learning mode is OFF by default
- [ ] Can be enabled in Settings with frequency selection
- [ ] Prompts appear every 10-15 cards (configurable)
- [ ] Auto-skip after 3 seconds (no interruption if user busy)
- [ ] Response is optional (can submit blank)
- [ ] Prompts are cached and reused across users
- [ ] Database tracks elaborative responses
- [ ] UI is calming and inviting (not stressful)

---

## 📋 **Task 18.2.3: Feature Validation A/B Testing Framework**

**Duration:** 4-5 days  
**Priority:** Critical (business validation)  
**Effort:** High

### **Objective**

Build comprehensive A/B testing infrastructure to randomly assign users to feature groups and measure retention/learning outcome differences.

### **A/B Test Configuration**

**File:** `lib/config/ab-tests.ts` (NEW)

```typescript
/**
 * A/B Test Definitions
 * Define all active experiments
 */

export interface ABTest {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  groups: ABTestGroup[];
  metrics: string[];      // Which metrics to track
  active: boolean;
}

export interface ABTestGroup {
  id: string;
  name: string;
  allocation: number;     // % of users (0-1)
  features: FeatureFlags;
}

export interface FeatureFlags {
  aiExamples: boolean;
  retrievalVariation: boolean;
  interleavedPractice: boolean;
  interferenceDetection: boolean;
  deepLearningMode: boolean;
}

/**
 * Active A/B Tests
 */
export const ACTIVE_AB_TESTS: ABTest[] = [
  {
    id: 'ai-examples-validation',
    name: 'AI-Generated Examples Validation',
    description: 'Test if AI-generated examples improve retention vs. no examples',
    startDate: new Date('2026-02-07'),
    endDate: new Date('2026-05-07'), // 90 days
    groups: [
      {
        id: 'control',
        name: 'Control (No AI Examples)',
        allocation: 0.5,
        features: {
          aiExamples: false,
          retrievalVariation: false,
          interleavedPractice: false,
          interferenceDetection: false,
          deepLearningMode: false,
        },
      },
      {
        id: 'treatment',
        name: 'Treatment (AI Examples)',
        allocation: 0.5,
        features: {
          aiExamples: true,
          retrievalVariation: false,
          interleavedPractice: false,
          interferenceDetection: false,
          deepLearningMode: false,
        },
      },
    ],
    metrics: ['day7Retention', 'day30Retention', 'avgAccuracy', 'wordsAdded'],
    active: true,
  },
  {
    id: 'retrieval-variation-validation',
    name: 'Retrieval Variation Validation',
    description: 'Test if retrieval variation improves retention',
    startDate: new Date('2026-03-01'),
    groups: [
      {
        id: 'control',
        name: 'Control (Traditional Only)',
        allocation: 0.5,
        features: {
          aiExamples: true,
          retrievalVariation: false, // Only traditional method
          interleavedPractice: true,
          interferenceDetection: false,
          deepLearningMode: false,
        },
      },
      {
        id: 'treatment',
        name: 'Treatment (5 Methods)',
        allocation: 0.5,
        features: {
          aiExamples: true,
          retrievalVariation: true, // All 5 methods
          interleavedPractice: true,
          interferenceDetection: false,
          deepLearningMode: false,
        },
      },
    ],
    metrics: ['day30Retention', 'day90Retention', 'avgAccuracy'],
    active: false, // Start after AI examples test
  },
];
```

### **User Assignment Service**

**File:** `lib/services/ab-test-assignment.ts` (NEW)

```typescript
/**
 * A/B Test Assignment Service
 * Assigns users to experiment groups on signup
 */

export async function assignUserToExperiments(
  userId: string
): Promise<void> {
  const activeTests = ACTIVE_AB_TESTS.filter(t => t.active);
  
  for (const test of activeTests) {
    const group = selectGroup(test.groups);
    
    // Update user cohort
    await prisma.userCohort.update({
      where: { userId },
      data: {
        experimentGroup: group.id,
        featureFlags: group.features,
      },
    });
    
    console.log(`[A/B Test] User ${userId} assigned to ${test.id}:${group.id}`);
  }
}

function selectGroup(groups: ABTestGroup[]): ABTestGroup {
  const random = Math.random();
  let cumulative = 0;
  
  for (const group of groups) {
    cumulative += group.allocation;
    if (random < cumulative) {
      return group;
    }
  }
  
  return groups[0]; // Fallback
}

/**
 * Get feature flags for user
 */
export async function getUserFeatureFlags(
  userId: string
): Promise<FeatureFlags> {
  const cohort = await prisma.userCohort.findUnique({
    where: { userId },
    select: { featureFlags: true },
  });
  
  return (cohort?.featureFlags as FeatureFlags) || DEFAULT_FEATURES;
}

const DEFAULT_FEATURES: FeatureFlags = {
  aiExamples: true,
  retrievalVariation: true,
  interleavedPractice: true,
  interferenceDetection: true,
  deepLearningMode: false, // Opt-in
};
```

### **Feature Gating**

**File:** `lib/hooks/use-feature-flags.ts` (NEW)

```typescript
/**
 * Hook to check if feature is enabled for user
 */

export function useFeatureFlags() {
  const { data: session } = useSession();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURES);
  
  useEffect(() => {
    if (!session?.user?.id) return;
    
    fetch(`/api/user/feature-flags`)
      .then(res => res.json())
      .then(data => setFlags(data.flags));
  }, [session]);
  
  return {
    flags,
    hasFeature: (feature: keyof FeatureFlags) => flags[feature],
  };
}

// Usage in components
export function ReviewPage() {
  const { hasFeature } = useFeatureFlags();
  
  const selectMethod = () => {
    if (hasFeature('retrievalVariation')) {
      return selectReviewMethod(word.id, user.id); // All 5 methods
    } else {
      return REVIEW_METHODS[0]; // Traditional only
    }
  };
}
```

### **Analysis Dashboard**

**File:** `app/(dashboard)/admin/ab-tests/page.tsx` (NEW)

```typescript
/**
 * A/B Test Results Dashboard
 * Shows retention comparison between groups
 */

export default async function ABTestDashboard() {
  const tests = ACTIVE_AB_TESTS;
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">A/B Test Results</h1>
      
      {tests.map(test => (
        <ABTestCard key={test.id} test={test} />
      ))}
    </div>
  );
}

function ABTestCard({ test }: { test: ABTest }) {
  const results = useABTestResults(test.id);
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border">
      <h2 className="text-2xl font-semibold mb-2">{test.name}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{test.description}</p>
      
      {/* Results Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Group</th>
            <th className="text-right py-2">Users</th>
            <th className="text-right py-2">Day 7</th>
            <th className="text-right py-2">Day 30</th>
            <th className="text-right py-2">Accuracy</th>
            <th className="text-right py-2">Lift</th>
          </tr>
        </thead>
        <tbody>
          {test.groups.map(group => {
            const data = results[group.id];
            return (
              <tr key={group.id} className="border-b">
                <td className="py-3">{group.name}</td>
                <td className="text-right">{data.userCount}</td>
                <td className="text-right">{data.day7Retention}%</td>
                <td className="text-right">{data.day30Retention}%</td>
                <td className="text-right">{data.avgAccuracy}%</td>
                <td className="text-right">
                  <span className={data.lift > 0 ? 'text-green-600' : 'text-red-600'}>
                    {data.lift > 0 ? '+' : ''}{data.lift}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Statistical Significance */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold">Statistical Significance:</span>{' '}
          {results.pValue < 0.05 ? (
            <span className="text-green-600">✓ Significant (p={results.pValue.toFixed(3)})</span>
          ) : (
            <span className="text-gray-500">○ Not significant (p={results.pValue.toFixed(3)})</span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Minimum 200 users per group and 30 days needed for reliable results
        </p>
      </div>
    </div>
  );
}
```

### **API Endpoint**

**File:** `app/api/analytics/ab-test-results/route.ts` (NEW)

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const testId = request.nextUrl.searchParams.get('testId');
  const test = ACTIVE_AB_TESTS.find(t => t.id === testId);
  
  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }
  
  // Calculate results for each group
  const results = {};
  
  for (const group of test.groups) {
    const cohorts = await prisma.userCohort.findMany({
      where: {
        experimentGroup: group.id,
        signupDate: { gte: test.startDate },
      },
    });
    
    const totalUsers = cohorts.length;
    const day7Active = cohorts.filter(c => c.day7Active).length;
    const day30Active = cohorts.filter(c => c.day30Active).length;
    const avgAccuracy = cohorts.reduce((sum, c) => sum + (c.avgAccuracy || 0), 0) / totalUsers;
    
    results[group.id] = {
      userCount: totalUsers,
      day7Retention: (day7Active / totalUsers) * 100,
      day30Retention: (day30Active / totalUsers) * 100,
      avgAccuracy: avgAccuracy * 100,
      lift: 0, // Calculated below
    };
  }
  
  // Calculate lift (treatment vs control)
  if (results['control'] && results['treatment']) {
    results['treatment'].lift = results['treatment'].day30Retention - results['control'].day30Retention;
  }
  
  // Calculate statistical significance (chi-square test)
  const pValue = calculatePValue(results['control'], results['treatment']);
  
  return NextResponse.json({
    test: {
      id: test.id,
      name: test.name,
      startDate: test.startDate,
    },
    results,
    pValue,
    significant: pValue < 0.05,
  });
}
```

### **Acceptance Criteria**

- [ ] Users randomly assigned to control/treatment on signup
- [ ] Feature flags control which features user sees
- [ ] Assignment is stable (user stays in same group)
- [ ] Admin dashboard shows results in real-time
- [ ] Statistical significance calculated (chi-square test)
- [ ] Minimum sample size enforced (200 users per group)
- [ ] Results exportable for analysis
- [ ] Can run multiple experiments simultaneously

---

## 📋 **Task 18.2.4: Admin Analytics Dashboard**

**Duration:** 3-4 days  
**Priority:** Medium  
**Effort:** Medium

### **Objective**

Build comprehensive admin dashboard to monitor retention, feature performance, costs, and A/B test results.

### **Dashboard Layout**

**File:** `app/(dashboard)/admin/page.tsx` (NEW)

```typescript
/**
 * Admin Analytics Dashboard
 * Restricted to admin users only
 */

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    redirect('/');
  }
  
  const stats = await getAdminStats();
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <span className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </span>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          trend={stats.userGrowth}
          icon={Users}
        />
        <StatCard
          title="Premium Users"
          value={stats.premiumUsers}
          subtitle={`${stats.conversionRate}% conversion`}
          icon={Crown}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toFixed(0)}`}
          trend={stats.revenueGrowth}
          icon={DollarSign}
        />
        <StatCard
          title="API Costs"
          value={`$${stats.monthlyCosts.toFixed(0)}`}
          subtitle={`${stats.profitMargin}% margin`}
          icon={TrendingDown}
        />
      </div>
      
      {/* Retention Cohorts */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border">
        <h2 className="text-xl font-semibold mb-4">Retention Cohorts (Last 30 Days)</h2>
        <RetentionChart data={stats.retentionCohorts} />
      </div>
      
      {/* A/B Test Results */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border">
        <h2 className="text-xl font-semibold mb-4">Active A/B Tests</h2>
        <ABTestResultsTable tests={ACTIVE_AB_TESTS.filter(t => t.active)} />
      </div>
      
      {/* Feature Usage */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border">
        <h2 className="text-xl font-semibold mb-4">Feature Usage</h2>
        <FeatureUsageChart data={stats.featureUsage} />
      </div>
      
      {/* Cost Breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border">
        <h2 className="text-xl font-semibold mb-4">Cost Breakdown (Monthly)</h2>
        <CostBreakdownChart data={stats.costBreakdown} />
      </div>
    </div>
  );
}
```

### **Retention Chart Component**

**File:** `components/admin/retention-chart.tsx` (NEW)

```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function RetentionChart({ data }: { data: CohortAnalysis[] }) {
  const chartData = data.map(cohort => ({
    date: cohort.cohortDate,
    'Day 1': cohort.retention.day1,
    'Day 7': cohort.retention.day7,
    'Day 30': cohort.retention.day30,
    'Day 90': cohort.retention.day90,
  }));
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <XAxis dataKey="date" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="Day 1" stroke="#3B82F6" strokeWidth={2} />
        <Line type="monotone" dataKey="Day 7" stroke="#8B5CF6" strokeWidth={2} />
        <Line type="monotone" dataKey="Day 30" stroke="#10B981" strokeWidth={2} />
        <Line type="monotone" dataKey="Day 90" stroke="#F59E0B" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### **Admin API Endpoints**

**File:** `app/api/admin/stats/route.ts` (NEW)

```typescript
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const stats = {
    // User stats
    totalUsers: await prisma.user.count(),
    premiumUsers: await prisma.user.count({ where: { isPremium: true } }),
    activeToday: await getActiveUsersToday(),
    
    // Revenue
    monthlyRevenue: await calculateMonthlyRevenue(),
    conversionRate: await calculateConversionRate(),
    
    // Costs
    monthlyCosts: await getMonthlyAICost() + await getDatabaseCosts(),
    profitMargin: calculateProfitMargin(),
    
    // Retention
    retentionCohorts: await getRetentionCohorts(30),
    
    // Features
    featureUsage: await getFeatureUsageStats(),
    
    // Costs breakdown
    costBreakdown: await getCostBreakdown(),
  };
  
  return NextResponse.json(stats);
}
```

### **Acceptance Criteria**

- [ ] Admin dashboard accessible only to admin users
- [ ] Real-time retention metrics displayed
- [ ] A/B test results with statistical significance
- [ ] Cost breakdown by service (OpenAI, database, etc.)
- [ ] Feature usage analytics
- [ ] Export capability (CSV/JSON)
- [ ] Auto-refresh every 5 minutes
- [ ] Mobile-responsive design

---

## 🎯 **Phase 18.2 Success Criteria**

### **Features Delivered**
- [x] Interference detection with comparative reviews
- [x] Deep learning mode (elaborative interrogation)
- [x] Feature validation A/B testing framework
- [x] Admin analytics dashboard

### **Learning Effectiveness**
- [ ] Confused word pairs identified automatically
- [ ] Comparative reviews improve accuracy by 15%+
- [ ] Deep learning mode users show 10%+ better long-term retention
- [ ] A/B tests provide data-driven feature validation

### **Business Intelligence**
- [ ] Can prove 20%+ retention improvement (for marketing)
- [ ] Cost per user tracked and optimized
- [ ] Feature ROI measured
- [ ] Decision-making is data-driven

---

## 📅 **Phase 18.2 Timeline**

**Week 1:**
- Days 1-3: Task 18.2.1 (Interference detection)
- Days 4-5: Task 18.2.2 (Deep learning - start)

**Week 2:**
- Days 1-2: Task 18.2.2 (Deep learning - complete)
- Days 3-5: Task 18.2.3 (A/B testing framework)

**Week 3:**
- Days 1-2: Task 18.2.4 (Admin dashboard)
- Days 3-4: Integration testing
- Day 5: Documentation

**Week 4 (Buffer):**
- Polish and refinements
- Collect initial A/B test data
- Prepare for Phase 18.3

**Total: 3-4 weeks**

---

## 🚀 **Phase 18.2 Deliverables**

### **Code**
- [ ] Interference detection service (~500 lines)
- [ ] Deep learning mode (~600 lines)
- [ ] A/B testing framework (~800 lines)
- [ ] Admin dashboard (~1,200 lines)
- [ ] 20+ tests

### **Data Infrastructure**
- [ ] ConfusionPair tracking
- [ ] Elaborative response storage
- [ ] Experiment group assignments
- [ ] Feature flag management

### **Business Value**
- [ ] Retention proof capability (marketing asset)
- [ ] Cost optimization data
- [ ] Feature validation pipeline
- [ ] Competitive intelligence (what works, what doesn't)

---

## 🔗 **Next Steps**

Upon completion of Phase 18.2:
1. ✅ Deploy to production
2. ✅ Start 90-day A/B test (AI examples validation)
3. ✅ Monitor daily for data quality
4. ✅ Begin building retention proof case study
5. → Begin Phase 18.3 (Launch Preparation)

---

**Phase 18.2 adds the intelligence layer that makes Palabra truly adaptive, learning from each user to provide targeted interventions and measurable improvements.**

**See [PHASE18.3_PLAN.md](PHASE18.3_PLAN.md) for app store launch preparation.**
