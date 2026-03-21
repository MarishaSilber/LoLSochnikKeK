import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Send, Paperclip, Smile } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { mockChats, mockMessages, mockStudents } from '../lib/mockData'
import { cn } from '../lib/utils'

export default function MessengerPage() {
  const { chatId } = useParams()
  const [messages, setMessages] = useState(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  
  // Находим чат и собеседника
  const chat = mockChats.find(c => c.id === parseInt(chatId)) || mockChats[0]
  const participant = chat.participant
  
  const handleSend = () => {
    if (!newMessage.trim()) return
    
    const message = {
      id: messages.length + 1,
      sender_id: 'me',
      text: newMessage,
      timestamp: new Date().toISOString(),
    }
    
    setMessages([...messages, message])
    setNewMessage('')
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const quickReplies = [
    'Привет! Поможешь с лабой по оптике?',
    'Ты сейчас в ГЗ?',
    'Можно встретиться и обсудить?',
  ]
  
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="card mb-4 py-4">
        <div className="flex items-center gap-4">
          <a href="/messenger" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          
          <img
            src={participant.photo_url}
            alt={participant.full_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{participant.full_name}</h2>
            <p className="text-sm text-gray-500">{participant.location}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="text-sm text-emerald-600">Онлайн</span>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-4">
        {messages.map((message) => {
          const isMe = message.sender_id === 'me'
          
          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                isMe ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] px-4 py-3 rounded-2xl",
                  isMe
                    ? "bg-primary-600 text-white rounded-br-sm"
                    : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"
                )}
              >
                <p className="text-sm">{message.text}</p>
                <p
                  className={cn(
                    "text-xs mt-1",
                    isMe ? "text-primary-200" : "text-gray-400"
                  )}
                >
                  {format(new Date(message.timestamp), 'HH:mm', { locale: ru })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Quick Replies */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto">
        {quickReplies.map((reply, index) => (
          <button
            key={index}
            onClick={() => setNewMessage(reply)}
            className="flex-shrink-0 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full 
                       hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 
                       transition-colors whitespace-nowrap"
          >
            {reply}
          </button>
        ))}
      </div>
      
      {/* Input */}
      <div className="card mt-4 py-4">
        <div className="flex items-end gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         resize-none max-h-32"
              style={{ minHeight: '48px' }}
            />
            <button className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={cn(
              "p-3 rounded-xl transition-colors",
              newMessage.trim()
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "bg-gray-100 text-gray-400"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
