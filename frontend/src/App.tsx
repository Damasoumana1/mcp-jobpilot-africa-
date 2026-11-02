import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { JobsTab } from './components/JobsTab';
import { MatchingTab } from './components/MatchingTab';
import { ApplicationsTab } from './components/ApplicationsTab';
import { InterviewTab } from './components/InterviewTab';
import { ProfileTab } from './components/ProfileTab';
import { CoverLetterModal } from './components/CoverLetterModal';
import { NewJobModal } from './components/NewJobModal';
import { CopilotChat } from './components/CopilotChat';
import { CandidateManager } from './components/CandidateManager';
import { ResumeParserModal } from './components/ResumeParserModal';
import type { Job, Candidate, Application, CoverLetterResponse } from './types';
import { CheckCircle2, AlertCircle, Bot } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

const normalizeCandidate = (data: Candidate): Candidate => ({
  ...data, name: data.full_name || data.name, email: data.email || '',
  skills: data.skills || [], bio: data.summary || '',
});

export const App: React.FC = () => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(() => localStorage.getItem('jobpilot_candidate') || '');
  const [revision, setRevision] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);


  const activeCandidateRef = useRef(candidate?.id);

  // Modals & Chat
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [isResumeParserOpen, setIsResumeParserOpen] = useState(false);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterResponse | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [preselectedJobIdForMatching, setPreselectedJobIdForMatching] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = () => setRevision(value => value + 1);
  const selectCandidate = (id: string) => {
    activeCandidateRef.current = undefined;
    localStorage.setItem('jobpilot_candidate', id);
    setSelectedCandidateId(id);
    setCandidate(null);
    setApplications([]);
    setCoverLetterData(null);
    setIsResumeParserOpen(false);
    setIsCopilotOpen(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    const read = async (url: string) => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    };
    setLoading(true);
    setLoadError('');
    (async () => {
      try {
        const [rawJobs, rawCandidates] = await Promise.all([read('/api/jobs'), read('/api/candidates')]);
        const profiles: Candidate[] = rawCandidates.map(normalizeCandidate);
        const active = profiles.find(profile => profile.id === selectedCandidateId) || profiles[0] || null;
        const apps = active ? await read(`/api/applications?candidate_id=${encodeURIComponent(active.id)}`) : [];
        if (controller.signal.aborted) return;
        setJobs(rawJobs.map((job: Job) => ({ ...job,
          location: job.location || job.country || 'Afrique', remote: job.remote ?? job.remote_allowed ?? false,
          required_skills: job.required_skills || job.skills || [], nice_to_have: job.nice_to_have || [],
        })));
        setCandidates(profiles);
        setCandidate(active);
        activeCandidateRef.current = active?.id;
        setApplications(apps);
        if (active) localStorage.setItem('jobpilot_candidate', active.id);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Erreur');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [selectedCandidateId, revision]);

  // Actions
  const handleJobCreated = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
    showToast(`L'offre "${newJob.title}" chez ${newJob.company} a été publiée avec succès !`);
  };

  const handleApplyJob = async (jobId: string) => {
    if (!candidate) return;
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          candidate_id: candidate.id,
          status: 'applied',
          notes: 'Postulé depuis l’interface Web JobPilot Africa',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur lors de la postulation');
      }

      const newApp = await res.json();
      if (activeCandidateRef.current !== candidate.id) return;
      setApplications((prev) => [newApp, ...prev]);
      showToast(lang === 'fr'
        ? 'Suivi enregistré dans JobPilot. Finalisez votre candidature auprès de l’employeur.'
        : 'Tracking saved in JobPilot. Complete your application with the employer.');
    } catch (err: any) {
      showToast(err.message || 'Erreur de postulation', 'error');
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    const requestCandidateId = candidate?.id;
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Erreur de mise à jour du statut');
      }

      await res.json();
      if (activeCandidateRef.current !== requestCandidateId) return;
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
      showToast(`Statut mis à jour : "${newStatus}"`);
    } catch (err: any) {
      showToast(err.message || 'Erreur', 'error');
    }
  };

  const handleGenerateCoverLetter = async (jobId: string) => {
    if (!candidate) return;
    showToast('Génération de la lettre & pitch IA en cours...', 'success');
    try {
      const res = await fetch('/api/applications/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          candidate_id: candidate.id,
          language: lang,
        }),
      });

      if (!res.ok) {
        throw new Error('Impossible de générer la lettre pour cette offre');
      }

      const letterData: CoverLetterResponse = await res.json();
      if (activeCandidateRef.current !== candidate.id) return;
      setCoverLetterData(letterData);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la génération', 'error');
    }
  };

  const handleMatchJob = (jobId: string) => {
    setPreselectedJobIdForMatching(jobId);
    setActiveTab('matching');
  };

  const appliedJobIds = new Set(applications.map((a) => a.job_id));

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-slideDown flex items-center space-x-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs sm:text-sm">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-white font-medium">{toast.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCopilot={() => setIsCopilotOpen(true)}
        applicationsCount={applications.length}
        jobsCount={jobs.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CandidateManager candidates={candidates} selectedId={candidate?.id || ''} onSelect={selectCandidate}
          onCreated={(id) => { selectCandidate(id); fetchData(); }} />
        {loadError && <div role="alert" className="my-4 text-rose-300">{lang === 'fr' ? 'Chargement impossible : ' : 'Unable to load: '}{loadError} <button onClick={fetchData}>{lang === 'fr' ? 'Réessayer' : 'Retry'}</button></div>}
        {loading && <p role="status">{lang === 'fr' ? 'Chargement…' : 'Loading…'}</p>}
        {!loading && !loadError && candidate && <React.Fragment key={candidate.id}>
        {activeTab === 'jobs'  && (
          <JobsTab
            candidateId={candidate.id}
            jobs={jobs}
            onOpenNewJobModal={() => setIsNewJobOpen(true)}
            onMatchJob={handleMatchJob}
            onGenerateCoverLetter={handleGenerateCoverLetter}
            onApplyJob={handleApplyJob}
            appliedJobIds={appliedJobIds}
          />
        )}

        {activeTab === 'matching' && (
          <MatchingTab
            jobs={jobs}
            candidate={candidate}
            onGenerateCoverLetter={handleGenerateCoverLetter}
            onApplyJob={handleApplyJob}
            preselectedJobId={preselectedJobIdForMatching}
          />
        )}

        {activeTab === 'applications' && (
          <ApplicationsTab
            applications={applications}
            onStatusChange={handleStatusChange}
            onRefresh={fetchData}
            onGenerateCoverLetter={handleGenerateCoverLetter}
          />
        )}

        {activeTab === 'interview' && <InterviewTab candidateId={candidate.id} jobs={jobs} />}

        {activeTab === 'profile' && (
          <ProfileTab
            candidate={candidate}
            onExploreJobs={() => setActiveTab('jobs')}
            onOpenResumeParser={() => setIsResumeParserOpen(true)}
          />
        )}
        </React.Fragment>}
      </main>

      {/* Floating Copilot Button (if closed) */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-2xl shadow-emerald-500/30 transition-all transform hover:scale-105"
        >
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline">Copilot IA</span>
        </button>
      )}

      {/* Modals & Drawers */}
      <CoverLetterModal
        data={coverLetterData}
        onClose={() => setCoverLetterData(null)}
      />

      <NewJobModal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        onJobCreated={handleJobCreated}
      />

      {candidate && <ResumeParserModal
        key={candidate.id}
        isOpen={isResumeParserOpen}
        onClose={() => setIsResumeParserOpen(false)}
        candidateId={candidate.id}
        onProfileUpdated={(updated) => {
          setCandidate(updated);
          fetchData();
        }}
        showToast={showToast}
      />}

      {candidate && <CopilotChat
        key={candidate.id}
        candidateId={candidate.id}
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        candidateName={candidate.name}
      />}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 JobPilot Africa • Model Context Protocol Server & Career Accelerator</p>
          <p className="flex items-center gap-1.5 text-slate-400">
            Propulsé par <span className="text-emerald-400 font-semibold">FastMCP</span> + <span className="text-cyan-400 font-semibold">Starlette</span> + <span className="text-violet-400 font-semibold">React Tailwind</span>
          </p>
        </div>
      </footer>

    </div>
  );
};

export default App;
