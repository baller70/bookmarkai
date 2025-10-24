#!/usr/bin/env node

/**
 * Script to stub out Supabase API routes
 * This replaces Supabase imports with TODO comments
 */

const fs = require('fs');
const path = require('path');

const apiRoutes = [
  'app/api/hierarchy-assignments/route.ts',
  'app/api/setup-notifications-db/route.ts',
  'app/api/setup-goal-tables/route.ts',
  'app/api/notifications/test/route.ts',
  'app/api/notifications/route.ts',
  'app/api/notifications/settings/route.ts',
  'app/api/timeline/bookmarks/[bookmarkId]/move/route.ts',
  'app/api/timeline/bookmarks/move/route.ts',
  'app/api/user-data/media/route.ts',
  'app/api/user-data/upload/route.ts',
  'app/api/user-data/documents/route.ts',
  'app/api/debug-goal-tables/route.ts',
  'app/api/dev/seed-profile/route.ts',
  'app/api/user-data/documents/[id]/route.ts',
  'app/api/test-supabase/route.ts',
  'app/api/pomodoro/route.ts',
  'app/api/ai/bulk-uploader/route.ts',
  'app/api/ai/recommendations/route.ts',
  'app/api/migrate/route.ts',
  'app/api/playbooks/[id]/plays/route.ts',
  'app/api/playbooks/route.ts',
  'app/api/playbooks/[id]/likes/route.ts',
  'app/api/playbooks/[id]/bookmarks/route.ts',
  'app/api/setup-hierarchy-table/route.ts',
  'app/api/hierarchy-sections/route.ts',
  'app/api/hierarchy/route.ts',
  'app/api/category-folders/folders/route.ts',
  'app/api/category-folders/route.ts',
];

const stubTemplate = `import { NextResponse } from 'next/server';

// TODO: Migrate to PostgreSQL/Prisma
// This API route has been stubbed during Supabase removal
// Original functionality needs to be reimplemented with Prisma client

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}
`;

let stubbedCount = 0;
let skippedCount = 0;

apiRoutes.forEach(route => {
  const filePath = path.join(__dirname, '..', route);
  
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, stubTemplate);
    console.log(`✅ Stubbed: ${route}`);
    stubbedCount++;
  } else {
    console.log(`⚠️  Skipped (not found): ${route}`);
    skippedCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Stubbed: ${stubbedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
console.log(`\n✨ Done! All API routes have been stubbed.`);
