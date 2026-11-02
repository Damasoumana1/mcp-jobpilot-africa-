import React, { useState } from 'react';
import { X, FileText, Sparkles, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import type { Candidate } from '../types';

interface ResumeParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  onProfileUpdated: (updatedCandidate: Candidate) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

interface ParsedResumeData {
  candidate_id: string;
  full_name: string;
  email: string;
  country: string;
  skills: string[];
  skills_count: number;
  experience_years: number;
  education: string;
  languages: string;
  summary: string;
  auto_saved?: boolean;
}

const SAMPLE_AFRICA_RESUME = `Dama Soumana
Email: dama.soumana@example.com | Téléphone: +221 77 123 45 67
Dakar, Sénégal

PROFIL PROFESSIONNEL:
Développeur passionné par les systèmes distribués, l’écosystème MCP (Model Context Protocol) et le développement d'agents IA appliqués à la tech africaine. 2 ans d'expérience pratique.

COMPÉTENCES TECHNIQUES:
- Langages: Python, TypeScript, JavaScript, SQL, Bash
- Frameworks & Web: React, FastAPI, Next.js, Tailwind CSS, Node.js
- Agents & IA: FastMCP, Model Context Protocol, PyTorch, Pandas
- DevOps & Cloud: Docker, Git, CI/CD, PostgreSQL, Linux

FORMATION:
Licence en Génie Logiciel & Systèmes Informatiques - Université Cheikh Anta Diop (UCAD)

LANGUES:
Français (courant), Anglais (professionnel), Wolof`;

export const ResumeParserModal: React.FC<ResumeParserModalProps> = ({
  isOpen,
  onClose,
  candidateId,
  onProfileUpdated,
  showToast,
}) => {
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setResumeText(SAMPLE_AFRICA_RESUME.trim());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setResumeText(content);
        showToast('Fichier chargé avec succès !', 'success');
      }
    };
    reader.onerror = () => {
      showToast('Erreur lors de la lecture du fichier', 'error');
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      showToast('Veuillez coller le texte de votre CV ou charger un fichier', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/candidates/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          candidate_id: candidateId,
          auto_save: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de l'analyse du CV");
      }

      const data: ParsedResumeData = await res.json();
      setParsedData(data);
      showToast(`Analyse réussie : ${data.skills_count} compétences détectées !`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Impossible d’analyser le CV', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToProfile = async () => {
    if (!parsedData) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/candidates/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          candidate_id: candidateId,
          auto_save: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      const data = await res.json();
      const updated: Candidate = {
        id: candidateId,
        name: data.full_name || candidateId,
        email: data.email,
        country: data.country,
        skills: data.skills || [],
        experience_years: data.experience_years,
        education: data.education,
        bio: data.summary,
      };

      onProfileUpdated(updated);
      showToast('Votre profil candidat a été mis à jour avec succès !', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l’enregistrement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1322] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">
                Analyseur de CV Intelligent (IA Agentique)
              </h3>
              <p className="text-xs text-slate-400">
                Extrayez automatiquement vos compétences tech, formation et expérience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* Sample loader & file upload helper */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-slate-300">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Collez votre CV ou chargez un fichier texte :</span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700">
                <span>Importer un fichier (.txt / .md)</span>
                <input
                  type="file"
                  accept=".txt,.md,.json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30 transition-colors"
              >
                Exemple Démo
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Contenu du CV
            </label>
            <textarea
              rows={8}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Collez ici les sections de votre CV (Compétences, Expériences, Formation, Coordonnées)..."
              className="w-full bg-[#070b14] border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 transition-colors resize-none"
            />
          </div>

          {/* Parsed Result Showcase */}
          {parsedData && (
            <div className="bg-[#0e1728] border border-emerald-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-white text-sm">
                    Résultats d'Extraction IA
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {parsedData.skills_count} compétences détectées
                </span>
              </div>

              {/* Grid overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block font-medium">Candidat Détecté</span>
                  <span className="text-white font-bold text-sm">{parsedData.full_name}</span>
                </div>
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block font-medium">Localisation & Contact</span>
                  <span className="text-white font-semibold">{parsedData.country} • {parsedData.email}</span>
                </div>
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block font-medium">Expérience Estimée</span>
                  <span className="text-emerald-400 font-bold">{parsedData.experience_years} an(s)</span>
                </div>
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block font-medium">Diplôme / Formation</span>
                  <span className="text-cyan-300 font-semibold">{parsedData.education}</span>
                </div>
              </div>

              {/* Skills Cloud */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Compétences Techniques Reconnues
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Fermer
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !resumeText.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-50 transition-all shadow-md"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              )}
              <span>Analyser avec l'IA</span>
            </button>

            {parsedData && (
              <button
                onClick={handleApplyToProfile}
                disabled={isLoading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display transition-all shadow-lg shadow-emerald-500/20"
              >
                <UserCheck className="w-4 h-4" />
                <span>Mettre à jour mon profil</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
