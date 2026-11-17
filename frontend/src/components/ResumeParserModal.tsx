import React, { useEffect, useRef, useState } from 'react';
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
  const [fileError, setFileError] = useState('');
  const [pdfInfo, setPdfInfo] = useState('');
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);

  const replaceText = (text: string) => {
    setResumeText(text);
    setParsedData(null);
    setFileError('');
    setPdfInfo('');
  };

  if (!isOpen) return null;

  const handleLoadSample = () => {
    replaceText(SAMPLE_AFRICA_RESUME.trim());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    replaceText('');
    const controller = new AbortController();
    activeRequest.current?.abort();
    activeRequest.current = controller;
    setIsLoading(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Le fichier dépasse la limite de 5 Mo.');
      if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
        const response = await fetch('/api/candidates/extract-resume-pdf', {
          method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: file, signal: controller.signal,
        });
        const data = await response.json();
        const messages: Record<string, string> = {
          pdf_too_large: 'Le PDF dépasse la limite de 5 Mo.',
          too_many_pages: 'Le PDF dépasse la limite de 10 pages.',
          encrypted_pdf: 'Ce PDF est protégé. Importez une version sans mot de passe.',
          no_pdf_text: 'Aucun texte extractible. Ce PDF peut être scanné : utilisez un outil OCR puis importez le texte.',
          invalid_pdf: 'Le fichier PDF est invalide ou endommagé.',
          too_much_text: 'Le PDF contient trop de texte (100 000 caractères maximum).',
          pdf_timeout: 'Extraction trop longue. Essayez un PDF plus simple ou collez son texte.',
        };
        if (!response.ok) throw new Error(messages[data.error] || 'Impossible d’extraire ce PDF.');
        if (controller.signal.aborted) return;
        setResumeText(data.resume_text);
        setPdfInfo(`${data.page_count} page(s) lue(s). ${data.empty_pages.length ? `Pages sans texte : ${data.empty_pages.join(', ')}. Leur contenu peut nécessiter de l’OCR. ` : ''}Vérifiez le texte extrait avant de l’analyser. Aucun profil n’a été modifié.`);
      } else {
        if (!/\.(txt|md|json)$/i.test(file.name)) throw new Error('Formats acceptés : PDF, TXT, MD et JSON.');
        const content = await file.text();
        if (controller.signal.aborted) return;
        if (content.length > 100000) throw new Error('Le texte dépasse 100 000 caractères.');
        setResumeText(content);
      }
    } catch (error) {
      if (!controller.signal.aborted) setFileError(error instanceof Error ? error.message : 'Erreur de lecture du fichier.');
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      showToast('Veuillez coller le texte de votre CV ou charger un fichier', 'error');
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      const res = await fetch('/api/candidates/parse-resume', {
        signal: controller.signal,
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
      if (controller.signal.aborted) return;
      setParsedData(data);
      showToast(`Analyse réussie : ${data.skills_count} compétences détectées !`, 'success');
    } catch (err: any) {
      if (controller.signal.aborted) return;
      showToast(err.message || 'Impossible d’analyser le CV', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToProfile = async () => {
    if (!parsedData) return;

    setIsLoading(true);
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      const res = await fetch('/api/candidates/parse-resume', {
        signal: controller.signal,
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
      if (controller.signal.aborted) return;
      const updated: Candidate = {
        ...data.saved_candidate,
        id: candidateId,
        name: data.full_name || candidateId,
        email: data.email,
        country: data.country,
        skills: data.saved_candidate?.skills || data.skills || [],
        experience_years: data.experience_years,
        education: data.education,
        bio: data.summary,
      };

      onProfileUpdated(updated);
      showToast('Votre profil candidat a été mis à jour avec succès !', 'success');
      onClose();
    } catch (err: any) {
      if (controller.signal.aborted) return;
      showToast(err.message || 'Erreur lors de l’enregistrement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="resume-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
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
              <h3 id="resume-title" className="text-lg font-bold font-display text-white">
                Importer et analyser un CV
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
              <span>Collez votre CV ou chargez un PDF contenant du texte :</span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700">
                <span>Importer un CV (PDF / texte)</span>
                <input
                  id="resume-file"
                  aria-label="Importer un CV"
                  type="file"
                  accept=".pdf,.txt,.md,.json"
                  disabled={isLoading}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30 transition-colors"
              >
                Exemple Démo
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400">PDF : 5 Mo et 10 pages maximum. Les PDF protégés ne sont pas acceptés ; les PDF scannés nécessitent de l’OCR. Le fichier est traité par le serveur JobPilot sans être enregistré sur disque.</p>
          {isLoading && <p role="status" className="text-xs text-emerald-300">Traitement en cours…</p>}
          {fileError && <p role="alert" className="text-sm text-rose-300">{fileError}</p>}
          {pdfInfo && <p role="status" className="text-xs text-cyan-300">{pdfInfo}</p>}

          {/* Textarea */}
          <div className="space-y-2">
            <label htmlFor="resume-text" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Contenu du CV
            </label>
            <textarea
              id="resume-text"
              rows={8}
              value={resumeText}
              maxLength={100000}
              disabled={isLoading}
              onChange={(e) => replaceText(e.target.value)}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Fermer
          </button>

          <div className="flex flex-col sm:flex-row gap-3">
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
