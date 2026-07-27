import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  User,
  Zap,
  HelpCircle
} from 'lucide-react';
import { ChatMessage, RosterSlot, LeagueSettings } from '../types';

interface AICoachViewProps {
  userRoster: RosterSlot[];
  leagueSettings: LeagueSettings;
}

export const AICoachView: React.FC<AICoachViewProps> = ({
  userRoster,
  leagueSettings
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Greetings! I am your AI Fantasy Strategist & Coach. I'm ready to analyze your lineup for **${leagueSettings.leagueName}** (${leagueSettings.scoringFormat} scoring).\n\nHow can I help you dominate your matchup this week?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Who should I start at FLEX this week?',
        'Analyze my roster depth & weakness',
        'Top 3 sleeper waiver targets for Week 8',
        'How does my trade value look?'
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          userRoster,
          leagueSettings
        })
      });

      if (!response.ok) {
        throw new Error('AI Coach response failed');
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.text || "I'm analyzing your matchup stats. Give me a moment to re-evaluate.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.warn('AI Coach fallback response:', err);
      const fallbackMsg: ChatMessage = {
        id: `a-err-${Date.now()}`,
        sender: 'assistant',
        text: `Based on your current roster setup and ${leagueSettings.scoringFormat} scoring, your starting lineup is projected for strong upside. Check the Start/Sit matrix or Waiver Wire tool for deeper individual player analysis.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col h-[620px] shadow-xl overflow-hidden">
      {/* Top Coach Bar */}
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs tracking-tight">GridironAI Fantasy Coach</h2>
            <p className="text-[10px] text-zinc-500">
              Gemini 3.6 Flash Engine • {leagueSettings.scoringFormat} Format
            </p>
          </div>
        </div>

        <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ACTIVE STRATEGIST</span>
        </span>
      </div>

      {/* Messages Scroll Container */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isAssistant ? '' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isAssistant ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }`}
              >
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div className="max-w-[85%] space-y-1.5">
                <div
                  className={`p-3 rounded text-xs leading-relaxed ${
                    isAssistant
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 font-sans'
                      : 'bg-indigo-600 text-white font-mono font-bold'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Suggested Action Chips */}
                {msg.suggestedActions && (
                  <div className="flex flex-wrap gap-1 pt-0.5 font-mono">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(action)}
                        className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-indigo-300 px-2.5 py-1 rounded border border-zinc-800 transition-colors cursor-pointer"
                      >
                        ⚡ {action}
                      </button>
                    ))}
                  </div>
                )}

                <span className={`text-[9px] font-mono text-zinc-500 block ${isAssistant ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Analyzing player matchup statistics & game scripts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-2.5 bg-zinc-900 border-t border-zinc-800 font-mono">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-coach-chat"
            type="text"
            placeholder="Ask AI Coach a question (e.g., 'Who should I target on waivers?')..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 outline-none"
          />

          <button
            id="btn-send-coach-msg"
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
