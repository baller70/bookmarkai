#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to update with demo Supabase client
const filesToUpdate = [
  // Dashboard components
  'apps/web/app/dashboard/billing/page.tsx',
  'apps/web/app/dashboard/profile/page.tsx',
  'apps/web/components/dashboard/Header.tsx',
  'apps/web/app/components/PricingCard.tsx',
  
  // DNA Profile settings
  'apps/web/app/settings/dna/recommendations/page.tsx',
  'apps/web/app/settings/dna/insight-questions/page.tsx',
  'apps/web/app/settings/dna/site-preference/page.tsx',
  'apps/web/app/settings/dna/importance/page.tsx',
  'apps/web/app/settings/dna/about-you/page.tsx',
  'apps/web/app/settings/dna/review-save/page.tsx',
  'apps/web/app/settings/dna/tags-filters/page.tsx',
  'apps/web/app/settings/dna/content-channels/page.tsx',
  
  // Auth components
  'apps/web/components/auth/AuthForm.tsx'
];

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Replace the import
    if (content.includes("import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'")) {
      content = content.replace(
        "import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'",
        "import { createDemoSupabaseClient, DEMO_USER_ID } from '../../../lib/supabase-demo'"
      );
      updated = true;
    }

    // Replace the client creation
    if (content.includes('createClientComponentClient()')) {
      content = content.replace(/createClientComponentClient\(\)/g, 'createDemoSupabaseClient()');
      updated = true;
    }

    // Replace any hardcoded user ID patterns with DEMO_USER_ID
    if (content.includes('demo-user-for-testing')) {
      content = content.replace(/['"`]demo-user-for-testing['"`]/g, 'DEMO_USER_ID');
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

console.log('🚀 Updating Supabase imports to use demo client...\n');

filesToUpdate.forEach(updateFile);

console.log('\n✨ Supabase import updates completed!'); 