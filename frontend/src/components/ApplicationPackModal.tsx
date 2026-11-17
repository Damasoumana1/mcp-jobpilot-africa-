import { useEffect, useRef, useState } from 'react';
import { BookmarkPlus, Calendar, Check, Copy, Download, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Application, ApplicationUpdate } from '../types';

interface PackFile { name: string; content: string }
interface Pack { candidate_name: string; job_title: string; language: 'fr' | 'en'; files: PackFile[] }

export function ApplicationPackModal({ candidateId, jobId, trackedApplication: existingApplication, onTrack, onUpdateApplication, onOpenApplications, onClose }: {
  candidateId: string;
  jobId: string;
  trackedApplication?: Application;
  onTrack: (jobId: string) => Promise<Application>;
  onUpdateApplication: (id: string, changes: ApplicationUpdate) => Promise<void>;
  onOpenApplications: () => void;
  onClose: () => void;
}) {
  const { lang } = useLanguage();
  const fr = lang === 'fr';
  const [pack, setPack] = useState<Pack | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [copiedFile, setCopiedFile] = useState('');
  const [trackedApplication, setTrackedApplication] = useState<Application | null>(existingApplication || null);
  const [nextAction, setNextAction] = useState(existingApplication?.next_action || '');
  const [followUpDate, setFollowUpDate] = useState(existingApplication?.follow_up_date || '');
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [followUpBusy, setFollowUpBusy] = useState(false);
  const [followUpSaved, setFollowUpSaved] = useState(false);
  const downloadRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setPack(null); setError('');
    fetch('/api/applications/pack', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ candidate_id: candidateId, job_id: jobId, language: lang }),
    }).then(async response => {
      if (!response.ok) throw new Error(fr ? 'Impossible de préparer le pack.' : 'Unable to prepare the pack.');
      const data = await response.json();
      if (!controller.signal.aborted) setPack(data);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => { controller.abort(); downloadRequest.current?.abort(); };
  }, [candidateId, jobId, lang, fr, attempt]);

  const download = async () => {
    if (!pack || busy) return;
    const controller = new AbortController();
    downloadRequest.current = controller;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/applications/pack/download', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ language: pack.language, files: pack.files }),
      });
      if (!response.ok) throw new Error(fr ? 'Téléchargement impossible. Votre aperçu est conservé.' : 'Unable to download. Your preview has been kept.');
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'jobpilot-application-pack.zip';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Error');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  };

  const copyFile = async (file: PackFile) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedFile(file.name);
      setError('');
    } catch {
      setError(fr ? `Impossible de copier « ${file.name} » dans le presse-papiers.` : `Unable to copy "${file.name}" to the clipboard.`);
    }
  };

  const downloadFile = (file: PackFile) => {
    const url = URL.createObjectURL(new Blob([file.content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const addToTracking = async () => {
    if (trackingBusy) return;
    setTrackingBusy(true);
    setError('');
    try {
      const application = await onTrack(jobId);
      setTrackedApplication(application);
      setNextAction(application.next_action || '');
      setFollowUpDate(application.follow_up_date || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (fr ? 'Ajout au suivi impossible.' : 'Unable to add to tracking.'));
    } finally {
      setTrackingBusy(false);
    }
  };

  const saveFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trackedApplication || followUpBusy) return;
    setFollowUpBusy(true);
    setError('');
    setFollowUpSaved(false);
    try {
      await onUpdateApplication(trackedApplication.id, { next_action: nextAction.trim(), follow_up_date: followUpDate });
      setTrackedApplication({ ...trackedApplication, next_action: nextAction.trim(), follow_up_date: followUpDate });
      setFollowUpSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (fr ? 'Enregistrement de la relance impossible.' : 'Unable to save follow-up.'));
    } finally {
      setFollowUpBusy(false);
    }
  };

  return <div role="dialog" aria-modal="true" aria-labelledby="pack-title" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <section className="w-full max-w-3xl max-h-[92vh] rounded-2xl border border-slate-700 bg-[#0d1424] flex flex-col overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
        <h2 id="pack-title" className="text-lg font-bold text-white">{fr ? 'Pack candidature' : 'Application pack'}</h2>
        <button onClick={onClose} aria-label={fr ? 'Fermer le pack' : 'Close pack'} className="text-slate-300 p-2"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto">
        <p className="text-sm text-slate-400">{fr ? 'Vérifiez et adaptez ces brouillons avant utilisation. Le ZIP contiendra exactement le contenu affiché. Aucun document n’est envoyé ; l’ajout au suivi est une action distincte et explicite.' : 'Review and adapt these drafts before use. The ZIP will contain exactly the content shown. No document is sent; adding a tracking record is a separate, explicit action.'}</p>
        {!pack && !error && <p role="status">{fr ? 'Préparation du pack…' : 'Preparing your pack…'}</p>}
        {error && <p role="alert" className="text-rose-300 text-sm">{error} {!pack && <button onClick={() => setAttempt(value => value + 1)} className="underline">{fr ? 'Réessayer' : 'Retry'}</button>}</p>}
        {pack && <>
          <p className="font-semibold text-emerald-300 break-words">{pack.candidate_name} · {pack.job_title}</p>
          {pack.files.map((file, index) => <div key={file.name} className="text-xs text-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={`pack-file-${index}`}>{file.name}</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void copyFile(file)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-200 hover:border-emerald-500 disabled:opacity-50">
                  {copiedFile === file.name ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedFile === file.name ? (fr ? 'Copié' : 'Copied') : (fr ? 'Copier' : 'Copy')}
                </button>
                <button type="button" onClick={() => downloadFile(file)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-200 hover:border-emerald-500 disabled:opacity-50">
                  <Download className="w-3.5 h-3.5" />{fr ? 'Télécharger' : 'Download'}
                </button>
              </div>
            </div>
            <textarea id={`pack-file-${index}`} rows={7} value={file.content} maxLength={100000} disabled={busy}
              onChange={event => {
                setCopiedFile('');
                setPack({ ...pack, files: pack.files.map((item, i) => i === index ? { ...item, content: event.target.value } : item) });
              }}
              className="mt-2 block w-full rounded-xl bg-slate-950 border border-slate-700 p-3 font-mono text-xs leading-relaxed text-slate-200 resize-y" />
          </div>)}
        </>}
        {trackedApplication && <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-emerald-300">{fr ? 'Offre dans votre suivi' : 'Job in your tracking list'}</h3>
              <p className="mt-1 text-xs text-slate-400">{fr ? 'Statut : à préparer. Aucune candidature n’a été envoyée.' : 'Status: saved. No application has been submitted.'}</p>
            </div>
            <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
          </div>
          <form onSubmit={event => void saveFollowUp(event)} className="grid gap-3 sm:grid-cols-[1fr_11rem]">
            <label className="text-xs text-slate-400" htmlFor="pack-next-action">{fr ? 'Prochaine action' : 'Next action'}
              <input id="pack-next-action" value={nextAction} maxLength={500} required disabled={followUpBusy} onChange={event => { setNextAction(event.target.value); setFollowUpSaved(false); }}
                placeholder={fr ? 'Ex. Finaliser les documents' : 'e.g. Finalize application documents'} className="block w-full mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white disabled:opacity-50" />
            </label>
            <label className="text-xs text-slate-400" htmlFor="pack-follow-up-date">{fr ? 'Date de relance' : 'Follow-up date'}
              <input id="pack-follow-up-date" type="date" value={followUpDate} required disabled={followUpBusy} onChange={event => { setFollowUpDate(event.target.value); setFollowUpSaved(false); }}
                className="block w-full mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white [color-scheme:dark] disabled:opacity-50" />
            </label>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={followUpBusy || !followUpDate || !nextAction.trim()} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">
                {followUpBusy ? (fr ? 'Enregistrement…' : 'Saving…') : (fr ? 'Enregistrer la relance' : 'Save follow-up')}
              </button>
              {followUpSaved && <span role="status" className="text-xs text-emerald-300">{fr ? 'Relance enregistrée' : 'Follow-up saved'}</span>}
              <button type="button" onClick={onOpenApplications} className="text-xs text-slate-300 underline">{fr ? 'Voir mes candidatures' : 'View my applications'}</button>
            </div>
          </form>
        </section>}
      </div>
      <div className="p-5 border-t border-slate-800 flex flex-wrap items-center gap-3">
        {!trackedApplication && <button type="button" onClick={() => void addToTracking()} disabled={!pack || trackingBusy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-300 disabled:opacity-50">
          <BookmarkPlus className="w-4 h-4" />{trackingBusy ? (fr ? 'Ajout…' : 'Adding…') : (fr ? 'Ajouter au suivi' : 'Add to tracking')}
        </button>}
        <button onClick={() => void download()} disabled={!pack || busy} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm disabled:opacity-50">
          <Download className="w-4 h-4" />{busy ? (fr ? 'Téléchargement…' : 'Downloading…') : (fr ? 'Télécharger mon pack candidature' : 'Download my application pack')}
        </button>
      </div>
    </section>
  </div>;
}
