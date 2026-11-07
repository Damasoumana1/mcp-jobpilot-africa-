import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Database, ExternalLink, RefreshCw } from 'lucide-react';
import type { Job } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface ImportResult {
  board: string;
  saved: boolean;
  fetched: number;
  eligible: number;
  skipped_location: number;
  offers: Job[];
}

export function JobSourcesPanel({ onImported }: { onImported: () => Promise<void> }) {
  const { lang } = useLanguage();
  const fr = lang === 'fr';
  const [open, setOpen] = useState(false);
  const [board, setBoard] = useState('');
  const [company, setCompany] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<'preview' | 'save' | null>(null);
  const [error, setError] = useState('');
  const [refreshError, setRefreshError] = useState(false);
  const [visible, setVisible] = useState(10);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  const invalidate = () => { setResult(null); setError(''); setRefreshError(false); setVisible(10); };
  const refresh = async () => {
    setRefreshError(false);
    try { await onImported(); } catch { setRefreshError(true); }
  };
  const collect = async (save: boolean) => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(save ? 'save' : 'preview');
    setError('');
    setRefreshError(false);
    if (!save) setResult(null);
    try {
      const response = await fetch('/api/sources/greenhouse/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ board: board.trim(), company: company.trim(), save }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      if (!Array.isArray(data.offers) || data.saved !== save || typeof data.eligible !== 'number') {
        throw new Error(fr ? 'Réponse du connecteur invalide' : 'Invalid connector response');
      }
      setResult(data);
      setVisible(10);
      if (save) await refresh();
    } catch (cause) {
      if (!controller.signal.aborted) {
        const detail = cause instanceof Error ? cause.message : (fr ? 'Erreur de connexion' : 'Connection error');
        setError(save
          ? `${fr ? 'Import non confirmé. Vérifiez le catalogue avant de réessayer.' : 'Import not confirmed. Check the catalogue before retrying.'} ${detail}`
          : `${fr ? 'Aperçu indisponible.' : 'Preview unavailable.'} ${detail}`);
      }
    } finally {
      if (!controller.signal.aborted) setBusy(null);
      request.current = null;
    }
  };

  const inputClass = 'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white disabled:opacity-60';
  return <section className="rounded-2xl border border-slate-800 bg-[#0d1424] overflow-hidden">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="job-sources-content"
      className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-800/30 transition-colors">
      <Database className="w-5 h-5 text-cyan-400 shrink-0" />
      <span className="flex-1"><span className="block font-semibold text-white">{fr ? 'Importer des offres · Greenhouse' : 'Import jobs · Greenhouse'}</span>
        <span className="block text-xs text-slate-400 mt-1">{fr ? 'Prévisualisez un portail employeur avant d’ajouter ses offres au catalogue.' : 'Preview an employer board before adding its jobs to the catalogue.'}</span></span>
      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    <div id="job-sources-content" hidden={!open} className="border-t border-slate-800 p-5 space-y-5">
      <form onSubmit={event => { event.preventDefault(); void collect(false); }} className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm text-slate-300" htmlFor="source-board">{fr ? 'Identifiant du portail Greenhouse' : 'Greenhouse board token'}
          <input id="source-board" value={board} onChange={event => { setBoard(event.target.value); invalidate(); }}
            required pattern="[a-zA-Z0-9_-]{1,100}" maxLength={100} disabled={!!busy} autoComplete="off"
            aria-describedby="source-board-help" className={`${inputClass} mt-2`} />
        </label>
        <label className="text-sm text-slate-300" htmlFor="source-company">{fr ? 'Nom de l’entreprise' : 'Company name'}
          <input id="source-company" value={company} onChange={event => { setCompany(event.target.value); invalidate(); }}
            required maxLength={300} disabled={!!busy} className={`${inputClass} mt-2`} />
        </label>
        <p id="source-board-help" className="sm:col-span-2 text-xs text-slate-400">
          {fr ? 'Utilisez l’identifiant exact du portail employeur, pas son URL. Le nom de l’entreprise est fourni par vous.' : 'Use the employer’s exact board token, not its URL. The company name is supplied by you.'}
        </p>
        <button type="submit" disabled={!!busy || !board.trim() || !company.trim()}
          className="sm:col-span-2 justify-self-start rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-4 py-2 text-sm font-semibold disabled:opacity-50 flex gap-2 items-center">
          {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
          {busy === 'preview' ? (fr ? 'Collecte en cours…' : 'Fetching…') : (fr ? 'Prévisualiser les offres' : 'Preview jobs')}
        </button>
      </form>
      <p className="text-xs text-slate-400 leading-relaxed">
        {fr ? 'Seules les annonces dont la localisation nomme un pays africain sont retenues. Les mentions « Remote », « Africa » ou « EMEA » sans pays sont ignorées. Tous les niveaux d’expérience peuvent être présents ; le télétravail ne garantit pas votre éligibilité. Les offres disparues du portail ne sont pas automatiquement fermées.'
          : 'Only postings whose location names an African country are retained. “Remote”, “Africa” or “EMEA” without a country are skipped. All experience levels may be included; remote work does not guarantee eligibility. Jobs missing from the board are not automatically closed.'}
      </p>
      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {result && <div className="space-y-4">
        <div role="status" className={`rounded-xl border p-4 ${result.saved ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 text-slate-200'}`}>
          <p className="font-semibold">{result.saved
            ? (fr ? `${result.eligible} offre(s) enregistrée(s) ou actualisée(s).` : `${result.eligible} job(s) saved or updated.`)
            : (fr ? 'Aperçu uniquement : aucune offre enregistrée.' : 'Preview only: no jobs saved.')}</p>
          <p className="text-sm mt-1">{result.fetched} {fr ? 'annonces reçues' : 'postings fetched'} · {result.eligible} {fr ? 'retenues' : 'retained'} · {result.skipped_location} {fr ? 'ignorées pour leur localisation' : 'skipped by location'}</p>
        </div>
        {!result.eligible && <p className="text-sm text-slate-300">{fr ? 'Aucune offre retenue sur ce portail. Essayez un autre identifiant ou vérifiez les localisations publiées.' : 'No jobs retained on this board. Try another token or check the published locations.'}</p>}
        <ul className="space-y-3">{result.offers.slice(0, visible).map(offer => <li key={offer.id} className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-2">
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="font-semibold text-white break-words">{offer.title}</h3>
            <span className="text-xs text-cyan-300">Greenhouse</span>
          </div>
          <p className="text-sm text-slate-300">{offer.company} · {offer.source_location || offer.country}</p>
          <p className="text-xs text-slate-400">{fr ? 'Compétences mentionnées : ' : 'Mentioned skills: '}{offer.skills?.join(', ') || (fr ? 'non détectées' : 'none detected')}</p>
          {offer.application_url?.startsWith('https://') && <a className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline" href={offer.application_url} target="_blank" rel="noreferrer">{fr ? 'Voir l’annonce employeur' : 'View employer posting'}<ExternalLink className="w-3 h-3" /></a>}
        </li>)}</ul>
        {result.offers.length > visible && <button type="button" className="text-sm text-cyan-300" onClick={() => setVisible(value => value + 10)}>{fr ? 'Afficher plus d’offres' : 'Show more jobs'} ({visible}/{result.offers.length})</button>}
        {!!result.eligible && !result.saved && <div className="space-y-2">
          <p className="text-xs text-slate-400">{fr ? 'L’import relit le portail : son contenu peut changer depuis cet aperçu. Un nouvel import actualise les annonces déjà connues sans les dupliquer.' : 'Import fetches the board again: its content may have changed since this preview. Reimporting updates known postings without duplicating them.'}</p>
          <button type="button" disabled={!!busy} onClick={() => void collect(true)} className="rounded-xl bg-emerald-500 text-slate-950 px-4 py-2 font-semibold text-sm disabled:opacity-50">
            {busy === 'save' ? (fr ? 'Import en cours…' : 'Importing…') : (fr ? 'Importer dans le catalogue' : 'Import into catalogue')}
          </button>
        </div>}
        {refreshError && <div role="alert" className="text-sm text-amber-300">
          <p>{fr ? 'Import enregistré, mais le catalogue affiché n’a pas pu être actualisé.' : 'Import saved, but the displayed catalogue could not be refreshed.'}</p>
          <button type="button" onClick={() => void refresh()} className="underline">{fr ? 'Actualiser le catalogue' : 'Refresh catalogue'}</button>
        </div>}
      </div>}
    </div>
  </section>;
}
