'use client'

import { useEffect, useState } from 'react'

export default function OracleRealtimeVoiceChat(): JSX.Element {
  const [response, setResponse] = useState('')
  const [conversationOn, setConversationOn] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [userHasInteracted, setUserHasInteracted] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        setError('SpeechRecognition not supported in this browser.')
        return
      }

      const recog = new SpeechRecognition()
      recog.continuous = false
      recog.lang = 'en-US'
      recog.interimResults = false
      recog.maxAlternatives = 1

      recog.onresult = async (event: any) => {
        const spokenText = event.results[0][0].transcript
        const openaiRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: spokenText })
        })

        const data = await openaiRes.json()
        const reply = data.reply || ''
        setResponse(reply)
        speak(reply)
      }

      recog.onerror = (e: any) => {
        setError('Speech recognition error: ' + e.error)
        stopConversation()
      }

      setRecognition(recog)
    }
  }, [])

  const speak = (text: string): void => {
    if (!userHasInteracted) {
      console.warn('Speech synthesis blocked: waiting for user interaction.')
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.onend = () => {
      if (conversationOn && recognition) recognition.start()
    }
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }

  const startConversation = (): void => {
    if (!recognition) return
    setUserHasInteracted(true)
    setConversationOn(true)
    recognition.start()
  }

  const stopConversation = (): void => {
    setConversationOn(false)
    recognition?.stop()
    speechSynthesis.cancel()
  }

  return (
    <div
      className="p-6 space-y-4 border rounded bg-white shadow"
      onClick={() => setUserHasInteracted(true)}
      onTouchStart={() => setUserHasInteracted(true)}
    >
      <button
        onClick={conversationOn ? stopConversation : startConversation}
        className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700"
      >
        {conversationOn ? '🛑 Stop Oracle Chat' : '🧠 Start Talking to Oracle'}
      </button>

      {error && <p className="text-sm text-red-600">⚠️ {error}</p>}
      {response && (
        <div className="text-gray-800 text-sm mt-2">
          <strong>Oracle:</strong> {response}
        </div>
      )}
    </div>
  )
} 