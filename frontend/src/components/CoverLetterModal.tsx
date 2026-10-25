import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, Send, Share2 } from 'lucide-react';
import type { CoverLetterResponse } from '../types';

interface CoverLetterModalProps {
  data: CoverLetterResponse | null;
  onClose: () => void;
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({ data, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!data) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold font-display text-white">
              Générateur de Candidature IA (Lettre & Pitch)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">

          {/* Email Subject */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Objet de l'e-mail recommandé
              </span>
              <button
                onClick={() => copyToClipboard(data.email_subject, 'subject')}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                {copiedSection === 'subject' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSection === 'subject' ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
            <p className="font-mono text-white bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs sm:text-sm">
              {data.email_subject}
            </p>
          </div>

          {/* LinkedIn Pitch */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Message d'approche LinkedIn (Recruteur / CTO)
              </span>
              <button
                onClick={() => copyToClipboard(data.linkedin_pitch, 'linkedin')}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                {copiedSection === 'linkedin' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSection === 'linkedin' ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
            <p className="text-slate-200 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed text-xs sm:text-sm whitespace-pre-line">
              {data.linkedin_pitch}
            </p>
          </div>

          {/* Key Highlights */}
          {data.key_highlights && data.key_highlights.length > 0 && (
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Points forts mis en avant
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {data.key_highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-md text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30"
                  >
                    ✦ {highlight}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Lettre de Motivation Personnalisée
              </span>
              <button
                onClick={() => copyToClipboard(data.cover_letter, 'letter')}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                {copiedSection === 'letter' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSection === 'letter' ? 'Copié !' : 'Copier la lettre'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 whitespace-pre-line font-sans text-xs sm:text-sm leading-relaxed text-slate-300">
              {data.cover_letter}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
