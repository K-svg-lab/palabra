# Pre-Generation Scripts - Quick Reference

**Phase 18.1.7**: AI Example Pre-Generation for Common Spanish Vocabulary

---

## 🚀 **Quick Start**

### **1. Test Run (Recommended First Step)**
```bash
# Generate examples for 10 words at A1 level only
npx tsx scripts/pre-generate-vocabulary.ts --limit 10 --levels A1
```
**Expected**: ~30 API calls, $0.01 cost, 2-3 minutes

### **2. Small Batch Run**
```bash
# Generate for top 100 words (all 3 levels)
npx tsx scripts/pre-generate-vocabulary.ts --limit 100
```
**Expected**: ~300 API calls, $0.09-$0.18 cost, 15-20 minutes

### **3. Full Pre-Generation**
```bash
# Generate for all 5,000 words (A1, B1, C1)
npx tsx scripts/pre-generate-vocabulary.ts
```
**Expected**: ~15,000 API calls, $4.50-$9.00 cost, 6-8 hours

### **4. Resume After Interruption**
```bash
# Continue from last saved checkpoint
npx tsx scripts/pre-generate-vocabulary.ts --resume
```

### **5. Check Coverage**
```bash
# Analyze cache coverage and performance
npx tsx scripts/verify-cache-coverage.ts
```

---

## 📋 **Command Options**

### **Pre-Generation Script**

| Option | Description | Example |
|--------|-------------|---------|
| `--limit N` | Process only first N words | `--limit 100` |
| `--levels A,B,C` | Specify CEFR levels | `--levels A1,B1` |
| `--resume` | Continue from last checkpoint | `--resume` |

**Examples**:
```bash
# Only A1 and B1 levels for first 500 words
npx tsx scripts/pre-generate-vocabulary.ts --limit 500 --levels A1,B1

# Resume with only C1 level
npx tsx scripts/pre-generate-vocabulary.ts --resume --levels C1
```

### **Coverage Script**

| Option | Description | Example |
|--------|-------------|---------|
| `--days N` | Analyze last N days of usage | `--days 7` |
| `--export FILE` | Export report to JSON file | `--export report.json` |

**Examples**:
```bash
# Analyze last week only
npx tsx scripts/verify-cache-coverage.ts --days 7

# Export detailed report
npx tsx scripts/verify-cache-coverage.ts --export coverage-$(date +%Y%m%d).json
```

---

## 🎯 **Recommended Workflow**

### **Day 1: Testing & Setup**
1. Run test with 10 words
2. Verify examples are cached
3. Check cost tracking
4. Expand word list to 5,000 words (if needed)

```bash
# Test
npx tsx scripts/pre-generate-vocabulary.ts --limit 10 --levels A1

# Check results
npx tsx scripts/verify-cache-coverage.ts
```

### **Day 2-3: Top 1,000 Words**
Process most common words first (highest ROI)

```bash
# High-frequency words
npx tsx scripts/pre-generate-vocabulary.ts --limit 1000

# Verify coverage
npx tsx scripts/verify-cache-coverage.ts
```

### **Day 4-6: Remaining 4,000 Words**
Complete the full list (can pause and resume)

```bash
# Resume from checkpoint
npx tsx scripts/pre-generate-vocabulary.ts --resume

# Check coverage periodically
npx tsx scripts/verify-cache-coverage.ts
```

### **Day 7: Final Validation**
```bash
# Full coverage analysis
npx tsx scripts/verify-cache-coverage.ts --days 30 --export final-report.json

# Review report
cat final-report.json | jq .
```

---

## 💰 **Cost Estimates**

| Words | API Calls | Estimated Cost | Duration |
|-------|-----------|----------------|----------|
| 10 | 30 | $0.01 | 2-3 min |
| 100 | 300 | $0.09-$0.18 | 15-20 min |
| 500 | 1,500 | $0.45-$0.90 | 1-1.5 hours |
| 1,000 | 3,000 | $0.90-$1.80 | 2-3 hours |
| 5,000 | 15,000 | $4.50-$9.00 | 6-8 hours |

**Budget limit**: $30 (script will auto-stop if exceeded)

---

## 🛡️ **Safety Features**

### **Automatic Protections**
- ✅ Budget checking before each batch
- ✅ Progress saved after every 50 words
- ✅ Graceful shutdown on Ctrl+C
- ✅ Auto-resume capability
- ✅ Cost tracking in database
- ✅ Rate limiting (2s delay between batches)

### **Manual Controls**
```bash
# Pause anytime with Ctrl+C
# Progress is automatically saved

# Resume later
npx tsx scripts/pre-generate-vocabulary.ts --resume
```

---

## 📊 **Understanding Output**

### **Pre-Generation Script Output**
```
📦 Batch 1/100 (Words 1-50)
═══════════════════════════════════════

✅ Batch completed in 45.2s
   Generated: 147     ← New examples created
   Cached: 3          ← Already in cache (skipped)
   Failed: 0          ← Errors (should be 0)
   Cost: $0.0441      ← This batch cost
   Progress: 50/5000  ← Overall progress
   Total cost: $0.04  ← Running total
   ETA: 1h 15m        ← Estimated completion
```

### **Coverage Report Output**
```
📈 Cache Coverage:
   Total words in list: 5000
   Cached words: 4235         ← Words with examples
   Coverage: 84.7%            ← Percentage cached

📊 Usage Statistics:
   Cache hits: 10,847 (86.5%) ← Served from cache
   Cache misses: 1,696        ← Required API call
   Estimated savings: $6.51   ← Money saved
```

---

## 🔍 **Troubleshooting**

### **Problem: Budget Exceeded**
```
❌ ERROR: Monthly budget limit reached
```
**Solution**: Wait until next month or increase budget in `ai-cost-control.ts`

### **Problem: Script Interrupted**
```
⚠️ Interrupted by user
```
**Solution**: Run with `--resume` flag to continue

### **Problem: OpenAI API Error**
```
Error: Rate limit exceeded
```
**Solution**: Script will auto-retry. If persistent, increase delay in script.

### **Problem: Database Connection Failed**
```
❌ Fatal error: Can't reach database
```
**Solution**: Check `DATABASE_URL` in `.env.local`

### **Problem: Progress File Missing**
```
Progress file not found
```
**Solution**: Don't use `--resume` flag if starting fresh

---

## 📁 **Files Reference**

| File | Purpose | Location |
|------|---------|----------|
| `common-words-5000.json` | Word list | `scripts/` |
| `pre-generate-vocabulary.ts` | Main script | `scripts/` |
| `verify-cache-coverage.ts` | Analysis tool | `scripts/` |
| `.pre-generation-progress.json` | Checkpoint data | `scripts/` (auto-created) |
| `PHASE18.1.7_IMPLEMENTATION.md` | Full documentation | Root |

---

## ✅ **Success Checklist**

After running pre-generation:

- [ ] Coverage report shows 80%+ cache coverage
- [ ] Total cost under $30
- [ ] All 3 levels (A1, B1, C1) have examples
- [ ] Cache hit rate improves to 85%+ after 1 week
- [ ] Response time for cached words <100ms
- [ ] No failed generations in final batch

---

## 🔗 **Related Documentation**

- **Full Implementation Guide**: `PHASE18.1.7_IMPLEMENTATION.md`
- **Phase 18 Roadmap**: `PHASE18_ROADMAP.md`
- **AI Example Generator**: `lib/services/ai-example-generator.ts`
- **Cost Control Service**: `lib/services/ai-cost-control.ts`

---

## 💡 **Tips**

1. **Start small**: Always test with `--limit 10` first
2. **Monitor costs**: Check coverage report after every 500 words
3. **Use resume**: Don't try to do all 5,000 in one sitting
4. **Prime time**: Run during off-peak hours (lower latency)
5. **Backup**: Export coverage reports regularly for tracking

---

**Questions?** See `PHASE18.1.7_IMPLEMENTATION.md` for comprehensive documentation.

**Created**: February 9, 2026  
**Phase**: 18.1.7 - Pre-Generation Strategy
