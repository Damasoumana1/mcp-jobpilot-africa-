import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { JobsTab } from './components/JobsTab';
import { MatchingTab } from './components/MatchingTab';
import { ApplicationsTab } from './components/ApplicationsTab';
import { InterviewTab } from './components/InterviewTab';
import { ProfileTab } from './components/ProfileTab';
import { CoverLetterModal } from './components/CoverLetterModal';
import { NewJobModal } from './components/NewJobModal';
import { CopilotChat } from './components/CopilotChat';
import type { Job, Candidate, Application, CoverLetterResponse } from './types';
import { CheckCircle2, AlertCircle, Bot } from 'lucide-react';

const DEFAULT_CANDIDATE: Candidate = {
  id: 'DAMA-001',
  name: 'Dama Soumana',
  email: 'dama.soumana@example.com',
  country: 'Sénégal',
  desired_role: 'Fullstack Developer / AI Apprentice',
  skills: ['Python', 'FastAPI', 'React', 'TypeScript', 'SQL', 'Git', 'Docker', 'REST API'],
  experience_years: 2,
  portfolio_url: 'https://github.com/Damasoumana1',
  education: 'Licence en Informatique & Systèmes Distribués',
  bio: 'Développeur passionné par les systèmes distribués, l’écosystème MCP (Model Context Protocol) et le développement de plateformes web scalables en Afrique.',
  available: true,
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidate, setCandidate] = useState<Candidate>(DEFAULT_CANDIDATE);
  const [applications, setApplications] = useState<Application[]>([]);


  // Modals & Chat
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterResponse | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [preselectedJobIdForMatching, setPreselectedJobIdForMatching] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load initial data
  const fetchData = async () => {
    try {
      // 1. Fetch Jobs
      const resJobs = await fetch('/api/jobs');
      if (resJobs.ok) {
        const rawJobs = await resJobs.json();
        const normalizedJobs: Job[] = Array.isArray(rawJobs)
          ? rawJobs.map((j: any) => ({
              ...j,
              location: j.location || (j.city ? `${j.city}, ${j.country}` : j.country) || 'Afrique',
              remote: j.remote ?? j.remote_allowed ?? false,
              required_skills: j.required_skills || j.skills || [],
              nice_to_have: j.nice_to_have || [],
              description: j.description || '',
              status: j.status || 'open',
            }))
          : [];
        setJobs(normalizedJobs);
      }

      // 2. Fetch Candidate
      const resCand = await fetch('/api/candidates/DAMA-001');
      if (resCand.ok) {
        const candData = await resCand.json();
        setCandidate({
          ...candData,
          name: candData.name || candData.full_name || DEFAULT_CANDIDATE.name,
          desired_role: candData.desired_role || DEFAULT_CANDIDATE.desired_role,
          skills: candData.skills || DEFAULT_CANDIDATE.skills,
          experience_years: candData.experience_years ?? DEFAULT_CANDIDATE.experience_years,
          bio: candData.bio || candData.summary || DEFAULT_CANDIDATE.bio,
          available: candData.available ?? DEFAULT_CANDIDATE.available,
        });
      }

      // 3. Fetch Applications
      const resApps = await fetch('/api/applications');
      if (resApps.ok) {
        const appsData = await resApps.json();
        setApplications(Array.isArray(appsData) ? appsData : []);
      }
    } catch (err) {
      console.warn('API error (using fallback state):', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Actions
  const handleJobCreated = (newJob: Job) => {
    setJobs((prev) => [newJob, ...prev]);
    showToast(`L'offre "${newJob.title}" chez ${newJob.company} a été publiée avec succès !`);
  };

  const handleApplyJob = async (jobId: string) => {
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
      setApplications((prev) => [newApp, ...prev]);
      showToast('Candidature enregistrée et transmise ! Suivi actif.');
    } catch (err: any) {
      showToast(err.message || 'Erreur de postulation', 'error');
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
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
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
      showToast(`Statut mis à jour : "${newStatus}"`);
    } catch (err: any) {
      showToast(err.message || 'Erreur', 'error');
    }
  };

  const handleGenerateCoverLetter = async (jobId: string) => {
    showToast('Génération de la lettre & pitch IA en cours...', 'success');
    try {
      const res = await fetch('/api/applications/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          candidate_id: candidate.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Impossible de générer la lettre pour cette offre');
      }

      const letterData: CoverLetterResponse = await res.json();
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
        {activeTab === 'jobs' && (
          <JobsTab
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

        {activeTab === 'interview' && <InterviewTab />}

        {activeTab === 'profile' && (
          <ProfileTab
            candidate={candidate}
            onExploreJobs={() => setActiveTab('jobs')}
          />
        )}
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

      <CopilotChat
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        candidateName={candidate.name}
      />

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
