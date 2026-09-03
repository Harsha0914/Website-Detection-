import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, PlusCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export function ChatBox({
  business,
  conversationType = 'WEBSITE_IMPROVEMENT',
  onRequestWebsite = null,
}) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isImprovement = conversationType === 'WEBSITE_IMPROVEMENT';

  const quickQuestions = isImprovement
    ? [
        'How can I improve mobile loading speed?',
        'What local SEO improvements do you suggest?',
        'How can I add WhatsApp ordering?',
        'How do I improve customer conversion rates?',
      ]
    : [
        'Why does a grocery store need a website?',
        'What pages should my shop website have?',
        'How can customers order online?',
        'What are the key features for a local shop?',
      ];

  // Initialize or fetch conversation
  useEffect(() => {
    if (!business?.id) return;
    const initChat = async () => {
      try {
        const res = await api.post('/chat/conversations', {
          business_id: business.id,
          conversation_type: conversationType,
        });
        setConversation(res.data);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Failed to initialize conversation', err);
      }
    };
    initChat();
  }, [business?.id, conversationType]);

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || inputMessage;
    if (!msg.trim() || !conversation?.id || loading) return;

    setInputMessage('');
    setLoading(true);

    // Optimistically append user message
    const tempUserMsg = {
      id: Date.now(),
      sender_type: 'USER',
      message: msg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.post(`/chat/conversations/${conversation.id}/messages`, {
        message: msg,
      });
      // Response returns [userMsg, assistantMsg]
      const [savedUserMsg, assistantMsg] = res.data;
      setMessages((prev) => [...prev.slice(0, -1), savedUserMsg, assistantMsg]);
    } catch (err) {
      console.error('Failed to send message', err);
      const errMsg = {
        id: Date.now() + 1,
        sender_type: 'ASSISTANT',
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[640px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30">
            {isImprovement ? <Sparkles className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold">
              {isImprovement ? 'Website Improvement Assistant' : 'Website Creation Assistant'}
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              Advising for: <span className="text-slate-200 font-medium">{business?.name}</span>
            </p>
          </div>
        </div>

        {onRequestWebsite && !isImprovement && (
          <button
            onClick={onRequestWebsite}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-all"
          >
            <span>Request Proposal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((m, idx) => {
          const isUser = m.sender_type === 'USER';
          return (
            <div
              key={m.id || idx}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  isUser ? 'bg-slate-800 text-white' : 'bg-brand-600 text-white shadow-sm'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.message}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic">
            <Bot className="w-4 h-4 text-brand-600 animate-bounce" />
            <span>Assistant is typing recommendations...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 pl-1">
          Suggestions:
        </span>
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q)}
            disabled={loading}
            className="shrink-0 text-xs px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-transparent rounded-full text-slate-600 transition-all disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or request recommendations..."
          className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || loading}
          className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
