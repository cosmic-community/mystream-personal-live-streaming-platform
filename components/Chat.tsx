'use client'

import { useEffect, useState, useRef } from 'react'
import { createWebSocketConnection, sendChatMessage, sanitizeMessage } from '@/lib/websocket'
import { getChatMessages, createChatMessage } from '@/lib/cosmic'
import type { ChatMessage, WebSocketMessage, AccessPermission } from '@/types'
import { Send, MessageCircle, Users } from 'lucide-react'

interface ChatProps {
  streamId: string
  viewerName: string
  isEnabled: boolean
  permissions: AccessPermission
}

export default function Chat({ streamId, viewerName, isEnabled, permissions }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Load initial chat messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const chatMessages = await getChatMessages(streamId)
        setMessages(chatMessages)
        setIsLoading(false)
        scrollToBottom()
      } catch (error) {
        console.error('Error loading chat messages:', error)
        setIsLoading(false)
      }
    }

    if (isEnabled) {
      loadMessages()
    }
  }, [streamId, isEnabled])

  // WebSocket connection
  useEffect(() => {
    if (!isEnabled) return

    const ws = createWebSocketConnection(
      streamId,
      handleWebSocketMessage,
      handleWebSocketError,
      handleWebSocketClose
    )

    if (ws) {
      wsRef.current = ws
      ws.addEventListener('open', () => {
        setIsConnected(true)
      })
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [streamId, isEnabled])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'chat':
        // Add new chat message to the list
        const chatMessage: ChatMessage = {
          id: Date.now().toString(),
          slug: '',
          title: '',
          type: 'chat-messages',
          created_at: message.timestamp,
          modified_at: message.timestamp,
          metadata: {
            message_content: message.data.message,
            viewer_name: message.data.viewer_name,
            timestamp: message.timestamp,
            message_type: message.data.message_type || 'regular'
          }
        }
        setMessages(prev => [...prev, chatMessage])
        break
      
      case 'viewer_count':
        setViewerCount(message.data.count)
        break
      
      default:
        break
    }
  }

  const handleWebSocketError = (error: Event) => {
    console.error('WebSocket error:', error)
    setIsConnected(false)
  }

  const handleWebSocketClose = (event: CloseEvent) => {
    console.log('WebSocket closed:', event.code, event.reason)
    setIsConnected(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !isConnected || permissions === 'view-only') return

    const sanitizedMessage = sanitizeMessage(newMessage)
    if (!sanitizedMessage) return

    try {
      // Send via WebSocket for real-time delivery
      if (wsRef.current) {
        sendChatMessage(wsRef.current, viewerName, sanitizedMessage, 'regular')
      }

      // Also save to Cosmic CMS for persistence
      await createChatMessage({
        message_content: sanitizedMessage,
        viewer_name: viewerName,
        stream_session_id: streamId,
        message_type: 'regular'
      })

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const getMessageTypeColor = (messageType: string) => {
    switch (messageType) {
      case 'system':
        return 'text-yellow-400'
      case 'moderator':
        return 'text-red-400'
      default:
        return 'text-gray-200'
    }
  }

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'moderator':
        return '🔧'
      case 'system':
        return '⚡'
      default:
        return null
    }
  }

  if (!isEnabled) {
    return (
      <div className="chat-container">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Chat is disabled for this stream</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="border-b border-border px-4 py-3 bg-muted/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Live Chat</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <Users className="h-4 w-4" />
            <span>{viewerCount}</span>
          </div>
        </div>
        {permissions !== 'view-only' && (
          <p className="text-xs text-muted-foreground mt-1">
            You can {permissions === 'moderator' ? 'moderate and ' : ''}send messages
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Be the first to say something!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium text-sm ${getMessageTypeColor(message.metadata?.message_type || 'regular')}`}>
                        {getMessageTypeIcon(message.metadata?.message_type || 'regular')}
                        {message.metadata?.viewer_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.metadata?.timestamp || message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground break-words">
                      {message.metadata?.message_content || ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      {permissions !== 'view-only' && (
        <div className="chat-input">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              className="form-input flex-1"
              disabled={!isConnected}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
              className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              Reconnecting to chat...
            </p>
          )}
        </div>
      )}
    </div>
  )
}