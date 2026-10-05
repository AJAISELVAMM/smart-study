import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, User } from 'lucide-react';
import { api, getErrorMessage } from '../services/api.js';
import { useStudy } from '../context/StudyContext.jsx';
import ContentText from './ContentText.jsx';
import LoadingState from './LoadingState.jsx';

const suggestedQuestions = [
  'What are the most important concepts?',
  'Explain this topic simply.',
  'What formulas should I remember?',
  'Give me a 5-mark answer for this topic.',
  'What should I study first?',
];

export default function AskAI({ sessionId }) {
  const { activeSession, setActiveSession } = useStudy();
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const messages = activeSession?.chatMessages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' }); }, [messages.length, sending]);

  async function sendQuestion(value = question) {
    const normalized = String(value || '').trim();
    if (!normalized || sending || !sessionId) return;
    setSending(true);
    setError('');
    setQuestion('');
    try {
      const response = await api.post('/chat', { sessionId, question: normalized });
      setActiveSession((current) => String(current?.id || current?.sessionId) === String(sessionId)
        ? { ...current, chatMessages: response.data.data.chatMessages || [] }
        : current);
    } catch (requestError) {
      setError(await getErrorMessage(requestError));
      setQuestion(normalized);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion();
  }

  return (
    <div className="tab-content ask-ai-content">
      <div className="tab-heading-row">
        <div><span className="section-kicker">GROUNDED STUDY ASSISTANT</span><h2>Ask AI</h2><p className="muted">Answers use this saved session’s study source. Missing details are identified clearly.</p></div>
      </div>
      <div className="chat-panel panel">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome"><span className="chat-welcome-icon"><MessageCircle size={22} /></span><h3>What would you like to understand?</h3><p>Ask anything about this study material. The answer is grounded in your source.</p></div>
          ) : messages.map((item) => (
            <div className={`chat-row ${item.role === 'user' ? 'from-user' : 'from-assistant'}`} key={item.id || `${item.role}-${item.createdAt}`}>
              <span className="chat-avatar">{item.role === 'user' ? <User size={16} /> : <Bot size={16} />}</span>
              <div className="chat-bubble"><ContentText text={item.message || item.content} /></div>
            </div>
          ))}
          {sending && <div className="chat-thinking"><span className="thinking-dots"><i /><i /><i /></span><span>Checking the study material…</span></div>}
          <div ref={bottomRef} />
        </div>
        {messages.length === 0 && <div className="suggested-prompts"><div className="suggested-label"><Sparkles size={14} /> Suggested questions</div><div className="suggestion-grid">
          {suggestedQuestions.map((item) => <button key={item} type="button" className="suggestion-button" onClick={() => sendQuestion(item)} disabled={sending}>{item}</button>)}
        </div></div>}
        {error && <div className="chat-error" role="alert">{error}</div>}
        <form className="chat-compose" onSubmit={handleSubmit}>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about this material…" aria-label="Ask a question about the study material" maxLength={2000} disabled={sending} />
          <button className="button button-primary send-button" type="submit" aria-label="Send question" disabled={sending || !question.trim()}><Send size={16} /> <span>Send</span></button>
        </form>
        <div className="chat-footnote">Grounded in your saved material · Conversation is saved with this session</div>
      </div>
    </div>
  );
}
