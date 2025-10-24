'use client'

import { useState, useRef } from 'react'
// import { useSpeechSynthesis } from 'react-speech-kit' // Temporarily disabled for deployment

export default function OracleVoiceChat() {
  const [isRecording, setIsRecording] = useState(false)
  const [conversation, setConversation] = useState<{ role: string; text: string }[]>([])
  // const { speak } = useSpeechSynthesis() // Temporarily disabled for deployment
  const speak = (text: string) => console.log('Speech synthesis disabled:', text)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    audioChunks.current = []

    mediaRecorder.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data)
    }

    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', audioBlob, 'input.webm')

      // Whisper transcription
      const whisperRes = await fetch('/api/oracle/whisper', {
        method: 'POST',
        body: formData,
      })
      const whisperData = await whisperRes.json()
      const userText = whisperData.text || '[Could not transcribe]'

      setConversation((prev) => [...prev, { role: 'user', text: userText }])

      // OpenAI Chat completion
      const chatRes = await fetch('/api/oracle/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userText }),
        headers: { 'Content-Type': 'application/json' },
      })

      const chatData = await chatRes.json()
      const assistantText = chatData.text || '[No reply]'
      setConversation((prev) => [...prev, { role: 'assistant', text: assistantText }])
      speak(assistantText)
    }

    mediaRecorder.current.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  return (
    <div className="p-4 max-w-md space-y-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isRecording ? '🛑 Stop & Send' : '🎤 Speak to Oracle'}
      </button>

      <div className="text-sm space-y-2">
        {conversation.map((entry, i) => (
          <div key={i} className={entry.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="block px-3 py-2 rounded bg-muted">
              <strong>{entry.role === 'user' ? 'You' : 'Oracle'}:</strong> {entry.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
} 