import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Trash2, Moon, Sun, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Message } from './types';

const API_URL = 'https://streamchat-backend-pdnz.onrender.com/chat';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Streaming fetch
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: accumulated } : msg
          )
        );
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  'Error: Could not reach the AI backend. Make sure FastAPI is running at http://localhost:8000',
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear all messages?')) {
      setMessages([]);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-screen transition-colors duration-300 font-sans',
        isDarkMode ? 'bg-[#0a0a0a] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
      )}
    >
      {/* Header */}
      <header
        className={cn(
          'flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10 backdrop-blur-md',
          isDarkMode ? 'border-zinc-800 bg-[#0a0a0a]/80' : 'border-zinc-200 bg-white/80'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">StreamChat AI</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              'p-2 rounded-full transition-colors',
              isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
            )}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={clearChat}
            className={cn(
              'p-2 rounded-full transition-colors text-zinc-500 hover:text-red-500',
              isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
            )}
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat History */}
      <main className="flex-1 overflow-y-auto px-4 py-8 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 opacity-50">
              <Bot className="w-16 h-16" />
              <div>
                <h2 className="text-2xl font-medium">How can I help you today?</h2>
                <p className="text-sm">Start a conversation with the streaming AI.</p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex gap-4 group',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1',
                    message.role === 'user' ? 'bg-zinc-700' : 'bg-orange-600'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                <div
                  className={cn(
                    'max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-zinc-800 text-zinc-100 rounded-tr-none'
                      : isDarkMode
                      ? 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800'
                      : 'bg-white text-zinc-800 rounded-tl-none border border-zinc-200 shadow-sm'
                  )}
                >
                  {message.content || (isLoading && message.role === 'assistant' && (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                    </div>
                  ))}
                  {message.content &&
                    message.role === 'assistant' &&
                    isLoading &&
                    messages[messages.length - 1].id === message.id && (
                      <span className="inline-block w-2 h-4 ml-1 bg-orange-500 animate-pulse align-middle" />
                    )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer
        className={cn(
          'p-6 border-t',
          isDarkMode ? 'border-zinc-800 bg-[#0a0a0a]' : 'border-zinc-200 bg-white'
        )}
      >
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message StreamChat..."
            disabled={isLoading}
            rows={1}
            className={cn(
              'w-full bg-transparent border rounded-2xl px-5 py-4 pr-14 focus:outline-none focus:ring-2 transition-all resize-none min-h-[56px] max-h-48',
              isDarkMode
                ? 'border-zinc-700 focus:ring-orange-500/50 focus:border-orange-500'
                : 'border-zinc-300 focus:ring-orange-500/30 focus:border-orange-500',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              'absolute right-3 bottom-3 p-2 rounded-xl transition-all',
              input.trim() && !isLoading
                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            )}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <p className="text-[10px] text-center mt-3 text-zinc-500 uppercase tracking-widest font-semibold">
          AI can make mistakes. Check important info.
        </p>
      </footer>
    </div>
  );
}