'use client'

import { AboutYouComponent } from '@/src/components/dna-profile/about-you'
import DnaProfileLayout from '@/src/components/dna-profile/dna-profile-layout'

export default function AboutYouPage() {
  return (
    <DnaProfileLayout 
      title="About You" 
      description="Tell us about yourself to get personalized AI recommendations"
    >
      <AboutYouComponent />
    </DnaProfileLayout>
  )
} 