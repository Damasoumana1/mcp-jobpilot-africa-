import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, RefreshCw, MessageSquare } from 'lucide-react';

interface CopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ isOpen, onClose, candidateName = 'Dama Soumana' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Bonjour ${candidateName} ! 👋 Je suis ton copilote IA JobPilot Africa.\n\nJe peux t'aider à analyser des offres tech, préparer tes entretiens, négocier tes prétentions salariales en FCFA/USD, ou optimiser ta candidature. Pose-moi une question !`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Comment réussir mon entretien chez Wave ?',
    'Optimise mon pitch pour un poste Remote',
    'Quelles technos apprendre pour l’IA en Afrique ?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, candidate_id: 'DAMA-001' }),
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply || data.response || "Je n'ai pas pu générer de réponse pour l'instant.";
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Note: Le serveur FastAPI/Starlette est en cours de synchronisation. Voici un conseil : Pour maximiser votre taux de réponse chez Wave ou InstaDeep, mettez l'accent sur vos contributions concrètes en Python, API REST, Docker et votre rigueur de code.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[420px] h-[580px] bg-[#0c1222] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
      
      {/* Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
              Copilot JobPilot IA
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-400">Conseiller carrière tech & MCP</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            )}
            <div
              className={`max-w-[82%] p-3 rounded-xl whitespace-pre-line leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-emerald-400 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Copilot analyse les opportunités...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <MessageSquare className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors border border-slate-700/60"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pose ta question au Copilot..."
          className="flex-1 bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
