import React from 'react';
import { User, MapPin, Mail, Globe, Briefcase, GraduationCap, Award, Sparkles } from 'lucide-react';
import type { Candidate } from '../types';

interface ProfileTabProps {
  candidate: Candidate;
  onExploreJobs: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, onExploreJobs }) => {
  return (
    <div className="space-y-6">

      {/* Hero Profile Header */}
      <div className="bg-[#0d1424] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center">
                <User className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                  {candidate.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {candidate.available ? '● Disponible' : 'En poste'}
                </span>
              </div>
              <p className="text-sm font-medium text-emerald-400">
                {candidate.desired_role}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {candidate.country}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" /> {candidate.experience_years} an(s) d'expérience
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {candidate.email}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onExploreJobs}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Voir les offres adaptées</span>
          </button>

        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Skills Tag Cloud */}
        <div className="md:col-span-2 bg-[#0d1424] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold font-display text-base">
            <Award className="w-5 h-5 text-emerald-400" />
            <span>Compétences Techniques & Outils Maîtrisés</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {candidate.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-mono font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:border-emerald-500/50 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>

          {candidate.bio && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                Pitch Professionnel
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {candidate.bio}
              </p>
            </div>
          )}
        </div>

        {/* Education & Info */}
        <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold font-display text-base">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <span>Formation & Portfolio</span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-300">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Formation</span>
              <p className="font-medium text-white mt-0.5">
                {candidate.education || 'Master / Licence en Génie Logiciel'}
              </p>
            </div>

            {candidate.portfolio_url && (
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Lien Portfolio / GitHub</span>
                <a
                  href={candidate.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{candidate.portfolio_url}</span>
                </a>
              </div>
            )}

            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 block">Identifiant MCP</span>
              <code className="text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 block mt-1">
                {candidate.id}
              </code>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
