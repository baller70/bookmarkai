export const dynamic = 'force-dynamic'

import OracleVoiceChat from '@/components/oracle/oracle-voice-chat'

export default function OracleVoiceTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Oracle Voice Chat Test</h1>
        
        <div className="flex justify-center">
          <OracleVoiceChat />
        </div>
        
        <div className="mt-8 text-center text-muted-foreground">
          <p>Click the microphone button to start speaking to Oracle</p>
          <p>Oracle will transcribe your speech, generate a response, and speak it back to you</p>
        </div>
      </div>
    </div>
  )
} 