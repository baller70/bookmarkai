'use client'
export const dynamic = 'force-dynamic'

import DnaSearch from '@/src/components/dna-profile/dna-search'
import DnaProfileLayout from '@/src/components/dna-profile/dna-profile-layout'

export default function SearchPage() {
  return (
    <DnaProfileLayout 
      title="AI-Powered Search" 
      description="Search through your bookmarks with intelligent AI recommendations"
    >
      <DnaSearch />
    </DnaProfileLayout>
  )
} 