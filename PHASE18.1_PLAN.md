# Phase 18.1: Foundation - Infrastructure & Core Features
**User Proficiency, Retention Metrics, AI Examples & Retrieval Variation**

**Created:** February 7, 2026  
**Status:** 📋 PLANNING  
**Priority:** 🔴 Critical Path  
**Estimated Duration:** 4-5 weeks  
**Dependencies:** Phase 16 (Verified Vocabulary Cache)

---

## 🎯 **Executive Summary**

Phase 18.1 establishes the technical foundation for intelligent flashcard features and implements 2-3 high-evidence learning methods. Focus on infrastructure that enables all future features while delivering immediate user value.

**Key Deliverables:**
- User proficiency tracking (A1-C2 CEFR)
- Comprehensive retention metrics infrastructure
- AI-generated contextual examples with caching
- 5 retrieval practice methods with intelligent selection
- Interleaved practice optimization
- Hybrid SM-2 integration with difficulty multipliers
- Pre-generation of 5,000 common Spanish words

**Expected Impact:**
- Foundation for 20%+ retention improvement
- 75-80% cost reduction through caching
- Zero perceived complexity for users
- Ready for Phase 18.2 advanced features

---

## ════════════════════════════════════════════════════════════════════════════════
## TASK BREAKDOWN
## ════════════════════════════════════════════════════════════════════════════════

## 📋 **Task 18.1.1: User Proficiency Tracking System**

**Duration:** 3-4 days  
**Priority:** Critical (blocks AI examples)  
**Effort:** Medium

### **Objective**

Implement CEFR-based proficiency tracking (A1-C2) to enable user-level appropriate AI content generation and personalized learning experiences.

### **Database Schema**

**File:** `lib/backend/prisma/schema.prisma`

```prisma
model User {
  // ... existing fields
  
  // Proficiency tracking
  languageLevel       String?   @default("B1") // A1, A2, B1, B2, C1, C2
  nativeLanguage      String?   @default("en")
  targetLanguage      String?   @default("es")
  assessedLevel       String?   // AI-assessed based on performance
  levelAssessedAt     DateTime?
  levelConfidence     Float?    // 0-1 confidence in assessment
  
  // Learning preferences
  dailyGoal           Int?      @default(10) // Words per day
  sessionLength       Int?      @default(15) // Minutes
  preferredTime       String?   // "morning", "afternoon", "evening"
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

### **Onboarding Flow**

**File:** `app/onboarding/page.tsx` (NEW)

**Screen 1: Welcome**
```typescript
<motion.div className="text-center">
  <h1 className="text-4xl font-bold mb-4">Welcome to Palabra! 🇪🇸</h1>
  <p className="text-lg text-gray-600 mb-8">
    Build your Spanish vocabulary with intelligent spaced repetition
    that adapts to how you learn.
  </p>
  <Button onClick={nextStep}>Get Started</Button>
</motion.div>
```

**Screen 2: Language Selection**
```typescript
<div className="space-y-4">
  <h2 className="text-2xl font-semibold">Choose your languages</h2>
  
  <Select value={nativeLanguage} onChange={setNativeLanguage}>
    <option value="en">🇬🇧 English</option>
    <option value="es">🇪🇸 Spanish</option>
  </Select>
  
  <Select value={targetLanguage} onChange={setTargetLanguage}>
    <option value="es">🇪🇸 Spanish</option>
    <option value="en">🇬🇧 English</option>
  </Select>
</div>
```

**Screen 3: Proficiency Level (Skippable)**
```typescript
<div className="space-y-6">
  <h2 className="text-2xl font-semibold">What's your Spanish level?</h2>
  
  <RadioGroup value={level} onChange={setLevel}>
    <Radio value="A1">
      <span className="font-semibold">Beginner (A1-A2)</span>
      <p className="text-sm text-gray-500">Just starting, know basic words</p>
    </Radio>
    
    <Radio value="B1" checked>
      <span className="font-semibold">Intermediate (B1-B2)</span>
      <p className="text-sm text-gray-500">Can hold conversations, building vocabulary</p>
    </Radio>
    
    <Radio value="C1">
      <span className="font-semibold">Advanced (C1-C2)</span>
      <p className="text-sm text-gray-500">Fluent, refining vocabulary</p>
    </Radio>
  </RadioGroup>
  
  <p className="text-sm text-gray-500 text-center">
    Don't know? We'll adjust as you learn. You can change this later.
  </p>
  
  <div className="flex gap-4">
    <Button variant="outline" onClick={() => skipWithDefault('B1')}>
      Skip
    </Button>
    <Button onClick={saveAndContinue}>Continue</Button>
  </div>
</div>
```

### **Adaptive Assessment**

**File:** `lib/services/proficiency-assessment.ts` (NEW)

```typescript
/**
 * Assesses user proficiency based on performance data
 * Runs after 20+ reviews to suggest level adjustments
 */

interface PerformanceData {
  reviewCount: number;
  avgAccuracy: number;
  avgResponseTime: number;
  masteredWords: number;
  strugglingWords: number;
}

export async function assessUserProficiency(
  userId: string
): Promise<{ 
  suggestedLevel: string;
  confidence: number;
  reason: string;
}> {
  const performance = await getUserPerformance(userId);
  
  // Not enough data yet
  if (performance.reviewCount < 20) {
    return {
      suggestedLevel: user.languageLevel || 'B1',
      confidence: 0.3,
      reason: 'Insufficient data for assessment'
    };
  }
  
  const currentLevel = user.languageLevel || 'B1';
  const levelIndex = CEFR_LEVELS.indexOf(currentLevel);
  
  // Excellent performance - suggest level up
  if (performance.avgAccuracy > 0.85 && performance.avgResponseTime < 3000) {
    const nextLevel = CEFR_LEVELS[Math.min(levelIndex + 1, 5)];
    return {
      suggestedLevel: nextLevel,
      confidence: 0.8,
      reason: `${(performance.avgAccuracy * 100).toFixed(0)}% accuracy suggests readiness for ${nextLevel}`
    };
  }
  
  // Struggling - suggest level down
  if (performance.avgAccuracy < 0.60 && performance.strugglingWords > 10) {
    const prevLevel = CEFR_LEVELS[Math.max(levelIndex - 1, 0)];
    return {
      suggestedLevel: prevLevel,
      confidence: 0.75,
      reason: `${(performance.avgAccuracy * 100).toFixed(0)}% accuracy suggests ${prevLevel} might be better`
    };
  }
  
  // Current level is appropriate
  return {
    suggestedLevel: currentLevel,
    confidence: 0.9,
    reason: 'Current level matches performance well'
  };
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
```

### **Insight Generation**

**File:** `lib/utils/insights.ts` (UPDATE)

```typescript
// Add proficiency-based insights
export function generateInsights(stats: UserStats): Insight[] {
  const insights: Insight[] = [];
  
  // ... existing insight logic ...
  
  // NEW: Proficiency assessment
  if (stats.reviewCount >= 20 && stats.lastAssessment > 30) {
    const assessment = await assessUserProficiency(stats.userId);
    
    if (assessment.suggestedLevel !== stats.currentLevel) {
      insights.push({
        id: 'level-adjustment',
        type: assessment.confidence > 0.7 ? 'milestone' : 'tip',
        icon: '📈',
        title: `Ready for ${assessment.suggestedLevel}?`,
        description: assessment.reason,
        action: {
          label: 'Update Level',
          onClick: () => updateUserLevel(assessment.suggestedLevel)
        }
      });
    }
  }
  
  return insights;
}
```

### **Acceptance Criteria**

- [ ] User can select proficiency during onboarding
- [ ] Skipping defaults to B1 (intermediate)
- [ ] Level can be changed in Settings
- [ ] Adaptive assessment suggests adjustments after 20+ reviews
- [ ] Insights show level-up suggestions when appropriate
- [ ] Database correctly stores and retrieves proficiency data

---

*[See complete Phase 18.1 plan in the full document - this file contains all 8 tasks with full technical specifications]*

---

## 🎯 **Phase 18.1 Success Criteria**

### **Features Delivered**
- [x] User proficiency tracking (A1-C2)
- [x] Retention metrics infrastructure
- [x] AI-generated contextual examples with caching
- [x] 5 retrieval practice methods
- [x] Interleaved practice optimization
- [x] Hybrid SM-2 with difficulty multipliers
- [x] Pre-generation of 5,000 common words
- [x] Comprehensive testing

### **Performance Targets**
- [ ] <50ms method selection
- [ ] <100ms cached example retrieval
- [ ] <$0.50 per user per month AI costs
- [ ] 75-80% of lookups served from cache

### **User Experience**
- [ ] Onboarding smooth (3 screens, skippable)
- [ ] Review methods feel natural and varied
- [ ] Zero perceived complexity
- [ ] Apple-quality animations (60fps)
- [ ] Mobile-optimized (all 5 methods work on touch)

### **Business**
- [ ] Cost tracking operational
- [ ] Retention measurement active
- [ ] Foundation for A/B testing ready
- [ ] Pre-generated content reduces API dependency

---

## 📅 **Phase 18.1 Timeline**

**Week 1:**
- Days 1-2: Task 18.1.1 (Proficiency tracking)
- Days 3-5: Task 18.1.2 (Retention metrics)

**Week 2:**
- Days 1-3: Task 18.1.3 (AI examples)
- Days 4-5: Task 18.1.4 (Retrieval methods - start)

**Week 3:**
- Days 1-2: Task 18.1.4 (Retrieval methods - complete)
- Days 3-4: Task 18.1.5 (Interleaving)
- Day 5: Task 18.1.6 (SM-2 integration)

**Week 4:**
- Days 1-3: Task 18.1.7 (Pre-generation)
- Days 4-5: Task 18.1.8 (Testing)

**Week 5 (Buffer):**
- Polish and bug fixes
- Documentation
- Prepare for 18.2

**Total: 4-5 weeks**

---

## 🚀 **Phase 18.1 Deliverables**

### **Code**
- [ ] 8 new service files (~2,500 lines)
- [ ] 5 new review method components (~1,000 lines)
- [ ] 4 database models added
- [ ] 3 API endpoints
- [ ] 30+ unit tests
- [ ] 5+ integration tests

### **Data**
- [ ] 5,000 common words pre-generated
- [ ] 15,000 example sentences cached (3 levels × 5,000)
- [ ] Verified vocabulary coverage: 80%+

### **Documentation**
- [ ] API documentation updated
- [ ] Service layer documented
- [ ] Testing guide
- [ ] Deployment runbook

---

## 🔗 **Next Steps**

Upon completion of Phase 18.1:
1. ✅ Deploy to staging environment
2. ✅ Run full test suite
3. ✅ Verify pre-generated cache coverage
4. ✅ Test on mobile devices (iOS/Android)
5. ✅ Collect baseline retention data (control group)
6. → Begin Phase 18.2 (Advanced Features)

---

**Phase 18.1 establishes the foundation for intelligent, evidence-based flashcard learning while maintaining cost efficiency through aggressive caching and pre-generation.**

**See [PHASE18.2_PLAN.md](PHASE18.2_PLAN.md) for advanced features and [PHASE18.3_PLAN.md](PHASE18.3_PLAN.md) for launch preparation.**

---

**NOTE:** This is a condensed version for overview. The complete task details with full code examples for all 8 tasks (18.1.1 through 18.1.8) can be found in the original Cursor plans file at `/.cursor/plans/phase_18_plan_c813ea05.plan.md`. Each task includes:
- Full database schema changes
- Complete service implementations
- React component code
- API endpoint specifications
- Testing protocols
- Acceptance criteria

For implementation, reference the full plan document which contains ~2,700 lines of detailed technical specifications.
