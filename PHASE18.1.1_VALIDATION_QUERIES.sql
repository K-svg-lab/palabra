/**
 * Phase 18.1.1 Database Validation Queries
 * 
 * Run these queries in Neon SQL Editor to verify proficiency tracking fields
 * Date: February 8, 2026
 */

-- ============================================================================
-- Query 1: Check ALL User table columns
-- ============================================================================
-- This shows every column in the User table with data type and nullable status

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'User'
  AND table_schema = 'public'
ORDER BY ordinal_position;


-- ============================================================================
-- Query 2: Verify Phase 18.1 Proficiency Fields (Specific)
-- ============================================================================
-- This checks ONLY the 9 new proficiency fields we added

SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_default IS NOT NULL THEN column_default
    ELSE 'NULL'
  END as default_value
FROM information_schema.columns
WHERE table_name = 'User'
  AND table_schema = 'public'
  AND column_name IN (
    'languageLevel',
    'nativeLanguage',
    'targetLanguage',
    'assessedLevel',
    'levelAssessedAt',
    'levelConfidence',
    'dailyGoal',
    'sessionLength',
    'preferredTime'
  )
ORDER BY column_name;

-- Expected Results:
-- ┌─────────────────┬───────────┬─────────────┬───────────────┐
-- │ column_name     │ data_type │ is_nullable │ default_value │
-- ├─────────────────┼───────────┼─────────────┼───────────────┤
-- │ assessedLevel   │ text      │ YES         │ NULL          │
-- │ dailyGoal       │ integer   │ YES         │ NULL          │
-- │ languageLevel   │ text      │ YES         │ NULL          │
-- │ levelAssessedAt │ timestamp │ YES         │ NULL          │
-- │ levelConfidence │ double    │ YES         │ NULL          │
-- │ nativeLanguage  │ text      │ YES         │ NULL          │
-- │ preferredTime   │ text      │ YES         │ NULL          │
-- │ sessionLength   │ integer   │ YES         │ 15            │
-- │ targetLanguage  │ text      │ YES         │ NULL          │
-- └─────────────────┴───────────┴─────────────┴───────────────┘


-- ============================================================================
-- Query 3: Check User Data (Test Users)
-- ============================================================================
-- View actual proficiency data for existing users

SELECT 
  id,
  name,
  email,
  languageLevel,
  nativeLanguage,
  targetLanguage,
  dailyGoal,
  sessionLength,
  assessedLevel,
  levelConfidence,
  levelAssessedAt,
  createdAt
FROM "User"
ORDER BY createdAt DESC
LIMIT 10;

-- This should show:
-- - tester7@gmail.com with NULL proficiency (for testing onboarding)
-- - kalvin's account with proficiency data (if completed onboarding)


-- ============================================================================
-- Query 4: Count Users by Proficiency Level
-- ============================================================================
-- Statistics: How many users at each CEFR level?

SELECT 
  languageLevel,
  COUNT(*) as user_count,
  AVG(dailyGoal) as avg_daily_goal
FROM "User"
WHERE languageLevel IS NOT NULL
GROUP BY languageLevel
ORDER BY 
  CASE languageLevel
    WHEN 'A1' THEN 1
    WHEN 'A2' THEN 2
    WHEN 'B1' THEN 3
    WHEN 'B2' THEN 4
    WHEN 'C1' THEN 5
    WHEN 'C2' THEN 6
  END;


-- ============================================================================
-- Query 5: Users Needing Proficiency Onboarding
-- ============================================================================
-- Find users who haven't set their language level yet

SELECT 
  id,
  name,
  email,
  languageLevel,
  createdAt
FROM "User"
WHERE languageLevel IS NULL
ORDER BY createdAt DESC;

-- These users should see the proficiency onboarding modal


-- ============================================================================
-- Query 6: Full Schema Verification
-- ============================================================================
-- Get complete User table structure with constraints

SELECT
  a.attname as column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
  a.attnotnull as not_null,
  COALESCE(pg_get_expr(ad.adbin, ad.adrelid), '') as default_value
FROM pg_attribute a
LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
WHERE a.attrelid = '"User"'::regclass
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;


-- ============================================================================
-- Query 7: Test Data Validation (Your Account)
-- ============================================================================
-- Check Kalvin's proficiency data specifically

SELECT 
  name,
  email,
  languageLevel,
  nativeLanguage,
  targetLanguage,
  dailyGoal,
  CASE 
    WHEN assessedLevel IS NOT NULL THEN assessedLevel || ' (confidence: ' || ROUND(levelConfidence::numeric, 2) || ')'
    ELSE 'Not assessed yet'
  END as assessment_info,
  createdAt,
  updatedAt
FROM "User"
WHERE email = 'kbrookes2507@gmail.com'
   OR email = 'tester7@gmail.com';


-- ============================================================================
-- VERIFICATION CHECKLIST
-- ============================================================================
-- 
-- ✅ Query 1 should show 40+ columns (existing + 9 new)
-- ✅ Query 2 should return exactly 9 rows (all proficiency fields)
-- ✅ Query 3 should show users with proficiency data
-- ✅ Query 4 should show distribution of language levels (may be empty if no users set)
-- ✅ Query 5 should show users needing onboarding
-- ✅ Query 6 confirms schema matches Prisma definition
-- ✅ Query 7 shows your specific proficiency data
-- 
-- If ANY query fails, the schema was NOT properly applied!
