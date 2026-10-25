import React, { useState } from 'react';
import { Search, Plus, MapPin, Globe, Sparkles, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Job } from '../types';

interface JobsTabProps {
  jobs: Job[];
  onOpenNewJobModal: () => void;
  onMatchJob: (jobId: string) => void;
  onGenerateCoverLetter: (jobId: string) => void;
  onApplyJob: (jobId: string) => void;
  appliedJobIds: Set<string>;
}

export const JobsTab: React.FC<JobsTabProps> = ({
  jobs,
  onOpenNewJobModal,
  onMatchJob,
  onGenerateCoverLetter,
  onApplyJob,
  appliedJobIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [onlyRemote, setOnlyRemote] = useState(false);

  const countries = ['all', 'Sénégal', 'Côte d\'Ivoire', 'Rwanda', 'Kenya', 'Nigeria', 'Cameroun'];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.required_skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCountry =
      selectedCountry === 'all' ||
      job.location.toLowerCase().includes(selectedCountry.toLowerCase());

    const matchesRemote = !onlyRemote || job.remote;

    return matchesSearch && matchesCountry && matchesRemote;
  });

  return (
    <div className="space-y-6">

      {/* Hero Banner with Stats */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800/80 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Matching & Postulation Intelligente</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
              Trouve ton prochain rôle tech en Afrique & Remote
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Explore des postes d'ingénieurs juniors, stagiaires et débutants chez Wave, InstaDeep, Orange Digital Center et bien d'autres startups du continent.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenNewJobModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Publier une Offre</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, stack, entreprise..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Country select */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? '🌍 Tous les pays' : `📍 ${c}`}
              </option>
            ))}
          </select>

          {/* Remote Toggle */}
          <label className="flex items-center space-x-2 px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-300 cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={onlyRemote}
              onChange={(e) => setOnlyRemote(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900"
            />
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> Télétravail uniquement
            </span>
          </label>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-base">Aucune opportunité ne correspond à vos filtres.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('all');
                setOnlyRemote(false);
              }}
              className="mt-3 text-sm text-emerald-400 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isApplied = appliedJobIds.has(job.id);
            return (
              <div
                key={job.id}
                className="group relative bg-[#0d1424] hover:bg-[#10192e] border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/20"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{job.company}</span>
                      </div>
                      <h3 className="text-lg font-display font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {job.title}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {job.remote ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Remote
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          Sur site
                        </span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" /> {job.location}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Required Skills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {job.required_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.nice_to_have &&
                      job.nice_to_have.map((skill, i) => (
                        <span
                          key={`nice-${i}`}
                          className="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700"
                        >
                          +{skill}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onMatchJob(job.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Score Match IA</span>
                    </button>
                    <button
                      onClick={() => onGenerateCoverLetter(job.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Lettre & Pitch</span>
                    </button>
                  </div>

                  <div>
                    {isApplied ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Postulé
                      </span>
                    ) : (
                      <button
                        onClick={() => onApplyJob(job.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                      >
                        <span>Postuler</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
