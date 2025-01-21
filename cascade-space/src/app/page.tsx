'use client'

import { useState, useEffect } from 'react'
import { ChatBubbleLeftRightIcon, MicrophoneIcon } from '@heroicons/react/24/outline'

export default function Home() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      setMessages(prev => [...prev, message])
      setMessage('')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Cascade Space</h1>
        
        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md w-full">
          <div className="space-y-4 mb-4 h-[400px] overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className="bg-white/5 p-3 rounded-lg">
                {msg}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 rounded-lg bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
            >
              <MicrophoneIcon className="h-6 w-6" />
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
