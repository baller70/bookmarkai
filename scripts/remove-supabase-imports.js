#!/usr/bin/env node

/**
 * Script to remove all remaining Supabase imports
 * This replaces Supabase imports with TODO comments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Finding all files with Supabase imports...\n');

// Find all files with supabase imports
const grepCommand = `grep -rl "from '@/lib/supabase'" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . || true`;
const filesOutput = execSync(grepCommand, { cwd: __dirname + '/..', encoding: 'utf-8' });
const files = filesOutput.split('\n').filter(f => f && !f.includes('node_modules'));

console.log(`Found ${files.length} files with Supabase imports\n`);

let processedCount = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Remove various Supabase import patterns
  const patterns = [
    /import\s+{\s*createRouteHandlerClient\s*}\s+from\s+['"]@\/lib\/supabase['"]\s*;?\s*\n?/g,
    /import\s+{\s*createClientComponentClient\s*}\s+from\s+['"]@\/lib\/supabase['"]\s*;?\s*\n?/g,
    /import\s+{\s*createClient\s*}\s+from\s+['"]@\/lib\/supabase['"]\s*;?\s*\n?/g,
    /import\s+{\s*supabase\s*}\s+from\s+['"]@\/lib\/supabase['"]\s*;?\s*\n?/g,
    /import\s+{\s*createDemoSupabaseClient,\s*DEMO_USER_ID\s*}\s+from\s+['"][^'"]+supabase-demo['"]\s*;?\s*\n?/g,
    /import\s+type\s+{\s*Database\s*}\s+from\s+['"]@\/types\/supabase['"]\s*;?\s*\n?/g,
  ];

  patterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });

  // Remove supabase variable declarations
  content = content.replace(/const\s+supabase\s*=\s*createClient\([^)]+\)\s*;?\s*\n?/g, '');
  content = content.replace(/const\s+supabase\s*=\s*createRouteHandlerClient\([^)]+\)\s*;?\s*\n?/g, '');
  content = content.replace(/const\s+supabase\s*=\s*createClientComponentClient\([^)]+\)\s*;?\s*\n?/g, '');
  content = content.replace(/const\s+supabase\s*=\s*createDemoSupabaseClient\([^)]+\)\s*;?\s*\n?/g, '');

  if (modified) {
    // Add TODO comment at the top if not already present
    if (!content.includes('TODO: Migrate to PostgreSQL/Prisma')) {
      const firstImportIndex = content.indexOf('import');
      if (firstImportIndex !== -1) {
        content = content.slice(0, firstImportIndex) + 
                  '// TODO: Migrate to PostgreSQL/Prisma - Supabase imports removed\n' +
                  content.slice(firstImportIndex);
      }
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Processed: ${file}`);
    processedCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Processed: ${processedCount} files`);
console.log(`\n✨ Done! All Supabase imports have been removed.`);
