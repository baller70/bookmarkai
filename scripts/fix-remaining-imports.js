#!/usr/bin/env node

/**
 * Script to remove remaining Supabase imports that reference deleted files
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/dna-profile/about-you.tsx',
  'components/dashboard/Header.tsx',
  'app/components/PricingCard.tsx',
  'app/dashboard/billing/page.tsx',
  'app/settings/dna/review-save/page.tsx',
  'app/settings/dna/importance/page.tsx',
  'app/settings/dna/about-you/page.tsx',
  'app/settings/dna/content-channels/page.tsx',
  'app/settings/dna/recommendations/page.tsx',
  'app/settings/dna/site-preference/page.tsx',
  'app/settings/dna/insight-questions/page.tsx',
  'app/settings/dna/tags-filters/page.tsx',
  'app/debug-settings/page.tsx',
  'app/settings-test/page.tsx',
];

let fixedCount = 0;

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Remove supabase-demo imports
  const demoPattern = /import\s+{\s*createDemoSupabaseClient,\s*DEMO_USER_ID\s*}\s+from\s+['"][^'"]+supabase-demo['"]\s*;?\s*\n?/g;
  if (demoPattern.test(content)) {
    content = content.replace(demoPattern, '');
    modified = true;
  }

  // Remove @/src/lib/supabase imports
  const srcPattern = /import\s+{\s*supabase\s*}\s+from\s+['"]@\/src\/lib\/supabase['"]\s*;?\s*\n?/g;
  if (srcPattern.test(content)) {
    content = content.replace(srcPattern, '');
    modified = true;
  }

  // Remove DEMO_USER_ID usage
  content = content.replace(/DEMO_USER_ID/g, '"demo-user"');

  // Remove createDemoSupabaseClient calls
  content = content.replace(/const\s+supabase\s*=\s*createDemoSupabaseClient\([^)]*\)\s*;?\s*\n?/g, '');

  if (modified) {
    // Add TODO comment if not present
    if (!content.includes('TODO: Migrate to PostgreSQL/Prisma')) {
      const firstImportIndex = content.indexOf('import');
      if (firstImportIndex !== -1) {
        content = content.slice(0, firstImportIndex) + 
                  '// TODO: Migrate to PostgreSQL/Prisma - Supabase demo imports removed\n' +
                  content.slice(firstImportIndex);
      }
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixedCount} files`);
console.log(`\n✨ Done!`);
