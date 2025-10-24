
'use client';
export const dynamic = 'force-dynamic'

import { SimpleBoardCanvas } from '@/src/features/simpleBoard/SimpleBoardCanvas';

export default function SimpleBoardPage() {
  return (
    <div className="w-screen h-screen">
      <SimpleBoardCanvas />
    </div>
  );
} 