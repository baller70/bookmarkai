"use client"

import dynamic from 'next/dynamic'

const DnaTabs = dynamic(() => import('./dna-tabs'), {
  ssr: false,
})

export default function DnaTabsWrapper() {
  return <DnaTabs />
} 