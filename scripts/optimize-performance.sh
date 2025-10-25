#!/bin/bash

# Performance Optimization Script
# Run this to optimize bundle sizes and improve performance

echo "🚀 Starting Performance Optimization..."
echo ""

# 1. Analyze current bundle
echo "📊 Step 1: Analyzing bundle size..."
npm run build 2>&1 | grep -A 30 "Route (app)"

echo ""
echo "✅ Build analysis complete"
echo ""

# 2. Check for unused dependencies
echo "📦 Step 2: Checking for unused dependencies..."
npx depcheck --ignores="@types/*,eslint-*,prettier,typescript" 2>/dev/null || echo "Install depcheck: npm install -g depcheck"

echo ""

# 3. Check bundle size
echo "📏 Step 3: Bundle size summary..."
du -sh .next/ 2>/dev/null || echo ".next directory not found - run npm run build first"

echo ""

# 4. Optimization recommendations
echo "💡 Optimization Recommendations:"
echo ""
echo "1. Large Pages Detected:"
echo "   - /settings/ai/auto-processing (268 kB)"
echo "   - /dashboard/analytics (214 kB)"
echo ""
echo "2. Quick Wins:"
echo "   ✓ Add dynamic imports for heavy components"
echo "   ✓ Implement lazy loading for images"
echo "   ✓ Split large components into smaller ones"
echo "   ✓ Use React.memo for expensive renders"
echo ""
echo "3. Commands to run:"
echo "   npm install --save-dev @next/bundle-analyzer"
echo "   ANALYZE=true npm run build"
echo ""

# 5. Check for large files
echo "📁 Step 4: Finding large files in src..."
find src -type f -size +50k -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr | head -10

echo ""
echo "✨ Optimization analysis complete!"
echo ""
echo "Next steps:"
echo "1. Review large files above"
echo "2. Consider code splitting for files > 100KB"
echo "3. Run: ANALYZE=true npm run build (after installing bundle analyzer)"
echo ""
