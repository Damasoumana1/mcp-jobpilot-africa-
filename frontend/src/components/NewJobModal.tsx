import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Job } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useGeography } from '../geography';

interface NewJobModalProps { isOpen: boolean; onClose: () => void; onJobCreated: (job: Job) => void }
const emptyForm = { title: '', company: '', country: '', remote_allowed: false, skills: '', description: '', application_url: '' };
const fieldStyle = 'w-full mt-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500';
export const NewJobModal: React.FC<NewJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const { lang } = useLanguage();
  const geography = useGeography();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = (fr: string, en: string) => lang === 'fr' ? fr : en;
  if (!isOpen) return null;
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(null);
    try {
      const country = geography.countries.find(country => country.code === form.country);
      if (!country) throw new Error(text('Sélectionnez un pays.', 'Select a country.'));
      const skills = form.skills.split(',').map(skill => skill.trim()).filter(Boolean);
      if (!skills.length) throw new Error(text('Indiquez au moins une compétence.', 'Enter at least one skill.'));
      if (!form.title.trim() || !form.company.trim() || !form.description.trim()) throw new Error(text('Complétez les champs obligatoires.', 'Complete the required fields.'));
      const response = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        id: `JOB-${crypto.randomUUID()}`, title: form.title.trim(), company: form.company.trim(), country: country.en,
        remote_allowed: form.remote_allowed, skills, description: form.description.trim(), application_url: form.application_url.trim() || null,
      }) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : text(`Publication impossible (${response.status}).`, `Unable to publish (${response.status}).`));
      }
      onJobCreated(await response.json()); setForm(emptyForm); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : text('Publication impossible.', 'Unable to publish.')); }
    finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-labelledby="publish-title" className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h2 id="publish-title" className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-400" />{text('Publier une offre en Afrique', 'Publish a job in Africa')}</h2>
        <button type="button" aria-label={text('Fermer', 'Close')} disabled={loading} onClick={onClose} className="p-2 text-slate-300 hover:text-white"><X className="w-5 h-5" /></button>
      </header>
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm text-slate-300">
        {error && <p role="alert" className="p-3 bg-rose-500/10 text-rose-300 rounded-lg">{error}</p>}
        <label className="block">{text('Intitulé du poste *', 'Job title *')}<input required autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={fieldStyle} /></label>
        <label className="block">{text('Entreprise *', 'Company *')}<input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={fieldStyle} /></label>
        <label className="block">{text('Pays du poste *', 'Job country *')}
          <select required disabled={geography.loading || geography.error} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className={fieldStyle}>
            <option value="">{text('Choisir un pays', 'Choose a country')}</option>
            {[...geography.countries].sort((a, b) => a[lang].localeCompare(b[lang], lang)).map(country => <option key={country.code} value={country.code}>{country[lang]}</option>)}
          </select>
        </label>
        {geography.loading && <p role="status">{text('Chargement des pays…', 'Loading countries…')}</p>}
        {geography.error && <p role="alert">{text('Liste des pays indisponible.', 'Country list unavailable.')} <button type="button" onClick={geography.retry} className="text-emerald-400 underline">{text('Réessayer', 'Retry')}</button></p>}
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.remote_allowed} onChange={e => setForm({ ...form, remote_allowed: e.target.checked })} />{text('Télétravail autorisé', 'Remote work allowed')}</label>
        <p className="text-xs text-slate-400">{text('Précisez dans la description les pays éligibles au télétravail.', 'Specify eligible remote work countries in the description.')}</p>
        <label className="block">{text('Compétences requises, séparées par des virgules *', 'Required skills, comma separated *')}<input required value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="Python, React, SQL" className={fieldStyle} /></label>
        <label className="block">{text('Description et responsabilités *', 'Description and responsibilities *')}<textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={fieldStyle} /></label>
        <label className="block">{text('Lien de candidature (facultatif)', 'Application link (optional)')}<input type="url" value={form.application_url} onChange={e => setForm({ ...form, application_url: e.target.value })} placeholder="https://…" className={fieldStyle} /></label>
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button type="button" disabled={loading} onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-lg">{text('Annuler', 'Cancel')}</button>
          <button type="submit" disabled={loading || geography.loading || geography.error} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg disabled:opacity-50">{loading ? text('Publication…', 'Publishing…') : text('Publier l’offre', 'Publish job')}</button>
        </div>
      </form>
    </section>
  </div>;
};
