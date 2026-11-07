import { useState } from 'react';
import type { Application, ApplicationUpdate } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const isActiveApplication = (application: Application) => ['saved', 'applied', 'interview'].includes(application.status);

export function ApplicationFollowUp({ application, onUpdate }: {
  application: Application;
  onUpdate: (id: string, changes: ApplicationUpdate) => Promise<void>;
}) {
  const { lang } = useLanguage();
  const fr = lang === 'fr';
  const [action, setAction] = useState(application.next_action || '');
  const [date, setDate] = useState(application.follow_up_date || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const dirty = (action.trim() || null) !== (application.next_action || null) || (date || null) !== (application.follow_up_date || null);

  const persist = async (complete: boolean) => {
    if (!complete && date && !action.trim()) {
      setError(fr ? 'Précisez la prochaine action pour cette relance.' : 'Enter the next action for this follow-up.');
      return;
    }
    setBusy(true); setError(''); setSaved(false);
    try {
      await onUpdate(application.id, { next_action: complete ? null : action.trim() || null, follow_up_date: complete ? null : date || null });
      if (complete) { setAction(''); setDate(''); }
      else setAction(action.trim());
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (fr ? 'Enregistrement impossible' : 'Unable to save'));
    } finally { setBusy(false); }
  };

  return <form aria-label={`${fr ? 'Relance' : 'Follow-up'} ${application.job_title || application.job_id}`} className="mt-4 border-t border-slate-800 pt-4 grid gap-3 sm:grid-cols-[1fr_11rem]"
    onSubmit={event => { event.preventDefault(); void persist(false); }}>
    <label className="text-xs text-slate-400" htmlFor={`action-${application.id}`}>{fr ? 'Prochaine action' : 'Next action'}
      <input id={`action-${application.id}`} value={action} maxLength={500} required={!!date} disabled={busy} onChange={event => { setAction(event.target.value); setSaved(false); }}
        placeholder={fr ? 'Ex. Relancer le recruteur' : 'e.g. Follow up with recruiter'} className="block w-full mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white disabled:opacity-50" />
    </label>
    <label className="text-xs text-slate-400" htmlFor={`date-${application.id}`}>{fr ? 'Date de relance' : 'Follow-up date'}
      <input id={`date-${application.id}`} type="date" value={date} min="0001-01-01" max="9999-12-31" disabled={busy} onChange={event => { setDate(event.target.value); setSaved(false); }}
        className="block w-full mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white [color-scheme:dark] disabled:opacity-50" />
    </label>
    {!isActiveApplication(application) && application.follow_up_date && <p className="sm:col-span-2 text-xs text-slate-400">{fr ? 'Cette candidature est clôturée : sa relance est conservée mais masquée dans « À faire aujourd’hui ».' : 'This application is closed: its reminder is retained but hidden from “To do today”.'}</p>}
    <div className="sm:col-span-2 flex flex-wrap gap-3 items-center">
      <button type="submit" disabled={busy || !dirty} className="text-xs font-semibold rounded-lg px-3 py-2 bg-emerald-500 text-slate-950 disabled:opacity-40">{busy ? (fr ? 'Enregistrement…' : 'Saving…') : (fr ? 'Enregistrer la relance' : 'Save follow-up')}</button>
      {application.follow_up_date && <button type="button" disabled={busy} onClick={() => void persist(true)} className="text-xs text-slate-300 underline disabled:opacity-40">{fr ? 'Marquer la relance comme faite' : 'Mark follow-up as done'}</button>}
      {saved && <span role="status" className="text-xs text-emerald-300">{fr ? 'Enregistré' : 'Saved'}</span>}
      {error && <span role="alert" className="text-xs text-rose-300">{error}</span>}
    </div>
  </form>;
}
