export const dynamic = 'force-dynamic'


import { redirect } from 'next/navigation'

export default function DnaProfileRedirect() {
  redirect('/dashboard/dna-profile')
}
