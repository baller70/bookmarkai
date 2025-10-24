import { NextResponse } from 'next/server';

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
