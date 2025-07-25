"use client"

import { format } from "date-fns"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
        <div
          className={`rounded-lg px-3 py-2 text-sm ${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}
        >
          {message.content}
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? "text-right" : "text-left"}`}>
          {format(message.timestamp, "HH:mm")}
        </div>
      </div>
      {!isUser && (
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-1 order-0">
          <span className="text-blue-600 text-xs font-medium">AI</span>
        </div>
      )}
    </div>
  )
}
