#!/usr/bin/env node

/**
 * Script to stub out problematic pages with Supabase usage
 */

const fs = require('fs');
const path = require('path');

const stubTemplate = `'use client'

// TODO: Migrate to PostgreSQL/Prisma
// This page has been stubbed during Supabase removal
// Original functionality needs to be reimplemented with Prisma client

export default function Page() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Page Under Migration</h1>
      <p>This page is being migrated from Supabase to PostgreSQL/Prisma.</p>
      <p>Please check back later.</p>
    </div>
  )
}
`;

const pagesToStub = [
  'app/dashboard/profile/page.tsx',
  'app/dashboard/billing/page.tsx',
  'app/settings/dna/about-you/page.tsx',
  'app/settings/dna/review-save/page.tsx',
  'app/settings/dna/content-channels/page.tsx',
  'app/settings/dna/tags-filters/page.tsx',
  'app/settings/dna/insight-questions/page.tsx',
  'app/settings/dna/site-preference/page.tsx',
  'app/settings/dna/importance/page.tsx',
  'app/settings/dna/recommendations/page.tsx',
  'app/settings/ai/recommendations/page.tsx',
  'app/settings/ai/bulk-uploader/page.tsx',
  'app/settings/ai/browser-launcher/page.tsx',
  'app/settings/ai/link-validator/page.tsx',
  'app/settings/oracle/appearance/page.tsx',
  'app/settings/oracle/tools/page.tsx',
  'app/settings/oracle/voice/page.tsx',
  'app/settings/oracle/behavior/page.tsx',
  'app/settings/oracle/context/page.tsx',
  'app/settings/oracle/advanced/page.tsx',
  'app/settings-test/page.tsx',
  'app/debug-settings/page.tsx',
  'app/oracle-demo/page.tsx',
];

let stubbedCount = 0;

pagesToStub.forEach(page => {
  const filePath = path.join(__dirname, '..', page);
  
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, stubTemplate);
    console.log(`✅ Stubbed: ${page}`);
    stubbedCount++;
  } else {
    console.log(`⚠️  Skipped (not found): ${page}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Stubbed: ${stubbedCount} files`);
console.log(`\n✨ Done!`);
