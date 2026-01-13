# Deployment Guide - Palabra MVP

This guide covers deploying the Palabra Spanish Vocabulary Learning Application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
4. [Production Build](#production-build)
5. [Deployment to Vercel (Recommended)](#deployment-to-vercel-recommended)
6. [Alternative Deployment Platforms](#alternative-deployment-platforms)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ Git repository with your code
- ✅ All Phase 6 tests passing
- ✅ Production environment variables ready
- ✅ Domain name (optional, but recommended)

---

## Environment Setup

### Environment Variables

Create a `.env.production` file (or configure in your hosting platform):

```bash
# App Configuration
NEXT_PUBLIC_APP_NAME="Palabra"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID="your-analytics-id"

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Build Configuration

Review `next.config.ts` for production optimizations:

```typescript
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,
  
  // Image optimization
  images: {
    domains: [],
  },
};
```

---

## Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Best for:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Serverless functions
- Free for personal projects

### Option 2: Netlify

**Best for:**
- Similar to Vercel
- Easy form handling
- Split testing

### Option 3: Self-Hosted

**Best for:**
- Full control
- Custom infrastructure
- Enterprise requirements

---

## Production Build

### 1. Test Production Build Locally

```bash
cd palabra

# Install dependencies
npm install --production=false

# Run production build
npm run build

# Test production build locally
npm run start
```

### 2. Verify Build Output

Check for:
- ✅ No build errors
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ All pages generated successfully
- ✅ Bundle size is acceptable (< 500KB)

```bash
# Check bundle size
npm run build -- --profile

# Analyze bundle (optional)
npm install -D @next/bundle-analyzer
```

---

## Deployment to Vercel (Recommended)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
cd palabra

# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod
```

### Step 4: Configure Project Settings

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings**
4. Configure:
   - **Environment Variables** (if any)
   - **Domains** (add custom domain)
   - **Build & Development Settings**

### Step 5: Connect GitHub for Automatic Deployments

1. Go to **Settings → Git**
2. Connect your GitHub repository
3. Enable automatic deployments:
   - ✅ Production branch: `main`
   - ✅ Preview branches: All branches

**Result:** Every push to `main` triggers a production deployment!

---

## Alternative Deployment Platforms

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd palabra
netlify deploy --prod
```

**Configuration (`netlify.toml`):**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Self-Hosted (Docker)

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**Build and run:**

```bash
docker build -t palabra:latest .
docker run -p 3000:3000 palabra:latest
```

---

## Post-Deployment Checklist

After deployment, verify:

### Functionality Tests

- [ ] Home page loads correctly
- [ ] Add new vocabulary word
- [ ] Search/filter vocabulary
- [ ] Start flashcard review
- [ ] Complete review session
- [ ] View progress statistics
- [ ] Navigation works (all tabs)
- [ ] Onboarding appears for new users

### Performance Tests

- [ ] Lighthouse score > 90 (Performance)
- [ ] Lighthouse score > 95 (Accessibility)
- [ ] Lighthouse score > 90 (Best Practices)
- [ ] Lighthouse score > 100 (SEO)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

### Mobile Tests

- [ ] Responsive on mobile (375px width)
- [ ] Responsive on tablet (768px width)
- [ ] Touch interactions work
- [ ] Bottom navigation accessible
- [ ] Flashcard swipes work (if implemented)

### Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Security Checks

- [ ] HTTPS enabled
- [ ] No console errors
- [ ] No exposed API keys
- [ ] CSP headers configured (optional)
- [ ] Rate limiting configured (optional)

---

## Monitoring & Maintenance

### Analytics Integration (Optional)

Add analytics to track user behavior:

**Google Analytics:**

```typescript
// lib/analytics/google.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export function pageview(url: string) {
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}
```

**Vercel Analytics (Built-in):**

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Tracking

Consider adding error tracking:

- **Sentry**: Comprehensive error tracking
- **LogRocket**: Session replay
- **Bugsnag**: Error monitoring

### Performance Monitoring

Monitor key metrics:

- Page load times
- Core Web Vitals
- Error rates
- User engagement

### Backup Strategy

Since data is stored in browser localStorage/IndexedDB:

1. **Export Feature**: Allow users to export their data
2. **Cloud Sync** (Future): Phase 12 will add backend storage
3. **User Education**: Inform users about browser data

---

## Troubleshooting

### Common Issues

#### 1. Build Fails with TypeScript Errors

```bash
# Check for type errors
npm run type-check

# Fix errors and rebuild
npm run build
```

#### 2. "Module not found" Errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

#### 3. Hydration Errors

- Check for mismatched HTML between server and client
- Ensure `suppressHydrationWarning` is only on `<html>` tag
- Verify no dynamic content in initial render

#### 4. Performance Issues

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for large dependencies
npx depcheck
```

#### 5. Mobile Layout Issues

- Test on real devices, not just emulators
- Check safe area insets on iOS
- Verify viewport meta tag is correct

#### 6. localStorage Not Working

- Some browsers block localStorage in private mode
- Check browser compatibility
- Implement fallback to memory storage

---

## Rollback Procedure

If deployment fails or issues arise:

### Vercel

```bash
# List recent deployments
vercel list

# Promote previous deployment to production
vercel promote [deployment-id]
```

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

---

## Production URLs

After deployment, your app will be available at:

- **Vercel**: `https://palabra.vercel.app` (or custom domain)
- **Netlify**: `https://palabra.netlify.app` (or custom domain)
- **Custom**: `https://your-domain.com`

---

## Custom Domain Setup

### Vercel

1. Go to **Settings → Domains**
2. Add your domain
3. Configure DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### SSL Certificate

- ✅ Automatic with Vercel/Netlify
- ✅ Let's Encrypt (free)
- ✅ Auto-renewal

---

## Support & Resources

### Documentation

- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel Docs**: https://vercel.com/docs
- **React Query**: https://tanstack.com/query/latest

### Community

- Next.js Discord: https://discord.gg/nextjs
- GitHub Issues: [Your repo URL]

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2026-01-12 | MVP Release - Phases 1-6 complete |

---

## License

[Your License Here]

---

**Deployed successfully? 🎉**

Share your app:
- Twitter: #LearnSpanish #VocabularyApp
- Product Hunt: Launch your MVP
- Show HN: Share with Hacker News

**Next Steps:**
- Gather user feedback
- Monitor analytics
- Plan Phase 7+ features
- Iterate and improve!

---

*Last Updated: January 12, 2026*

