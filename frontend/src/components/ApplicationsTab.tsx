import React, { useState } from 'react';
import { FileText, Calendar, Building2, Sparkles, AlertCircle } from 'lucide-react';
import type { Application } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface ApplicationsTabProps {
  applications: Application[];
  onStatusChange: (applicationId: string, newStatus: string) => void;
  onRefresh: () => void;
  onGenerateCoverLetter: (jobId: string) => void;
}

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  applications,
  onStatusChange,
  onRefresh,
  onGenerateCoverLetter,
}) => {
  const { t } = useLanguage();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const statuses = [
    { value: 'saved', label: t.applications.status_saved, color: 'bg-slate-700 text-slate-300' },
    { value: 'applied', label: t.applications.status_applied, color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { value: 'interview', label: t.applications.status_interview, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { value: 'offer', label: t.applications.status_offer, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { value: 'rejected', label: t.applications.status_rejected, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  ];

  const handleStatusSelect = async (appId: string, status: string) => {
    setUpdatingId(appId);
    await onStatusChange(appId, status);
    setUpdatingId(null);
  };

  const counts = {
    total: applications.length,
    applied: applications.filter((a) => a.status === 'applied').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offer: applications.filter((a) => a.status === 'offer').length,
  };

  return (
    <div className="space-y-6">

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">{t.applications.total}</div>
          <div className="text-2xl font-bold font-display text-white mt-1">{counts.total}</div>
        </div>
        <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-blue-400">{t.applications.sent}</div>
          <div className="text-2xl font-bold font-display text-blue-300 mt-1">{counts.applied}</div>
        </div>
        <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-amber-400">{t.applications.interviews}</div>
          <div className="text-2xl font-bold font-display text-amber-300 mt-1">{counts.interview}</div>
        </div>
        <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-emerald-400">{t.applications.offers}</div>
          <div className="text-2xl font-bold font-display text-emerald-300 mt-1">{counts.offer}</div>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-[#0d1424] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white font-display">
              Tableau de Bord des Candidatures
            </h3>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Actualiser
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              {t.applications.no_applications}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                {/* Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-base">
                      {app.job_title || `Offre #${app.job_id}`}
                    </span>
                    <span className="text-xs font-mono text-slate-500">({app.id})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      {app.company || 'Entreprise Partenaire'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {app.applied_at ? app.applied_at.substring(0, 10) : 'Récemment'}
                    </span>
                  </div>
                  {app.notes && (
                    <p className="text-xs text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800 inline-block mt-1">
                      📝 {app.notes}
                    </p>
                  )}
                </div>

                {/* Status Changer & Quick Actions */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Quick Letter */}
                  <button
                    onClick={() => onGenerateCoverLetter(app.job_id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Lettre IA</span>
                  </button>

                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      value={app.status}
                      disabled={updatingId === app.id}
                      onChange={(e) => handleStatusSelect(app.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
