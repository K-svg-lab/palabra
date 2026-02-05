# Localhost:3000 Hang - Debug Guide

**Date**: February 5, 2026  
**Status**: 🔴 UNRESOLVED - Pre-existing issue (not caused by Phase 16)  
**Severity**: High - Blocks local development and testing

---

## 🎯 **Problem Summary**

**Symptom**: Both `npm run dev` and `npm run build` hang indefinitely at "Compiling / ..." or "Creating an optimized production build..."

**Key Finding**: This issue existed BEFORE Phase 16 database integration (verified by rolling back to commit `acc4462`).

---

## 📊 **Evidence & Timeline**

### **Test 1: Current State (With Phase 16)**
```bash
# Commit: 972e256 and later
npm run dev
# Result: Hangs at "○ Compiling / ..."
# Duration: 65+ seconds, never completes
```

### **Test 2: Rollback (Before Phase 16)**
```bash
git checkout acc4462  # Before database integration
npm run dev
# Result: STILL HANGS at "○ Compiling / ..."
# Duration: 30+ seconds, never completes
```

**Conclusion**: Phase 16 is NOT the cause. This is a pre-existing Next.js Turbopack issue.

---

## 🔍 **Technical Details**

### **Environment**
- **OS**: macOS (darwin 23.2.0)
- **Next.js**: 16.1.1 (Turbopack enabled)
- **Node**: (check with `node -v`)
- **npm**: (check with `npm -v`)
- **Project Path**: Contains spaces (Google Drive path)

### **Hang Point**
```
▲ Next.js 16.1.1 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.10.37:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 1241ms
○ Compiling / ...  <--- HANGS HERE FOREVER
```

### **What's Affected**
- ✅ `npm install` - Works fine
- ✅ `prisma generate` - Works fine
- ❌ `npm run dev` - Hangs at page compilation
- ❌ `npm run build` - Hangs at "Creating an optimized production build"
- ❌ `npx tsc --noEmit` - Hangs (TypeScript check)
- ✅ **Vercel Builds** - Work perfectly! (different bundler)

---

## 🧩 **Possible Root Causes**

### **1. File Path with Spaces**
Your project is in:
```
/Users/kalvinbrookes/Library/CloudStorage/GoogleDrive-kbrookes2507@gmail.com/My Drive/01_Kalvin/...
```

**Issue**: Spaces in path ("My Drive") can cause issues with Node.js tools.

**Test**:
```bash
# Move project to path without spaces
cp -r "Spanish_Vocab" ~/Desktop/Spanish_Vocab_Test
cd ~/Desktop/Spanish_Vocab_Test
rm -rf .next node_modules
npm install
npm run dev
```

### **2. Google Drive Sync Conflicts**
Google Drive may be locking files during sync.

**Test**:
```bash
# Check if Google Drive is syncing
ls -la .next/  # Look for .tmp or .goutputstream files

# Pause Google Drive sync temporarily
# Then try: npm run dev
```

### **3. Turbopack Issues**
Turbopack (Next.js 13+) can have stability issues.

**Test - Disable Turbopack**:
```bash
# Edit package.json
"scripts": {
  "dev": "next dev --turbo=false",
  "build": "next build --turbo=false"
}

npm run dev
```

### **4. .env.local Parsing**
Large or complex environment variables.

**Test**:
```bash
# Temporarily rename .env.local
mv .env.local .env.local.backup

# Try dev server without env vars
npm run dev

# If works, gradually add vars back to find culprit
```

### **5. Circular Dependencies**
Webpack/Turbopack might be stuck resolving dependencies.

**Test**:
```bash
# Install madge to detect circular dependencies
npm install -g madge

# Check for circular deps
madge --circular --extensions ts,tsx ./app
madge --circular --extensions ts,tsx ./lib
madge --circular --extensions ts,tsx ./components
```

### **6. Node.js Memory Issues**
Limited memory causing hang.

**Test**:
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"
npm run dev
```

### **7. Port Conflicts**
Port 3000 already in use.

**Test**:
```bash
# Check what's using port 3000
lsof -i :3000

# Kill any processes
kill -9 <PID>

# Try different port
npm run dev -- -p 3001
```

---

## 🛠️ **Debugging Steps (Systematic Approach)**

### **Phase 1: Quick Wins (5 minutes)**

```bash
# 1. Kill all node processes
pkill -9 node

# 2. Clean everything
rm -rf .next node_modules .turbo package-lock.json

# 3. Fresh install
npm install

# 4. Try dev server
npm run dev
```

### **Phase 2: Isolate Cause (15 minutes)**

**Test A: Minimal Next.js App**
```bash
# In a different directory (no spaces in path)
npx create-next-app@latest test-app --typescript --turbo
cd test-app
npm run dev

# Does it work? If YES, issue is project-specific
# If NO, issue is environment/system
```

**Test B: Disable Turbopack**
```bash
# In your project, edit package.json
"dev": "next dev --turbo=false"

npm run dev

# Does it work? If YES, Turbopack is the problem
```

**Test C: Move Project**
```bash
# Copy to path without spaces
cp -r "/path/with spaces/Spanish_Vocab" ~/Desktop/Spanish_Vocab_Test
cd ~/Desktop/Spanish_Vocab_Test
rm -rf .next node_modules
npm install
npm run dev

# Does it work? If YES, file path is the problem
```

### **Phase 3: Deep Dive (30+ minutes)**

**Circular Dependency Analysis**:
```bash
npm install -g madge
madge --circular --extensions ts,tsx ./app > circular-deps-app.txt
madge --circular --extensions ts,tsx ./lib > circular-deps-lib.txt
madge --circular --extensions ts,tsx ./components > circular-deps-components.txt

# Review files for any circular imports
```

**Strace/Dtrace Analysis** (macOS):
```bash
# Run dev server in background
npm run dev &
PID=$!

# Monitor system calls (requires sudo)
sudo dtruss -p $PID 2>&1 | tee dtrace-output.txt

# Let it run for 30 seconds, then analyze dtrace-output.txt
# Look for repeated system calls or file access patterns
```

**Next.js Debug Mode**:
```bash
# Enable debug logging
export DEBUG=*
npm run dev 2>&1 | tee debug-output.txt

# Review debug-output.txt for clues
```

---

## ✅ **Workarounds (Until Fixed)**

### **Option 1: Vercel for Testing** (Recommended)
```bash
# Push to GitHub, let Vercel build
git push origin main

# Test on live site: https://palabra-[your-project].vercel.app
```

**Pros**: Works reliably, matches production  
**Cons**: Slower iteration (wait for builds)

### **Option 2: Production Build Locally**
```bash
# Build once (may take 5-10 minutes but completes on Vercel)
npm run build

# Run production server locally
npm start

# Access at http://localhost:3000
```

**Pros**: Faster than Vercel after initial build  
**Cons**: Initial build is slow, no hot reload

### **Option 3: Disable Turbopack**
```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbo=false",
    "build": "next build --turbo=false"
  }
}
```

**Pros**: May fix the hang  
**Cons**: Slower build times

---

## 📝 **Collect Diagnostic Data**

Before starting a debug session, gather this info:

```bash
# 1. System info
uname -a
node -v
npm -v

# 2. Process info during hang
npm run dev &
PID=$!
sleep 30  # Let it hang
ps aux | grep $PID
lsof -p $PID | head -20

# 3. Check for file locks
ls -la .next/

# 4. Disk usage
df -h

# 5. Memory usage
top -l 1 | head -10

# Save all output to debug-info.txt
```

---

## 🎯 **Recommended Next Steps**

1. **Quick Test**: Try moving project to `~/Desktop/palabra_test` (no spaces)
2. **If that works**: Use symlinks or restructure your Google Drive setup
3. **If that doesn't work**: Disable Turbopack as a permanent workaround
4. **Long-term**: Consider moving project out of Google Drive entirely

---

## 📚 **Related Issues**

- Next.js Issue Tracker: https://github.com/vercel/next.js/issues
- Search for: "Turbopack hang", "compile hang", "Google Drive Next.js"
- Similar reported issues with macOS + Google Drive + Turbopack

---

## 🔧 **Files to Check During Debug**

Key files that might reveal clues:
- `package.json` - Check for unusual dependencies
- `next.config.ts` - Check for problematic config
- `tsconfig.json` - Check for overly broad includes
- `.gitignore` - Ensure .next is ignored
- `.env.local` - Check for malformed variables

---

## ✨ **Success Criteria**

Debug session is successful when:
- ✅ `npm run dev` completes in < 5 seconds
- ✅ Page loads at http://localhost:3000
- ✅ Hot reload works for file changes
- ✅ `npm run build` completes successfully

---

**Last Updated**: February 5, 2026  
**Status**: Documented, ready for systematic debugging
