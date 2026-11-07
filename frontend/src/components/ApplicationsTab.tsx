import { useEffect, useState } from 'react';
import { FileText, Calendar, Building2, Sparkles } from 'lucide-react';
import type { Application, ApplicationUpdate } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { ApplicationFollowUp, isActiveApplication } from './ApplicationFollowUp';

interface Props {
  applications: Application[];
  onUpdate: (id: string, changes: ApplicationUpdate) => Promise<void>;
  onRefresh: () => void;
  onGenerateCoverLetter: (jobId: string) => void;
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function ApplicationsTab({ applications, onUpdate, onRefresh, onGenerateCoverLetter }: Props) {
  const { t, lang } = useLanguage();
  const fr = lang === 'fr';
  const [view, setView] = useState<'all' | 'today'>('all');
  const [today, setToday] = useState(localToday);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    const update = () => setToday(localToday());
    const timer = window.setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);

  const scheduled = applications.filter(app => isActiveApplication(app) && app.follow_up_date);
  const overdue = scheduled.filter(app => app.follow_up_date! < today).length;
  const due = scheduled.filter(app => app.follow_up_date === today).length;
  const upcoming = scheduled.filter(app => app.follow_up_date! > today).length;
  const visible = view === 'all' ? applications : scheduled.filter(app => app.follow_up_date! <= today)
    .sort((a, b) => a.follow_up_date!.localeCompare(b.follow_up_date!) || a.id.localeCompare(b.id));
  const statuses = [
    { value: 'saved', label: t.applications.status_saved },
    { value: 'applied', label: t.applications.status_applied },
    { value: 'interview', label: t.applications.status_interview },
    { value: 'offer', label: t.applications.status_offer },
    { value: 'rejected', label: t.applications.status_rejected },
  ];
  const metrics = [
    [t.applications.total, applications.length],
    [t.applications.sent, applications.filter(app => app.status === 'applied').length],
    [t.applications.interviews, applications.filter(app => app.status === 'interview').length],
    [t.applications.offers, applications.filter(app => app.status === 'offer').length],
  ];
  const changeStatus = async (app: Application, status: string) => {
    setPending(prev => ({ ...prev, [app.id]: true }));
    setErrors(prev => ({ ...prev, [app.id]: '' }));
    try { await onUpdate(app.id, { status }); }
    catch (cause) { setErrors(prev => ({ ...prev, [app.id]: cause instanceof Error ? cause.message : 'Error' })); }
    finally { setPending(prev => ({ ...prev, [app.id]: false })); }
  };

  return <section className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{metrics.map(([label, count]) => <div key={label} className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4">
      <p className="text-xs text-slate-400">{label}</p><p className="text-2xl font-bold text-white mt-1">{count}</p>
    </div>)}</div>
    <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-5 space-y-3">
      <h2 className="font-semibold text-white">{fr ? 'Vos prochaines relances' : 'Your upcoming follow-ups'}</h2>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <span className="text-rose-300">{fr ? 'En retard' : 'Overdue'} : {overdue}</span>
        <span className="text-amber-300">{fr ? 'Aujourd’hui' : 'Today'} : {due}</span>
        <span className="text-cyan-300">{fr ? 'À venir' : 'Upcoming'} : {upcoming}</span>
      </div>
      <p className="text-xs text-slate-400">{fr ? 'Rappels dans ce tableau de bord, selon la date locale de votre navigateur. Aucun message automatique n’est envoyé. Les offres reçues et les refus sont exclus des relances à traiter.' : 'Dashboard reminders use your browser’s local date. No messages are sent automatically. Offers and rejected applications are excluded from pending follow-ups.'}</p>
    </div>
    <div className="bg-[#0d1424] border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex gap-2 items-center font-bold text-white"><FileText className="w-5 h-5 text-emerald-400" />{fr ? 'Candidatures' : 'Applications'}</h2>
        <button onClick={onRefresh} className="text-xs text-slate-400 hover:text-white">{fr ? 'Actualiser' : 'Refresh'}</button>
        <div className="w-full flex flex-wrap gap-2" role="group" aria-label={fr ? 'Vue des candidatures' : 'Application view'}>
          <button aria-pressed={view === 'all'} onClick={() => setView('all')} className={`rounded-lg px-3 py-2 text-sm ${view === 'all' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{fr ? 'Toutes' : 'All'} ({applications.length})</button>
          <button aria-pressed={view === 'today'} onClick={() => setView('today')} className={`rounded-lg px-3 py-2 text-sm ${view === 'today' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{fr ? 'À faire aujourd’hui' : 'To do today'} ({overdue + due})</button>
        </div>
      </div>
      {!visible.length && <p className="p-10 text-center text-sm text-slate-400">{view === 'today' ? (fr ? 'Aucune relance à traiter aujourd’hui.' : 'No follow-ups to handle today.') : t.applications.no_applications}</p>}
      <div className="divide-y divide-slate-800">{visible.map(app => <article key={app.id} className="p-5 sm:p-6" aria-label={app.job_title || app.job_id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <h3 className="font-bold text-white break-words">{app.job_title || app.job_id}</h3>
            <p className="flex flex-wrap items-center gap-3 text-xs text-slate-400"><span className="inline-flex gap-1 items-center"><Building2 className="w-3.5 h-3.5" />{app.company || '—'}</span><span className="inline-flex gap-1 items-center"><Calendar className="w-3.5 h-3.5" />{app.applied_at?.substring(0, 10)}</span></p>
            {app.follow_up_date && isActiveApplication(app) && <p className={`text-xs ${app.follow_up_date < today ? 'text-rose-300' : app.follow_up_date === today ? 'text-amber-300' : 'text-cyan-300'}`}>{app.follow_up_date < today ? (fr ? 'En retard' : 'Overdue') : app.follow_up_date === today ? (fr ? 'Aujourd’hui' : 'Today') : (fr ? 'À venir' : 'Upcoming')} · <time dateTime={app.follow_up_date}>{app.follow_up_date}</time></p>}
            {app.notes && <p className="text-xs text-slate-400 whitespace-pre-wrap break-words">{app.notes}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => onGenerateCoverLetter(app.job_id)} className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300"><Sparkles className="w-3.5 h-3.5" />{fr ? 'Lettre IA' : 'Cover letter'}</button>
            <select aria-label={`${fr ? 'Statut' : 'Status'} ${app.job_title || app.job_id}`} value={app.status} disabled={pending[app.id]} onChange={event => void changeStatus(app, event.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs disabled:opacity-50">
              {statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>
        </div>
        {errors[app.id] && <p role="alert" className="mt-2 text-xs text-rose-300">{errors[app.id]}</p>}
        <ApplicationFollowUp application={app} onUpdate={onUpdate} />
      </article>)}</div>
    </div>
  </section>;
}
