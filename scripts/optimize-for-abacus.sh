#!/bin/bash

# Abacus Deployment Optimization Script
# This script prepares the app for fast deployment on Abacus

set -e

echo "🚀 Starting Abacus deployment optimization..."

# Step 1: Clean all build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .next .build .next-fresh tsconfig.tsbuildinfo app_backup

# Step 2: Clean node_modules cache
echo "🗑️  Cleaning node_modules cache..."
rm -rf node_modules/.cache

# Step 3: Optimize package.json for faster installs
echo "📦 Optimizing dependencies..."
if [ -f "yarn.lock" ]; then
    echo "Using Yarn..."
    yarn install --frozen-lockfile --production=false --prefer-offline
elif [ -f "package-lock.json" ]; then
    echo "Using npm..."
    npm ci --prefer-offline
fi

# Step 4: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 5: Run optimized build
echo "🏗️  Building application..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

if [ -f "yarn.lock" ]; then
    yarn build
else
    npm run build
fi

# Step 6: Clean up after build
echo "🧹 Post-build cleanup..."
find .next -name "*.map" -type f -delete
find .next -name "*.d.ts" -type f -delete

echo "✅ Deployment optimization complete!"
echo "📊 Build size:"
du -sh .next 2>/dev/null || echo "No .next directory"

echo ""
echo "🎯 Next steps:"
echo "1. Commit these changes to git"
echo "2. Push to your repository"
echo "3. Deploy on Abacus"
