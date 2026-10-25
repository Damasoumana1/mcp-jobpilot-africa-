import React, { useState } from 'react';
import { X, Plus, Sparkles, Building2, MapPin, Globe } from 'lucide-react';
import type { Job } from '../types';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: Job) => void;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: 'Dakar, Sénégal',
    remote: false,
    required_skills: '',
    nice_to_have: '',
    description: '',
    application_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        remote: formData.remote,
        required_skills: formData.required_skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        nice_to_have: formData.nice_to_have
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        description: formData.description.trim(),
        application_url: formData.application_url.trim() || undefined,
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erreur serveur (${res.status})`);
      }

      const createdJob = await res.json();
      onJobCreated(createdJob);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Impossible de créer le job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold font-display text-white">
              Publier une Offre Tech
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Intitulé du poste *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ex: Lead Backend Engineer (FastAPI/Go)"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Entreprise *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="ex: Wave Mobile Money"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Localisation *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="ex: Abidjan, Côte d'Ivoire"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="remote-check"
              checked={formData.remote}
              onChange={(e) => setFormData({ ...formData, remote: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-0 bg-slate-900"
            />
            <label htmlFor="remote-check" className="text-sm text-slate-300 flex items-center gap-1 cursor-pointer">
              <Globe className="w-4 h-4 text-emerald-400" /> Télétravail autorisé / 100% Remote
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Compétences requises (séparées par des virgules) *
            </label>
            <input
              type="text"
              required
              value={formData.required_skills}
              onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
              placeholder="ex: Python, FastAPI, Docker, PostgreSQL"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Compétences secondaires (Nice to have)
            </label>
            <input
              type="text"
              value={formData.nice_to_have}
              onChange={(e) => setFormData({ ...formData, nice_to_have: e.target.value })}
              placeholder="ex: Kubernetes, Redis, FinTech APIs"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Description du poste & responsabilités *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Missions, stack technique, impact attendu..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Lien de candidature (Optionnel)
            </label>
            <input
              type="url"
              value={formData.application_url}
              onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold rounded-lg text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Publication...' : 'Publier le Job'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
