#!/bin/bash

# Palabra Database Setup Script
# This script helps you set up the PostgreSQL database for production

echo "🎯 Palabra - Database Setup for Production"
echo "=========================================="
echo ""
echo "Choose your database provider:"
echo ""
echo "1. Vercel Postgres (Recommended - Integrated)"
echo "2. Neon (Free - Easy Setup)"
echo "3. Supabase (Free - Feature Rich)"
echo "4. I already have a DATABASE_URL"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    echo ""
    echo "📦 Setting up Vercel Postgres..."
    echo ""
    echo "Follow these steps:"
    echo "1. Visit: https://vercel.com/nutritrues-projects/palabra/stores"
    echo "2. Click 'Create Database'"
    echo "3. Select 'Postgres'"
    echo "4. Name: palabra-db"
    echo "5. Click 'Create'"
    echo ""
    echo "Vercel will automatically add DATABASE_URL to your environment variables!"
    echo ""
    read -p "Press ENTER when done..."
    ;;
    
  2)
    echo ""
    echo "🆓 Setting up Neon (Free PostgreSQL)..."
    echo ""
    echo "Follow these steps:"
    echo "1. Visit: https://console.neon.tech/signup"
    echo "2. Sign up (GitHub/Google recommended)"
    echo "3. Create a new project: 'palabra'"
    echo "4. Copy the connection string"
    echo ""
    read -p "Press ENTER when you have your connection string..."
    echo ""
    read -p "Paste your Neon connection string here: " DATABASE_URL
    
    if [ -n "$DATABASE_URL" ]; then
      echo "$DATABASE_URL" | npx vercel env add DATABASE_URL production
      echo "✅ DATABASE_URL added to Vercel!"
    else
      echo "❌ No connection string provided. Please run this script again."
      exit 1
    fi
    ;;
    
  3)
    echo ""
    echo "🚀 Setting up Supabase (Free PostgreSQL)..."
    echo ""
    echo "Follow these steps:"
    echo "1. Visit: https://supabase.com/dashboard"
    echo "2. Create a new project: 'palabra'"
    echo "3. Go to Settings → Database"
    echo "4. Copy the Connection String (URI format)"
    echo ""
    read -p "Press ENTER when you have your connection string..."
    echo ""
    read -p "Paste your Supabase connection string here: " DATABASE_URL
    
    if [ -n "$DATABASE_URL" ]; then
      echo "$DATABASE_URL" | npx vercel env add DATABASE_URL production
      echo "✅ DATABASE_URL added to Vercel!"
    else
      echo "❌ No connection string provided. Please run this script again."
      exit 1
    fi
    ;;
    
  4)
    echo ""
    read -p "Paste your DATABASE_URL here: " DATABASE_URL
    
    if [ -n "$DATABASE_URL" ]; then
      echo "$DATABASE_URL" | npx vercel env add DATABASE_URL production
      echo "✅ DATABASE_URL added to Vercel!"
    else
      echo "❌ No connection string provided. Please run this script again."
      exit 1
    fi
    ;;
    
  *)
    echo "Invalid choice. Please run the script again."
    exit 1
    ;;
esac

echo ""
echo "=========================================="
echo "🎉 Database configuration complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to production: npx vercel --prod"
echo "2. Initialize database schema: npm run prisma:push"
echo "3. Visit your app: https://palabra.vercel.app"
echo ""
echo "For detailed instructions, see: ../VERCEL_SETUP_GUIDE.md"
echo "=========================================="

