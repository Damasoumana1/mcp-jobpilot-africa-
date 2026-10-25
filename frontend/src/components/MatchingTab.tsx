import React, { useState } from 'react';
import { Target, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import type { Job, Candidate, MatchResult } from '../types';

interface MatchingTabProps {
  jobs: Job[];
  candidate: Candidate;
  onGenerateCoverLetter: (jobId: string) => void;
  onApplyJob: (jobId: string) => void;
  preselectedJobId?: string | null;
}

export const MatchingTab: React.FC<MatchingTabProps> = ({
  jobs,
  candidate,
  onGenerateCoverLetter,
  onApplyJob,
  preselectedJobId,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(
    preselectedJobId || (jobs.length > 0 ? jobs[0].id : '')
  );
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const runMatching = async (jobIdToMatch = selectedJobId) => {
    if (!jobIdToMatch) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          job_id: jobIdToMatch,
        }),
      });

      if (!res.ok) {
        throw new Error(`Erreur lors du calcul du match (${res.status})`);
      }

      const data: MatchResult = await res.json();
      setMatchResult(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de calculer le match');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/50 bg-rose-500/10';
  };

  return (
    <div className="space-y-6">

      {/* Selector Card */}
      <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Candidate Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Candidat Actif
              </label>
              <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{candidate.name}</div>
                  <div className="text-xs text-slate-400">
                    {candidate.desired_role} • {candidate.country}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {candidate.id}
                </span>
              </div>
            </div>

            {/* Job Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Sélectionner l'Offre à Analyser
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  setSelectedJobId(e.target.value);
                  setMatchResult(null);
                }}
                className="w-full p-3 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.company} — {job.title} ({job.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => runMatching()}
            disabled={loading || !selectedJobId}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{loading ? 'Calcul en cours...' : 'Calculer le Match IA'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Results View */}
      {matchResult && selectedJob && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main Score Banner */}
          <div className="bg-gradient-to-r from-[#0d1424] via-[#101b30] to-[#0d1424] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Score Dial */}
              <div className="flex items-center space-x-5">
                <div
                  className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center font-display shadow-xl ${getScoreColor(
                    matchResult.score
                  )}`}
                >
                  <span className="text-3xl font-extrabold">{matchResult.score}%</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Adéquation</span>
                </div>

                <div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    Résultat de l'analyse MCP
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                    {selectedJob.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {selectedJob.company} • {selectedJob.location} {selectedJob.remote && '• (Télétravail)'}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                <button
                  onClick={() => onGenerateCoverLetter(selectedJob.id)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Rédiger Lettre & Pitch</span>
                </button>
                <button
                  onClick={() => onApplyJob(selectedJob.id)}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <span>Postuler</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Matched Skills */}
            <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-display font-bold text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5" />
                <span>Compétences Validées ({matchResult.matched_skills.length})</span>
              </div>
              <p className="text-xs text-slate-400">
                Ces technologies requises correspondent directement à votre profil :
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {matchResult.matched_skills.length > 0 ? (
                  matchResult.matched_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Aucune compétence commune trouvée.</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 font-display font-bold text-sm sm:text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Points à Développer ({matchResult.missing_skills.length})</span>
              </div>
              <p className="text-xs text-slate-400">
                Compétences attendues à mentionner ou à consolider via vos projets :
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {matchResult.missing_skills.length > 0 ? (
                  matchResult.missing_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-400 font-medium">
                    🎉 Profil 100% aligné sur toutes les compétences requises !
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* AI Recommendation Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Avis Stratégique de l'IA & MCP</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              {matchResult.recommendation}
            </p>
          </div>

        </div>
      )}

      {!matchResult && !loading && (
        <div className="p-12 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80">
          <Target className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">
            Prêt à évaluer votre adéquation ?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
            Cliquez sur le bouton ci-dessus pour lancer l'algorithme pondéré de matching (compétences, mobilité et expérience).
          </p>
        </div>
      )}

    </div>
  );
};
