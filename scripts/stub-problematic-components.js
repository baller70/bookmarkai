#!/usr/bin/env node

/**
 * Script to stub out problematic components with Supabase usage
 */

const fs = require('fs');
const path = require('path');

const stubTemplate = `'use client'

// TODO: Migrate to PostgreSQL/Prisma
// This component has been stubbed during Supabase removal
// Original functionality needs to be reimplemented with Prisma client

export default function Component() {
  return (
    <div style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ccc' }}>
      <p>Component Under Migration</p>
    </div>
  )
}
`;

const componentsToStub = [
  'components/dashboard/Header.tsx',
  'components/oracle/oracle-blob.tsx',
  'components/oracle/oracle-blob-enhanced.tsx',
];

let stubbedCount = 0;

componentsToStub.forEach(component => {
  const filePath = path.join(__dirname, '..', component);
  
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, stubTemplate);
    console.log(`✅ Stubbed: ${component}`);
    stubbedCount++;
  } else {
    console.log(`⚠️  Skipped (not found): ${component}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Stubbed: ${stubbedCount} files`);
console.log(`\n✨ Done!`);
