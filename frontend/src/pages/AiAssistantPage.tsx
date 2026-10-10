import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, User, Sparkles, Send, RefreshCw, MessageSquarePlus,
  Trash2, Database, ArrowRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  getChatConversations, createChatConversation, getConversationDetail,
  sendChatMessage, deleteConversation, getChatStatus
} from '../services/api';
import { ChatConversation, ChatMessage } from '../types';

export const AiAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ gemini_available: boolean; model: string; api_key_configured: boolean } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Which shelves should we investigate first based on current records?",
    "Why is task TSK-101 prioritized over TSK-102?",
    "Explain the latest planogram mismatch on Shelf B2.",
    "Which shelves need restocking that have verified backroom inventory available?",
    "Show unresolved tasks that have verified inventory available.",
    "How many unresolved checkout discrepancies are there?",
    "Did the verification image confirm that task TSK-098 was resolved?",
    "Which store zones have the highest recorded activity?",
    "What evidence supports the highest-priority recommendation?"
  ];

  useEffect(() => {
    loadStatusAndConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadStatusAndConversations = async () => {
    try {
      const st = await getChatStatus();
      setStatus(st);
      const convs = await getChatConversations();
      setConversations(convs);
      if (convs.length > 0) {
        loadConversation(convs[0].id);
      } else {
        startNewConversation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      setActiveConvId(id);
      const detail = await getConversationDetail(id);
      setMessages(detail.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewConversation = async () => {
    try {
      const newConv = await createChatConversation("Store Operations Chat");
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) {
        const remaining = conversations.filter(c => c.id !== id);
        if (remaining.length > 0) loadConversation(remaining[0].id);
        else startNewConversation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading || !activeConvId) return;

    setInput('');
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: activeConvId,
      sender: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await sendChatMessage(activeConvId, text);
      setMessages(prev => [...prev, res]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        conversation_id: activeConvId,
        sender: 'assistant',
        content: `**Error communicating with Gemini Copilot**: ${err.message}`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (action: any) => {
    if (action?.target) {
      navigate(action.target);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">RetailVision AI Copilot</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">
                {status?.model || 'Gemini 2.5'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Conversational decision support grounded in live SQLite database records
            </p>
          </div>
        </div>

        <button
          onClick={startNewConversation}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: Conversation History */}
        <div className="w-64 glass-card rounded-xl border border-slate-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={`p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between group ${
                  activeConvId === c.id ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate flex-1">{c.title || `Chat #${c.id}`}</span>
                <button
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Message Stream & Input */}
        <div className="flex-1 glass-card rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
            {messages.length === 0 ? (
              <div className="py-12 px-4 text-center max-w-xl mx-auto space-y-4">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Welcome to RetailVision AI Copilot</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  I can answer operational inquiries about your shelf audits, backroom inventory availability, priority score rationale, checkout scale variances, and store traffic. Select an inquiry below or ask a question:
                </p>

                <div className="grid grid-cols-2 gap-2 text-left pt-2">
                  {suggestedPrompts.slice(0, 6).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="text-xs p-3 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                const action = msg.action_metadata || (msg.action_metadata_json ? JSON.parse(msg.action_metadata_json) : null);

                return (
                  <div key={idx} className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      isUser ? 'bg-slate-800 text-white' : 'bg-gradient-to-tr from-sky-600 to-teal-500 text-white'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`max-w-[75%] rounded-xl p-4 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {action && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Actionable Link:</span>
                          <button
                            onClick={() => handleActionClick(action)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-xs border border-sky-200 transition-colors cursor-pointer"
                          >
                            <span>{action.label || 'Open Section'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 py-2">
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center animate-spin">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <span>Grounding context & synthesizing operational response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-end space-x-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about shelf audits, tasks, inventory, priorities..."
                rows={2}
                className="flex-1 text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="h-11 px-5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                <Database className="w-3 h-3" />
                <span>Database Context Retrieval Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
