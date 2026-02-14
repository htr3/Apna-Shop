#!/bin/bash
# Quick start guide for Supabase + Vercel deployment

echo "🚀 Shopkeeper Insights - Deployment Setup"
echo "=========================================="
echo ""

# Step 1: Environment setup
echo "✓ Step 1: Setting up environment variables..."
cp .env.local.example .env.local
echo "  📝 Created .env.local (edit with your Supabase credentials)"
echo ""

# Step 2: Dependencies
echo "✓ Step 2: Installing dependencies..."
npm install
echo ""

# Step 3: Database
echo "✓ Step 3: Database setup instructions..."
echo "  1. Go to https://supabase.com and create a new project"
echo "  2. Copy the PostgreSQL connection string"
echo "  3. Update DATABASE_URL in .env.local"
echo "  4. Run: npm run db:push"
echo "  5. Run: npm run seed"
echo ""

# Step 4: Local dev
echo "✓ Step 4: Start local development..."
echo "  Run: npm run dev"
echo ""

# Step 5: GitHub
echo "✓ Step 5: Push to GitHub..."
echo "  git add ."
echo "  git commit -m 'Setup for Supabase + Vercel'"
echo "  git push origin main"
echo ""

# Step 6: Vercel
echo "✓ Step 6: Deploy to Vercel..."
echo "  1. Go to https://vercel.com/new"
echo "  2. Import your GitHub repository"
echo "  3. Add environment variables (see DEPLOYMENT_SUPABASE_VERCEL.md)"
echo "  4. Click Deploy"
echo ""

echo "✨ Setup complete! Follow the steps above to deploy."

