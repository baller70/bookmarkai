
'use client'
export const dynamic = 'force-dynamic'

import { ComprehensiveAnalytics } from '@/src/components/dna-profile/comprehensive-analytics'
import DnaProfileLayout from '@/src/components/dna-profile/dna-profile-layout'

export default function Analytics() {
  return (
    <DnaProfileLayout 
      title="Analytics Dashboard"
      description="Comprehensive insights into your bookmark usage and productivity patterns"
    >
      <ComprehensiveAnalytics />
    </DnaProfileLayout>
  )
} 