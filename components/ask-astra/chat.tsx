'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, AlertCircle, Bot, User, Trash2, ArrowRight } from 'lucide-react';
import { loadBirthDetails, loadChartResponse } from '../../lib/storage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  { text: 'How will the current Dasha affect my career?', category: 'career' },
  { text: 'Explain the placement of Venus in my chart.', category: 'relationship' },
  { text: 'What does my Moon Nakshatra say about my mind?', category: 'general' },
  { text: 'What financial potential does my chart reveal?', category: 'finance' },
];

export function AskAstraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/ask');
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            setSessionId(data.sessionId);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    console.log('[Frontend] Submit fired. Message:', textToSend);
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMsg = textToSend.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const birth = loadBirthDetails();
      const chart = loadChartResponse();

      if (!birth || !chart) {
        console.error('[Frontend] Validation failed: Missing birth or chart data.');
        setError('Please generate your birth chart first before chatting with Astra.');
        setLoading(false);
        return;
      }

      console.log('[Frontend] API called: POST /api/ask');
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
          birth,
          chart,
          sessionId,
        }),
      });

      if (!res.ok) {
        let errMsg = 'Failed to get response from Astra.';
        try {
          const errData = await res.json();
          if (errData.message) errMsg = errData.message;
          else if (errData.error) errMsg = errData.error;
        } catch(e) {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      console.log('[Frontend] API response received', data);
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      console.log('[Frontend] Frontend rendered assistant message');
    } catch (err) {
      console.error('[Frontend] Fetch failed or error thrown:', err);
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    // Let's create a new session next time they send a message
  };

  const birth = typeof window !== 'undefined' ? loadBirthDetails() : null;

  if (!birth) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
          <Sparkles size={24} />
        </div>
        <h3 className="font-display text-xl font-semibold text-white">Generate Your Chart First</h3>
        <p className="mt-2 max-w-sm text-sm text-[#B8BCC8]">
          To ask Astra personalized questions about your life, you need to calculate your sidereal birth chart first.
        </p>
        <a
          href="/birth-form"
          className="mt-5 flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#D4AF37]/90"
        >
          Generate Chart
          <ArrowRight size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-4xl flex-col rounded-[24px] border border-white/10 bg-white/[0.03] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-white uppercase tracking-wider">Ask Astra AI</h1>
            <p className="text-[10px] text-[#B8BCC8]">Personalized cosmic dialog with your birth chart context</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-[#B8BCC8]/60 transition hover:text-red-400"
            title="Reset conversation"
          >
            <Trash2 size={13} />
            Reset
          </button>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col justify-center space-y-8"
            >
              <div className="text-center max-w-md mx-auto space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Cosmic Oracle</p>
                <h2 className="font-display text-2xl font-semibold text-white">How can Astra guide you today?</h2>
                <p className="text-xs text-[#B8BCC8]">
                  Ask about career, love, relationships, life chapters or health. Your birth chart data is automatically enriched with every prompt.
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid gap-3 sm:grid-cols-2 max-w-xl mx-auto w-full">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s.text)}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-xs text-[#B8BCC8] transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 hover:text-white"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3.5 ${isUser ? 'justify-end' : ''}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Bot size={15} />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3.5 text-sm leading-6 max-w-[80%] ${
                    isUser
                      ? 'border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-white'
                      : 'border border-white/10 bg-black/30 text-[#B8BCC8]'
                  }`}
                >
                  {m.content}
                </div>
                {isUser && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[#B8BCC8]">
                    <User size={15} />
                  </div>
                )}
              </motion.div>
            );
          })}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                <Bot size={15} />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37]" />
              </div>
            </motion.div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-400/20 bg-red-400/8 p-4 text-xs text-red-400">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2 border-t border-white/10 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Astra about your chart..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-[#B8BCC8]/50 outline-none transition focus:border-[#D4AF37]/40 focus:ring-1 focus:ring-[#D4AF37]/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37] text-black transition hover:bg-[#D4AF37]/90 disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
