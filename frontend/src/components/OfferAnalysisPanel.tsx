import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, FileSearch, Loader2, Save } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface AnalysisPayload { candidate_id: string; job_text: string; title?: string; company?: string; source_url?: string }
interface AnalysisReport extends AnalysisPayload {
  id: string | null;
  skills: { name: string; matched: boolean; evidence: string }[];
  coverage_score: number | null;
  recommendation: 'promising' | 'review' | 'low_coverage' | 'insufficient_data';
  warnings: string[];
  created_at: string;
}

const copy = {
  fr: {
    heading: 'Analyser une offre', intro: 'Collez une annonce et comparez ses compétences à votre profil.',
    title: 'Intitulé (facultatif)', company: 'Entreprise (facultatif)', source: 'Lien source HTTPS (facultatif)',
    sourceHelp: 'Conservé comme référence uniquement. La page ne sera pas consultée.', text: 'Texte de l’offre',
    placeholder: 'Collez ici les missions, compétences et conditions de l’annonce…', length: '30 à 20 000 caractères',
    analyze: 'Analyser', analyzing: 'Analyse en cours…', save: 'Enregistrer le rapport', saving: 'Enregistrement…', saved: 'Rapport enregistré',
    error: 'Impossible de terminer cette action. Réessayez.', historyError: 'Impossible de charger les rapports enregistrés.',
    history: 'Rapports enregistrés', empty: 'Aucun rapport enregistré pour le moment.', untitled: 'Offre sans intitulé',
    coverage: 'Couverture des compétences', explanation: 'Ce score compare les compétences repérées au profil. Ce n’est pas une probabilité d’embauche.',
    matched: 'Présente dans le profil', missing: 'À confirmer ou à développer', noSkills: 'Aucune compétence reconnue dans ce texte. Ajoutez les exigences détaillées de l’annonce.',
    noScore: 'Non calculable', evidence: 'Extrait de l’offre', warnings: {
      keyword_only: 'Analyse par mots-clés : le contexte et les équivalences peuvent être incomplets.',
      availability_unverified: 'L’ouverture de cette offre n’a pas été vérifiée.',
      eligibility_unverified: 'Les conditions de pays, de mobilité et d’éligibilité restent à vérifier.',
    } as Record<string, string>, recommendations: {
      promising: 'Une candidature à envisager', review: 'Des points à approfondir',
      low_coverage: 'Plusieurs compétences à développer', insufficient_data: 'Informations insuffisantes pour conclure',
    },
  },
  en: {
    heading: 'Analyze a job offer', intro: 'Paste a job description and compare its skills with your profile.',
    title: 'Job title (optional)', company: 'Company (optional)', source: 'HTTPS source link (optional)',
    sourceHelp: 'Stored as a reference only. The page will not be fetched.', text: 'Job description',
    placeholder: 'Paste the responsibilities, skills and conditions from the job offer…', length: '30 to 20,000 characters',
    analyze: 'Analyze', analyzing: 'Analyzing…', save: 'Save report', saving: 'Saving…', saved: 'Report saved',
    error: 'Unable to complete this action. Please try again.', historyError: 'Unable to load saved reports.',
    history: 'Saved reports', empty: 'No saved reports yet.', untitled: 'Untitled offer',
    coverage: 'Skills coverage', explanation: 'This score compares recognized skills with your profile. It is not a hiring probability.',
    matched: 'Present in your profile', missing: 'To confirm or develop', noSkills: 'No recognized skills in this text. Add the detailed requirements from the offer.',
    noScore: 'Not available', evidence: 'Excerpt from the offer', warnings: {
      keyword_only: 'Keyword analysis: context and equivalent skills may be missed.',
      availability_unverified: 'Whether this offer is still open has not been verified.',
      eligibility_unverified: 'Country, mobility and eligibility conditions still need to be checked.',
    } as Record<string, string>, recommendations: {
      promising: 'Consider applying', review: 'Some points need a closer look',
      low_coverage: 'Several skills to develop', insufficient_data: 'Not enough information to conclude',
    },
  },
};

export function OfferAnalysisPanel({ candidateId }: { candidateId: string }) {
  const { lang } = useLanguage();
  const t = copy[lang];
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('');
  const [text, setText] = useState('');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const [historyError, setHistoryError] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [busy, setBusy] = useState<'analyze' | 'save' | null>(null);
  const [error, setError] = useState(false);
  const revision = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    revision.current += 1;
    setReport(null);
    setHistory([]);
    setHistoryError(false);
    setHistoryLoading(true);
    fetch(`/api/job-analyses?candidate_id=${encodeURIComponent(candidateId)}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        setHistory(await response.json());
      }).catch(() => { if (!controller.signal.aborted) setHistoryError(true); })
      .finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [candidateId]);

  const change = (setter: (value: string) => void, value: string) => {
    revision.current += 1;
    setter(value);
    setReport(null);
    setError(false);
  };
  const submit = async (save: boolean) => {
    const currentRevision = revision.current;
    const payload: AnalysisPayload = save && report ? {
      candidate_id: report.candidate_id, job_text: report.job_text, title: report.title,
      company: report.company, source_url: report.source_url,
    } : { candidate_id: candidateId, job_text: text, title: title.trim() || undefined,
      company: company.trim() || undefined, source_url: source.trim() || undefined };
    setBusy(save ? 'save' : 'analyze');
    setError(false);
    try {
      const response = await fetch(save ? '/api/job-analyses' : '/api/jobs/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error();
      const result: AnalysisReport = await response.json();
      if (currentRevision !== revision.current) return;
      setReport(result);
      if (save) setHistory(previous => [result, ...previous.filter(item => item.id !== result.id)]);
    } catch { if (currentRevision === revision.current) setError(true); }
    finally { setBusy(null); }
  };
  const reopen = (item: AnalysisReport) => {
    revision.current += 1;
    setTitle(item.title || ''); setCompany(item.company || '');
    setSource(item.source_url || ''); setText(item.job_text); setReport(item); setError(false);
  };
  const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 disabled:opacity-60';

  return <section className="rounded-2xl border border-emerald-500/30 bg-slate-900/70 overflow-hidden">
    <button type="button" aria-expanded={expanded} aria-controls="offer-analysis-workspace" onClick={() => setExpanded(!expanded)} className="w-full text-left px-5 py-5 flex items-center justify-between gap-4 hover:bg-slate-800/40 focus-visible:outline focus-visible:outline-emerald-400">
      <span className="flex items-center gap-3"><FileSearch className="w-6 h-6 text-emerald-400 shrink-0" /><span><span className="block font-semibold text-white">{t.heading}</span><span className="block mt-1 text-sm text-slate-300">{t.intro}</span></span></span>
      {expanded ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
    </button>
    {expanded && <div id="offer-analysis-workspace" className="border-t border-slate-800 p-5 space-y-6">
      <form onSubmit={event => { event.preventDefault(); void submit(false); }} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm text-slate-300">{t.title}<input value={title} maxLength={200} onChange={e => change(setTitle, e.target.value)} className={fieldClass} /></label>
          <label className="text-sm text-slate-300">{t.company}<input value={company} maxLength={200} onChange={e => change(setCompany, e.target.value)} className={fieldClass} /></label>
        </div>
        <label className="block text-sm text-slate-300">{t.source}<input type="url" pattern="https://.*" value={source} onChange={e => change(setSource, e.target.value)} aria-describedby="offer-source-help" placeholder="https://…" className={fieldClass} /></label>
        <p id="offer-source-help" className="text-xs text-slate-400">{t.sourceHelp}</p>
        <label className="block text-sm text-slate-300">{t.text}<textarea required minLength={30} maxLength={20000} rows={7} value={text} onChange={e => change(setText, e.target.value)} placeholder={t.placeholder} aria-describedby="offer-text-help" className={`${fieldClass} resize-y`} /></label>
        <div className="flex flex-wrap items-center justify-between gap-3"><p id="offer-text-help" className="text-xs text-slate-400">{t.length} · {text.length.toLocaleString(lang)}</p>
          <button disabled={!!busy || text.trim().length < 30} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-sm text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed">{busy === 'analyze' && <Loader2 className="w-4 h-4 animate-spin" />}{busy === 'analyze' ? t.analyzing : t.analyze}</button>
        </div>
      </form>
      {error && <p role="alert" className="text-sm text-rose-300">{t.error}</p>}
      <div aria-live="polite" aria-busy={!!busy}>
        {report && <article className="border-t border-slate-700 pt-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold text-lg text-white">{report.title || t.untitled}</h3>{report.company && <p className="text-sm text-slate-300">{report.company}</p>}<p className="mt-2 text-emerald-300 font-medium">{t.recommendations[report.recommendation]}</p></div>
            <div className="sm:text-right"><p className="text-3xl font-bold text-emerald-400">{report.coverage_score === null ? t.noScore : `${report.coverage_score}%`}</p><p className="text-xs text-slate-300">{t.coverage}</p></div>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">{t.explanation}</p>
          {report.skills.length ? <ul className="divide-y divide-slate-800">{report.skills.map(skill => <li key={skill.name} className="py-3"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-sm">{skill.name}</span><span className={`text-xs ${skill.matched ? 'text-emerald-300' : 'text-amber-300'}`}>{skill.matched ? t.matched : t.missing}</span></div><blockquote aria-label={t.evidence} className="mt-2 pl-3 border-l-2 border-slate-700 text-sm text-slate-300 whitespace-pre-wrap break-words">“{skill.evidence}”</blockquote></li>)}</ul> : <p className="text-sm text-slate-300">{t.noSkills}</p>}
          <ul className="space-y-1 text-xs text-amber-200/90">{report.warnings.map(warning => <li key={warning}>{t.warnings[warning] || warning}</li>)}</ul>
          <button type="button" onClick={() => void submit(true)} disabled={!!busy || !!report.id} className="flex items-center gap-2 border border-emerald-500/40 rounded-xl px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"><Save className="w-4 h-4" />{report.id ? t.saved : busy === 'save' ? t.saving : t.save}</button>
        </article>}
      </div>
      <div className="border-t border-slate-800 pt-4"><h3 className="text-sm font-semibold mb-3">{t.history}</h3>
        {historyLoading ? <Loader2 aria-label={t.analyzing} className="w-4 h-4 animate-spin text-slate-400" /> : historyError ? <p role="alert" className="text-sm text-rose-300">{t.historyError}</p> : history.length === 0 ? <p className="text-sm text-slate-400">{t.empty}</p> : <ul className="max-h-60 overflow-y-auto divide-y divide-slate-800">{history.map(item => <li key={item.id}><button type="button" disabled={!!busy} onClick={() => reopen(item)} className="w-full text-left py-3 flex flex-wrap justify-between gap-2 hover:text-emerald-300 disabled:opacity-50"><span className="text-sm">{item.title || t.untitled}{item.company ? ` · ${item.company}` : ''}</span><time className="text-xs text-slate-400" dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString(lang)}</time></button></li>)}</ul>}
      </div>
    </div>}
  </section>;
}
