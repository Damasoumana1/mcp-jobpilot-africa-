import { useState } from 'react';
import type { Candidate } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useGeography } from '../geography';

interface Props {
  candidates: Candidate[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreated: (id: string) => void;
}

export function CandidateManager({ candidates, selectedId, onSelect, onCreated }: Props) {
  const { lang } = useLanguage();
  const fr = lang === 'fr';
  const { countries } = useGeography();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputClass = 'w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white';

  return <section className="mb-6 rounded-2xl border border-slate-800 p-4 space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="active-candidate">{fr ? 'Profil actif' : 'Active profile'}</label>
      <select id="active-candidate" className={inputClass + ' sm:w-auto'} value={selectedId} onChange={event => onSelect(event.target.value)}>
        {!selectedId && <option value="">{fr ? 'Choisir un profil' : 'Choose a profile'}</option>}
        {candidates.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
      </select>
      <button className="text-emerald-400" onClick={() => { setOpen(!open); setError(''); }}>{fr ? 'Créer un profil' : 'Create a profile'}</button>
    </div>
    {open && <form className="grid gap-3 sm:grid-cols-2" onSubmit={async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const fields = new FormData(form);
      setBusy(true);
      setError('');
      try {
        const response = await fetch('/api/candidates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: `CAND-${crypto.randomUUID()}`, full_name: String(fields.get('name')).trim(),
            country: fields.get('country'), email: fields.get('email') || null,
            education: fields.get('education') || null, summary: fields.get('summary') || null,
            skills: String(fields.get('skills')).split(',').map(skill => skill.trim()).filter(Boolean) }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
        form.reset();
        setOpen(false);
        onCreated(result.id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erreur');
      } finally { setBusy(false); }
    }}>
      <label>{fr ? 'Nom complet' : 'Full name'}<input className={inputClass} name="name" required maxLength={200} /></label>
      <label>{fr ? 'Pays de résidence' : 'Country of residence'}<select className={inputClass} name="country" required defaultValue="">
        <option value="" disabled>{fr ? 'Choisir un pays' : 'Choose a country'}</option>
        {countries.map(country => <option key={country.code} value={country.fr}>{country[lang]}</option>)}
      </select></label>
      <label>Email<input className={inputClass} name="email" type="email" /></label>
      <label>{fr ? 'Formation' : 'Education'}<input className={inputClass} name="education" /></label>
      <label>{fr ? 'Compétences séparées par des virgules' : 'Comma-separated skills'}<input className={inputClass} name="skills" placeholder="Python, React, SQL" /></label>
      <label>{fr ? 'Présentation' : 'Summary'}<textarea className={inputClass} name="summary" /></label>
      {error && <p role="alert" className="text-rose-300">{error}</p>}
      <button disabled={busy} className="rounded-lg bg-emerald-500 p-2 text-slate-950 disabled:opacity-50">{busy ? (fr ? 'Enregistrement…' : 'Saving…') : (fr ? 'Enregistrer le profil' : 'Save profile')}</button>
    </form>}
  </section>;
}
