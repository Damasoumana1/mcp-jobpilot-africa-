import { useState, type FormEvent } from 'react';

interface AccountUser {
  id: string;
  email: string;
  full_name: string;
  candidate_id: string | null;
}

interface AccountSettingsModalProps {
  lang: 'fr' | 'en';
  open: boolean;
  user: AccountUser;
  onClose: () => void;
  onUpdated: (user: AccountUser) => void;
  onSessionExpired: () => void;
  onDeleted: () => void;
}

export function AccountSettingsModal({
  lang,
  open,
  user,
  onClose,
  onUpdated,
  onSessionExpired,
  onDeleted,
}: AccountSettingsModalProps) {
  const fr = lang === 'fr';
  const [email, setEmail] = useState(user.email);
  const [fullName, setFullName] = useState(user.full_name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const close = () => {
    setCurrentPassword('');
    setNewPassword('');
    setError('');
    setMessage('');
    onClose();
  };

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      onUpdated(result);
      setMessage(fr ? 'Compte mis à jour.' : 'Account updated.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      onSessionExpired();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm(
      fr
        ? 'Supprimer définitivement votre compte, votre profil et vos candidatures ?'
        : 'Permanently delete your account, profile, and applications?',
    );
    if (!confirmed) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/me', { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      onDeleted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4 bg-slate-950/80 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
        className="my-auto w-full max-w-lg rounded-2xl border border-slate-700 bg-[#111827] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="account-settings-title" className="text-xl font-bold text-white">
            {fr ? 'Mon compte' : 'Account settings'}
          </h2>
          <button type="button" onClick={close} className="text-slate-400 hover:text-white" aria-label={fr ? 'Fermer' : 'Close'}>×</button>
        </div>

        <form onSubmit={saveAccount} className="space-y-3">
          <h3 className="font-semibold text-slate-200">{fr ? 'Informations du compte' : 'Account details'}</h3>
          <label className="block text-sm text-slate-300">
            {fr ? 'Nom complet' : 'Full name'}
            <input className={inputClass} required minLength={2} maxLength={200} value={fullName} onChange={event => setFullName(event.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">
            Email
            <input className={inputClass} type="email" required minLength={3} maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          <button disabled={busy} className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">
            {fr ? 'Enregistrer' : 'Save changes'}
          </button>
        </form>

        <form onSubmit={updatePassword} className="mt-6 space-y-3 border-t border-slate-700 pt-5">
          <h3 className="font-semibold text-slate-200">{fr ? 'Changer le mot de passe' : 'Change password'}</h3>
          <label className="block text-sm text-slate-300">
            {fr ? 'Mot de passe actuel' : 'Current password'}
            <input className={inputClass} type="password" required maxLength={128} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">
            {fr ? 'Nouveau mot de passe (12 caractères minimum)' : 'New password (at least 12 characters)'}
            <input className={inputClass} type="password" required minLength={12} maxLength={128} value={newPassword} onChange={event => setNewPassword(event.target.value)} />
          </label>
          <button disabled={busy} className="rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-200 disabled:opacity-50">
            {fr ? 'Mettre à jour le mot de passe' : 'Update password'}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
        {message && <p role="status" className="mt-4 text-sm text-emerald-300">{message}</p>}

        <div className="mt-6 border-t border-rose-900/70 pt-5">
          <button type="button" disabled={busy} onClick={deleteAccount} className="rounded-lg border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">
            {fr ? 'Supprimer mon compte' : 'Delete my account'}
          </button>
        </div>
      </section>
    </div>
  );
}
