#!/usr/bin/env node

/**
 * Script to replace all supabase.auth calls with TODO comments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Finding all files with supabase.auth calls...\n');

// Find all files with supabase.auth
const grepCommand = `grep -rl "supabase\\.auth\\|supabase\\.from\\|supabase\\.storage" --include="*.ts" --include="*.tsx" app/ || true`;
const filesOutput = execSync(grepCommand, { cwd: __dirname + '/..', encoding: 'utf-8' });
const files = filesOutput.split('\n').filter(f => f && !f.includes('node_modules'));

console.log(`Found ${files.length} files with supabase calls\n`);

let processedCount = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Replace supabase.auth.getUser() calls
  const getUserPattern = /const\s+{\s*data:\s*{\s*user\s*}(?:,\s*error:\s*\w+)?\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g;
  if (getUserPattern.test(content)) {
    content = content.replace(getUserPattern, '// TODO: Replace with NextAuth session\n      const user = null');
    modified = true;
  }

  // Replace supabase.auth.getSession() calls
  const getSessionPattern = /const\s+{\s*data:\s*{\s*session\s*}(?:,\s*error:\s*\w+)?\s*}\s*=\s*await\s+supabase\.auth\.getSession\(\)/g;
  if (getSessionPattern.test(content)) {
    content = content.replace(getSessionPattern, '// TODO: Replace with NextAuth session\n      const session = null');
    modified = true;
  }

  // Replace supabase.from() calls - handle multi-line
  const fromPattern = /await\s+supabase\.from\([^)]+\)[^\n;]*/g;
  if (fromPattern.test(content)) {
    content = content.replace(fromPattern, '// TODO: Replace with Prisma\n      await Promise.resolve({ data: null, error: null })');
    modified = true;
  }

  // Replace supabase.storage calls - handle multi-line
  const storagePattern = /await\s+supabase\.storage[^\n;]*/g;
  if (storagePattern.test(content)) {
    content = content.replace(storagePattern, '// TODO: Replace with file storage\n      await Promise.resolve({ data: null, error: null })');
    modified = true;
  }

  // Replace remaining supabase.storage references (non-await)
  const storageRefPattern = /supabase\.storage[^\n;]*/g;
  if (storageRefPattern.test(content)) {
    content = content.replace(storageRefPattern, '// TODO: Replace with file storage\n      ({ data: { publicUrl: null } })');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Processed: ${file}`);
    processedCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Processed: ${processedCount} files`);
console.log(`\n✨ Done!`);