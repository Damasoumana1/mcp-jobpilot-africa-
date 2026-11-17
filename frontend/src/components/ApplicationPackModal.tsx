import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface PackFile { name: string; content: string }
interface Pack { candidate_name: string; job_title: string; language: 'fr' | 'en'; files: PackFile[] }

export function ApplicationPackModal({ candidateId, jobId, onClose }: {
  candidateId: string; jobId: string; onClose: () => void;
}) {
  const { lang } = useLanguage();
  const fr = lang === 'fr';
  const [pack, setPack] = useState<Pack | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [copiedFile, setCopiedFile] = useState('');
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

  return <div role="dialog" aria-modal="true" aria-labelledby="pack-title" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <section className="w-full max-w-3xl max-h-[92vh] rounded-2xl border border-slate-700 bg-[#0d1424] flex flex-col overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
        <h2 id="pack-title" className="text-lg font-bold text-white">{fr ? 'Pack candidature' : 'Application pack'}</h2>
        <button onClick={onClose} aria-label={fr ? 'Fermer le pack' : 'Close pack'} className="text-slate-300 p-2"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto">
        <p className="text-sm text-slate-400">{fr ? 'Vérifiez et adaptez ces brouillons avant utilisation. Le ZIP contiendra exactement le contenu affiché. Aucune candidature n’est envoyée et aucun suivi n’est créé.' : 'Review and adapt these drafts before use. The ZIP will contain exactly the content shown. No application is sent and no tracking record is created.'}</p>
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
      </div>
      <div className="p-5 border-t border-slate-800">
        <button onClick={() => void download()} disabled={!pack || busy} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm disabled:opacity-50">
          <Download className="w-4 h-4" />{busy ? (fr ? 'Téléchargement…' : 'Downloading…') : (fr ? 'Télécharger mon pack candidature' : 'Download my application pack')}
        </button>
      </div>
    </section>
  </div>;
}
