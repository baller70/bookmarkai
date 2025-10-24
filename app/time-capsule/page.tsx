'use client'

import DnaTimeCapsule from '@/src/components/dna-profile/dna-time-capsule'
import DnaProfileLayout from '@/src/components/dna-profile/dna-profile-layout'

export default function TimeCapsulePage() {
  return (
    <DnaProfileLayout 
      title="Time Capsule" 
      description="Explore your digital journey and see how your interests evolved over time"
    >
      <DnaTimeCapsule />
    </DnaProfileLayout>
  )
} 