import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/app/components/ui/skill-swap-button";
import { Send, Paperclip, Calendar, Clock, Check, CheckCheck, MoreVertical, Phone, Video, ChevronLeft, Loader2, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/app/components/ui/Toast";
import { matchesApi, type Match } from "@/app/api/matches";
import { messagesApi, type Message } from "@/app/api/messages";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSocket } from "@/app/hooks/useSocket";

export function ChatPage() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { socket, isConnected, joinMatch, leaveMatch, sendMessage, sendTyping, markMessageAsRead } = useSocket();

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];
  const otherUser = selectedMatch?.otherUser;

  // Fetch matches on mount
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const data = await matchesApi.getMyMatches();
        setMatches(data);
        if (data.length > 0 && !selectedMatchId) {
          setSelectedMatchId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
        showToast("error", "Failed to load matches");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Fetch messages when selected match changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedMatchId) return;
      
      try {
        const data = await messagesApi.getByMatchId(selectedMatchId);
        setMessages(data);
        
        // Mark unread messages as read
        data.forEach((msg) => {
          if (!msg.is_read && msg.sender_id !== user?.id) {
            markMessageAsRead(msg.id, selectedMatchId);
          }
        });
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [selectedMatchId, user?.id, markMessageAsRead]);

  // Join match room when selected match changes
  useEffect(() => {
    if (!selectedMatchId || !socket) return;

    joinMatch(selectedMatchId);

    // Set up WebSocket event listeners
    socket.on("new_message", (message: Message) => {
      setMessages((prev) => {
        // Check if message already exists
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      
      // Mark message as read if from other user
      if (message.sender_id !== user?.id) {
        markMessageAsRead(message.id, selectedMatchId);
      }
    });

    socket.on("message_sent", ({ messageId, tempId }: { messageId: string; tempId?: string }) => {
      // Update temp message with real ID
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, id: messageId } : msg
        )
      );
    });

    socket.on("message_read", ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    });

    socket.on("typing", ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (userId !== user?.id) {
        setOtherUserTyping(isTyping);
      }
    });

    socket.on("user_status", ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      if (userId === otherUser?.id) {
        setOtherUserOnline(isOnline);
      }
    });

    socket.on("user_joined", ({ userId }: { userId: string }) => {
      if (userId === otherUser?.id) {
        setOtherUserOnline(true);
      }
    });

    socket.on("user_left", ({ userId }: { userId: string }) => {
      if (userId === otherUser?.id) {
        setOtherUserOnline(false);
      }
    });

    socket.on("error", ({ message }: { message: string }) => {
      console.error("Socket error:", message);
      showToast("error", message);
    });

    return () => {
      leaveMatch(selectedMatchId);
      socket.off("new_message");
      socket.off("message_sent");
      socket.off("message_read");
      socket.off("typing");
      socket.off("user_status");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("error");
    };
  }, [selectedMatchId, socket, joinMatch, leaveMatch, user?.id, otherUser?.id, markMessageAsRead, showToast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedMatchId) return;

    const tempId = `temp-${Date.now()}`;
    const content = messageInput.trim();
    
    setIsSending(true);
    
    // Optimistically add message to UI
    const tempMessage: Message = {
      id: tempId,
      match_id: selectedMatchId,
      sender_id: user?.id || "",
      content: content,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: user?.id || "",
        name: user?.name || "",
        avatar: user?.avatar || "",
      },
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setMessageInput("");
    setIsTyping(false);

    try {
      if (isConnected && socket) {
        // Send via WebSocket
        sendMessage(selectedMatchId, content, tempId);
      } else {
        // Fallback to HTTP API
        await messagesApi.send({
          match_id: selectedMatchId,
          content: content,
        });
        // Refresh messages
        const updatedMessages = await messagesApi.getByMatchId(selectedMatchId);
        setMessages(updatedMessages);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      showToast("error", "Failed to send message");
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    if (!isTyping && selectedMatchId && isConnected) {
      setIsTyping(true);
      sendTyping(selectedMatchId, true);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedMatchId && isConnected) {
        sendTyping(selectedMatchId, false);
      }
    }, 2000);
  };

  const handleTemplateClick = (template: string) => {
    setMessageInput(template);
    setShowTemplates(false);
  };

  const messageTemplates = [
    "When can we meet?",
    "What time works for you?",
    "I'm available this weekend",
    "Can we schedule a session?",
  ];

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--text-primary)' }}>No matches yet</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Start matching with people to begin chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Sidebar - 20% width */}
      <div 
        className="w-[20%] min-w-[200px] rounded-2xl border flex flex-col overflow-hidden"
        style={{ 
          backgroundColor: 'var(--card)',
          borderColor: '#2D2D2D',
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: '#2D2D2D' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#E0E0E0' }}>
            Messages
          </h2>
          <p className="text-sm" style={{ color: '#BDBDBD' }}>
            {matches.length} active conversation{matches.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => setSelectedMatchId(match.id)}
              className={`w-full p-3 flex items-center gap-3 transition-all text-left border-b ${
                selectedMatchId === match.id ? "bg-[var(--section-bg)]" : "hover:bg-[var(--section-bg)]/50"
              }`}
              style={{ borderColor: '#2D2D2D' }}
            >
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${match.otherUser?.avatar})` }}
                />
              </div>
                <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: '#E0E0E0' }}>
                  {match.otherUser?.name || 'Unknown'}
                </p>
                <p className="text-xs truncate" style={{ color: '#757575' }}>
                  Click to chat
                </p>
              </div>

              {selectedMatchId === match.id && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-indigo)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window - 80% width */}
      <div 
        className="flex-1 rounded-2xl border flex flex-col overflow-hidden"
        style={{ 
          backgroundColor: 'var(--card)',
          borderColor: '#2D2D2D',
        }}
      >
        {/* Chat Header */}
        <div 
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: '#2D2D2D' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url(${otherUser?.avatar})` }}
            />
            <div>
              <h3 className="font-semibold" style={{ color: '#E0E0E0', fontWeight: 500 }}>
                {otherUser?.name || 'Unknown'}
              </h3>
              <div className="flex items-center gap-2">
                {otherUserOnline ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-500">Online</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span className="text-xs text-gray-500">Offline</span>
                  </>
                )}
                {!isConnected && (
                  <span className="text-xs text-orange-500 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    Reconnecting...
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-lg transition-colors hover:bg-[var(--section-bg)]"
              onClick={() => showToast("info", "Session scheduling coming soon!")}
            >
              <Calendar className="w-5 h-5" style={{ color: '#BDBDBD' }} />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-[var(--section-bg)]">
              <Phone className="w-5 h-5" style={{ color: '#BDBDBD' }} />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-[var(--section-bg)]">
              <Video className="w-5 h-5" style={{ color: '#BDBDBD' }} />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-[var(--section-bg)]">
              <MoreVertical className="w-5 h-5" style={{ color: '#BDBDBD' }} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center justify-center my-4">
                <div className="h-px flex-1" style={{ backgroundColor: '#2D2D2D' }} />
                <span className="px-3 text-xs" style={{ color: '#757575' }}>
                  {formatDate(new Date(date))}
                </span>
                <div className="h-px flex-1" style={{ backgroundColor: '#2D2D2D' }} />
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {dateMessages.map((message, index) => {
                  const isMe = message.sender_id === user?.id;
                  const showAvatar = !isMe && (index === 0 || dateMessages[index - 1].sender_id !== message.sender_id);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {!isMe && showAvatar && (
                          <div
                            className="w-8 h-8 rounded-full bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: `url(${otherUser?.avatar})` }}
                          />
                        )}
                        {!isMe && !showAvatar && <div className="w-8" />}

                        <div
                          className={`px-4 py-2.5 rounded-2xl ${
                            isMe 
                              ? "rounded-br-md" 
                              : "rounded-bl-md"
                          }`}
                          style={{
                            backgroundColor: isMe ? 'rgba(108, 99, 255, 0.15)' : '#2D2D2D',
                            border: isMe ? '1px solid rgba(108, 99, 255, 0.3)' : '1px solid #3D3D3D',
                          }}
                        >
                          <p style={{ color: '#E0E0E0', fontWeight: 400 }}>{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                            <span className="text-[10px]" style={{ color: '#757575' }}>
                              {formatTime(new Date(message.created_at))}
                            </span>
                            {isMe && (
                              <>
                                {!message.is_read ? (
                                  <Check className="w-3 h-3" style={{ color: '#757575' }} />
                                ) : (
                                  <CheckCheck className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {otherUserTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl rounded-bl-md" style={{ backgroundColor: '#2D2D2D' }}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs" style={{ color: '#757575' }}>{otherUser?.name} is typing...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Templates */}
        {showTemplates && (
          <div 
            className="px-4 py-2 border-t"
            style={{ 
              backgroundColor: 'var(--section-bg)',
              borderColor: '#2D2D2D',
            }}
          >
            <div className="flex gap-2 overflow-x-auto pb-2">
              {messageTemplates.map((template) => (
                <button
                  key={template}
                  onClick={() => handleTemplateClick(template)}
                  className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors hover:opacity-80"
                  style={{ 
                    backgroundColor: 'rgba(108, 99, 255, 0.2)',
                    color: '#6C63FF',
                  }}
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: '#2D2D2D' }}
        >
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-lg transition-colors hover:bg-[var(--section-bg)]"
              onClick={() => showToast("info", "File attachment coming soon!")}
            >
              <Paperclip className="w-5 h-5" style={{ color: '#BDBDBD' }} />
            </button>
            <button 
              className="p-2 rounded-lg transition-colors hover:bg-[var(--section-bg)]"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <span className="text-sm" style={{ color: '#BDBDBD' }}>💬</span>
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`Plan your session with ${otherUser?.name || 'them'}...`}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[var(--accent-indigo)]/30 transition-all"
                style={{ 
                  backgroundColor: 'var(--section-bg)',
                  borderColor: '#2D2D2D',
                  color: '#E0E0E0',
                }}
              />
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!messageInput.trim() || isSending}
              size="sm"
              className="px-4"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
