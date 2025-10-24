import { NextRequest, NextResponse } from 'next/server';

// TODO: Migrate to PostgreSQL/Prisma
// This API route has been stubbed during Supabase removal
// Original functionality needs to be reimplemented with Prisma client

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}
