import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Send, Bot, User, Sparkles, AlertCircle, Database,
  ArrowRight, RefreshCw, MessageSquarePlus, Trash2
} from 'lucide-react';
import {
  getChatConversations, createChatConversation, getConversationDetail,
  sendChatMessage, deleteConversation, getChatStatus
} from '../../services/api';
import { ChatConversation, ChatMessage } from '../../types';

interface GeminiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiDrawer: React.FC<GeminiDrawerProps> = ({ isOpen, onClose }) => {
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
    "How many unresolved checkout discrepancies are there?",
    "Did the verification image confirm that task TSK-098 was resolved?",
    "Which store zones have the highest recorded activity?",
    "What optical evidence supports the highest-priority recommendation?"
  ];

  useEffect(() => {
    if (isOpen) {
      loadStatusAndConversations();
    }
  }, [isOpen]);

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

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading || !activeConvId) return;

    setInput('');
    // Optimistic user message
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
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-slide-left">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm tracking-tight text-white">RetailVision AI Copilot</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
                {status?.model || 'Gemini 2.5'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center space-x-1">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Grounded in Live Store SQLite Records</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={startNewConversation}
            title="New Conversation"
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="py-6 px-2 text-center">
            <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Retail Intelligence Assistant</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
              Ask questions about shelf audits, backroom inventory, priority scores, planogram gaps, or checkout reconciliation. Answers are strictly grounded in store database records.
            </p>

            <div className="text-left">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Suggested Inquiries:</p>
              <div className="space-y-1.5">
                {suggestedPrompts.slice(0, 4).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left text-xs bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 p-2.5 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const action = msg.action_metadata || (msg.action_metadata_json ? JSON.parse(msg.action_metadata_json) : null);

            return (
              <div key={idx} className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${isUser ? 'bg-slate-800 text-white' : 'bg-gradient-to-tr from-sky-600 to-teal-500 text-white'}`}>
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Structured Action Dispatcher Button */}
                  {action && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Suggested Action:</span>
                      <button
                        onClick={() => handleActionClick(action)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-[11px] border border-sky-200 transition-colors cursor-pointer"
                      >
                        <span>{action.label || 'View in App'}</span>
                        <ArrowRight className="w-3 h-3" />
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
            <span>Grounding context & synthesizing response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about shelf audits, tasks, inventory, priorities..."
            rows={2}
            className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="h-10 px-3.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
          <span>Enter to send, Shift+Enter for newline</span>
          <span className="text-emerald-600 font-medium">Strict DB Grounding Active</span>
        </p>
      </div>
    </div>
  );
};
