import { useEffect, useState } from 'react';
import type { Job } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface Task { task: string; priority: string; completed: boolean }
interface Props { candidateId: string; jobs: Job[] }

export function InterviewTab({ candidateId, jobs }: Props) {
  const { lang } = useLanguage();
  const fr = lang === 'fr';
  const [jobId, setJobId] = useState(jobs[0]?.id || '');
  const [attempt, setAttempt] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const storageKey = `jobpilot_checklist:${candidateId}:${jobId}`;
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();
    setQuestions([]);
    setChecklist([]);
    setError('');
    try { setChecks(JSON.parse(localStorage.getItem(storageKey) || '{}')); }
    catch { setChecks({}); }
    if (!jobId) return () => controller.abort();
    setLoading(true);
    const post = async (path: string) => {
      const response = await fetch(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ candidate_id: candidateId, job_id: jobId, number: 6 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      if (!Array.isArray(result)) throw new Error('Invalid response');
      return result;
    };
    Promise.all([post('/api/interview/questions'), post('/api/interview/checklist')])
      .then(([newQuestions, tasks]) => {
        if (!controller.signal.aborted) { setQuestions(newQuestions); setChecklist(tasks); }
      }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [candidateId, jobId, storageKey, attempt]);

  return <section className="space-y-6">
    <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-6 space-y-3">
      <label htmlFor="interview-job" className="block font-semibold">{fr ? 'Offre à préparer' : 'Prepare for a job'}</label>
      <select id="interview-job" value={jobId} onChange={event => setJobId(event.target.value)} className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3">
        {!jobs.length && <option value="">{fr ? 'Aucune offre disponible' : 'No jobs available'}</option>}
        {jobs.map(job => <option key={job.id} value={job.id}>{job.title} — {job.company}</option>)}
      </select>
      <button disabled={!jobId || loading} onClick={() => setAttempt(value => value + 1)} className="rounded-xl bg-emerald-500 text-slate-950 px-4 py-2 disabled:opacity-50">{fr ? 'Actualiser la préparation' : 'Refresh preparation'}</button>
    </div>
    {loading && <p role="status">{fr ? 'Préparation en cours…' : 'Preparing…'}</p>}
    {error && <p role="alert" className="text-rose-300">{fr ? 'Impossible de charger la préparation : ' : 'Unable to load preparation: '}{error}</p>}
    {!loading && !error && jobId && <>
      <h2 className="text-xl font-bold">{fr ? 'Questions d’entretien' : 'Interview questions'}</h2>
      <p className="text-sm text-slate-400">{fr ? 'Les questions et tâches sont actuellement proposées en anglais.' : 'Questions and tasks are currently provided in English.'}</p>
      <ol className="space-y-3">{questions.map((question, index) => <li key={question} className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">{index + 1}. {question}</li>)}</ol>
      <h2 className="text-xl font-bold">{fr ? 'Checklist de préparation' : 'Preparation checklist'}</h2>
      <p className="text-sm text-slate-400">{fr ? 'Progression conservée sur ce navigateur pour ce profil et cette offre.' : 'Progress saved in this browser for this profile and job.'}</p>
      <div className="space-y-3">{checklist.map(item => <label key={item.task} className="flex gap-3 rounded-xl border border-slate-800 p-4 cursor-pointer">
        <input type="checkbox" checked={checks[item.task] ?? item.completed} onChange={event => {
          const next = { ...checks, [item.task]: event.target.checked };
          setChecks(next);
          localStorage.setItem(storageKey, JSON.stringify(next));
        }} />
        <span>{item.task} <span className="text-xs text-slate-400">({item.priority})</span></span>
      </label>)}</div>
    </>}
  </section>;
}
