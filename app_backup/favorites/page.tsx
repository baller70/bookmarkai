'use client'

import { FavoritesPage } from '@/src/components/dna-profile/favorites-page'
import DnaProfileLayout from '@/src/components/dna-profile/dna-profile-layout'

export default function Favorites() {
  return (
    <DnaProfileLayout 
      title="Favorites" 
      description="Your most loved bookmarks and content recommendations"
    >
      <FavoritesPage userId="mock-user-id" />
    </DnaProfileLayout>
  )
} 