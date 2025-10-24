#!/usr/bin/env node

/**
 * Script to stub out remaining API routes with Supabase usage
 */

const fs = require('fs');
const path = require('path');

const stubTemplate = `import { NextResponse } from 'next/server';

// TODO: Migrate to PostgreSQL/Prisma
// This API route has been stubbed during Supabase removal
// Original functionality needs to be reimplemented with Prisma client

export async function GET(req: Request) {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}

export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}

export async function PUT(req: Request) {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}

export async function DELETE(req: Request) {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}
`;

const routesToStub = [
  'app/api/save/route.ts',
  'app/api/webhooks/stripe/route.ts',
  'app/api/credits/route.ts',
  'app/api/mentions/route.ts',
  'app/api/create-checkout-session/route.ts',
  'app/api/comments/route.ts',
  'app/api/comments/[id]/route.ts',
  'app/api/comments/[id]/reactions/route.ts',
];

let stubbedCount = 0;

routesToStub.forEach(route => {
  const filePath = path.join(__dirname, '..', route);
  
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, stubTemplate);
    console.log(`✅ Stubbed: ${route}`);
    stubbedCount++;
  } else {
    console.log(`⚠️  Skipped (not found): ${route}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Stubbed: ${stubbedCount} files`);
console.log(`\n✨ Done!`);
