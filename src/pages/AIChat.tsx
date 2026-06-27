import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  RefreshCw, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { ChatResponse } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  detectedTasks?: ChatResponse['detectedTasks'];
  priorityAnalysis?: string;
  suggestedPlan?: string;
}

export default function AIChat() {
  const { refreshWorkspace } = useWorkspace();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your SOUM AI Companion. I represent the central node coordinating your Planner, Priority, Scheduler, and Reminder agents.\n\nTell me about your upcoming commitments, assignments, exams, or chores, and I will extract them, rank their priorities, and schedule them into your calendar automatically.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await api.sendChatMessage(userText);
      
      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: response.response,
        detectedTasks: response.detectedTasks,
        priorityAnalysis: response.priorityAnalysis,
        suggestedPlan: response.suggestedPlan,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: "Apologies, I encountered an issue analyzing your request. Please ensure the backend Express server is running and check your connection.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async (detectedTasks: ChatResponse['detectedTasks'], messageId: string) => {
    if (!detectedTasks || detectedTasks.length === 0) return;
    
    setActionLoading(true);
    setSuccessMessage('');
    try {
      for (const t of detectedTasks) {
        await api.createTask({
          title: t.title,
          deadline: t.deadline || null,
          importance: t.importance || 3,
          estimatedEffort: t.estimatedEffort || 60,
          category: t.category || 'General'
        });
      }

      await refreshWorkspace(true);

      setSuccessMessage(`Successfully scheduled ${detectedTasks.length} tasks! All active Planner and Priority agents have processed them.`);
      
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, detectedTasks: [] };
        }
        return m;
      }));

    } catch (e) {
      console.error(e);
      alert('Error creating tasks from chat.');
    } finally {
      setActionLoading(false);
    }
  };

  const samplePrompts = [
    "I have DSA practice, a DBMS assignment, and internship work due this week.",
    "Help! I have a chemistry quiz due tonight and I haven't started.",
    "Recommend a daily plan to finish my homework by 6:00 PM."
  ];

  return (
    <div className="flex-1 flex flex-col h-screen max-w-5xl mx-auto border-x border-hairline bg-canvas relative font-light">
      
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-hairline flex items-center justify-between relative">
        <div className="absolute bottom-[-1.5px] left-0 w-24 h-[3px] m-stripe" />
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface-card border border-hairline text-ink">
            <MessageSquare className="w-5 h-5 text-ink" />
          </div>
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-ink">AI Coordinator Agent</h2>
            <p className="text-[9px] text-muted font-bold tracking-widest uppercase">Multi-Agent Control Node</p>
          </div>
        </div>
      </header>

      {/* Success banner */}
      {successMessage && (
        <div className="m-4 p-3.5 border border-success bg-success/5 text-success text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-none">
          <CheckCircle className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div 
              key={m.id} 
              className={`flex items-start gap-3.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 border flex items-center justify-center font-bold text-[10px] tracking-wide rounded-none shrink-0 uppercase
                ${isUser 
                  ? 'bg-canvas border-ink text-ink font-extrabold' 
                  : 'bg-surface-card border-hairline text-muted'
                }
              `}>
                {isUser ? 'U' : 'AI'}
              </div>

              {/* Message Bubble */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className={`px-4 py-3 rounded-none text-xs leading-relaxed whitespace-pre-line border
                  ${isUser 
                    ? 'bg-canvas border-ink text-ink font-semibold' 
                    : 'bg-surface-card border-hairline text-body'
                  }
                `}>
                  {m.text}
                </div>

                {/* Extracted Tasks card */}
                {!isUser && m.detectedTasks && m.detectedTasks.length > 0 && (
                  <div className="p-4 bg-surface-soft border border-hairline rounded-none space-y-3 relative shadow-none">
                    <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
                    
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-ink uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      Extracted Tasks Found
                    </div>
                    
                    <div className="space-y-2">
                      {m.detectedTasks.map((t, idx) => (
                        <div key={idx} className="p-2.5 bg-canvas border border-hairline flex justify-between items-center text-xs rounded-none">
                          <div>
                            <p className="font-bold text-ink uppercase tracking-wide text-xs">{t.title}</p>
                            <span className="text-[8px] font-bold text-muted uppercase tracking-widest block mt-1">
                              Est: {t.estimatedEffort || 60}m • Category: {t.category || 'General'}
                            </span>
                          </div>
                          {t.deadline && (
                            <span className="text-[8px] text-ink bg-surface-card border border-hairline px-2 py-0.5 font-bold uppercase tracking-widest">
                              Due {t.deadline}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {m.priorityAnalysis && (
                      <div className="text-[10px] text-body leading-relaxed border-t border-hairline pt-2.5">
                        <span className="font-bold block text-ink uppercase tracking-widest text-[8px] mb-0.5">Priority Analysis:</span>
                        {m.priorityAnalysis}
                      </div>
                    )}

                    {m.suggestedPlan && (
                      <div className="text-[10px] text-body leading-relaxed">
                        <span className="font-bold block text-ink uppercase tracking-widest text-[8px] mb-0.5">Recommended Route:</span>
                        {m.suggestedPlan}
                      </div>
                    )}

                    <button
                      onClick={() => handleBulkAdd(m.detectedTasks || [], m.id)}
                      disabled={actionLoading}
                      className="w-full bmw-btn-primary py-2 text-[10px]"
                    >
                      {actionLoading ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          Approve & Deploy to Planner
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 border border-hairline bg-surface-card text-muted flex items-center justify-center font-bold text-[10px] animate-pulse">
              AI
            </div>
            <div className="px-4 py-3 bg-surface-card border border-hairline text-muted text-xs flex items-center gap-2 rounded-none">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-ink" />
              <span>Agent coordinating with sub-nodes...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Input Prompts Bar */}
      {messages.length === 1 && (
        <div className="px-6 py-2 flex flex-col gap-2 z-10 bg-canvas">
          <p className="text-[9px] text-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
            <HelpCircle className="w-3 h-3" /> Quick Command Guides
          </p>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => setInput(p)}
                className="px-3 py-1.5 border border-hairline bg-surface-card hover:bg-canvas text-xs text-muted hover:text-ink transition-colors cursor-pointer rounded-none uppercase text-left tracking-wide font-medium"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Input Footer */}
      <footer className="p-4 border-t border-hairline bg-canvas">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type task details or ask for scheduling rearrangement advice..."
            className="flex-1 bmw-input text-xs"
            required
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bmw-btn-primary py-2.5 px-4 font-bold text-xs"
          >
            <Send className="w-4 h-4 text-current" />
          </button>
        </form>
      </footer>

    </div>
  );
}
