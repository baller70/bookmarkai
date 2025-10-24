"use client"

import dynamic from 'next/dynamic'

const AiCopilotTabs = dynamic(() => import('./ai-copilot-tabs').then(mod => ({ default: mod.AICopilotTabs })), {
  ssr: false,
})

export default function AiCopilotTabsWrapper() {
  return <AiCopilotTabs />
} 