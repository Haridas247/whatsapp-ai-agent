'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Bot,
  UserCheck,
  Send,
  Phone,
  ShieldAlert,
  Clock,
  Sparkles,
  Search,
  RefreshCw,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

interface Conversation {
  id: string;
  status: 'BOT' | 'HUMAN_HANDOFF' | 'RESOLVED';
  state_step: string;
  updated_at: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  messages: Array<{
    id: string;
    message: string;
    created_at: string;
    sender: 'CUSTOMER' | 'ASSISTANT' | 'HUMAN';
  }>;
}

interface Message {
  id: string;
  sender: 'CUSTOMER' | 'ASSISTANT' | 'HUMAN';
  message: string;
  message_type: string;
  created_at: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [simulating, setSimulating] = useState(false);
  const [patientInput, setPatientInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const lastMessage = messages[messages.length - 1];
  const isAwaitingBotReply =
    botTyping ||
    simulating ||
    (activeConv?.status === 'BOT' &&
      lastMessage?.sender === 'CUSTOMER' &&
      Date.now() - new Date(lastMessage.created_at).getTime() < 10000);

  const handleSimulatePatient = async (text: string) => {
    if (!text.trim() || simulating) return;
    try {
      setSimulating(true);
      setBotTyping(true);
      const phone = activeConv?.customer.phone || '919876543210';
      const name = activeConv?.customer.name || 'Rahul';

      // Immediately render optimistic customer message
      const optimisticCustomerMsg: Message = {
        id: `opt_${Date.now()}`,
        sender: 'CUSTOMER',
        message: text.trim(),
        message_type: 'text',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticCustomerMsg]);

      await fetchApi('/api/simulator/inbound', {
        method: 'POST',
        body: JSON.stringify({ phone, name, text }),
      });
      await loadConversations(true);
      if (selectedIdRef.current) await loadMessages(selectedIdRef.current, true);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
      setBotTyping(false);
    }
  };

  const loadConversations = async (silent = false) => {
    try {
      if (!silent && conversations.length === 0) setLoadingList(true);
      const url = statusFilter === 'ALL' ? '/api/conversations' : `/api/conversations?status=${statusFilter}`;
      const data = await fetchApi(url);
      setConversations(data);
      if (data.length > 0 && !selectedIdRef.current) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  const loadMessages = async (convId: string, silent = false) => {
    try {
      if (!silent) setLoadingChat(true);
      const data = await fetchApi(`/api/conversations/${convId}/messages`);
      const newMessages: Message[] = data.messages || [];

      setMessages((prev) => {
        if (
          prev.length === newMessages.length &&
          prev.every((m, i) => m.id === newMessages[i]?.id)
        ) {
          return prev;
        }
        // Auto-hide typing indicator as soon as assistant response message is received and rendered
        if (newMessages.length > 0 && newMessages[newMessages.length - 1]?.sender === 'ASSISTANT') {
          setBotTyping(false);
        }
        return newMessages;
      });
      setActiveConv(data.conversation || null);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!silent) setLoadingChat(false);
    }
  };

  useEffect(() => {
    loadConversations(false);
  }, [statusFilter]);

  useEffect(() => {
    if (selectedId) {
      setBotTyping(false);
      loadMessages(selectedId, false);
    }
  }, [selectedId]);

  // Silent background polling every 5 seconds without triggering loading spinners or flicker
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations(true);
      if (selectedIdRef.current) {
        loadMessages(selectedIdRef.current, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAwaitingBotReply]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedId || sending) return;

    try {
      setSending(true);
      const newMsg = await fetchApi(`/api/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: inputText.trim() }),
      });
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleToggleHandoff = async () => {
    if (!selectedId || !activeConv) return;
    const nextAction = activeConv.status === 'HUMAN_HANDOFF' ? 'RETURN_TO_BOT' : 'TAKEOVER';

    try {
      await fetchApi(`/api/conversations/${selectedId}/takeover`, {
        method: 'POST',
        body: JSON.stringify({ action: nextAction }),
      });
      await loadMessages(selectedId);
      await loadConversations();
    } catch (err) {
      console.error('Failed to toggle handoff:', err);
    }
  };

  const handleDeleteConversation = async (convId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await fetchApi(`/api/conversations/${convId}`, { method: 'DELETE' });
      if (selectedId === convId) {
        setSelectedId(null);
        setActiveConv(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleClearAllConversations = async () => {
    if (!confirm('Are you sure you want to delete ALL conversations and test chats? This cannot be undone.')) return;
    try {
      await fetchApi('/api/conversations', { method: 'DELETE' });
      setSelectedId(null);
      setActiveConv(null);
      setMessages([]);
      await loadConversations();
    } catch (err) {
      console.error('Failed to clear all conversations:', err);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = search.toLowerCase();
    return c.customer.name.toLowerCase().includes(q) || c.customer.phone.includes(q);
  });

  return (
    <div className="flex-1 flex h-[calc(100vh)] overflow-hidden bg-gray-50">
      {/* Left Sidebar: Conversation List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white shrink-0 shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              WhatsApp Chats
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearAllConversations}
                title="Clear all chats"
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => loadConversations()}
                title="Refresh"
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1">
            {['ALL', 'BOT', 'HUMAN_HANDOFF'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  statusFilter === tab
                    ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab === 'HUMAN_HANDOFF' ? 'Escalated' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loadingList && conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">Loading chats...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">No conversations found</div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = selectedId === c.id;
              const lastMsg = c.messages?.[0]?.message || 'No messages';

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-2 border-blue-600' : 'hover:bg-gray-50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-gray-900 truncate">{c.customer.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          c.status === 'HUMAN_HANDOFF'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {c.status === 'HUMAN_HANDOFF' ? 'Escalated' : 'AI Bot'}
                      </span>
                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        title="Delete this chat"
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {isSelected && isAwaitingBotReply ? (
                    <div className="text-[11px] text-blue-600 italic flex items-center gap-1.5 mb-1">
                      <span>typing...</span>
                      <span className="inline-flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-blue-600 animate-wa-dot-1"></span>
                        <span className="w-1 h-1 rounded-full bg-blue-600 animate-wa-dot-2"></span>
                        <span className="w-1 h-1 rounded-full bg-blue-600 animate-wa-dot-3"></span>
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500 truncate mb-1">{lastMsg}</div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span>{c.customer.phone}</span>
                    <span>{new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat Window */}
      {selectedId && activeConv ? (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-sm text-blue-700">
                {activeConv.customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-gray-900">{activeConv.customer.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeConv.status === 'HUMAN_HANDOFF'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}
                  >
                    {activeConv.status === 'HUMAN_HANDOFF' ? 'Human Agent Active' : 'AI Bot Active'}
                  </span>
                </div>
                {isAwaitingBotReply ? (
                  <p className="text-xs text-blue-600 flex items-center gap-1.5 font-medium italic mt-0.5">
                    <span>typing...</span>
                    <span className="inline-flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-blue-600 animate-wa-dot-1"></span>
                      <span className="w-1 h-1 rounded-full bg-blue-600 animate-wa-dot-2"></span>
                      <span className="w-1 h-1 rounded-full bg-blue-600 animate-wa-dot-3"></span>
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 flex items-center gap-2 font-mono mt-0.5">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {activeConv.customer.phone} • Step: {activeConv.state_step}
                  </p>
                )}
              </div>
            </div>

            {/* Takeover / Return to Bot Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleHandoff}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm border ${
                  activeConv.status === 'HUMAN_HANDOFF'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
                    : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {activeConv.status === 'HUMAN_HANDOFF' ? (
                  <>
                    <Bot className="h-3.5 w-3.5" />
                    Return to AI Bot
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5" />
                    Take Over Chat (Mute Bot)
                  </>
                )}
              </button>

              <button
                onClick={() => handleDeleteConversation(activeConv.id)}
                title="Delete this chat"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 transition-all shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Chat
              </button>
            </div>
          </div>

          {/* WhatsApp Inbound Patient Simulator Bar */}
          <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex flex-wrap items-center gap-2 text-xs shadow-sm z-10">
            <span className="text-gray-600 font-medium flex items-center gap-1 shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Simulate Patient Message:
            </span>
            <button
              onClick={() => handleSimulatePatient('Vanakkam, doctor ku appointment venum')}
              disabled={simulating}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-medium transition-colors shadow-sm"
            >
              🩺 "Vanakkam, doctor ku appointment venum"
            </button>
            <button
              onClick={() => handleSimulatePatient('What are your clinic timings and address?')}
              disabled={simulating}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-medium transition-colors shadow-sm"
            >
              🕒 "Clinic timings & address"
            </button>
            <button
              onClick={() => handleSimulatePatient('I have severe bleeding after tooth extraction, please help')}
              disabled={simulating}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-medium transition-colors shadow-sm"
            >
              🚨 "Severe bleeding after extraction"
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (patientInput.trim()) {
                  handleSimulatePatient(patientInput.trim());
                  setPatientInput('');
                }
              }}
              className="flex items-center gap-1.5 ml-auto"
            >
              <input
                type="text"
                placeholder="Type as Patient..."
                value={patientInput}
                onChange={(e) => setPatientInput(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-2.5 py-1 text-[11px] text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-44 shadow-sm"
              />
              <button
                type="submit"
                disabled={!patientInput.trim() || simulating}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-md text-[11px] transition-colors shadow-sm"
              >
                Send as Patient
              </button>
            </form>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingChat && messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No message history</div>
            ) : (
              messages.map((m) => {
                const isCustomer = m.sender === 'CUSTOMER';
                const isHumanStaff = m.sender === 'HUMAN';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-md rounded-xl p-4 text-xs leading-relaxed space-y-1 shadow-sm ${
                        isCustomer
                          ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                          : isHumanStaff
                          ? 'bg-blue-50 border border-blue-200 text-blue-900 rounded-tr-sm'
                          : 'bg-green-50 border border-green-200 text-green-900 rounded-tr-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] font-bold text-gray-500 pb-1 border-b border-gray-200/60">
                        <span>
                          {isCustomer
                            ? 'Patient'
                            : isHumanStaff
                            ? 'Reception Desk (Human)'
                            : 'AI Receptionist (Aditi)'}
                        </span>
                        <span className="font-mono text-[9px]">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap pt-1">{m.message}</div>
                    </div>
                  </div>
                );
              })
            )}
            {/* Real-time WhatsApp Presence Typing Indicator */}
            {isAwaitingBotReply && (
              <div className="flex flex-col items-start transition-all duration-300 animate-in fade-in">
                <div className="bg-white border border-gray-200 text-gray-600 rounded-xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2.5">
                  <span className="text-xs font-normal text-gray-500 italic tracking-wide">typing...</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-wa-dot-1"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-wa-dot-2"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-wa-dot-3"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Human Reply Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-200 bg-white flex items-center gap-3 shrink-0 shadow-sm z-10"
          >
            <input
              type="text"
              placeholder="Type message to send directly to patient's WhatsApp..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
          <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">Select a conversation on the left</p>
          <p className="text-xs text-gray-400 mt-1">Live customer chats will appear in real time</p>
        </div>
      )}
    </div>
  );
}
