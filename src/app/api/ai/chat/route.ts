import { NextResponse } from 'next/server';

// TODO: Migrate to PostgreSQL/Prisma
export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'This endpoint is not yet implemented with PostgreSQL' },
    { status: 501 }
  );
}
