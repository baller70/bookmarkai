export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

export default function DNAPage() {
  redirect('/settings/dna/about-you')
}
