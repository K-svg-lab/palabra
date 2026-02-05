#!/bin/bash

# Push Prisma Schema to Production Database
# Phase 16.2 - A/B Testing Infrastructure
# 
# This script pushes the new ABTestEvent model to production

echo "🚀 Pushing Prisma Schema to Production Database..."
echo ""
echo "⚠️  IMPORTANT: This requires DATABASE_URL environment variable"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment"
    echo ""
    echo "Please run one of the following:"
    echo ""
    echo "Option 1: Pull from Vercel (Recommended)"
    echo "  vercel env pull .env.production"
    echo "  source .env.production"
    echo "  ./scripts/push-schema-to-production.sh"
    echo ""
    echo "Option 2: Set manually"
    echo "  export DATABASE_URL='your-production-database-url'"
    echo "  ./scripts/push-schema-to-production.sh"
    echo ""
    echo "Option 3: Use Vercel CLI directly"
    echo "  vercel exec npx prisma db push --schema=./lib/backend/prisma/schema.prisma"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL found"
echo "📍 Database: $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1)"
echo ""

# Confirm before proceeding
echo "⚠️  This will add the following to your production database:"
echo "  - ABTestEvent table"
echo "  - 6 indexes for performance"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 0
fi

echo ""
echo "📦 Pushing schema to production..."
echo ""

# Push schema
npx prisma db push --schema=./lib/backend/prisma/schema.prisma

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema successfully pushed to production!"
    echo ""
    echo "New table created:"
    echo "  - ABTestEvent (with 6 indexes)"
    echo ""
    echo "🎉 A/B testing is now ready to track events!"
    echo ""
    echo "Next steps:"
    echo "  1. Visit your site to trigger A/B test assignment"
    echo "  2. Check analytics at /api/analytics/ab-test"
    echo "  3. Monitor variant distribution in Vercel logs"
    echo ""
else
    echo ""
    echo "❌ Schema push failed"
    echo ""
    echo "Common issues:"
    echo "  - DATABASE_URL is incorrect"
    echo "  - Database is unreachable"
    echo "  - Insufficient permissions"
    echo ""
    echo "Check the error above and try again"
    exit 1
fi
