export const dynamic = 'force-dynamic'

import OracleWhisper from '@/components/oracle/oracle-whisper'

export default function OracleWhisperTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Oracle Whisper Test</h1>
        
        <div className="flex justify-center">
          <OracleWhisper />
        </div>
        
        <div className="mt-8 text-center text-muted-foreground">
          <p>Click &quot;Speak to Oracle&quot; to start recording</p>
          <p>Oracle will transcribe your speech, generate a response, and speak it back using native browser TTS</p>
          <p>This version uses SpeechSynthesisUtterance for text-to-speech</p>
        </div>
      </div>
    </div>
  )
} 