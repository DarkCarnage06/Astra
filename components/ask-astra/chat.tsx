'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUp, ArrowUpRight, Copy, Eclipse, Plus, RotateCcw, Share2, Sparkles } from 'lucide-react';
import { toast } from '../../lib/toast';
import { Markdown } from '../ui/markdown';
import styles from '../../app/astra.module.css';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'What themes stand out in my career?',
  'What patterns show up in my relationships?',
  'What does my current Dasha highlight?',
  'What can I learn from my Moon sign?',
];

const DISMISSED_SESSION = 'astra:dismissed_chat';

export function AskAstraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'failed'>('loading');
  const [sending, setSending] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [error, setError] = useState<{ text: string; code?: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const transcript = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const requestInFlight = useRef(false);
  const locked = error?.code === 'limit_reached';

  useEffect(() => {
    const controller = new AbortController();
    async function loadConversation() {
      try {
        const res = await fetch('/api/ask', { signal: controller.signal, cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          setError({ text: res.status === 401 ? 'Sign in to open your conversation.' : 'Your conversation could not be loaded.', code: res.status === 401 ? 'unauthorized' : undefined });
          setStatus('failed');
          return;
        }

        let dismissed: string | null = null;
        try {
          dismissed = sessionStorage.getItem(DISMISSED_SESSION);
        } catch {
          // Chat still works when browser storage is unavailable.
        }
        const restore = data.sessionId && data.sessionId !== dismissed;
        setMessages(restore ? data.messages : []);
        setSessionId(restore ? data.sessionId : null);
        setStatus(data.hasChart ? 'ready' : 'missing');
      } catch {
        if (!controller.signal.aborted) {
          setError({ text: 'Your conversation could not be loaded. Check your connection and try again.' });
          setStatus('failed');
        }
      }
    }
    void loadConversation();
    return () => controller.abort();
  }, [loadAttempt]);

  useEffect(() => {
    if (transcript.current && (messages.length || pendingQuestion)) {
      transcript.current.scrollTop = transcript.current.scrollHeight;
    }
  }, [messages, pendingQuestion, sending]);

  function reload() {
    setStatus('loading');
    setError(null);
    setLoadAttempt((count) => count + 1);
  }

  async function send(question: string, replaceReplyId?: string) {
    const message = question.trim();
    if (status !== 'ready' || requestInFlight.current || (locked && !replaceReplyId) || (!message && !replaceReplyId)) return;

    requestInFlight.current = true;
    setError(null);
    setSending(true);
    if (!replaceReplyId) setPendingQuestion(message);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, replaceReplyId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || typeof data?.reply?.content !== 'string') {
        if (!replaceReplyId) setInput(message);
        setError({
          text: res.status === 401 ? 'Sign in to send your question.' : data?.message ?? 'Astra could not answer right now. Please try again.',
          code: res.status === 401 ? 'unauthorized' : data?.error,
        });
        return;
      }

      setSessionId(data.sessionId);
      if (replaceReplyId) {
        setMessages((previous) => previous.map((entry) => entry.id === replaceReplyId ? data.reply : entry));
      } else {
        setMessages((previous) => [...previous, { role: 'user', content: message }, data.reply]);
        setInput('');
      }
    } catch {
      if (!replaceReplyId) setInput(message);
      setError({ text: 'The connection was interrupted. Please try again.' });
    } finally {
      requestInFlight.current = false;
      setPendingQuestion(null);
      setSending(false);
    }
  }

  function newConversation() {
    if (requestInFlight.current) return;
    if (sessionId) {
      try {
        sessionStorage.setItem(DISMISSED_SESSION, sessionId);
      } catch {
        // New conversations can start without browser storage.
      }
    }
    setSessionId(null);
    setMessages([]);
    setInput('');
    setError(null);
    editor.current?.focus();
  }

  async function copy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Reply copied.');
    } catch {
      toast.error('Could not copy the reply. You can select and copy its text.');
    }
  }

  async function share(content: string) {
    if (!navigator.share) {
      await copy(content);
      return;
    }
    try {
      await navigator.share({ title: 'Ask Astra', text: content });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        toast.error('Could not share the reply. Try copying it instead.');
      }
    }
  }

  return (
    <section className={styles.chat} aria-label="Ask Astra conversation">
      <header className={styles.chatHeader}>
        <h1 className={styles.brand}><Eclipse size={23} aria-hidden="true" /> Ask Astra</h1>
        {status === 'ready' && messages.length > 0 && (
          <button type="button" disabled={sending} onClick={newConversation}><Plus size={17} aria-hidden="true" /> New chat</button>
        )}
      </header>

      <div ref={transcript} className={styles.transcript}>
        {status !== 'ready' || (!messages.length && !pendingQuestion) ? (
          <div className={styles.chatIntro}>
            <Sparkles size={28} aria-hidden="true" />
            <h2>{status === 'missing' ? 'Start with your chart.' : 'What’s on your mind?'}</h2>
            {status === 'loading' && <p role="status">Loading your chart and conversation…</p>}
            {status === 'missing' && (
              <>
                <p>Astra uses your saved Vedic birth chart to answer questions about your placements and planetary periods.</p>
                <Link className={styles.primary} href="/birth-form">Create my birth chart <ArrowRight size={16} aria-hidden="true" /></Link>
              </>
            )}
            {status === 'failed' && (
              <>
                <p role="alert">{error?.text}</p>
                {error?.code === 'unauthorized'
                  ? <Link className={styles.primary} href="/sign-in?redirect_url=%2Fask-astra">Sign in</Link>
                  : <button className={styles.primary} type="button" onClick={reload}>Try again</button>}
              </>
            )}
            {status === 'ready' && (
              <>
                <p>Ask about a placement in your chart or a chapter in your life. Pick a question to get started.</p>
                <div className={styles.suggestions} aria-label="Suggested questions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} type="button" disabled={sending || locked} onClick={() => {
                      setInput(suggestion);
                      editor.current?.focus();
                    }}>
                      {suggestion} <ArrowUpRight size={15} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={styles.messageList} role="log" aria-label="Conversation">
            {messages.map((message, index) => (
              <article key={message.id ?? index} className={styles.message} data-role={message.role}>
                <h2>{message.role === 'user' ? 'You' : 'Astra'}</h2>
                {message.role === 'user' ? <p>{message.content}</p> : (
                  <>
                    <Markdown content={message.content} />
                    <div className={styles.messageActions}>
                      <button type="button" onClick={() => void copy(message.content)}><Copy size={14} aria-hidden="true" /> Copy</button>
                      <button type="button" onClick={() => void share(message.content)}><Share2 size={14} aria-hidden="true" /> Share</button>
                      {message.id && index === messages.length - 1 && (
                        <button type="button" disabled={sending} onClick={() => void send('', message.id)}>
                          <RotateCcw size={14} aria-hidden="true" /> Regenerate
                        </button>
                      )}
                    </div>
                  </>
                )}
              </article>
            ))}
            {pendingQuestion && <article className={styles.message} data-role="user"><h2>You</h2><p>{pendingQuestion}</p></article>}
            {sending && <p className={styles.status} role="status">Astra is preparing a response…</p>}
          </div>
        )}
      </div>

      {status === 'ready' && (
        <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); void send(input); }}>
          {error && (
            <div className={styles.error} role="alert">
              {error.text}
              {locked && <Link href="/dashboard/billing">View plans</Link>}
              {error.code === 'chart_not_found' && <Link href="/birth-form">Create chart</Link>}
              {error.code === 'unauthorized' && <Link href="/sign-in?redirect_url=%2Fask-astra">Sign in</Link>}
              {error.code === 'session_changed' && <button type="button" onClick={reload}>Reload conversation</button>}
              {error.code === 'session_not_found' && <button type="button" onClick={newConversation}>Start a new chat</button>}
            </div>
          )}
          <div className={styles.composerRow}>
            <textarea
              ref={editor}
              aria-label="Your question for Astra"
              placeholder="Ask about your chart…"
              value={input}
              rows={1}
              maxLength={1500}
              disabled={locked}
              readOnly={sending}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send(input);
                }
              }}
            />
            <button className={styles.primary} type="submit" aria-label="Send question" disabled={!input.trim() || sending || locked}>
              <ArrowUp size={21} aria-hidden="true" />
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
