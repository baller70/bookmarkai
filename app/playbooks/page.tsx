
'use client'
export const dynamic = 'force-dynamic'

import DnaPlaybooks from '@/src/components/dna-profile/dna-playbooks'
import DnaProfileLayout from '@/src/components/dna-profile/dna-profile-layout'

export default function PlaybooksPage() {
  return (
    <DnaProfileLayout 
      title="AI Playbooks" 
      description="Discover and create AI-powered workflows based on your profile"
    >
      <DnaPlaybooks />
    </DnaProfileLayout>
  )
} 